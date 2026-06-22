---
sidebar_position: 14
tags: [ue5, ue5-8, iris, networking, replication, mmo]
---

# Iris 复制系统深度分析

**模块名：** IrisCore  
**源码路径：** `Engine/Source/Runtime/Net/Iris/`  
**命名空间：** `UE::Net`

Iris 是 UE5 的新一代网络复制引擎，在 UE5.8 中完全成熟。相比 UE4 的传统 Replication 系统，Iris 在性能、可扩展性、带宽利用率和 MMO 支持上有质的飞跃。

---

## 1. 架构总览

```
游戏层 (UObject/AActor)
    ↑↓  ObjectReplicationBridge
Iris 核心层
  ├── UReplicationSystem（主系统）
  │   ├── Filtering（过滤系统 — 哪些对象对哪个连接可见）
  │   ├── Prioritization（优先级系统 — 发送顺序）
  │   ├── DeltaCompression（增量压缩）
  │   ├── NetBlob（RPC 与 Attachment）
  │   └── DataStream（序列化数据流）
  ├── FNetRefHandle（64-bit 网络句柄）
  └── Serialization（序列化器）
    ↑↓
网络传输层 (Net/Core)
```

### 与传统系统对比

| 特性 | 传统 Replication | Iris |
|------|-----------------|------|
| **句柄** | NetworkGUID (32-bit) | `FNetRefHandle` (64-bit, 含序列号防重用) |
| **对象过滤** | 硬编码在 Actor Channel | 可插拔 `UNetObjectFilter` |
| **优先级** | 简单基于距离 | 可插拔 `UNetObjectPrioritizer` |
| **增量压缩** | 无 | 支持 Delta Compression Baseline |
| **RPC 系统** | 基于 Channel | 基于 `NetBlob`（更灵活） |
| **子对象复制** | 受限于 Actor Channel | 独立于根对象 |
| **TArray 同步** | 整体序列化 | `FFastArraySerializer` 增量同步 |
| **依赖对象调度** | 简单先后 | 支持 `EDependentObjectSchedulingHint` |
| **MMO 群集** | 不支持 | 支持 GridFilter + 空间优先级 |

---

## 2. 核心源码分析

### 2.1 FNetRefHandle — 64 位网络句柄

**文件：** `Iris/ReplicationSystem/NetRefHandle.h`

替代传统 `NetworkGUID`，每个网络对象拥有唯一句柄：

```cpp
class FNetRefHandle
{
    // 64-bit 内部结构：
    struct {
        uint64 Static : 1;               // 是否为静态（关卡）对象
        uint64 Serial : 53;              // 序列号（防悬挂引用）
        uint64 ReplicationSystemId : 10; // 所属 ReplicationSystem
    } Fields;

    bool IsStatic() const;   // 静态对象（关卡 Actor）→ ODD ID
    bool IsDynamic() const;  // 动态对象（Spawned Actor）→ EVEN ID
    bool IsValid() const;    // Serial != 0
};
```

**关键特性：**
- **序列号机制**防止句柄被回收后误用（类似 `FMassEntityHandle` 的设计）
- `MaxSerial = 2^53` ≈ 9000 万亿，几乎不会耗尽
- `MaxReplicationSystemCount = 1024`（10-bit ID）
- 支持 `FullCompare()` 完全比对（含 ReplicationSystemId）

### 2.2 UReplicationSystem — 主系统

**文件：** `Iris/ReplicationSystem/ReplicationSystem.h`

```cpp
UCLASS(transient)
class UReplicationSystem : public UObject
{
    struct FReplicationSystemParams
    {
        UObjectReplicationBridge* ReplicationBridge;
        uint32 MaxReplicatedObjectCount = 65536;   // 最大复制对象数
        uint32 InitialNetObjectListCount = 65536;  // 预分配列表大小
        uint32 NetObjectListGrowCount = 16384;     // 增长步长
    };
};
```

### 2.3 对象复制的核心流程

```
服务器每帧：
  1. 标记脏对象（MarkDirty）
  2. 过滤（Filtering）→ 确定每个连接可见的对象
  3. 优先级计算（Prioritization）→ 排序发送顺序
  4. 增量压缩（DeltaCompression）→ 只发送变化
  5. 序列化（Serialization）→ 写入 BitStream
  6. 发送（TickFlush / PostTickDispatch）

客户端每帧：
  1. 接收 BitStream
  2. 反序列化
  3. 应用状态 → 触发 OnRep 回调
```

### 2.4 对象复制桥 — ObjectReplicationBridge

**文件：** `Iris/ReplicationSystem/ObjectReplicationBridge.h`

Bridge 是 Iris 和游戏层之间的桥梁，负责将 `AActor`/`UObject` 映射到 Iris 内部对象：

```cpp
// 代理（Delegates）：
FOnRootObjectPostInit  // 根对象初始化完成
FOnRootObjectDetached  // 根对象分离
FOnSubObjectPostInit   // 子对象初始化完成
FOnSubObjectDetached   // 子对象分离
```

**常用方法：**
- `CreateRootObject(AActor*)` — 注册 AActor 为根复制对象
- `CreateSubObject(UObject*, RootObject)` — 注册子对象
- `DestroyObject(Handle)` — 销毁对象
- `SetObjectRelevancy(Handle, bRelevant)` — 临时控制相关度

### 2.5 过滤系统 — UNetObjectFilter

**文件：** `Iris/ReplicationSystem/Filtering/NetObjectFilter.h`

决定一个对象是否需要发送给某个连接：

```cpp
enum class ENetFilterStatus : uint32
{
    Disallow,  // 禁止复制
    Allow,     // 允许复制
};
```

**内置过滤器：**

| 过滤器 | 文件 | 功能 |
|--------|------|------|
| `UNetObjectGridFilter` | `NetObjectGridFilter.h` | **网格空间过滤** — 基于玩家位置和剔除距离的 2D/3D 空间过滤，MMO 的核心！ |
| `UAlwaysRelevantNetObjectFilter` | `AlwaysRelevantNetObjectFilter.h` | 始终相关（GameMode、GameState） |
| `UFilterOutNetObjectFilter` | `FilterOutNetObjectFilter.h` | 始终过滤 |
| `UNetObjectConnectionFilter` | `NetObjectConnectionFilter.h` | 基于连接 ID 过滤 |
| `UNetObjectParentRelevancyGridFilter` | `NetObjectParentRelevancyGridFilter.h` | 父级关联网格过滤 |

#### 网格过滤器配置（MMO 核心）

```cpp
UCLASS(transient, config=Engine)
class UNetObjectGridFilterConfig : public UNetObjectFilterConfig
{
    // 玩家跨越单元格后，老单元格继续相关多少帧（防止边界闪烁）
    uint32 ViewPosRelevancyFrameCount = 2;
};

// 配置文件（Profile）：
USTRUCT()
struct FNetObjectGridFilterProfile
{
    FName FilterProfileName;         // 配置名称
    uint16 FrameCountBeforeCulling = 4; // 剔除前保留帧数
};
```

### 2.6 优先级系统 — UNetObjectPrioritizer

**文件：** `Iris/ReplicationSystem/Prioritization/NetObjectPrioritizer.h`

决定对象的发送优先级。优先级的本质是带宽分配策略。

```cpp
struct FNetObjectPrioritizationParams
{
    const FInternalNetRefIndex* ObjectIndices; // 对象索引
    uint32 ObjectCount;                          // 数量
    float* Priorities;                           // 优先级值
};
```

**内置优先级器：**

| 优先级器 | 文件 | 策略 |
|---------|------|------|
| `USphereNetObjectPrioritizer` | `SphereNetObjectPrioritizer.h` | 球形距离优先级（内圈高优先级，外圈低） |
| `USphereWithOwnerBoostNetObjectPrioritizer` | `SphereWithOwnerBoostNetObjectPrioritizer.h` | 球形 + 所有者提升 |
| `UFieldOfViewNetObjectPrioritizer` | `FieldOfViewNetObjectPrioritizer.h` | FOV 视野优先级（视角内优先） |
| `ULocationBasedNetObjectPrioritizer` | `LocationBasedNetObjectPrioritizer.h` | 位置基类 |
| `UNetObjectCountLimiter` | `NetObjectCountLimiter.h` | 每帧限制发送数量（RoundRobin / Fill 模式）|

#### SpherePrioritizer 配置

```cpp
UCLASS(transient, config=Engine)
class USphereNetObjectPrioritizerConfig
{
    float InnerRadius = 2000.0f;    // 内圈半径（最高优先级）
    float OuterRadius = 10000.0f;   // 外圈半径
    float InnerPriority = 1.0f;     // 内圈优先级值
    float OuterPriority = 0.2f;     // 外圈边界优先级
    float OutsidePriority = 0.1f;   // 外圈外优先级
};
```

#### CountLimiter 配置（MMO 带宽控制）

```cpp
UENUM()
enum class ENetObjectCountLimiterMode
{
    RoundRobin,  // 轮流——每帧选 N 个不同对象
    Fill,        // 填充——每帧选最久未同步的 N 个对象
};

class UNetObjectCountLimiterConfig
{
    ENetObjectCountLimiterMode Mode = RoundRobin;
    uint32 MaxObjectCount = 2;       // 每帧考虑的对象数
    float Priority = 1.0f;           // 达到此阈值才发送
    bool bEnableOwnedObjectsFastLane = true; // 所属对象快速通道
};
```

### 2.7 发送策略 — ReplicationSystemTypes

**文件：** `Iris/ReplicationSystem/ReplicationSystemTypes.h`

```cpp
// 两种发送时机：
enum class EReplicationSystemSendPass
{
    PostTickDispatch,  // Tick 分发后立即发送（部分更新，仅 RPC/Attachment）
    TickFlush,         // Tick 结束时完整更新（包含属性和过滤）
};

// 依赖对象调度策略：
enum class EDependentObjectSchedulingHint
{
    Default,                            // 默认：跟随父对象
    ScheduleBeforeParent,               // 优先于父对象发送
    ScheduleBeforeParentIfInitialState,  // 初始状态优先发送
};
```

---

## 3. MMO 网络优化实战

### 3.1 启用 Iris

在 `DefaultEngine.ini` 中：

```ini
[/Script/OnlineSubsystemUtils.IpNetDriver]
ReplicationSystemName=Iris
```

或者在代码中：

```cpp
UE::Net::SetUseIrisReplication(true);
```

### 3.2 配置网格过滤（关键！）

```ini
[/Script/IrisCore.NetObjectGridFilterConfig]
ViewPosRelevancyFrameCount=2

[/Script/IrisCore.NetObjectGridFilterProfile]
+Profiles=(FilterProfileName="Default", FrameCountBeforeCulling=4)
```

### 3.3 配置空间优先级

```cpp
// 自定义优先级配置
UNetObjectCountLimiterConfig* LimiterConfig = 
    GetMutableDefault<UNetObjectCountLimiterConfig>();
LimiterConfig->Mode = ENetObjectCountLimiterMode::RoundRobin;
LimiterConfig->MaxObjectCount = 10;       // 每帧最多同步 10 个非所有者对象
LimiterConfig->bEnableOwnedObjectsFastLane = true;
LimiterConfig->SaveConfig();
```

### 3.4 注册 AActor 到 Iris

```cpp
// AActor 开始复制时自动注册（前提：bReplicates = true）
// 或手动注册：
UObjectReplicationBridge* Bridge = ...;
FNetRefHandle Handle = Bridge->CreateRootObject(MyActor);

// 注册子对象
FNetRefHandle SubHandle = Bridge->CreateSubObject(MySubObject, MyActor);

// 销毁对象
Bridge->DestroyObject(Handle);
```

### 3.5 自定义 DataStream（进阶）

```cpp
// 继承 UDataStream 实现自定义序列化逻辑
class FMyCustomDataStream : public UDataStream
{
    // 重写序列化/反序列化方法
    virtual void WriteData(...) override;
    virtual void ReadData(...) override;
};
```

### 3.6 MMO 配置示例

```ini
[/Script/IrisCore.IrisDynamicConfig]
; 并行 Iris 支持
UE_SUPPORT_PARALLEL_IRIS=1

; ReplicationSystem 参数
MaxReplicatedObjectCount=262144    ; 最大复制对象数
InitialNetObjectListCount=262144   ; 预分配
NetObjectListGrowCount=32768       ; 增长步长
```

---

## 4. 关于 Iris 的注意事项

| 注意点 | 说明 |
|--------|------|
| **Iris 与 PushModel 兼容** | 通过 `LegacyPushModel.cpp` 桥接 |
| **FastArraySerializer 增量同步** | 通过 `FastArrayReplicationFragment` 支持 |
| **RPC 系统** | 通过 `NetBlob` 实现，支持可靠/不可靠、有序/OOB |
| **依赖性对象** | 使用 `SetDependentObjectSchedulingHint()` 控制调度 |
| **调试支持** | 通过 `IrisCreationFlowLog` 和 `NetMetrics` 追踪 |
| **带宽统计** | 通过 `NetStats` 子系统收集 |

---

## 5. Iris 如何引入项目

### 步骤 1：确认 Iris 启用

```cpp
if (UE::Net::ShouldUseIrisReplication())
{
    UE_LOG(LogNet, Log, TEXT("Iris replication system enabled"));
}
```

### 步骤 2：配置空间过滤

```ini
; DefaultEngine.ini
[/Script/IrisCore.NetObjectGridFilterConfig]
ViewPosRelevancyFrameCount=3

[/Script/IrisCore.SphereNetObjectPrioritizerConfig]
InnerRadius=2500.0
OuterRadius=12000.0
InnerPriority=1.0
OuterPriority=0.3
OutsidePriority=0.05
```

### 步骤 3：利用 Iris 特性优化性能

| MMO 场景 | Iris 配置 |
|----------|----------|
| 万人同服 | `MaxObjectCount` 限制 + GridFilter 空间划分 |
| 同屏大量 Actor | `CountLimiter` RoundRobin 模式，每帧均摊同步 |
| 视野优先级 | `FieldOfViewNetObjectPrioritizer` 视角内优先同步 |
| 对象所有权 | `bEnableOwnedObjectsFastLane` 所属对象快速通道 |
| 子对象同步 | `CreateSubObject()` + `EDependentObjectSchedulingHint` |
| 带宽控制 | `NetObjectCountLimiter` 限制每帧同步量 |

---

## 6. UE5.8 Iris 变更

| 变更 | 说明 |
|------|------|
| **并行支持** | `UE_SUPPORT_PARALLEL_IRIS` 控制 Iris 并行执行 |
| **并发存储** | 与 Mass 一致，Iris 内部数据结构也趋向并发安全 |
| **CountLimiter RoundRobin** | 适用于大批量对象的带宽均摊 |
| **Debugging 增强** | `IrisCreationFlowLog` 提供详细的创建/销毁追踪 |
| **NetRefHandle 序列化大小** | 可通过 `UE_NET_IRIS_NETREFHANDLE_SERIAL_SIZE` 自定义（默认 53） |

> **核心结论：** Iris 是为 MMO 级网络同步设计的复制引擎。网格过滤 + 空间优先级 + 数量限制器的组合，可以在有限带宽下管理数十万个网络对象。
