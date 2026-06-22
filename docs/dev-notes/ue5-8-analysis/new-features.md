---
sidebar_position: 6
tags: [ue5, ue5-8, nne, mass, verse, chaos, new-features]
---

# 新特性模块

UE5.8 引入了若干值得关注的新模块和技术改进。

## NNE — 神经网络引擎

NNE（Neural Network Engine）是 UE5 内置的神经网络推理引擎，允许在游戏运行时加载和运行 AI 模型。

```
Runtime/NNE/Public/
├── NNE.h                  ← 主接口（Register/Unregister Runtime）
├── NNEModelData.h         ← 模型数据管理
├── NNERuntime.h           ← IRuntime 接口（CPU/GPU/NPU）
├── NNERuntimeCPU.h        ← CPU 运行时
├── NNERuntimeGPU.h        ← GPU 运行时
├── NNERuntimeNPU.h        ← NPU 运行时（神经处理单元）
├── NNERuntimeRDG.h        ← RDG 集成运行时
├── NNERuntimeRunSync.h    ← 同步推理封装
├── NNEStatus.h            ← 状态/错误码
└── NNETypes.h             ← 类型定义（Tensor、Shape、DataType）
```

### NNE 架构

```
NNE Runtime Manager
├── CPU Runtime (NNERuntimeCPU) — 纯 CPU 推理
├── GPU Runtime (NNERuntimeGPU) — GPU 加速
├── NPU Runtime (NNERuntimeNPU) — 专用 NPU
└── RDG Runtime (NNERuntimeRDG) — 集成到 Render Graph 中
```

**使用流程：**
1. 加载模型 → `UNNEModelData`
2. 注册 Runtime → `UE::NNE::RegisterRuntime()`
3. 创建推理会话
4. 输入数据 → 推理 → 输出结果

> NNE 使得在游戏中运行 ML/AI 模型成为可能——如姿态识别、动作分析、智能 NPC 行为等。

## Mass — 大规模实体系统

Mass 是 UE5 的 ECS（Entity-Component-System）架构实现，专门用于处理大规模实体（数万到数百万个对象）。

```
Runtime/Mass/
├── MassCore/       ← 核心 ECS 框架
│   ├── Public/Mass/
│   │   ├── MassEntityManager.h    ← 实体管理器
│   │   ├── MassProcessingPhases.h ← 处理阶段
│   │   ├── MassArchetype.h        ← 原型（同类实体集合）
│   │   └── MassChunk.h            ← Chunk 存储
│   └── Private/...
├── MassEntity/     ← UE 集成层
├── MassEngine/     ← 引擎集成
├── MassDeveloper/  ← 调试工具
└── MassSignals/    ← 信号系统
```

```
MassEntity/Public/
├── MassEntitySubsystem.h   ← 引擎子系统
├── MassEntityConfigFile.h  ← 配置文件
├── MassExecutionContext.h  ← 执行上下文
├── MassFragment.h          ← Fragment（组件数据）
├── MassProcessor.h         ← Processor（系统）
├── MassProcessingPhase.h   ← 处理阶段
├── MassQuery.h             ← 实体查询
└── MassSettings.h          ← 设置
```

### Mass ECS 架构

```
Fragment（数据层）: 纯数据，无逻辑
  → FragmentA { Position, Velocity }
  → FragmentB { Health, Mana }

Processor（逻辑层）: 纯逻辑，无数据
  → MovementProcessor ← Query(Position, Velocity) → Update
  → HealthProcessor ← Query(Health) → Tick

Archetype（存储层）: 相同 Fragment 组合的实体集合
  → ArchetypeA: Position + Velocity + Health
  → ArchetypeB: Position + Velocity + RenderInfo
```

## Verse

Verse 是 Epic 为元宇宙开发的编程语言，UE5.8 中包含 Verse 编译器和运行时的源码。

```
Runtime/VerseCompiler/  ← Verse 编译器实现
Runtime/Solaris/        ← Verse 运行时虚拟机
    ├── Public/         ← 公开 API
    └── Private/        ← 实现
```

## Chaos 物理

Chaos 是 UE5 的物理引擎，完全替代了 PhysX。

```
Runtime/Experimental/Chaos/         ← 核心物理
Runtime/Experimental/ChaosCore/     ← 物理核心库
Runtime/Experimental/ChaosSolverEngine/ ← 解算引擎
Runtime/Experimental/ChaosVehicles/ ← 车辆物理
Runtime/Experimental/ChaosSpatialPartitions/ ← 空间分区
Runtime/Experimental/FieldSystem/   ← 场系统（破坏）
Runtime/Experimental/GeometryCollectionEngine/ ← 几何体集合
```

### 关键子系统

| 子系统 | 说明 |
|--------|------|
| Chaos Core | 刚体动力学、碰撞检测、约束求解 |
| Chaos Vehicles | 基于物理的车辆模拟 |
| Field System | 场力驱动的效果（爆炸、风、力场） |
| Geometry Collection | 破坏系统——将 Mesh 切分为碎块 |
| Chaos Visual Debugger | 物理可视化调试器 |

## AutoRTFM

`AutoRTFM`（Runtime/Runtime/AutoRTFM）是 UE5.8 中值得关注的新模块——**自动运行时事务内存**。它允许在多线程环境中以原子方式执行代码块，自动处理数据冲突和回滚。

## 其他重要新增/变更模块

| 模块 | 功能 |
|------|------|
| **StateStream** | 渲染帧间状态插值系统（详见[网络与复制](networking)） |
| **CUDA** | CUDA 集成（GPU 通用计算） |
| **InteractiveToolsFramework** | 交互式工具框架 |
| **SparseVolumeTexture** | 稀疏体积纹理 |
| **TypedElementFramework/Runtime** | 类型化元素系统（UI/编辑器基础设施） |
| **UniversalObjectLocator** | 通用对象定位器 |
| **AutomationTest** | 自动化测试框架 |
| **ComputeSystemInterface** | 计算系统接口（GPU Compute） |
| **RenderGraph** | 渲染图系统（详见[渲染系统](rendering)） |
