---
sidebar_position: 8
tags: [ue5, ue5-8, actor, replication, lifecycle]
---

# AActor — 游戏对象

**源码：** `Engine/Classes/GameFramework/Actor.h`  
**实现：** `Engine/Private/Actor.cpp`、`ActorConstruction.cpp`、`ActorReplication.cpp`、`ActorEditor.cpp`

`AActor` 是所有可以放置到世界中的游戏对象的基类，继承自 `UObject`。Actor 是 UE5 Gameplay 框架的核心构建块。

## 类声明

```cpp
class AActor : public UObject
{
    GENERATED_BODY()

    ENGINE_API AActor();
    ENGINE_API AActor(const FObjectInitializer& ObjectInitializer);
    
    // 核心属性
    FActorTickFunction PrimaryActorTick;   // 主 Tick
    
    // 网络标志
    uint8 bNetTemporary:1;       // 仅初始复制一次
    uint8 bNetStartup:1;         // 地图加载时存在
    uint8 bOnlyRelevantToOwner:1; // 仅对所有者相关
    uint8 bAlwaysRelevant:1;     // 始终相关（全局同步）
};
```

## 核心网络复制相关的枚举

### EActorUpdateOverlapsMethod

```cpp
enum class EActorUpdateOverlapsMethod : uint8
{
    UseConfigDefault,  // 使用原生类或配置的默认值
    AlwaysUpdate,      // 初始化时总是更新重叠
    OnlyUpdateMovable, // 仅当根组件为 Movable 时更新
    NeverUpdate        // 从不在初始化时更新重叠
};
```

### ESpawnActorScaleMethod

```cpp
enum class ESpawnActorScaleMethod : uint8
{
    OverrideRootScale,  // 硬覆盖根组件缩放为 SpawnTransform 的值
    MultiplyWithRoot,   // SpawnTransform 的值与根组件默认缩放相乘
    SelectDefaultAtRuntime
};
```

## Actor 生命周期

```
[构造]
  ↓
InitializeDefaults()          ← 构造函数中调用
  ↓
PostInitProperties()          ← UObject 初始化
  ↓
SpawnActor 完成
  ↓
PostActorCreated()            ← 生成后立即调用
  ↓
OnConstruction()              ← 蓝图构造脚本
  ↓ (编辑器: 重新加载或移动时再次调用)
BeginPlay()                   ← 游戏开始
  ↓
Tick(ActorTickFunction)       ← 每帧更新
  ↓
EndPlay(EEndPlayReason)       ← 结束
  ↓
Destroy() / K2_DestroyActor()
  ↓
OnDestroyed() / FinishedDestroy()
```

## Actor Tick

每个 Actor 都有一个 `PrimaryActorTick`，可以通过 `PrimaryActorTick.bCanEverTick` 控制。

```cpp
// 启用 Tick
PrimaryActorTick.bCanEverTick = true;

// 设置 Tick 组（优先级）
PrimaryActorTick.TickGroup = TG_PrePhysics;

// 依赖关系
AddTickPrerequisiteActor(SomeActor);
AddTickPrerequisiteComponent(SomeComponent);
```

**TickGroup 优先级：**
```
TG_PrePhysics → TG_StartPhysics →
TG_DuringPhysics → TG_EndPhysics →
TG_PostPhysics → TG_LastDemotable
```

## Actor 网络复制标志位

| 属性 | 作用 |
|------|------|
| `bReplicates` | 开启网络复制 |
| `bNetTemporary` | 仅发送一次（诞生效果、临时的 VFX） |
| `bNetStartup` | 地图加载时就存在的 Actor |
| `bOnlyRelevantToOwner` | 只复制给所有者（典型：玩家武器） |
| `bAlwaysRelevant` | 复制给所有客户（全局状态） |
| `bReplicateMovement` | 自动同步 RootComponent 移动 |
| `bReplicatesToOwnerOnly` | 仅在服务器和所有者之间复制 |
| `bNetLoadOnClient` | 客户端加载（关卡 Actor） |
| `bNetUseOwnerRelevancy` | 跟随所有者的相关度 |

### RPC 声明

```cpp
UFUNCTION(Server, Reliable, WithValidation)
void Server_DoSomething(int32 Param);

UFUNCTION(Client, Reliable)
void Client_OnSomethingHappened();

UFUNCTION(NetMulticast, Unreliable)
void Multicast_PlayEffect();
```

## Actor 生成关键函数

```cpp
UWorld* World = GetWorld();

// 默认生成
AActor* NewActor = World->SpawnActor<AMyActor>(SpawnLocation, SpawnRotation);

// 带参数生成
FActorSpawnParameters SpawnParams;
SpawnParams.Owner = this;
SpawnParams.Instigator = GetController();
SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;
AActor* NewActor = World->SpawnActor<AMyActor>(ActorClass, SpawnLocation, SpawnRotation, SpawnParams);
```

## Actor 核心实现文件

| 文件 | 内容 |
|------|------|
| `Actor.cpp` | 主实现——构造函数、Tick、生命周期 |
| `ActorConstruction.cpp` | OnConstruction、蓝图构造脚本 |
| `ActorReplication.cpp` | 网络复制逻辑 |
| `ActorEditor.cpp` | 编辑器相关（PIE、拖拽、撤销） |
| `ActorEditorUtils.cpp` | 编辑器工具函数 |
| `ActorFolder.cpp` | Actor 文件夹管理 |
| `ActorFolderDesc.cpp` | 文件夹描述数据 |
| `ActorReferencesUtils.cpp` | Actor 引用工具 |
| `ActorPrimitiveColorHandler.cpp` | Actor 颜色处理 |
