# CHANGELOG — GameDevelopementWiki

> 所有版本变更记录。每次增删改内容后同步更新。
> 版本格式：**major.minor.patch** | Git tag: `v$(cat VERSION)`

---

### v0.9.0 — 进化篇重写 + 四个进化类型深入分析（2026-07-02）
- 重写 `vampire-survivors-evolution.md`：从 ~5,300 字扩展到 ~8,600 字
  - Evolution：完整 26 行进化对照表、被动道具消耗规则、Bracelet 特殊进化、多重进化宝箱
  - Union：Vandalier/Phieraggi/Fuwalafuwaloo/SpellStrom 精确属性数据与 Singularity 伤害公式
  - Gift：Super Candybox II Turbo 获取条件、稀有度 0.1、Luck 倍率
  - Morph：4 角色精确等级表、无需宝箱的设计逻辑
- VERSION 0.8.0 → 0.9.0

### v0.8.0 — 新增游戏设计分析板块（2026-07-02）
- 新增 `docs/game-design-analysis/` 板块
- 新增 `docs/game-design-analysis/index.md`：板块首页
- 新增 `docs/game-design-analysis/vampire-survivors.md`：Vampire Survivors 玩法拆解与设计分析（武器进化系统、极简操作、Roguelite 升级决策、时间压力曲线等）
- 新增 `docs/game-design-analysis/vampire-survivors-minimal-controls.md`：极简操作 + 自动攻击深度分析（认知负荷分配、心流触发、减法设计哲学、底层系统详解）
- 新增 `docs/game-design-analysis/vampire-survivors-evolution.md`：武器进化系统深度分析（四种进化类型、触发条件、多重进化、平衡设计）
- 新增 `docs/game-design-analysis/vampire-survivors-slot-strategy.md`：6 武器槽与策略搭配深度分析（角色分工、决策模型、经典配装、槽位合理性）
- 新增 `docs/game-design-analysis/vampire-survivors-roguelite-decision.md`：Roguelite 升级决策树深度分析（权重系统、拥有物品偏向、Banish/Reroll/Skip、满级池子净化）
- 新增 `docs/game-design-analysis/vampire-survivors-characters.md`：角色差异化深度分析（设计模板、207 角色分工、组合多样性）
- 新增 `docs/game-design-analysis/vampire-survivors-time-curve.md`：时间压力曲线深度分析（四阶段节奏、核心事件时间线、压力与成长同步）
- 新增 `docs/game-design-analysis/vampire-survivors-chest.md`：宝箱与仪式感深度分析（五种宝箱类型、Luck 品质联动、音效系统、走位决策）
- 新增 `docs/game-design-analysis/vampire-survivors-six-systems.md`：支撑底层六大系统深度分析（冷却数值/自动瞄准 12 种弹道/经验宝石 400 合并/升级暂停保护/击退协作/Magnet 不吸宝箱的设计意图）
- VERSION 0.7.2 → 0.8.0

### v0.7.2 — UE6 路线图分析：蓝图去向（2026-06-23）
- 新增 `docs/dev-notes/engine-roadmap.md`：UE6 EA 时间线、蓝图弃用真相、Verse/Visual Verse 替代方案、社区反应分析、开发者应对策略

### v0.7.1 — UI 系统 Slate & UMG 深度分析（2026-06-23）
- 新增 `docs/dev-notes/ue5-8-analysis/ui-system.md`：Slate 三层架构、TSlateAttribute 属性系统、FWidgetProxy 失效率缓存、减少蓝图依赖的 6 大策略及性能对比
- index.md 新增第 17 章、更新模块描述和源码路径

### v0.7.0 — crew-cli v1.00204 循环读取修复分析（2026-06-23）
- 新增 `docs/dev-notes/crew-cli-analysis/prompt-improvement.md` C 节：循环读取修复的根因分析与修复方案
  - validateBash 漏网：powershell -Command "Get-Content"、type "file.h" 引号路径
  - Loop 检测 Level 3 不生效（detectLoop 返回 0|1|2 修复）
  - 系统提示：Read files once, then implement 防循环
- VERSION 0.6.0 → 0.7.0

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

### v0.4.0 - Iris ����ϵͳ��ȷ��� (2026-06-22)
- ���� ue5-8-analysis/iris-deep-dive: Iris �ܹ�ȫ�⡢MMO ������ˡ����ȼ�/����ѹ��/ʵս����
- ��Դ: UE 5.8 ����Դ�� Engine/Source/Runtime/Net/Iris/

### v0.5.0 - AutoRTFM / Verse / StateStream ��ȷ��� (2026-06-22)
- ���� ue5-8-analysis/autortfm-deep-dive: Open/Closed ˫ģʽ���롢�����������ڡ�Hazards ׼��
- ���� ue5-8-analysis/verse-deep-dive: �������ܹ���Solaris VM��UE ����
- ���� ue5-8-analysis/statestream-deep-dive: IStateStream ��ֵ�ܹ���Lane ���ơ�Transform ��
- ��Դ: UE 5.8 ����Դ�� Engine/Source/Runtime/AutoRTFM/, VerseCompiler/, Solaris/, StateStream/
