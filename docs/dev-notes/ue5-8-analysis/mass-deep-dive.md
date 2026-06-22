---
sidebar_position: 13
tags: [ue5, ue5-8, mass, ecs, entity, processor, fragment]
---

# Mass 大规模实体系统深度分析

**源码路径：** `Engine/Source/Runtime/Mass/`  
**模块结构：** `MassCore`（核心类型） / `MassEntity`（ECS 框架） / `MassEngine`（引擎集成） / `MassSignals`（信号系统） / `MassDeveloper`（调试工具）

Mass 是 UE5 内置的 **ECS（Entity-Component-System）架构实现**，专为处理**数万到数百万个实体**而设计。

---

## 1. 核心概念

### 与传统 UE Gameplay 对比

| | 传统 AActor + UActorComponent | Mass ECS |
|--|-------------------------------|----------|
| **对象** | AActor（UObject，重型） | `FMassEntityHandle`（64 位整数，极轻量） |
| **数据** | UActorComponent（UObject，反射） | `FMassFragment`（普通 struct，无 GC） |
| **逻辑** | Actor::Tick() / Component::TickComponent() | `UMassProcessor`（Query + Execute） |
| **内存** | 每个 Actor 独立分配 | Archetype 中连续排布（cache-friendly） |
| **创建** | `SpawnActor`（需要同步到网络） | `EntityManager.CreateEntity()` |
| **数量级** | 数百到数千 | 数万到数百万 |

### Mass 的数据流

```
FMassEntityHandle（64-bit ID）
  ├── Index        → 实体在数组中的位置
  └── SerialNumber → 序列号（防悬挂引用）

FMassFragment（数据片段，纯 struct）
  ├── FTransformFragment  ← 位置/旋转/缩放
  ├── FMassVelocityFragment ← 速度
  └── 你的自定义 Fragment

FMassTag（标签，空 struct）
  ├── 用于标记实体状态
  └── 不包含数据，只做存在性检测

UMassProcessor（处理器）
  ├── 声明需要哪些 Fragment/Tag
  └── 在 Execute() 中处理匹配实体
```

---

## 2. 源码架构

### 2.1 实体句柄（`FMassEntityHandle`）

**文件：** `MassCore/Public/Mass/EntityHandle.h`

```cpp
USTRUCT(BlueprintType)
struct alignas(8) FMassEntityHandle
{
    int32 Index;        // 位置
    int32 SerialNumber; // 序列号
};
// 总共 8 字节，可转换为 uint64
static_assert(sizeof(FMassEntityHandle) == sizeof(uint64));
```

### 2.2 Fragment 体系（`EntityElementTypes.h` + `EntityFragments.h`）

所有 Mass 数据类型的基类继承树：

```
FMassElement（根）
├── FMassFragment           ← 标准数据片段（每个实体一份）
│   └── FMassSparseFragment ← 稀疏片段（仅部分实体拥有）
├── FMassTag                ← 标签（纯标记，无数据）
│   └── FMassSparseTag      ← 稀疏标签
├── FMassChunkFragment      ← Chunk 级片段（同一 Chunk 内所有实体共享）
└── FMassSharedFragment     ← 全局共享片段（所有实体共享）
    └── FMassConstSharedFragment ← 常量共享片段
```

**内置 Fragment：`FTransformFragment`**

```cpp
USTRUCT()
struct FTransformFragment : public FMassFragment
{
    FTransform Transform;
    // GetTransform() / SetTransform() / GetMutableTransform()
};
```

### 2.3 实体管理器（`FMassEntityManager`）

**文件：** `MassEntity/Public/MassEntityManager.h`

```cpp
struct FMassEntityManager : public TSharedFromThis<FMassEntityManager>
{
    // 创建实体
    FMassEntityHandle CreateEntity(
        const FMassArchetypeHandle& Archetype,
        const FEntityCreationContext& Context = {});

    // 销毁实体（通过命令缓冲延迟执行）
    void DestroyEntity(const FMassEntityHandle Entity);

    // Archetype 管理
    FMassArchetypeHandle CreateArchetype(
        const FMassArchetypeCompositionDescriptor& Composition);

    // 实体查询
    void ExecuteQuery(
        FMassEntityQuery& Query,
        FMassExecutionContext& ExecutionContext);
};
```

### 2.4 Archetype 系统（`MassArchetypeTypes.h`）

Archetype 是具有相同 Fragment 组合的实体集合。相同 Archetype 的实体在内存中连续存储。

```cpp
// FMassArchetypeHandle → 指向内部 FMassArchetypeData
struct FMassArchetypeHandle;
```

### 2.5 实体查询（`FMassEntityQuery`）

**文件：** `MassEntity/Public/MassEntityQuery.h`

```cpp
struct FMassEntityQuery : public FMassFragmentRequirements
{
    // 设置需要哪些 Fragment
    void AddRequirement(...);
    
    // 执行查询——在匹配的 Archetype 上运行 Processor
    void ForEachEntityChunk(
        FMassEntityManager& EntityManager,
        FMassExecutionContext& Context,
        const FMassEntityExecuteFunction& ExecuteFunction);
};
```

### 2.6 Processor 系统（`UMassProcessor`）

**文件：** `MassEntity/Public/MassProcessor.h`

```cpp
UCLASS(abstract)
class UMassProcessor : public UObject
{
    // 声明执行顺序
    FMassProcessorExecutionOrder ExecutionOrder;
    
    // 注册需要查询的 Fragment
    virtual void ConfigureQueries() PURE_VIRTUAL;
    
    // 执行逻辑
    virtual void Execute(
        FMassEntityManager& EntityManager,
        FMassExecutionContext& Context) PURE_VIRTUAL;
};
```

### 2.7 处理阶段（`FMassProcessingPhase`）

**文件：** `MassEntity/Public/MassProcessingPhaseManager.h`

```
ETickingGroup 驱动的处理阶段：
  TG_PrePhysics  → PrePhysiscs 阶段
  TG_DuringPhysics → DuringPhysics 阶段
  TG_PostPhysics → PostPhysics 阶段
  TG_LastDemotable → LastDemotable 阶段

每个阶段内：
  1. 并行执行 Processors（默认开启）
  2. 每个 Chunk 分配到独立线程
  3. 完成后合并结果
```

**UE5.8 变更：** 单线程实体存储被移除，**并发存储（Concurrent Storage）**已成为默认。

```cpp
// MassEntityManager.h L39-45
// UE_DEPRECATED 5.8: Single threaded entity storage is being removed.
// Concurrent storage will always be used.
#define WITH_MASS_CONCURRENT_RESERVE 1
```

### 2.8 信号系统（`UMassSignalSubsystem`）

**文件：** `MassSignals/Public/MassSignalSubsystem.h`

实体间轻量通信，不依赖 UObject 消息系统：

```cpp
// 触发信号
SignalSubsystem->SignalEntity(TEXT("AttackHit"), Entity);

// 延迟信号
SignalSubsystem->DelaySignalEntity(TEXT("Respawn"), Entity, 3.0f);

// 延迟信号（通过命令缓冲，Processor 内部使用）
SignalSubsystem->DelaySignalEntityDeferred(Context, TEXT("Respawn"), Entity, 3.0f);

// 监听信号
SignalSubsystem->GetSignalDelegateByName(TEXT("AttackHit"))
    .AddLambda([](FName SignalName, TConstArrayView<FMassEntityHandle> Entities)
    {
        // 处理信号
    });
```

**内置信号：**（来自 `MassEngineTypes.h`）

| 信号名 | 触发时机 |
|--------|---------|
| `TransformChanged` | Transform 变更 |
| `MeshChanged` | Mesh 变更 |
| `MeshVisualPropertyChanged` | 渲染属性变更 |
| `RenderStateDirty` | 渲染状态脏标记 |

### 2.9 渲染集成（`MassEngine`）

Mass 引擎模块负责将 Mass 实体的数据同步到渲染，使用 **ISM（Instanced Static Mesh）** 实现高效渲染：

```
MassEntity
  → MassEngine Processors
    → ISM 实例数据更新
      → 渲染线程
```

---

## 3. 如何应用到游戏项目

### 步骤 1：定义 Fragment（数据）

```cpp
// MonsterMassFragments.h
USTRUCT()
struct FMonsterHealthFragment : public FMassFragment
{
    GENERATED_BODY()
    
    float Health = 100.0f;
    float MaxHealth = 100.0f;
    bool bIsAlive = true;
};

USTRUCT()
struct FMonsterTargetFragment : public FMassFragment
{
    GENERATED_BODY()
    
    FMassEntityHandle CurrentTarget;
    float AggroRange = 1000.0f;
    float AttackRange = 200.0f;
};

USTRUCT()
struct FMonsterStateTag : public FMassTag
{
    GENERATED_BODY()
    // 纯标记，无数据
};

USTRUCT()
struct FMonsterDeadTag : public FMassTag
{
    GENERATED_BODY()
};
```

### 步骤 2：定义 Processor（行为逻辑）

```cpp
// MonsterMovementProcessor.h
UCLASS()
class UMonsterMovementProcessor : public UMassProcessor
{
    GENERATED_BODY()

protected:
    FMassEntityQuery EntityQuery;

    virtual void ConfigureQueries() override
    {
        // 声明需要的 Fragment：必须同时拥有这两个 Fragment
        EntityQuery.AddRequirement<FTransformFragment>(
            EMassFragmentAccess::ReadWrite);
        EntityQuery.AddRequirement<FMonsterHealthFragment>(
            EMassFragmentAccess::ReadOnly);
        // 排除已死的
        EntityQuery.AddTagRequirement<FMonsterDeadTag>(
            EMassFragmentPresence::None);

        // 可选 Fragment
        EntityQuery.AddRequirement<FMonsterVelocityFragment>(
            EMassFragmentAccess::ReadWrite,
            EMassFragmentPresence::Optional);
    }

    virtual void Execute(FMassEntityManager& EntityManager,
                         FMassExecutionContext& Context) override
    {
        // 对每个匹配 Chunk 中的实体执行
        EntityQuery.ForEachEntityChunk(EntityManager, Context,
            [](FMassExecutionContext& Context, int32 ChunkIndex)
            {
                // 批量获取 Fragment 数组视图
                TArrayView<FTransformFragment> Transforms =
                    Context.GetMutableFragmentView<FTransformFragment>();
                TConstArrayView<FMonsterHealthFragment> Healths =
                    Context.GetFragmentView<FMonsterHealthFragment>();

                const int32 NumEntities = Context.GetNumEntities();
                for (int32 i = 0; i < NumEntities; i++)
                {
                    if (Healths[i].Health <= 0.0f)
                    {
                        // 标记为死亡
                        Context.Defer().AddTag<FMonsterDeadTag>(
                            Context.GetEntity(i));
                    }

                    // 移动逻辑...
                    FVector NewLocation = Transforms[i].GetTransform().GetLocation();
                    NewLocation.X += 10.0f;
                    Transforms[i].SetTransform(FTransform(NewLocation));
                }
            });
    }
};
```

### 步骤 3：创建实体

```cpp
// 在 GameMode 或子系统初始化中
void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    UMassEntitySubsystem* Subsystem =
        UWorld::GetSubsystem<UMassEntitySubsystem>(GetWorld());

    FMassEntityManager& EntityManager =
        Subsystem->GetMutableEntityManager();

    // 定义 Archetype 组成
    FMassArchetypeCompositionDescriptor ArchetypeDesc;
    ArchetypeDesc.Fragments.Add<FTransformFragment>();
    ArchetypeDesc.Fragments.Add<FMonsterHealthFragment>();
    ArchetypeDesc.Fragments.Add<FMonsterTargetFragment>();

    FMassArchetypeHandle Archetype =
        EntityManager.CreateArchetype(ArchetypeDesc);

    // 批量创建实体
    constexpr int32 NumMonsters = 10000;
    TArray<FMassEntityHandle> Entities;
    for (int32 i = 0; i < NumMonsters; i++)
    {
        FMassEntityHandle Entity = EntityManager.CreateEntity(
            Archetype, FEntityCreationContext{});

        // 初始化 Fragment 数据
        FTransformFragment& Transform =
            EntityManager.GetFragmentData<FTransformFragment>(Entity);

        FMonsterHealthFragment& Health =
            EntityManager.GetFragmentData<FMonsterHealthFragment>(Entity);

        Transform.SetTransform(FTransform(
            FRotator::ZeroRotator,
            FVector(FMath::RandRange(-5000, 5000), 0, 0)));

        Entities.Add(Entity);
    }

    UE_LOG(LogTemp, Log, TEXT("Created %d Mass monsters"), NumMonsters);
}
```

### 步骤 4：注册 Processor

```cpp
// 在自定义的 UMassCompositeProcessor 或插件模块中
void FMyMassModule::StartupModule()
{
    // 在项目配置中注册 Processor
    // 或者通过 MassEntitySettings 配置
    UMassEntitySettings* Settings = GetMutableDefault<UMassEntitySettings>();
    // ...
}

// 或者用 Processor 添加到 Pipeline 中
FMassRuntimePipeline Pipeline;
Pipeline.CreateFromArray({ NewObject<UMonsterMovementProcessor>() }, Owner);
```

---

## 4. 绑怪实战：万只怪物

### 架构设计

```
UMassEntitySubsystem (World 子系统)
  └── FMassEntityManager
      ├── Archetype: Monster
      │   ├── FTransformFragment
      │   ├── FMonsterHealthFragment
      │   ├── FMonsterTargetFragment
      │   └── FMonsterStateTag
      │
      └── Processors Pipeline
          ├── UMonsterMovementProcessor (PrePhysics)
          ├── UMonsterAITargetingProcessor (PostPhysics)
          ├── UMonsterDamageProcessor (PostPhysics)
          └── UMonsterRenderProcessor (LastDemotable → ISM)
```

### 渲染：ISM 集成

Mass 引擎模块通过 `ISMCustomInstanceMesh` 将实体渲染为 Instance Static Mesh：

| 组件 | 负责 |
|------|------|
| `MassEngine/Mesh/` 中 Processors | 将 `FTransformFragment` 同步到 ISM 实例数据 |
| `MassEngineRenderISMProcessors` | ISM 更新 |
| `MassEngineRenderStateProcessors` | 渲染状态管理 |

### 信号驱动的 AI

```cpp
// 攻击信号 → AI 响应
void UMonsterAITargetingProcessor::Execute(FMassEntityManager& EntityManager,
    FMassExecutionContext& Context)
{
    EntityQuery.ForEachEntityChunk(EntityManager, Context,
        [](FMassExecutionContext& Context, int32 ChunkIndex)
        {
            TArrayView<FTransformFragment> Transforms =
                Context.GetMutableFragmentView<FTransformFragment>();
            TArrayView<FMonsterHealthFragment> Healths =
                Context.GetMutableFragmentView<FMonsterHealthFragment>();

            const int32 NumEntities = Context.GetNumEntities();
            for (int32 i = 0; i < NumEntities; i++)
            {
                if (Healths[i].Health <= 0.0f)
                {
                    // 延迟 3 秒后发送重生信号
                    Context.GetMutableSubsystem<UMassSignalSubsystem>()
                        ->DelaySignalEntityDeferred(
                            Context,
                            TEXT("MonsterRespawn"),
                            Context.GetEntity(i),
                            3.0f);
                }
            }
        });
}
```

---

## 5. Mass vs 传统的性能对比

| 场景 | 传统 AActor | Mass ECS |
|------|-----------|----------|
| 1000 只怪物 | 流畅（~1MB 开销/个） | 轻松 |
| 10000 只怪物 | 卡顿（GC 压力大） | **流畅（cache-friendly 内存布局）** |
| 100000 只怪物 | ❌ 不可行 | **可行（需 ISM 渲染）** |
| Tick 开销 | 每 Actor 独立调度的虚函数 | **批量处理，无虚调用** |
| 并行 | 手动 ParallelFor | **自动 Chunk 级并行** |
| 网络复制 | 支持完整 replication | Iris 可集成 |

---

## 6. UE5.8 重要变更

| 变更 | 说明 |
|------|------|
| **单线程存储移除** | `WITH_MASS_CONCURRENT_RESERVE` 强制为 true，并发存储已成默认 |
| **Fragment 移动** | `MassEntityFragments.h` 已废弃，改用 `MassCore/Public/Mass/EntityFragments.h` |
| **FEntityBuilder** | 新的实体构建 API（`FEntityBuilder::CreateEntity()`） |
| **并发创建** | 多线程实体创建和销毁变得简单 |
| **AutoRTFM 集成** | `FScopedProcessing` 使用 AutoRTFM 事务管理 |

---

## 7. 适用场景指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 弹幕/子弹 | ✅ Mass | 成千上万的实体，极轻量 |
| 大群怪物/兽群 | ✅ Mass | 上万 AI + ISM 渲染 |
| 粒子系统替代 | ✅ Mass | 纯逻辑，无渲染 |
| 主控角色 | ❌ AActor | 需要完整 replication |
| 交互式 NPC（对话） | ❌ AActor | 需要 UObject 反射 |
| Boss 战 | ⚠️ 混合 | Boss 用 AActor，小怪用 Mass |
| 装备/物品 | ⚠️ 取决于场景 | 量太大时用 Mass |

> **核心结论：** Mass 做**大规模 + 简单行为**，AActor 做**小规模 + 复杂交互**。两者互补不互斥。
