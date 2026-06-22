---
sidebar_position: 9
tags: [ue5, ue5-8, component, scene-component, actor-component]
---

# UActorComponent — 组件系统

**组件（Component）** 是 UE5 组合式架构的核心。每个 `AActor` 可以挂载多个 Component，Component 负责具体的功能实现——渲染、物理、移动、音频等。

## 组件层级

```
UActorComponent（基类，无 Transform）
└── USceneComponent（有 Transform — 位置/旋转/缩放）
    ├── UPrimitiveComponent（可渲染 + 碰撞）
    │   ├── UMeshComponent（网格渲染）
    │   │   ├── UStaticMeshComponent
    │   │   ├── USkeletalMeshComponent
    │   │   └── UInstancedStaticMeshComponent
    │   ├── UShapeComponent（碰撞形状）
    │   │   ├── UBoxComponent
    │   │   ├── USphereComponent
    │   │   └── UCapsuleComponent
    │   ├── UTextRenderComponent
    │   ├── USplineMeshComponent
    │   └── UDecalComponent
    ├── UCameraComponent（相机）
    ├── UAudioComponent（音频播放）
    ├── ULightComponent（光照）
    ├── USpringArmComponent（弹簧臂——第三人称相机）
    └── UBillboardComponent（公告板）
│
├── UActorComponent（无 Transform 的组件）
│   ├── UPawnMovementComponent（Pawn 移动）
│   ├── UCharacterMovementComponent（Character 移动）
│   ├── UProjectileMovementComponent（抛射物移动）
│   ├── UInputComponent（输入绑定）
│   ├── UTimelineComponent（时间线）
│   ├── UChildActorComponent（子 Actor）
│   └── UWidgetComponent（3D Widget）
```

**源码：** `Engine/Classes/Components/` 目录下包含所有组件头文件。

## UActorComponent — 基础组件

**源码：** `Engine/Classes/Components/ActorComponent.h`

所有组件的基类。继承自 `UObject`。

### 生命周期

```
构造 → OnComponentCreated → PostInitProperties →
  RegisterComponent → BeginPlay → TickComponent →
  UnregisterComponent → EndPlay → DestroyComponent
```

### 核心属性

```cpp
class UActorComponent : public UObject
{
    // Tick 控制
    UActorComponentTickFunction PrimaryComponentTick;
    
    // 状态标志
    uint8 bRegistered:1;          // 已注册到 World
    uint8 bActive:1;              // 激活状态
    uint8 bReplicates:1;          // 是否网络复制
    uint8 bAutoActivate:1;        // 自动激活
};
```

### 关键虚函数

```cpp
virtual void BeginPlay() override;
virtual void TickComponent(float DeltaTime, ELevelTick TickType, 
    FActorComponentTickFunction* ThisTickFunction);
virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
virtual void OnComponentCreated();
virtual void OnRegister();
virtual void OnUnregister();
virtual void Activate(bool bReset = false);
virtual void Deactivate();
```

### 组件注册

Component 必须注册到 World 才能参与 Tick 和渲染：

```cpp
// 手动注册
MyComponent->RegisterComponent();

// 自动注册（通过 Actor 创建时自动调用）
CreateDefaultSubobject<UMyComponent>(TEXT("MyComponent"));

// 注销
MyComponent->UnregisterComponent();
```

## USceneComponent — 场景组件

**源码：** `Engine/Classes/Components/SceneComponent.h`

有位置/旋转/缩放的组件。Actor 的根组件必须是 SceneComponent。

### 核心属性

```cpp
class USceneComponent : public UActorComponent
{
    FVector  RelativeLocation;      // 相对父级位置
    FRotator RelativeRotation;      // 相对父级旋转
    FVector  RelativeScale3D;       // 相对父级缩放
    uint8 bVisible:1;               // 可见性
    TArray<USceneComponent*> AttachChildren; // 子组件列表
    USceneComponent* AttachParent;  // 父组件
};
```

### 变换层级

```
Actor.RootComponent
  └── SceneComponentA (AttachParent = RootComponent)
      ├── MeshComponent (AttachParent = SceneComponentA)
      └── CameraComponent (AttachParent = SceneComponentA)
```

## UPrimitiveComponent — 可渲染组件

**源码：** `Engine/Classes/Components/PrimitiveComponent.h`

可以渲染和参与碰撞的组件。所有可见 Mesh 的基类。

### 核心能力

```cpp
// 碰撞
ECollisionEnabled::QueryOnly / PhysicsOnly / QueryAndPhysics
// 渲染
UPrimitiveComponent::SetMaterial()
UPrimitiveComponent::SetVisibility()
// 重叠/命中事件
OnComponentBeginOverlap
OnComponentEndOverlap
OnComponentHit
```

## UE5.8 相关新特性

| 组件 | 说明 |
|------|------|
| `UCharacterMovementComponentAsync` | 异步 Character 移动（减少主线程负担） |
| `ULightWeightInstanceManager` | 轻量级实例管理器 |
| `UWorldPartitionStreamingSourceComponent` | World Partition 流式源组件 |
| `UHeterogeneousVolumeComponent` | 异质体积组件 |
| `ULocalFogVolumeComponent` | 局部雾体积 |

## 常见模式

### 创建根组件

```cpp
// .h
UPROPERTY(VisibleAnywhere)
TObjectPtr<USceneComponent> Root;

UPROPERTY(VisibleAnywhere)
TObjectPtr<UStaticMeshComponent> Mesh;

// .cpp
AMyActor::AMyActor()
{
    Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));
    SetRootComponent(Root);
    
    Mesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    Mesh->SetupAttachment(Root);
}
```

### 获取组件

```cpp
// 获取指定类型组件
UActorComponent* Comp = GetComponentByClass(UMyComponent::StaticClass());

// 获取所有指定类型组件
TArray<UActorComponent*> Comps = GetComponentsByClass(UMyComponent::StaticClass());

// 简写模板
UMyComponent* Comp = FindComponentByClass<UMyComponent>();
```
