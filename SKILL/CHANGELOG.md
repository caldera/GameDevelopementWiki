# CHANGELOG — GameDevelopementWiki

> 所有版本变更记录。每次增删改内容后同步更新。
> 版本格式：**major.minor.patch** | Git tag: `v$(cat VERSION)`

---

### v0.3.4 — Mass ECS 深度分析（2026-06-22）
- 新增 `ue5-8-analysis/mass-deep-dive`：Mass ECS 架构全解（Fragment/Tag/Processor/Archetype/Query/Signal）、源码抄录（FMassEntityHandle/FTransformFragment/UMassProcessor/UMassSignalSubsystem/FMassProcessingPhase）、万怪实战代码、ISM 渲染集成、UE5.8 变更（并发存储强制启用、Fragment 迁移）
- 来源：UE 5.8 引擎源码 `Engine/Source/Runtime/Mass/`

### v0.3.3 — NNE 绑怪实战（2026-06-22）
- 新增 `ue5-8-analysis/nne-monster-ai`：3 种绑怪架构、MonsterNNComponent 完整 C++ 实现、Async 异步推理、Batch 优化、BehaviorTree 黑板集成
- 来源：UE 5.8 引擎源码 `Engine/Source/Runtime/NNE/`

### v0.3.2 — NNE 神经网络引擎深度分析（2026-06-22）
- 新增 `ue5-8-analysis/nne-deep-dive`：NNE 三层抽象架构（ModelData→IModel→IModelInstance）、全部源码抄录（NNETypes/INNERuntime/NNERuntimeCPU/GPU/NPU/RDG/NNEModelData/FRegistry）、ONNX 导入流程、LLM API 接入可行性评估
- 来源：UE 5.8 引擎源码 `Engine/Source/Runtime/NNE/`

### v0.3.1 — Gameplay 框架逐系统分析（2026-06-22）
- 新增 `ue5-8-analysis/world-level`：UWorld 架构、ULevel、Level Streaming、World Partition、Tick 循环
- 新增 `ue5-8-analysis/actor`：AActor 生命周期 10 步、TickGroup 优先级、6 个复制标志位、Spawn 参数
- 新增 `ue5-8-analysis/component`：组件层级树、生命周期、注册机制、UE5.8 新组件
- 新增 `ue5-8-analysis/gameplay-framework`：GameMode/PlayerController/Pawn/Character/GS/PS/HUD 全流程、UE5.8 变更汇总
- 来源：UE 5.8 引擎源码 `Engine/Source/Runtime/Engine/Classes/GameFramework/`

### v0.3.0 — 添加 UE5.8 引擎源码分析（2026-06-22）
- 新增 `ue5-8-analysis/` 完整板块（5 章）：源码架构总览、Core & CoreUObject、Engine 核心、Rendering RHI、Iris 网络复制、新特性模块
- 模块规模排行、关键源码路径速查、Nanite/Lumen/RDG 管线、Iris 复制系统全解、StateStream 插值系统、NNE/Mass/Verse/Chaos/AutoRTFM 新特性概览
- 来源：UE 5.8 引擎源码 `T:\Unreal Engines\UE_5.8\Engine\Source`

### v0.2.5 — 主线原则（2026-06-22）
- SKILL.md 版本管理新增主线原则：不做分支/临时/测试/预览版本

### v0.2.4 — SKILL 内容更新日志 + 规范工作流（2026-06-22）
- SKILL.md 全面重写：新增内容更新日志章节、内容更新工作流、commit 格式规范、完整目录结构、中英对照规范

### v0.2.3 — 深挖 C++ 风格指南（2026-06-22）
- 新增 `cpp-style-guide/deep-dive`：Stream vs Printf、无符号陷阱、RAII、匈牙利命名法、宏高级用法、MSVC 封装
- 增强 `formatting`：修复重复内容，17 节细化格式规则
- 增强 `exceptions`：Windows 规则补充 5 处细节
- 来源：Google C++ 编程风格指南（edisonpeng 整理版）

### v0.2.2 — 深挖 Prompt Engineering 第二轮（2026-06-22）
- 新增 `prompt-engineering/resources`：论文索引、模型对比、Vertex AI Studio 速查
- 新增 `prompt-engineering/pitfalls`：10 大常见陷阱 + Debug Checklist
- 增强 `advanced-techniques`：CoT 优劣势表、选型决策指南、ReAct 实战注意
- 增强 `code-prompting`：JSON 输出三大好处、6 条关键原则
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.2.1 — 深挖 Prompt Engineering 第一轮（2026-06-22）
- 增强 `llm-config`：Softmax 类比、极端值压制关系表
- 增强 `basic-techniques`：Zero-shot 失败模式、安全/毒性控制、幻觉抑制
- 增强 `advanced-techniques`：CoT 答案后置原理、Temperature=0 原则
- 增强 `best-practices`：完整 Prompt 生命周期、RAG 集成、自动化测试
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.2.0 — 添加 Prompt Engineering 指南（2026-06-22）
- 新增 `prompt-engineering/` 完整板块（5 章）：LLM 配置、基础技术、高级推理、代码提示、最佳实践
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.1.1 — 添加 C++ 风格指南（2026-06-22）
- 新增 `dev-notes/cpp-style-guide/` 完整板块（8 章）
- 来源：Google C++ 编程风格指南（edisonpeng 整理版）

### v0.1.0 — 初始化（2026-06-22）
- 初始化 Docusaurus 3 项目
- 建立 5 大分区骨架（dev-notes / ue5-caveats / world-building / project-mgmt / mmo-dev）
- 建版 VERSION、SKILL/ 目录、版本系统、prebuild 校验钩子
- Git tag: `v0.1.0`
