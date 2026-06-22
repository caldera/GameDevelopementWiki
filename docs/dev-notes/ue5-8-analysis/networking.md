---
sidebar_position: 5
tags: [ue5, ue5-8, networking, replication, iris, statestream, mmo]
---

# 网络与复制系统

UE5.8 的网络架构由三个层级组成：**Net/Core**（底层传输）→ **Iris**（新一代复制引擎）→ **StateStream**（渲染帧间状态插值）。

## 模块概览

```
Runtime/Net/
├── Common/          ← 通用网络工具
├── Core/            ← 核心网络层
│   ├── Public/Net/Core/
│   │   ├── NetBuffer.h      ← 网络缓冲区
│   │   ├── NetBitWriter.h   ← Bit 级写入器
│   │   ├── NetBitReader.h   ← Bit 级读取器
│   │   ├── NetPacket.h      ← 网络包
│   │   ├── NetConnection.h  ← 连接管理
│   │   └── NetDriver.h      ← 网络驱动
│   └── ...
└── Iris/            ← Iris 复制系统
    ├── Public/Iris/
    │   ├── Core/             ← 核心类型
    │   ├── ReplicationSystem/ ← 复制系统核心
    │   ├── ReplicationState/  ← 复制状态
    │   ├── Serialization/    ← 序列化
    │   ├── DataStream/       ← 数据流
    │   ├── PacketControl/    ← 包控制
    │   └── Config/           ← 配置
    └── Private/...
```

## Iris — 新一代复制系统

Iris 是 UE5 引入的全新网络复制引擎，在 UE5.8 中已趋成熟。

### 核心组件

| 组件 | 文件 | 功能 |
|------|------|------|
| **复制系统** | `ReplicationSystem/` | 复制引擎主循环 |
| **NetRefHandle** | `NetRefHandle.h` | 网络引用句柄（替代传统 NetworkGUID） |
| **NetObjectFactory** | `NetObjectFactory.h` | 网络对象的工厂创建 |
| **对象复制桥** | `ObjectReplicationBridge.h` | UE 原生 Actor 到 Iris 的桥接 |
| **FastArray 复制** | `FastArrayReplicationFragment.h` | TArray 的高效增量同步 |
| **数据流** | `DataStream/` | 自定义数据流片段 |
| **包控制** | `PacketControl/` | 丢包/乱序/拥塞处理 |

### Iris 与传统 Replication 的对比

| 特性 | 传统 Replication | Iris |
|------|-----------------|------|
| **架构** | 内嵌在 Engine 中 | 独立模块，可插拔 |
| **对象引用** | NetworkGUID | `FNetRefHandle`（更轻量） |
| **增量同步** | 基于属性脏标记 | 基于状态分组 + 分片 |
| **TArray 同步** | 整体序列化 | `FFastArraySerializer` 增量同步 |
| **依赖关系** | 线性 | 支持依赖优先序 |
| **延迟处理** | 简单 | 支持优先级队列 |
| **可扩展性** | 有限 | 自定义 Fragment/DataStream |

### FNetRefHandle

```
// 比传统 NetworkGUID 更轻量的网络引用
FNetRefHandle → InternalNetRefIndexManager
  → 按需分配、索引管理、64 位全局唯一 ID
```

### Iris 复制流程

```
服务器端:
1. 标记脏对象 (MarkDirty)
2. 优先级排序 (Prioritize)
3. 构建复制包 (BuildPacket)
4. 序列化到 BitStream (Serialize)
5. 发送 (Send)

客户端:
1. 接收包 (Receive)
2. 反序列化 (Deserialize)
3. 应用状态 (ApplyState)
4. 触发回调 (PostApply)
```

## StateStream — 状态流

StateStream 是 UE5.8 中引入的渲染帧间状态插值系统。

```
Runtime/StateStream/Public/
├── StateStream.h              ← 主接口 IStateStream
├── StateStreamCreator.h       ← 流创建器
├── StateStreamManager.h       ← 流管理器
├── StateStreamStore.h         ← 状态存储
├── GenericStateStream.h       ← 泛型流实现
├── TransformStateStream.h     ← Transform 专用流
├── TransformStateStreamMath.h ← Transform 插值数学
├── StateStreamHandle.h        ← 句柄系统
├── StateStreamDefinitions.h   ← 基础定义
├── StateStreamDebugRenderer.h ← 调试渲染
└── Pow2ChunkedArray.h         ← 2 的幂分块数组
```

### StateStream 架构

```
Game Thread (GT) → 写入 Tick 数据
    ↓
StateStream Buffer (环形存储)
    ↓
Render Thread (RT) → 读取并插值到指定时间点
```

**关键接口 `IStateStream`：**
- `Game_BeginTick(LaneId)` — 开始当前 Tick
- `Game_EndTick(AbsoluteTime, LaneId)` — 提交当前 Tick
- `Render_Update(AbsoluteTime)` — 渲染线程插值
- `Render_Interpolate()` — 插值结果回调

### 适用场景

| 场景 | 说明 |
|------|------|
| **Transform 插值** | 平滑物体位置/旋转/缩放 |
| **动画状态** | 动画骨骼的帧间平滑 |
| **物理模拟** | 物理结果的视觉平滑 |
| **网络同步** | 网络更新频率低时的视觉平滑 |

## UE5.8 MMO 网络开发速查

| 需求 | 使用的模块 |
|------|-----------|
| 基础网络传输 | `Net/Core` — NetDriver, NetConnection |
| 对象复制 | `Iris` — ReplicationSystem, FNetRefHandle |
| 属性同步 | `Iris` + `UPROPERTY(Replicated)` |
| RPC | `UFUNCTION(Server/Client/NetMulticast)` |
| 帧间插值 | `StateStream` — TransformStateStream |
| TArray 增量同步 | `Iris` — FastArrayReplicationFragment |
| 自定义同步 | `Iris` — Custom DataStream |
| 带宽控制 | `Iris` — PacketControl |
