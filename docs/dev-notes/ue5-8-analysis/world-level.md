---
sidebar_position: 7
tags: [ue5, ue5-8, world, level, world-partition]
---

# 游戏世界：UWorld & ULevel

## UWorld — 世界的根对象

**源码：** `Engine/Classes/Engine/World.h`  
**实现：** `Engine/Private/World.cpp`

`UWorld` 是 UE5 中所有游戏世界的根容器，负责管理关卡、Actor、网络、物理、音频等所有子系统。

### 关键前置声明（World.h ~L52-106）

```cpp
class UWorldPartition;
class UDataLayerManager;
class ULevel;
class ULevelStreaming;
class UNetDriver;
class UDemoNetDriver;
class UAISystemBase;
class UGameViewportClient;
class UCanvas;
class UChaosEventRelay;
class ULocalPlayer;
class UNavigationSystemBase;
class FPhysScene_Chaos;
```

### 迭代器类型

```cpp
typedef TArray<TWeakObjectPtr<AController>>::TConstIterator        FConstControllerIterator;
typedef TArray<TWeakObjectPtr<APlayerController>>::TConstIterator  FConstPlayerControllerIterator;
typedef TArray<TWeakObjectPtr<ACameraActor>>::TConstIterator       FConstCameraActorIterator;
typedef TArray<ULevel*>::TConstIterator                            FConstLevelIterator;
typedef TArray<TWeakObjectPtr<APhysicsVolume>>::TConstIterator     FConstPhysicsVolumeIterator;
```

### 关键委托

```cpp
FOnActorSpawned                      // Actor 生成时触发
FOnActorDestroyed                    // Actor 销毁时触发
FOnPostRegisterAllActorComponents    // Actor 组件注册后
FOnPreUnregisterAllActorComponents   // Actor 组件注销前
FOnActorRemovedFromWorld             // Actor 从世界移除
FOnFeatureLevelChanged               // RHI 特性级别变化
FOnMovieSceneSequenceTick            // 过场动画 Tick
```

### 世界上下文

UE5.8 中的 World 由 `FWorldContext` 管理，包含：
- 网络复制信息
- 当前/持久关卡
- 世界类型（Game/PIE/Editor/Preview）

### UWorldProxy

```cpp
class UWorldProxy
{
    // 对 GWorld 访问的验证代理类
    // 确保所有对当前世界的访问都经过安全检查
};
```

### World 的组成部分

| 子系统 | 类型 | 说明 |
|--------|------|------|
| 关卡容器 | `TArray<ULevel*>` | 包含所有已加载关卡 |
| 持久关卡 | `ULevel* PersistentLevel` | 始终存在的关卡 |
| 当前关卡 | `ULevel* CurrentLevel` | 编辑器中的当前编辑关卡 |
| 流式关卡 | `TArray<ULevelStreaming*>` | 动态加载/卸载的关卡 |
| 网络驱动 | `UNetDriver* NetDriver` | 网络复制引擎 |
| 物理场景 | `FPhysScene_Chaos*` | Chaos 物理场景 |
| 导航系统 | `UNavigationSystemBase*` | AI 导航 |
| AI 系统 | `UAISystemBase*` | AI 框架 |
| 音频设备 | `UAudioDevice*` | 3D 音频 |
| 视图客户端 | `UGameViewportClient*` | 视口渲染 |
| 参数集合 | `UMaterialParameterCollectionInstance*` | 全局材质参数 |

## ULevel — 关卡

**源码：** `Engine/Classes/Engine/Level.h`

关卡是 Actor 的容器，包含关卡中的所有 Actor、BSP、光照信息等。

### Level 的核心职责

- 持有本关卡的 `AActor` 列表
- 管理关卡流式加载状态（Visible / Loaded / Unloaded）
- 持有 `UWorldSettings` —— 关卡的全局设置（如 GameMode 覆盖）
- 持有 `AMapBuildData` —— 构建数据（光照、导航等）
- 管理 `LevelScriptBlueprint` 中的蓝图逻辑

### 默认 Level 构建块

Level 中包含一组默认的 Info Actor：
- `AWorldSettings` — 关卡全局设置
- `AGameModeBase` — 游戏模式（可被 WorldSettings 覆盖）
- `APlayerStart` — 玩家起始点

## Level Streaming（关卡流式加载）

UE5.8 支持多种方式管理大型世界中的关卡：

| 方式 | 说明 |
|------|------|
| **Level Streaming（传统）** | 基于距离/体积的关卡动态加载 |
| **World Partition（推荐）** | UE5 新一代世界分区系统，自动管理网格单元 |
| **Data Layers** | 数据图层——按逻辑分组而非空间分组 |

### World Partition

World Partition 是 UE5 为开放世界引入的系统，在 UE5.8 中持续优化：

```
世界被划分为网格单元（Grid Cells）
每个单元是一个独立的包和 Actor 集合
运行时：根据玩家位置动态加载/卸载单元
编辑器：支持多编辑者同时编辑不同区域
```

**关键文件：**
- `WorldPartition.h`
- `WorldPartitionStreamingSourceComponent.h`
- `WorldDataLayers.h`

### 关卡流式加载的事件顺序

```
PreLoad → 包加载 → PostLoad → 
  PreBeginPlay → BeginPlay → 
  SetVisible(true) → 渲染线程可见
```

## 世界 Tick 循环

```
FWorldManager::Tick()
  → UWorld::Tick(LEVELTICK_All)
    → 网络复制（UNetDriver::TickDispatch/Flush）
    → 物理 Tick（FPhysScene_Chaos）
    → 关卡流式加载检查
    → 关卡内所有 Actors Tick
      → PreTickComponent
      → TickActor（先 Pawn/Character，再其他）
      → PostTickComponent
    → 计时器更新（FTimerManager）
    → 延迟函数调用
    → 音频更新
```
