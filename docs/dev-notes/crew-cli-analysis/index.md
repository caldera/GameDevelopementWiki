---
sidebar_position: 1
tags: [crew-cli, agent, ai-tools, automation]
---

# crew-cli — AI Agent Runtime 全栈开发助手

**项目路径：** `H:\3D Game Dev\coordination\`  
**引擎：** DeepSeek API (function calling)  
**语言：** TypeScript (ES2022, Node16)  
**版本：** v1.00204（`src/crew.ts` CLI_VERSION 唯一来源）  
**架构：** 单 Agent 多轮工具循环（Agent Runtime）

crew-cli 是一个自建的 AI Agent Runtime，类似 OpenClaw 但更轻量、更专注 UE5 游戏开发场景。它可以替代多角色流水线，用单个 DeepSeek Agent + 全套工具（Bash / Read / Write / Edit / Glob / Grep / WebFetch / WebSearch）完成从架构设计到代码实现到编译修复的全流程。

---

## 📐 架构总览

```
src/agent-runtime/          ← 核心（~103K）
├── loop.ts                 ← Agent 主循环（compaction/budget/截断）
├── session.ts              ← 对话管理 + ContentBlock 持久化
├── tools.ts                ← 14 个工具执行器
├── deepseek.ts             ← DeepSeek API + 流式解析
├── provider/               ← Provider 抽象层（DeepSeek/OpenAI/xAI）
└── index.ts                ← 统一导出
```

### 核心文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `loop.ts` | ~13K | Agent 主循环，含 compaction、budget 控制、消息截断 |
| `session.ts` | ~17K | ContentBlock 结构化消息管理、API 格式转换 |
| `tools.ts` | ~28K | 14 个工具执行器（Bash/Read/Write/Edit/Glob/Grep/WebFetch/WebSearch 等）|
| `deepseek.ts` | ~10K | DeepSeek 流式 API 封装，3 次自动重试 |
| `prompt-builder.ts` | ~10K | System prompt 构建器，自动发现 git/diff/OS/指令文件 |
| `memory.ts` | ~19K | LLM 经验记忆系统（store.json）|
| `code-index.ts` | ~19K | 9 种语言代码索引，块匹配跳过字符串/注释内大括号 |

---

## 🧠 Agent Runtime 核心机制

### 1. 单 Agent 多轮工具循环

```
用户输入
  ↓
Agent 自理解任务 → 决定使用什么工具
  ├── Bash     → 编译、测试、启动服务
  ├── Read     → 查看现有代码
  ├── Write    → 创建新文件  
  ├── Edit     → 修改已有代码
  ├── Glob     → 搜索文件
  ├── Grep     → 搜索内容
  ├── WebFetch → 获取网页内容（查文档）
  └── WebSearch → 搜索网络（查信息）
  ↓
Agent 自判断是否完成 → 未完成 → 继续多轮
  ↓
完成 → 输出报告
```

对比旧的多角色流水线（Architect → Executor → Reviewer 6 角色），单 Agent 模式：
- 不需要 6 个角色来回传纸条
- 不需要意图分类器
- 不需要共识裁决
- Agent 自己决定做什么、怎么干、什么算完成

### 2. ContentBlock 消息架构

解决了"tool 消息孤儿"问题——tool_use 和 tool_result 在同一消息内，不会分离：

```
消息 N:
├── ContentBlock 1: text("我需要查看 AI 控制器文件")
├── ContentBlock 2: tool_use(read, path="...")
│
消息 N+1:
├── ContentBlock 1: tool_result("// BossAIController.cpp ...")
├── ContentBlock 2: text("看到了，接下来实现阶段转换...")
```

### 3. Compaction 机制

当对话超过 MAX_TURNS 限制时，自动压缩历史——保留关键上下文同时裁剪冗余消息。压缩策略包括：
- 移除 tool_result 中的大段内容，仅保留摘要
- 合并连续的用户/助手消息
- 保留 system prompt、最新几轮完整对话

### 4. 预算控制

```typescript
// 默认 $0.50 预算保护
const budget = process.env.CREW_BUDGET || 0.50;
// 达到预算上限时自动终止
```

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `CREW_BUDGET` | 0.50 | Token 费用上限（美元）|
| `CREW_MAX_ROUNDS` | — | 最大工具调用轮数 |

---

## 🔧 14 个工具集

| 工具 | 功能 | 安全限制 |
|------|------|---------|
| **Bash** | 任意 shell 命令 | Win/Linux/macOS 三平台安全校验，拦截危险命令 |
| **Read** | 读取文件内容 | 文件存在性 + 编码检测 |
| **Write** | 创建或覆盖文件 | 路径白名单 + 500KB 上限 |
| **Edit** | 精确替换文件内容 | 路径白名单 + UTF-8 编码保护 |
| **Glob** | 搜索文件（替代 find） | 禁止 Bash 搜索文件 |
| **Grep** | 内容搜索 | — |
| **WebFetch** | 获取网页内容 | — |
| **WebSearch** | 搜索网络 | — |
| **Lint** | 自动代码检查 | 写入后自动触发 |
| **ReviewCode** | 代码审查 | 可选工具 |
| **CodeIntel** | LSP 代码智能 | diagnostics/definition/references |
| **TaskCreate/Get/List/Stop** | 子任务管理 | — |
| **EnterPlanMode** | 计划模式 | 只允许读操作 |

### 安全校验（平台感知）

```
Bash 工具执行前校验：
  Win PowerShell: 拦截 Remove-Item / Stop-Computer / Format-Volume / Invoke-Command
  macOS: 拦截 diskutil erase / csrutil disable
  Linux: 拦截 rm -rf / / dd if=... of=/dev/sda
```

---

## 🔥 Provider 热切换

当主 Provider 失败时自动降级：

```
主: deepseek-chat ($0.28/M)   ← 正常使用
  ↓ 主失败（含 3 次重试）
备: deepseek-reasoner ($2.19/M) ← 第一次降级
  ↓ 仍失败
备: claude-sonnet-4-6 ($15.00/M) ← 最终保底
  ↓ 全部失败
返回最后一次错误信息
```

### 三规则自动升级

| 规则 | 触发条件 | 升级目标 |
|------|---------|---------|
| **失败升级** | 同一角色连续 2 次 FAIL | 升一级模型 |
| **复杂度升级** | 模块文件 > 6 个 | 直接走 reasoner |
| **架构升级** | 架构分歧 ≥ 2 次 | 直达 sonnet |

---

## 📁 记忆系统

```
output/
├── .crew/memory/
│   ├── PROGRESS.md    ← 进度跟踪
│   ├── BUGS.md        ← Bug 记录
│   ├── FEATURES.md    ← 功能规划
│   ├── DECISIONS.md   ← 技术决策
│   ├── CLAUDE.md      ← 项目原则
│   ├── STORE.json     ← LLM 经验记忆（语义匹配）
│   └── code-index/    ← 代码索引持久化
├── sessions/          ← 对话历史（支持 resume）
├── artifacts/         ← 设计文档/代码/审查报告
└── src/               ← ---FILE:--- 解析后写入的真实文件
```

### 语义匹配引擎

基于 TF-IDF + 余弦相似度，自动找到与当前目标最相似的 3 条历史教训注入到系统提示中。

---

## 🌐 Web 服务架构

**端口：** 3721  
**前端：** 单页 HTML（内嵌 CSS/JS）  
**后端：** Node HTTP（零外部依赖）

### 模块拆分

```
web/server.ts           ← HTTP 入口 + 路由注册（273行）
web/router.ts           ← Map 路由表替代 if-else（93行）
web/task-runner.ts      ← 统一任务管理（214行）
web/sse.ts              ← SSE 广播中心（36行）
web/browse-handler.ts   ← 目录浏览（70行）
web/project-manager.ts  ← 项目 CRUD（270行）
web/public/index.html   ← 前端 UI（1576行）
```

### 数据流

```
用户提交任务 → POST /api/run
  → spawn agent-runtime 子进程
  → 捕获 stdout → 解析阶段事件 → SSE 推送

SSE 事件流 → GET /api/stream
  → 前端实时渲染：
    ├── Agent 状态面板
    ├── 流式日志输出
    ├── 文件树浏览器
    └── 统计面板 & 历史
```

---

## 🧩 MCP 服务器集成

| MCP 服务器 | 工具 | 用途 |
|-----------|------|------|
| `git.json` | Git | 自动创建分支、commit、提 PR |
| `filesystem.json` | Filesystem | 受控文件系统访问 |
| `ue5-docs.json` | UE5 类查询 | 查类/函数签名（自定义，零依赖）|
| `crew-bus.json` | Agent 间通信 | 查其他模块的接口文件和声明 |

### 自定义 UE5 MCP 服务器

内置 20+ UE5 类的 API 数据库，无需网络：
- `ue5_lookup(class_name)` — 查类描述、成员、函数签名、继承关系
- `ue5_search(query)` — 模糊搜索相关类

---

## 💡 关键技术决策

| 决策 | 方案 | 原因 |
|------|------|------|
| Agent 模式 | 单 Agent 多轮工具循环 | 避免多角色流水线的协调开销和上下文碎片 |
| 版本号 | `src/crew.ts` CLI_VERSION 唯一来源 | 代码改了就必须加 1，不依赖 package.json |
| 文件操作 | Write/Edit 路径白名单 + 500KB 上限 | 防止误写系统文件 |
| 编码 | 禁用 `Set-Content` 写含中文/emoji 文件 | PowerShell 默认编码破坏 UTF-8 |
| Provider | 抽象层支持 DeepSeek/OpenAI/xAI 热切换 | 避免单点故障 |
| 记忆 | TF-IDF + 余弦相似度语义匹配 | 轻量无外部依赖 |

---

## 🚀 开发规范

| # | 原则 | 说明 |
|---|------|------|
| 1 | **主线开发，不建分支** | 所有改动直接进主干 |
| 2 | **不做简化版/临时版/修复版** | 不在源码外复制一份来改 |
| 3 | **改源码→编译→运行** | 一个循环，不手动改编译产物 |
| 4 | **清理遗留文件** | `.backup-*`、`dist-temp/` 等及时清理 |

### 编码实用原则

> 问题一定是代码问题，不是缓存问题。

> 借用已成功的方法，不要创造新的调用方式——所有 LLM 调用必须使用统一的 `pool.runAgent()`。

> 不要用 `Set-Content` 修改含中文/emoji 的文件，用 `[System.IO.File]::WriteAllText()`。

---

## 📈 代码规模

```
总代码量：~280K（删除 ~80K 废弃代码后）
Agent Runtime 核心：~103K (37%)
Web 服务：~45K (16%)
MCP 服务器：~45K (16%)
记忆系统：~37K (13%)
前端 + 配置：~50K (18%)
```
