---
sidebar_position: 3
tags: [ue5, ue5-8, engine, world, actor, component]
---

# 引擎核心 Engine

`Engine` 模块（1603 个 .cpp 文件）是 UE5 中最大的模块，实现了游戏世界、Actor、Component、GameMode、PlayerController、Pawn 等核心 Gameplay 框架。

## World / Level 系统

```
Engine/Public/
├── World.h          ← UWorld — 世界的容器
├── Level.h          ← ULevel — 关卡的容器
├── LevelStreaming.h ← 关卡流式加载
├── WorldPartition/   ← 世界分区系统
└── Actor.h          ← AActor
```

### UWorld — 世界的根对象

`UWorld` 是游戏世界的顶级容器，包含：
- 所有 `ULevel` 实例
- 网络复制信息（`FWorldContext`）
- 物理场景
- Audio 世界
- 蓝图/脚本执行上下文

### AActor 生命周期

```
SpawnActor (构造) → PostActorCreated → BeginPlay → Tick → EndPlay → Destroy
```

关键源码文件：
- `Actor.cpp` (2963 行?) — Actor 基础框架
- `ActorConstruction.cpp` — 构造脚本执行
- `ActorReplication.cpp` — 网络同步
- `ActorFolder.cpp` — Actor 文件夹管理

## Component 系统

`UActorComponent` 是所有组件的基类，每个 Actor 可以挂载多个组件。

```
Actor 包含 Components[]
├── USceneComponent    ← 有 Transform 的组件（位置/旋转/缩放）
│   ├── UPrimitiveComponent  ← 可渲染组件
│   │   ├── UMeshComponent   ← 网格组件
│   │   └── UShapeComponent  ← 碰撞形状
│   └── UCameraComponent     ← 相机
├── UActorComponent     ← 无 Transform 的组件
│   ├── UPawnMovementComponent ← 移动
│   └── UInputComponent      ← 输入
```

## GameMode / GameState / Pawn / PlayerController

关键文件路径：`Engine/Public/GameFramework/`

```
GameMode.h           ← AGameModeBase / AGameMode
GameState.h          ← AGameStateBase / AGameState
PlayerController.h   ← APlayerController
Pawn.h               ← APawn
Character.h          ← ACharacter
PlayerState.h        ← APlayerState
HUD.h                ← AHUD
GameSession.h        ← AGameSession
GameNetworkManager.h ← AGameNetworkManager
```

### Gameplay 框架协作流程

```
AGameMode (服务器 Only)
  → 控制游戏规则、生成 Pawn、管理游戏状态
AGameState (全同步)
  → 复制给所有客户端，存储游戏全局状态
APlayerController (每个玩家)
  → 输入处理、HUD、Camera 控制
APawn (玩家控制)
  → 物理表示、移动
ACharacter (Pawn 子类)
  → 加入 CharacterMovementComponent
APlayerState (全同步)
  → 玩家数据（分数、名称等）
```

## 其他重要子系统

| 子系统 | 关键文件 | 功能 |
|--------|---------|------|
| **物理** | `PhysicsEngine/` | Collision, Query, Scene |
| **动画** | `Animation/` | AnimInstance, AnimBlueprint, Montage |
| **音频** | `Audio/` | ActiveSound, AudioDevice, AudioBus |
| **AI** | `AIModule/` | BehaviorTree, Blackboard, EQS |
| **导航** | `NavigationSystem/` | NavMesh, PathFinding |
| **资产管理** | `AssetManager.cpp` | PrimaryAsset, AssetRegistry |
| **流式加载** | `LevelStreaming.h` | Level streaming, World Partition |
