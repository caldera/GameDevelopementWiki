---
sidebar_position: 10
tags: [ue5, ue5-8, gamemode, playercontroller, pawn, character, gamestate]
---

# Gameplay 框架 — GameMode / PC / Pawn / GS / PS

**源码根：** `Engine/Classes/GameFramework/`

UE5 的 Gameplay 框架定义了一套完整的多人游戏角色和规则管理机制。

## 框架总览

```
Server Only         全同步               Per-Player
┌─────────┐     ┌──────────────┐     ┌──────────────────┐
│GameMode  │     │  GameState   │     │ PlayerController │
│(规则制定) │     │  (全局状态)   │     │ (玩家的大脑)      │
└─────────┘     └──────────────┘     └──────────────────┘
                                           │
                                    ┌──────┴──────┐
                                    │   PlayerState │
                                    │  (玩家数据)    │
                                    └──────┬──────┘
                                           │
                                    ┌──────┴──────┐
                                    │  Pawn/Char   │
                                    │ (玩家化身)    │
                                    └─────────────┘
```

## AGameMode — 游戏规则

**源码：** `Engine/Classes/GameFramework/GameMode.h`  
**来源继承：** `GameModeBase.h`

### AGameModeBase（基础）

```cpp
class AGameModeBase : public AInfo
{
    // 默认类引用
    TSubclassOf<APawn>            DefaultPawnClass;
    TSubclassOf<APlayerController> PlayerControllerClass;
    TSubclassOf<AGameStateBase>   GameStateClass;
    TSubclassOf<APlayerState>     PlayerStateClass;
    TSubclassOf<AHUD>             HUDClass;
    TSubclassOf<UGameSession>     GameSessionClass;
    TSubclassOf<ASpectatorPawn>   SpectatorClass;
};
```

#### 核心流程

```cpp
// 玩家接入
virtual void PreLogin(const FString& Options, const FUniqueNetIdRepl& UniqueId, 
    FString& ErrorMessage);
virtual void PostLogin(APlayerController* NewPlayer);
virtual void HandleStartingNewPlayer_Implementation(APlayerController* NewPlayer);

// 游戏流程
virtual void StartPlay();
virtual bool HasMatchEnded();
virtual bool ReadyToStartMatch();
virtual void StartMatch();
virtual void EndMatch();
```

### AGameMode（完整版）

继承 `AGameModeBase`，添加：
```
- 比赛状态机（EnteringMap / WaitingToStart / InProgress / WaitingPostMatch / LeavingMap）
- 热身/暂停/结束流程
- 队伍管理
```

## APlayerController — 玩家控制器

**源码：** `Engine/Classes/GameFramework/PlayerController.h`

每个玩家有一个专属的 PlayerController，**只在服务器和这个玩家之间同步**。

### 核心职责

```cpp
// 输入
UInputComponent* InputComponent;        // 输入绑定

// 相机控制
AActor*         ViewTarget;              // 被观察的目标
FCameraCacheEntry PlayerCameraManager;  // 相机管理器

// Pawn 控制
APawn*          PawnPendingDestroy;      // 待销毁的 Pawn
APawn*          CurrentPawn;             // 当前控制的 Pawn

// 网络
FString         PlayerNetworkAddress;    // 玩家网络地址
bool            bIsLocalPlayerController; // 是否为本地玩家
```

### 关键函数

```cpp
// Pawn 控制
virtual void Possess(APawn* InPawn);          // 控制一个 Pawn
virtual void UnPossess();                      // 释放 Pawn
void          SetPawn(APawn* InPawn);

// 输入
virtual void SetupInputComponent();            // 设置输入绑定
virtual void ProcessPlayerInput(const float DeltaTime, const bool bGamePaused);

// 相机
virtual void GetPlayerViewPoint(FVector& Location, FRotator& Rotation) const;

// 网络 RPC
UFUNCTION(Client, Reliable)
void ClientTravel(const FString& URL, ETravelType TravelType);
```

### Possess 流程

```
PlayerController::Possess(Pawn)
  → Pawn::PossessedBy(PC)
  → Pawn->SetOwner(PC)
  → Pawn->OnRep_Owner()
  → PC->Client_OnPawnPossessed()
  → Pawn->OnPossessedByClient() (客户端)
```

## APawn — 可操控角色

**源码：** `Engine/Classes/GameFramework/Pawn.h`

Pawn 是玩家或 AI 可以控制的游戏对象。

```cpp
class APawn : public AActor
{
    // 控制者
    AController* Controller;            // 当前控制者
    AController* LastControllerCache;   // 上一个控制者缓存
    
    // 移动
    UPawnMovementComponent* MovementComponent;
    
    // AI
    AController* GetController() const;
    
    // 网络
    bool bReplicateMovementToSimulated;  // 移动自动复制（通过网络）
};
```

### 关键函数

```cpp
// 被控制
virtual void PossessedBy(AController* NewController);
virtual void UnPossessed();

// 移动控制输入
virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent);
void AddMovementInput(FVector WorldDirection, float ScaleValue = 1.0f);
void AddControllerYawInput(float Val);
void AddControllerPitchInput(float Val);

// 发射/生成
FVector GetPawnViewLocation() const;
FRotator GetViewRotation() const;
```

## ACharacter — 带移动的 Pawn

**源码：** `Engine/Classes/GameFramework/Character.h`

Character 继承 Pawn，内置 CharacterMovementComponent。

```cpp
class ACharacter : public APawn
{
    UCharacterMovementComponent* CharacterMovement;  // 人物移动组件
    UCapsuleComponent*           CapsuleComponent;   // 胶囊碰撞体
    USkeletalMeshComponent*      Mesh;               // 骨骼网格
};

// 新增至 UE5.8:
// CharacterMovementComponentAsync 支持异步 Character 移动计算
```

## AGameState — 全局游戏状态

**源码：** `Engine/Classes/GameFramework/GameState.h` / `GameStateBase.h`

```cpp
class AGameStateBase : public AInfo, public IGameStateInterface
{
    TArray<APlayerState*> PlayerArray;     // 所有玩家状态
    float                MatchStateTimer;  // 比赛计时器
    bool                 bReplicatedHasBegunPlay; // 游戏是否已开始
    
    virtual void OnRep_MatchState();       // 比赛状态变化回调
    virtual void OnRep_ReplicatedHasBegunPlay();
};
```

**同步范围：** 对所有客户端复制。

## APlayerState — 玩家数据

**源码：** `Engine/Classes/GameFramework/PlayerState.h`

```cpp
class APlayerState : public AInfo
{
    FString         PlayerName;         // 玩家名
    int32           PlayerId;           // 玩家 ID
    int32           TeamId;             // 队伍 ID
    FUniqueNetIdRepl UniqueId;          // 平台唯一 ID
    float           Score;              // 分数
    int32           Ping;               // 延迟
    bool            bIsSpectator;       // 是否为旁观者
    bool            bIsABot;            // 是否为 Bot
};
```

**同步范围：** 对所有客户端复制。

## AHUD — 抬头显示

**源码：** `Engine/Classes/GameFramework/HUD.h`

```cpp
class AHUD : public AInfo
{
    APlayerController* PlayerOwner;       // 所属 PlayerController
    
    // 绘图
    UCanvas* Canvas;                      // 画布
    void DrawHUD();                       // 主绘图函数
    
    virtual void PostRender();
};
```

## AGameSession — 游戏会话

**源码：** `Engine/Classes/GameFramework/GameSession.h`

管理玩家登录、踢出、会话设置。

## AWorldSettings — 世界设置

**源码：** `Engine/Classes/GameFramework/WorldSettings.h`

每个 Level 的全局设置，可以覆盖 GameMode。

```
DefaultGameMode          ← 设置默认 GameMode
bEnableWorldPartition    ← World Partition 开关
bUseClientSideCameraInterpolation
TimeDilation             ← 时间膨胀（慢动作等）
```

## UE5.8 Gameplay 框架重要变化

| 变更 | 说明 |
|------|------|
| **AActor 新增 `EActorUpdateOverlapsMethod`** | 更精细控制重叠初始化的时机 |
| **AActor 新增 `ESpawnActorScaleMethod`** | 控制 Spawn 时缩放的计算方式 |
| **`CharacterMovementComponentAsync`** | 异步 Character 移动，减少主线程负载 |
| **网络复制增强** | Iris 集成更深；`AActor` 中新增 Iris 特定的网络标志 |
| **`LightWeightInstanceManager`** | 轻量级 Actor 实例化系统（高性能静态物体） |
