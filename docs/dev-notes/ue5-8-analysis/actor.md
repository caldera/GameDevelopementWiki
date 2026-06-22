---
sidebar_position: 15
tags: [ue5, ue5-8, actor, lifecycle, replication, spawn]
---

# AActor 深度分析 — 游戏对象

**源码：** `Engine/Classes/GameFramework/Actor.h`（~2400 行）  
**实现：** `Engine/Private/Actor.cpp`（7402 行） / `ActorReplication.cpp`（1226 行） / `ActorConstruction.cpp`（1456 行） / `ActorEditor.cpp`（2157 行）

`AActor` 是所有可以放置到世界中的游戏对象的基类，继承自 `UObject`。Actor 是 UE5 Gameplay 框架的核心构建块。本文是对其源码的全景式深度分析。

---

## 1. 类声明总览

```cpp
class AActor : public UObject
{
    GENERATED_BODY()

    //══════════════════════════════════════════
    // 构造函数
    //══════════════════════════════════════════
    ENGINE_API AActor();
    ENGINE_API AActor(const FObjectInitializer& ObjectInitializer);
    ENGINE_API void InitializeDefaults();

    //══════════════════════════════════════════
    // Tick 系统
    //══════════════════════════════════════════
    UPROPERTY(EditDefaultsOnly, Category=Tick)
    struct FActorTickFunction PrimaryActorTick;

    //══════════════════════════════════════════
    // 网络复制
    //══════════════════════════════════════════
    ENGINE_API virtual void GetLifetimeReplicatedProps(...) override;
    ENGINE_API virtual void GetReplicatedCustomConditionState(...) override;
    ENGINE_API virtual void PreReplication(...);
    ENGINE_API virtual void PreReplicationForReplay(...);
    ENGINE_API virtual bool ReplicateSubobjects(...);
    ENGINE_API virtual void TearOff();

    //══════════════════════════════════════════
    // 生命周期
    //══════════════════════════════════════════
    ENGINE_API virtual void PostInitProperties() override;
    ENGINE_API virtual void BeginPlay();
    ENGINE_API virtual void EndPlay(const EEndPlayReason::Type EndPlayReason);
    ENGINE_API virtual void Destroyed();
    ENGINE_API virtual void K2_DestroyActor();

    //══════════════════════════════════════════
    // 碰撞/重叠/命中事件
    //══════════════════════════════════════════
    ENGINE_API virtual void NotifyActorBeginOverlap(AActor* OtherActor);
    ENGINE_API virtual void NotifyActorEndOverlap(AActor* OtherActor);
    ENGINE_API virtual void NotifyHit(...);

    //══════════════════════════════════════════
    // 输入系统
    //══════════════════════════════════════════
    ENGINE_API virtual void EnableInput(APlayerController* PlayerController);
    ENGINE_API virtual void DisableInput(APlayerController* PlayerController);
    ENGINE_API virtual void CreateInputComponent(...);
};
```

---

## 2. 全部 Bit 标志位（46 个）

AActor 使用位域（bitfield）来节省内存。以下是按照功能分组的完整清单：

### 🔵 网络复制标志

| 标志 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bReplicates` | `uint8:1` | false | 是否开启网络复制（蓝图属性）|
| `bNetTemporary` | `uint8:1` | false | 仅初始复制一次，之后不更新（如诞生效果、临时 VFX）|
| `bNetStartup` | `uint8:1` | false | 地图加载时就存在的 Actor（关卡静态对象）|
| `bOnlyRelevantToOwner` | `uint8:1` | false | 仅复制给所有者 |
| `bAlwaysRelevant` | `uint8:1` | false | 复制给所有客户端（全局状态） |
| `bReplicateMovement` | `uint8:1` | false | `ReplicatedUsing=OnRep_ReplicateMovement` — 自动同步 RootComponent 移动 |
| `bNetLoadOnClient` | `uint8:1` | true | 客户端是否加载此 Actor |
| `bNetUseOwnerRelevancy` | `uint8:1` | false | 跟随所有者的相关度 |
| `bRelevantForNetworkReplays` | `uint8:1` | true | 回放中是否相关 |
| `bReplayRewindable` | `uint8:1` | true | 回放倒带支持 |
| `bTearOff` | `uint8:1` | false | `UPROPERTY(Replicated)` — 一次性复制后断开 |
| `bForceNetAddressable` | `uint8:1` | false | 强制 Actor 有网络地址 |
| `bExchangedRoles` | `uint8:1` | false | 是否已交换角色 |
| `bReplicateUsingRegisteredSubObjectList` | `uint8:1` | false | 使用注册的子对象列表复制 |
| `bNetCheckedInitialPhysicsState` | `uint8:1` | false | 初始物理状态已检查 |

### 🟢 生命周期/初始化状态

| 标志 | 默认值 | 说明 |
|------|--------|------|
| `bHasFinishedSpawning` | false | 是否已完成 Spawn |
| `bActorInitialized` | false | 是否已初始化（BeginPlay 后）|
| `bActorBeginningPlayFromLevelStreaming` | false | 是否来自关卡流式加载的 BeginPlay |
| `bActorIsBeingDestroyed` | false | 正在销毁中 |
| `bActorWantsDestroyDuringBeginPlay` | false | 希望在 BeginPlay 时销毁 |
| `bActorIsBeingConstructed` | false | 正在构造中 |
| `bActorIsPendingPostNetInit` | false | 等待网络初始化完成 |
| `bHasDeferredComponentRegistration` | false | 有待处理的延迟组件注册 |
| `bHasPreRegisteredAllComponents` | false | 已完成预注册所有组件 |
| `bHasRegisteredAllComponents` | false | 已完成注册所有组件 |
| `bRunningUserConstructionScript` | false | 正在运行用户构造脚本 |
| `bTickFunctionsRegistered` | false | Tick 函数是否已注册 |
| `bFinishedBuilding` | false | 构建完成 |

### 🟡 编辑器/工具标志

| 标志 | 默认值 | 说明 |
|------|--------|------|
| `bIsEditorOnlyActor` | false | 仅编辑器可见 |
| `bIgnoreInPIE` | false | PIE 中忽略 |
| `bForceDuplicateInPIE` | false | 强制在 PIE 中复制 |
| `bIsMainWorldOnly` | false | 仅在主世界加载 |
| `bMigratingAsset` | false | 正在迁移资产 |
| `bActorSeamlessTraveled` | false | 是否无缝旅行过 |

### 🟠 渲染/碰撞/物理

| 标志 | 默认值 | 说明 |
|------|--------|------|
| `bHidden` | false | `UPROPERTY(Replicated, Interp)` — 游戏中隐藏 |
| `bCanBeDamaged` | true | `UPROPERTY(Replicated, SaveGame)` — 能否受伤 |
| `bBlockInput` | false | 是否拦截输入 |
| `bCollideWhenPlacing` | false | 放置时是否碰撞 |
| `bFindCameraComponentWhenViewTarget` | true | 作为视角目标时找相机组件 |
| `bGenerateOverlapEventsDuringLevelStreaming` | false | 关卡流式加载时产生重叠事件 |
| `bIgnoresOriginShifting` | false | 忽略原点偏移 |
| `bEnableAutoLODGeneration` | true | 是否启用自动 LOD 生成 |
| `bRelevantForLevelBounds` | true | 是否参与关卡包围盒计算 |
| `bActorEnableCollision` | true | Actor 级碰撞开关 |
| `bAsyncPhysicsTickEnabled` | false | 是否启用异步物理 Tick |

### 🟣 Tick 控制

| 标志 | 默认值 | 说明 |
|------|--------|------|
| `bAllowTickBeforeBeginPlay` | false | 是否允许在 BeginPlay 前 Tick |
| `bAutoDestroyWhenFinished` | false | 完成后自动销毁 |
| `bAllowReceiveTickEventOnDedicatedServer` | false | 专用服务器上是否接收 Tick 事件 |
| `bCanBeInCluster` | true | 是否可放入 GC 集群 |

---

## 3. 全部虚函数接口（30+）

### 网络复制

```cpp
virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const;
    // 🔑 所有子类重写此函数来注册 UPUPERTY(Replicated)
    // 例如: DOREPLIFETIME(AMyActor, Health);

virtual void PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker);
    // 复制前回调 — 可以在发送前修改属性

virtual void PreReplicationForReplay(IRepChangedPropertyTracker& ChangedPropertyTracker);
    // 回放专用的复制前回调

virtual bool ReplicateSubobjects(UActorChannel* Channel, FOutBunch* Bunch, FReplicationFlags* RepFlags);
    // 复制子对象（如 ActorComponent）

virtual void OnSubobjectCreatedFromReplication(UObject* NewSubobject);
    // 子对象通过复制创建时回调

virtual void OnSubobjectDestroyFromReplication(UObject* Subobject);
    // 子对象因复制而销毁时回调

virtual void RewindForReplay();
    // 回放倒带回调

virtual void TearOff();
    // 一次性复制后断开连接（UFUNCTION, BlueprintCallable）

virtual void OnRep_ReplicateMovement();
    // bReplicateMovement 复制后的响应（UFUNCTION）

virtual void OnRep_AttachmentReplication();
    // AttachmentReplication 复制后的响应

virtual void OnRep_Owner();
    // Owner 复制后的响应

virtual void OnRep_Instigator();
    // Instigator 复制后的响应

virtual bool HasNetOwner() const;
virtual bool HasLocalNetOwner() const;
```

### 生命周期

```cpp
virtual void PostInitProperties() override;
    // UObject 初始化后调用 — Actor 在这里设置初始状态

virtual void BeginPlay();
    // 游戏开始 / Actor 生成后调用 — 🔑 所有游戏逻辑从这里启动

virtual void EndPlay(const EEndPlayReason::Type EndPlayReason);
    // 结束时调用 — 清理资源、移除监听

virtual void Destroyed();
    // Actor 销毁后调用

virtual void K2_DestroyActor();
    // BlueprintCallable — 蓝图版销毁

virtual void OnDestroyed() {}
    // 被销毁时的事件广播
```

### 碰撞/重叠/命中

```cpp
virtual void NotifyActorBeginOverlap(AActor* OtherActor);
virtual void NotifyActorEndOverlap(AActor* OtherActor);
virtual void NotifyHit(UPrimitiveComponent* MyComp, AActor* Other,
    UPrimitiveComponent* OtherComp, bool bSelfMoved, FVector HitLocation,
    FVector HitNormal, FVector NormalImpulse, const FHitResult& Hit);
virtual void NotifyActorBeginCursorOver();
virtual void NotifyActorEndCursorOver();
virtual void NotifyActorOnClicked(FKey ButtonPressed);
virtual void NotifyActorOnReleased(FKey ButtonReleased);
virtual void NotifyActorOnInputTouchBegin(const ETouchIndex::Type FingerIndex);
virtual void NotifyActorOnInputTouchEnd(const ETouchIndex::Type FingerIndex);
virtual void NotifyActorOnInputTouchEnter(const ETouchIndex::Type FingerIndex);
virtual void NotifyActorOnInputTouchLeave(const ETouchIndex::Type FingerIndex);
```

### 输入系统

```cpp
virtual void EnableInput(APlayerController* PlayerController);
virtual void DisableInput(APlayerController* PlayerController);
virtual void CreateInputComponent(TSubclassOf<UInputComponent> InputComponentToCreate);
```

### 编辑/工具

```cpp
virtual void OnConstruction(const FTransform& Transform);
    // 编辑器构造脚本 — 🔑 每次 Actor 放置/移动后调用

virtual void PostActorCreated();
    // Actor 刚生成后调用（先于 OnConstruction）

virtual void PreSaveRoot(FObjectPreSaveRootContext ObjectSaveContext);
virtual void PostSaveRoot(FObjectPostSaveRootContext ObjectSaveContext);

virtual bool ShouldLevelKeepRefIfExternal() const { return false; }
virtual bool IsLockLocation() const;
virtual void OnPlayFromHere();
virtual void GetActorDescProperties(FPropertyPairsMap& PropertyPairsMap) const;
```

### 序列化/加载

```cpp
virtual void Serialize(FArchive& Ar) override;
virtual void PostLoad() override;
virtual void PostLoadSubobjects(FObjectInstancingGraph* OuterInstanceGraph);
virtual bool CheckDefaultSubobjectsInternal() const override;
virtual void ProcessEvent(UFunction* Function, void* Parameters) override;
```

---

## 4. 完整的生命周期

Actor 的初始化有多个步骤，以下是**所有重要函数的调用顺序**（源自 Actor.h 注释 ~L249）：

```
1. 构造阶段:
   AActor()                          ← 构造函数
   ├── InitializeDefaults()          ← 初始化默认子对象（组件）
   └── PostInitProperties()          ← UObject 初始化

2. 生成阶段（UWorld::SpawnActor）:
   ├── PostActorCreated()            ← 生成后立即调用（先于构造脚本）
   ├── OnConstruction()              ← 蓝图构造脚本运行（编辑器每移动一次就调用）
   └── SpawnActor 完成 → 返回

3. 游戏开始:
   ├── BeginPlay()                   ← 🔑 游戏逻辑从这里开始
   ├── 所有自有组件 BeginPlay()
   └── 注册 Tick 函数

4. 每帧运行:
   └── Tick(DeltaTime)               ← PrimaryActorTick 驱动

5. 结束:
   ├── EndPlay(EEndPlayReason)       ← 结束回调
   ├── 清理 → OnDestroyed()
   ├── Destroyed()
   └── UObject 析构链
```

---

## 5. Actor 的出生（SpawnActor 内部细节）

SpawnActor 是 UWorld 的方法，过程如下：

```cpp
AActor* UWorld::SpawnActor(UClass* Class, FTransform const& Transform,
    const FActorSpawnParameters& SpawnParams)
{
    // 1. 检查类是否有效,当前是否允许 Spawn
    // 2. 构造 Actor 对象 (NewObject<AActor>)
    //    → AActor 构造函数
    //    → 创建所有 CreateDefaultSubobject 的组件
    // 3. 设置 Owner / Instigator
    // 4. 设置初始 Transform
    // 5. PostActorCreated() — 通知子类已创建
    // 6. 执行构造脚本 (OnConstruction)
    // 7. 注册所有组件
    // 8. 执行碰撞检测,调整 Spawn 位置 (如果配置了)
    // 9. 返回 Actor
}
```

### FActorSpawnParameters

```cpp
struct FActorSpawnParameters
{
    AActor* Owner;                  // 所有者
    APawn* Instigator;              // 发动者（造成伤害的源头）
    ESpawnActorCollisionHandlingMethod SpawnCollisionHandlingOverride;
    ESpawnActorScaleMethod ScaleMethod;  // UE5.8 新增
    ULevel* OverrideLevel;          // 指定所属 Level
    FName Name;                     // 指定 Actor 名称
    UObject* OverridePackage;       // 指定包
    UObject* OverrideExternalPackage;
    bool bDeferConstruction;        // 延迟构造（之后手动调用 FinishSpawning）
    bool bAllowDuringConstructionScript;
    bool bTemporaryEditorActor;
    bool bHideFromSceneOutliner;
    bool bCreateActorPackage;
};
```

### 延迟生成模式

```cpp
// 延迟构造 — 先创建对象,之后手动完成
FActorSpawnParameters SpawnParams;
SpawnParams.bDeferConstruction = true;
AActor* Actor = World->SpawnActor<AMyActor>(Class, Location, Rotation, SpawnParams);

// ... 初始化 Actor 的额外数据 ...

Actor->FinishSpawning(Transform);  // 完成构造 + 注册
```

---

## 6. Actor 的 Tick 链

```cpp
void AActor::RegisterActorTickFunctions(bool bRegister)
{
    // 注册 PrimaryActorTick 到 Tick 系统
}

// Tick 分组优先级：
enum ETickingGroup
{
    TG_PrePhysics        = 0,  // 物理前
    TG_StartPhysics      = 1,  // 物理开始
    TG_DuringPhysics     = 2,  // 物理进行中
    TG_EndPhysics        = 3,  // 物理结束
    TG_PostPhysics       = 4,  // 物理后
    TG_LastDemotable     = 5,  // 最后
};
```

设置方法：

```cpp
PrimaryActorTick.bCanEverTick = true;
PrimaryActorTick.TickGroup = TG_PrePhysics;
PrimaryActorTick.bStartWithTickEnabled = true;

// 依赖关系
AddTickPrerequisiteActor(OtherActor);       // 确保 OtherActor 先 Tick
AddTickPrerequisiteComponent(OtherComp);    // 确保 OtherComp 先 Tick
```

---

## 7. Actor 的销毁

```cpp
void AActor::Destroy(bool bNetForce, bool bShouldModifyLevel)
{
    // 1. 设置 bActorIsBeingDestroyed = true
    // 2. 如果开启了复制,通知服务器和客户端
    // 3. EndPlay(EEndPlayReason::Destroyed)
    // 4. 从所属 Level 的 Actors 数组中移除
    // 5. 调用 Destroyed()
    // 6. Unregister 所有组件
    // 7. 断开所有 Attached Actors
    // 8. 标记为待 GC 回收 (MarkPendingKill/MarkAsGarbage)
}
```

```cpp
// 在 BeginPlay 中想销毁自己时
// 不要直接调用 Destroy(),而应该:
void AMyActor::BeginPlay()
{
    Super::BeginPlay();

    if (SomeCondition)
    {
        // 安全延迟销毁
        SetLifeSpan(0.001f);
    }
}
```

---

## 8. 输入系统

Actor 的输入处理流程：

```cpp
// 启用输入
EnableInput(PlayerController);
// → 创建或启用 InputComponent
// → 绑定 Action/Axis 事件

// 禁用输入
DisableInput(PlayerController);
// → 移除输入绑定

// 自定义输入组件
CreateInputComponent(MyInputComponentClass);
// → 创建指定类型的 InputComponent
```

---

## 9. 实现文件分工

| 文件 | 行数 | 主要内容 |
|------|------|---------|
| `Actor.cpp` | 7402 | 构造函数、生命周期、Tick、序列化、加载/保存、输入、碰撞、编辑器工具函数 |
| `ActorReplication.cpp` | 1226 | `GetLifetimeReplicatedProps`、`PreReplication`、`ReplicateSubobjects`、`TearOff`、子对象复制 |
| `ActorConstruction.cpp` | 1456 | `OnConstruction`、蓝图构造脚本执行、ConstructionScript 的编辑器/运行时行为差异 |
| `ActorEditor.cpp` | 2157 | PIE 复制、编辑器拖拽、撤销/重做、属性编辑 |
| `ActorEditorUtils.cpp` | — | 编辑器工具函数 |
| `ActorFolder.cpp` | — | Actor 文件夹管理（World Partition 相关）|
| `ActorReferencesUtils.cpp` | — | Actor 引用管理工具 |

---

## 10. UE5.8 新增/变更

| 变更 | 文件 | 说明 |
|------|------|------|
| `EActorUpdateOverlapsMethod` | `Actor.h` | 新增枚举——精细控制重叠初始化时机 |
| `ESpawnActorScaleMethod` | `Actor.h` | 新增枚举——控制 Spawn 时缩放的计算方式 |
| `bAsyncPhysicsTickEnabled` | `Actor.h` | 新增异步物理 Tick 支持 |
| `ELevelInstanceType` / `ELevelInstanceFlags` | `Actor.h` | LevelInstance 集成 |
| `bActorIsPendingPostNetInit` | `Actor.h` | 网络初始化状态追踪 |
| 增强的 Iris 集成 | `ActorReplication.cpp` | Iris 复制系统的更深层集成 |

---

## 11. 常见模式

### 创建自定义 Actor

```cpp
// MyPickup.h
UCLASS()
class AMyPickup : public AActor
{
    GENERATED_BODY()

public:
    AMyPickup();

    UPROPERTY(VisibleAnywhere)
    TObjectPtr<UStaticMeshComponent> Mesh;

    UPROPERTY(Replicated, BlueprintReadOnly)
    float PowerLevel;
};

// MyPickup.cpp
AMyPickup::AMyPickup()
{
    PrimaryActorTick.bCanEverTick = false;
    bReplicates = true;

    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    SetRootComponent(Mesh);
}

void AMyPickup::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMyPickup, PowerLevel);
}
```

### 监听 Hit / Overlap 事件

```cpp
void AMyActor::NotifyHit(UPrimitiveComponent* MyComp, AActor* Other,
    UPrimitiveComponent* OtherComp, bool bSelfMoved, FVector HitLocation,
    FVector HitNormal, FVector NormalImpulse, const FHitResult& Hit)
{
    Super::NotifyHit(MyComp, Other, OtherComp, bSelfMoved,
        HitLocation, HitNormal, NormalImpulse, Hit);

    if (Other && Other != this)
    {
        ApplyDamage(Other);
    }
}
```

> **核心结论：** AActor 是 UE5 中最复杂的基础类之一。理解它的位标志、虚函数接口和生命周期，是掌握 UE5 Gameplay 框架的起点。46 个 bit 标志位决定了 Actor 在网络、编辑器、渲染、碰撞等方面的精确行为。
