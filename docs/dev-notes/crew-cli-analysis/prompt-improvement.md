---
sidebar_position: 2
tags: [crew-cli, prompt-engineering, improvement]
---

# crew-cli Prompt 改进分析 + 采样控制改进

**来源：** Google Prompt Engineering 指南（`docs/dev-notes/prompt-engineering/`）  
**目标：** 基于 Google 官方方法论，分析并改进 crew-cli 的 prompt-builder 系统及 API 采样参数

---

## 两部分改进

| 部分 | 改什么 | 涉及文件 |
|------|--------|---------|
| **A — Prompt 内容改进**（10 条）| `prompt-builder.ts` | 正向指令、Few-shot、输出格式、角色定义等 |
| **B — 采样控制改进**（4 条）| `deepseek.ts` + `openai.ts` + `provider/types.ts` | Temperature/Top-K/Top-P 按任务差异化 |

---

## 现状分析

crew-cli 的 `prompt-builder.ts`（242 行）构建一个组装式的 system prompt，包含 10 个 Section：

| Section | 功能 | 当前问题 |
|---------|------|---------|
| Intro | 角色定义 | 良好 |
| Persona | SOUL.md/IDENTITY.md 注入 | 良好 |
| System | 4 条通用规则 | 见下文 |
| Doing Tasks | 5 条任务规则 | 见下文 |
| Executing Actions | 通用安全准则 | 良好 |
| Environment | 自动检测 OS/路径/日期 | 良好 |
| Project Context | Git status/diff | 良好 |
| Code Index | 代码索引提示 | 良好 |
| Memory Files | PROJECT.md/SYSTEMS.md | 良好 |
| Documents | 记忆文件说明 | 良好 |

### 核心问题（对照 Google 指南）

---

## 改进 1：用正向指令替代负向约束

**Google 指南原则：** Use Instructions over Constraints

> Growing research suggests that focusing on positive instructions in prompting can be more effective than relying heavily on constraints.

**当前代码（`addDoingTasks`）：**

```typescript
'Do not add speculative abstractions or unrelated cleanup.',
'Report outcomes faithfully.',
```

**改进后：**

```typescript
'Keep changes scoped to the intended feature. Add only the code needed to implement it.',
'After each action, report: what happened, what you observed, and what you plan next.',
```

---

## 改进 2：提供 Few-shot 示例

**Google 指南原则：** Provide Examples

> The most important best practice is to provide (one shot / few shot) examples within a prompt.

crew-cli 当前是纯 zero-shot——只有规则描述，没有示例。对于 Agent 需要理解的复杂操作（如"什么时候应该用 Read vs 什么时候应该直接 Edit"），一个简单的 few-shot 示例可以显著提升效果。

```typescript
private addExamples(): void {
    this.add('Examples of effective task execution', `
Example 1: Adding a new feature
- Step 1: Read existing code in the target module (Glob + Read)
- Step 2: Check SYSTEMS.md for architecture patterns
- Step 3: Write new files following existing patterns
- Step 4: Run build to verify compilation
- Step 5: Fix any compilation errors

Example 2: Debugging a failing test
- Step 1: Run the test to see the exact error (Bash)
- Step 2: Read the failing file + its dependencies (Read)
- Step 3: Identify the root cause
- Step 4: Apply fix (Edit)
- Step 5: Re-run test to confirm fix (Bash)
`);
}
```

---

## 改进 3：明确输出格式

**Google 指南原则：** Be Specific About the Output

> A concise instruction might not guide the LLM enough or could be too generic. Providing specific details can help the model focus on what's relevant.

当前 prompt 没有指定 Agent 应该**如何结构化其回复**。添加明确的输出规范：

```typescript
private addOutputFormat(): void {
    this.add('Output format',
`After using a tool, always include:
1. A one-line summary of what the tool returned
2. What you learned from it
3. What your next step will be

When a task is complete, include a summary of:
- What was done
- Key files created or modified
- Any issues encountered
- Verification steps taken`);
}
```

---

## 改进 4：Step-back 机制

**Google 指南原则：** Step-back Prompting

> Step-back prompting is a technique for improving performance by prompting the LLM to first consider a general question related to the specific task.

crew-cli 已经通过 .crew/memory 实现了某种程度的 step-back（先读 SYSTEMS.md 再动手），但可以做得更明确。在 `addDoingTasks` 中补充：

```typescript
'Before implementing: check SYSTEMS.md and DECISIONS.md for existing design patterns.',
'Before debugging: formulate a hypothesis about the root cause before making changes.',
```

---

## 改进 5：清晰的角色定义

**Google 指南原则：** System, Contextual and Role Prompting

> Role prompting assigns a specific character or identity for the language model to adopt.

当前角色定义只是简单的一句话"你是一个AI开发助手，叫大龙 🐉，务实、直接、偶尔来点幽默"。可以更丰富：

```typescript
private addRoleDefinition(): void {
    this.add('Role', `You are 大龙 🐉 — an AI development assistant specialized in UE5/C++ game development.

Your working style:
- 务实 (pragmatic): Choose the simplest solution that works
- 直接 (direct): Say what you're doing, skip filler
- 偶尔来点幽默 (occasional humor): A well-placed joke is fine, but don't overdo it

Your workflow:
1. Understand → Read relevant code before making changes
2. Plan → Check existing patterns (SYSTEMS.md, DECISIONS.md)
3. Execute → Make focused, minimal changes
4. Verify → Build, run, or test to confirm
5. Report → Summarize what was done`);
}
```

---

## 改进 6：给动词、给模板

**Google 指南原则：** Design with Simplicity — Use verbs that describe the action

> Try using verbs: Act, Analyze, Categorize, Classify, Create, Describe, Define, Extract, Find, Generate, Identify, List, Parse, Predict, Provide, Rank, Recommend, Retrieve, Rewrite, Select, Show, Summarize, Translate, Write.

```typescript
private addActionTemplate(): void {
    this.add('Action templates',
'When you need information: Read the file, summarize what you found, then decide next step.

When you need to create: Write the file, then build/compile to verify.

When you need to modify: Read the target file, identify what to change, Edit precisely, then verify.

When you encounter an error: Read the error output, trace the root cause, then fix. Not the other way around.');
}
```

---

## 改进 7：指令优先的约束重构

**原则：** 把"不要做 X"改成"请做 Y"

| 当前（负向约束） | 改进后（正向指令） |
|-----------------|-------------------|
| "不要添加推测性抽象或不相关的清理" | "保持变更范围集中在目标功能上" |
| "如果某个方法失败，先诊断再切换策略" | "失败时：分析原因 → 修复根本问题 → 验证" |
| "如实报告结果" | "每次操作后报告三件事：做了什么、观察到什么、下一步计划" |

---

## 改进 8：减少上下文碎片

**Google 指南原则：** 系统提示越简洁越好，相关的上下文信息应该按需注入而非全部塞入。

当前 prompt-builder 把所有文件的内容都注入到 system prompt 中。改进方向：

| 当前做法 | 问题 | 改进 |
|---------|------|------|
| SOUL.md + IDENTITY.md 全文注入 | 可能很大 | 仅注入关键描述（前 500 字）|
| 所有 output/*.md 都塞入 | 数量无限制 | 只注入 output/plan.md 和 output/design.md |
| SYSTEMS.md 截断 2000 字 | 可能丢失关键内容 | 按需 Read 而非注入摘要 |

---

## 改进 9：用变量驱动 prompt

**Google 指南原则：** Use Variables in Prompts

当前已经通过 config 传入了输出目录、工作区路径、目标等变量。可以进一步扩展：

```typescript
export interface PromptBuilderConfig {
    // 现有
    outputDir: string
    cwd: string
    platform?: string
    goal: string
    
    // 新增
    taskType?: 'build' | 'analyze' | 'fix' | 'chat'  // 任务类型
    projectLanguage?: string                            // 项目语言
    expertMode?: boolean                                // 是否进入深度模式
}
```

---

## 改进 10：缓存的代码索引提示词优化

```typescript
// 当前
'**The code index above contains ALL existing project files. It is exhaustive. If something is not listed here, it does not exist in the project yet.**'

// 改进 - 更具体的引导
'**The code index above contains ALL existing project files. It is exhaustive. If something is not listed here, it does not exist in the project yet.**

How to use the code index:
- To understand a class: Read its .h file (index tells you where it is)
- To understand implementation: Read its .cpp file
- To find dependencies: Check #include statements in the .h file
- The index already parsed every .h file — its summary tells you what the file contains'
```

---

## 实施优先级

| 优先级 | 改进 | 预期效果 | 改动量 |
|--------|------|---------|--------|
| P0 | 正向指令替代负向约束 | 减少 Agent 理解偏差 | 小（改 5 行文字）|
| P1 | 添加 Few-shot 示例 | 显著提升复杂任务执行质量 | 中（+30 行）|
| P2 | Step-back 机制增强 | 减少"先动手再翻文档"的行为 | 小（+2 行）|
| P3 | 输出格式规范 | Agent 回复更结构化 | 中（+25 行）|
| P4 | 缓存索引提示优化 | 代码索引被更有效利用 | 小（+5 行）|
| P5 | 上下文碎片减少 | 降低 token 消耗，提升专注度 | 中（改动 addInstructionFiles）|

---

## 实施后预期效果

```
当前 prompt-builder 输出 ≈ 2-3K tokens
改进后 ≈ 3-4K tokens（+示例 + 格式规范 - 冗余上下文）

预期行为变化：
├── ❌ 当前：Agent 在动手前先翻 10 个文件
├── ✅ 改进后：Agent 先看索引 → 直接读关键文件
├── ❌ 当前：Agent 花多轮解释它在做什么
├── ✅ 改进后：Agent 简练报告 + 直接执行
└── ❌ 当前：Agent 遇到错误随便试
    └── ✅ 改进后：Agent 先诊断再修复
```

---

# B — 采样控制改进（4 条）

**基于：** Google Prompt Engineering 指南 → `llm-config.md` — Temperature / Top-K / Top-P

## 现状

| 参数 | deepseek.ts | openai.ts | 问题 |
|------|-------------|-----------|------|
| `temperature` | 0.3 硬编码 | 0.3 硬编码 | 所有任务（开发/分析/修复/聊天）共用同一个值 |
| `top_p` | ❌ 未设置 | ❌ 未设置 | 走 Provider 默认值（不同 Provider 不同） |
| `top_k` | ❌ 未设置 | ❌ 未设置 | DeepSeek 不支持，但 OpenAI 支持 |
| `max_tokens` | 32768 硬编码 | 32768 硬编码 | 分析/压缩类任务不需要这么大 |

## 改进 B1：按任务类型差异化 Temperature

**Google 指南原则：**

> - **Temperature = 0**（贪婪解码）— 确定性最高，始终选择概率最高的 token
> - **低 Temperature（0.1-0.3）** — 输出稳定、可预测，适合事实类任务
> - **中 Temperature（0.5-0.8）** — 一些创造性，适合内容生成
> - **高 Temperature（≥1）** — 高度随机、多样化，适合创意探索

在 `loop.ts` 中，Agent 主循环应该根据当前任务类型选择不同的采样配置：

```typescript
// loop.ts — AgentLoop 新增

export function selectSampling(taskType: AgentTaskType): SamplingConfig {
    switch (taskType) {
        case 'build':    // 编译修复、编码实现 → 高确定性
            return { temperature: 0.1, topP: 0.9,  topK: 20,  maxTokens: 32768 }
        case 'analyze':  // 分析代码、架构评估 → 适度创造
            return { temperature: 0.5, topP: 0.95, topK: 30,  maxTokens: 8192 }
        case 'fix':      // 修复 bug → 最高确定性
            return { temperature: 0.0, topP: 0.0,  topK: 1,   maxTokens: 16384 }
        case 'chat':     // 聊天对话 → 高度创造
            return { temperature: 0.9, topP: 0.99, topK: 40,  maxTokens: 4096 }
        default:         // 兜底
            return { temperature: 0.3, topP: 0.95, topK: 30,  maxTokens: 16384 }
    }
}
```

## 改进 B2：ProviderConfig 增加采样参数

**文件：** `provider/types.ts`

```typescript
export interface ProviderConfig {
    model: string
    baseUrl?: string
    apiKey?: string
    maxTokens?: number
    temperature?: number
    // 新增：精细采样控制
    topP?: number       // 核心采样
    topK?: number       // Top-K 采样
    frequencyPenalty?: number  // 频率惩罚
    presencePenalty?: number   // 存在惩罚
}

// 预置配置（参考 Google 推荐起始参数）
export const SAMPLING_PRESETS = {
    // 事实类/代码任务：高确定性
    FACTUAL:   { temperature: 0.1, topP: 0.9,  topK: 20,   maxTokens: 16384, frequencyPenalty: 0 },
    // 开发任务：平衡
    CODING:    { temperature: 0.2, topP: 0.95, topK: 30,   maxTokens: 32768, frequencyPenalty: 0 },
    // 分析/设计：适度创造
    ANALYSIS:  { temperature: 0.5, topP: 0.95, topK: 30,   maxTokens: 8192,  frequencyPenalty: 0.1 },
    // 创意/聊天：高度创造
    CREATIVE:  { temperature: 0.9, topP: 0.99, topK: 40,   maxTokens: 4096,  frequencyPenalty: 0.3 },
} as const
```

### 各参数对照表

| 场景 | Temperature | Top-P | Top-K | MaxTokens | FrequencyPenalty |
|------|-------------|-------|-------|-----------|-----------------|
| **编译修复**（唯一正确答案） | 0.0 | 0.0 | 1 | 16384 | 0 |
| **代码实现**（平衡） | 0.2 | 0.95 | 30 | 32768 | 0 |
| **架构分析**（适度创造） | 0.5 | 0.95 | 30 | 8192 | 0.1 |
| **聊天对话**（高度创造） | 0.9 | 0.99 | 40 | 4096 | 0.3 |

## 改进 B3：极端值保护

**Google 指南原则：** 极端值相互抵消

> | Temperature = 0 | top-K 和 top-P **失效** |
> | Top-K = 1 | Temperature 和 top-P **失效** |
> | Top-P = 0 | Temperature 和 top-K **失效** |

在 `deepseek.ts` 和 `openai.ts` 的请求构建中添加校验：

```typescript
function buildRequestBody(config: SamplingConfig) {
    const body: any = {
        max_tokens: config.maxTokens ?? 32768,
        temperature: config.temperature ?? 0.3,
    }

    // Temperature = 0 时 topK/topP 失效，跳过发送
    if (config.temperature > 0) {
        if (config.topP !== undefined) body.top_p = config.topP
        if (config.topK !== undefined) body.top_k = config.topK
    }

    // 频率/存在惩罚
    if (config.frequencyPenalty !== undefined) body.frequency_penalty = config.frequencyPenalty
    if (config.presencePenalty !== undefined) body.presence_penalty = config.presencePenalty

    return body
}
```

## 改进 B4：Token 限制按任务调整

**Google 指南原则：** 输出长度

> Reducing the output length doesn't cause the LLM to become more succinct in the output it creates, it just causes the LLM to stop predicting more tokens once the limit is reached.

当前 `max_tokens: 32768` 全部任务通用，缺点是：
- 分析类任务（如代码审查）输出不会变简洁，只是到 32768 才停
- 对话类任务浪费钱

```typescript
// 任务类型 → 推荐 max_tokens
// 编译/构建修复:  16384  （大块代码输出）
// 代码实现:       32768  （完整模块生成）
// 架构分析:        8192  （分析报告不需要太长）
// 代码审查:        4096  （聚焦问题点）
// 语义压缩:        8192  （摘要需要适度）
// 聊天对话:        2048  （简短回应）
```

## 实施优先级

| 优先级 | 改进 | 预期效果 | 改动量 |
|--------|------|---------|--------|
| P0 | B1 — 按任务差异化 Temperature | 编译修复更准，创意聊天更活 | 中（改 3 个文件）|
| P1 | B2 — ProviderConfig 增加参数 | 支持 Top-P/Top-K/FrequencyPenalty | 大（改 types + 2 Provider）|
| P2 | B4 — Token 按任务调整 | 对话类任务省钱 50%+ | 小（改 loop.ts 配置表）|
| P3 | B3 — 极端值保护 | 防止参数冲突导致无效 | 小（改 request builder）|

---

## C — v1.00204 循环读取修复（2026-06-22）

### 问题背景

运行"实现装备唯一ID系统"的编码任务时，Agent 陷入 139 轮死循环：

1. Round 1-6：通过 Read 读取项目文件（正常）
2. Round 11-12：改用 Grep 搜索 → Bash `type` 被拦截 → 切回 Read
3. Round 21+：绕过拦截，用 `powershell -Command "Get-Content 'path'"` 读取文件
4. Round 25：循环检测 Level 3 触发，但 LLM 无视系统消息继续发 tool_calls
5. Round 77：完整 compact 后 Agent 短暂恢复认知，但马上又进入新循环
6. Round 139：用户手动取消

**核心症状：** Agent 永远不进入代码实现阶段。反复读同一组文件（RPGSaveGame.h、InventoryItemInstance.h、EquipmentItemData.h），每次都说"现在我了解了"然后继续读更多文件。

### 根因 1：validateBash 漏网

**`powershell -Command "Get-Content 'path'"` 未被拦截**

```typescript
// 之前的代码（无效）：
if (/^Get-Content/i.test(t) || /^gc\s+/i.test(t))  // 只匹配命令开头
```

`powershell -Command "Get-Content ..."` 以 `powershell` 开头，不是 `Get-Content`，正则不匹配。同理 `gc 'path'` 也被绕过。

**修复（tools.ts）：**

```typescript
// 新增：powershell + Get-Content 任意位置检测
if (/^powershell/i.test(t) && /(Get-Content|\bgc\b|gc['"])/i.test(t))
  return { allowed: false, reason: '禁止用 powershell Get-Content 读取文件' }
```

**`type "file.h"` 带引号路径未被拦截**

```typescript
// 之前的代码：
if (/^type\s+.+\.(h|cpp|...)/i.test(t))
```

`type "RPGSaveGame.h"` 中 `.h"` 的尾引号导致 `\.h` 匹配不到。

**修复：**

```typescript
// 先去引号再检测
const tNoQuotes = t.replace(/"([^"]*)"/g, '$1').replace(/'([^']*)'/g, '$1')
if (/^type\s+/.test(tNoQuotes) && /\.(h|cpp|...)\s*$/i.test(tNoQuotes))
  return { allowed: false, reason: '禁止用 Bash type 读取文件' }
```

**新增拦截项：**

| 命令 | 被拦截？ |
|------|---------|
| `powershell -Command "Get-Content 'foo.h'"` | ? 新增拦截 |
| `type "foo.h"` | ? 新增去引号后拦截 |
| `cmd /c type foo.h` | ? 新增 `cmd /c type` 拦截 |
| `findstr "pattern" *.cpp` | ? 新增 `findstr` 拦截 |
| `Get-ChildItem -Recurse` | ? 新增拦截（应使用 Glob） |
| `dir /s /b` | ? 已有 `dir` + 路径 拦截 |

### 根因 2：系统提示缺少"停止探索"指示

Agent 永远不知道何时该停止读文件开始写代码。每次 Read 返回 `[✅完整]` 后，它仍然会再次读取同一个文件。

**修复（prompt-builder.ts）：**

```typescript
'**Critical: Read files once, then implement.** After you have read the key files needed to understand the codebase (typically 3-5 files), stop exploring and start writing code. Re-reading the same files multiple times is wasteful. If you find yourself saying "I now understand" and then reading more files, you are stuck — force yourself to start implementing.'

'**When Read returns [✅完整], the file is fully loaded. Never re-read it.** If you need to reference specific details, use your own memory of what you read — do NOT call Read again on the same file.'
```

### 根因 3：Level 3 强制终止不生效

`detectLoop()` 返回 `boolean`：

```typescript
// 之前的代码：
private detectLoop(state: LoopState): boolean { ... return true }
// 调用方：
if (this.detectLoop(state)) continue  // 继续下一轮，不是 break
```

Level 3（12次重复）只 push 了一个系统消息"任务被终止"，然后 `return true` → `continue`。LLM 在下一轮看到这个消息，但**完全无视它**，继续发 tool_calls。

**修复（loop.ts）：**

```typescript
private detectLoop(state: LoopState): 0 | 1 | 2 {
  // 0 = 无操作
  // 1 = 已注入提示，继续下一轮
  // 2 = 强制终止，调用方应 break 循环
}

// 调用方：
const loopResult = this.detectLoop(state)
if (loopResult === 2) {
  // 真正 break 循环，返回 TurnResult
  return { success: false, content: '（因重复执行相同操作被系统终止）' + summary, sessionId, stopReason: 'max_turns' }
}
if (loopResult === 1) continue
```

**Bash Level 2 实际阻止执行：** 此前 Bash 循环检测只注入警告消息（Level 1），没有实际阻止执行。新增 Level 2（≥5 次重复）：

```typescript
// 在 executeToolCallsAndLog 中检查
if (tc.name === 'Bash') {
  const argsKey = this.normalizeArgs(tc)
  const checkKey = 'Bash|' + argsKey
  const level = state.loopLevel.get(checkKey) || 0
  if (level >= 2) {
    // 跳过执行，注入阻止结果
    this.session.pushToolResult(tc.id, '错误: 该 Bash 命令因重复执行已被阻止', true)
    continue
  }
}
```

### 改动清单

| 文件 | 改动 |
|------|------|
| `src/agent-runtime/tools.ts` | `validateBash()` 新增 4 条拦截规则 |
| `src/agent-runtime/loop.ts` | `detectLoop()` 返回 `0\|1\|2`，Level 3 真正 break，Bash Level 2 阻止执行 |
| `src/prompt-builder.ts` | `addDoingTasks()` 新增 "Read files once, then implement" + "[✅完整]后永不重读" |
| `src/crew.ts` | CLI_VERSION v1.00203 → v1.00204 |
