# SKILL: GameDevelopementWiki

本 Wiki 基于 **Docusaurus 3** 构建，内容编辑采用纯 Markdown + Git 工作流。

项目根：`H:\3D Game Dev\GameDevelopementWiki`

---

## 📁 目录结构

```
GameDevelopementWiki/
├── VERSION                   ← 版本号（唯一来源）
├── SKILL/
│   └── SKILL.md              ← 本文件（内含完整更新日志）
├── scripts/
│   ├── bump-version.js       ← 版本升级脚本
│   └── verify-version.js     ← 版本校验（prebuild 钩子）
├── docs/                     ← 所有文档内容
│   ├── intro.md              ← 首页
│   ├── dev-notes/            ← 程序开发笔记
│   │   ├── cpp-style-guide/  ← Google C++ 编程风格指南（9 章）
│   │   └── prompt-engineering/ ← Google Prompt Engineering 指南（7 章）
│   ├── ue5-caveats/          ← UE5 踩坑记录
│   ├── world-building/       ← 世界观（剧情/势力/地理/角色）
│   ├── project-mgmt/         ← 项目管理
│   └── mmo-dev/              ← 大型网游开发（网络/架构/复制/扩容）
├── blog/                     ← 开发日志
├── src/
│   ├── version.ts            ← 版本信息模块
│   └── css/custom.css        ← 自定义样式
├── static/img/               ← 图片资源
├── sidebars.ts               ← 侧边栏配置
└── docusaurus.config.ts      ← 站点配置（自动读取 VERSION）
```

---

## 📋 内容更新日志

> 每次增删改内容后，在此记录变更，同步更新 VERSION 版本号。

### v0.2.3 — 深挖 C++ 风格指南（2026-06-22）
- 新增 `cpp-style-guide/deep-dive` 深度话题页（Stream vs Printf、无符号陷阱、RAII、匈牙利命名法、宏高级用法、MSVC 封装）
- 增强 `cpp-style-guide/formatting`：修复重复内容，完整 17 节细化格式规则
- 增强 `cpp-style-guide/exceptions`：Windows 规则补充 5 处细节
- 来源：Google C++ 编程风格指南（edisonpeng 整理版）

### v0.2.2 — 深挖 Prompt Engineering 第二轮（2026-06-22）
- 新增 `prompt-engineering/resources`：论文索引、模型对比、Vertex AI Studio 速查
- 新增 `prompt-engineering/pitfalls`：10 大常见陷阱 + Debug Checklist
- 增强 `prompt-engineering/advanced-techniques`：CoT 优劣势表、选型决策指南、ReAct 实战注意
- 增强 `prompt-engineering/code-prompting`：JSON 输出三大好处、6 条关键原则
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.2.1 — 深挖 Prompt Engineering 第一轮（2026-06-22）
- 增强 `prompt-engineering/llm-config`：Softmax 类比、极端值压制关系表
- 增强 `prompt-engineering/basic-techniques`：Zero-shot 失败模式、安全/毒性控制、幻觉抑制
- 增强 `prompt-engineering/advanced-techniques`：CoT 答案后置原理、Temperature=0 原则
- 增强 `prompt-engineering/best-practices`：完整 Prompt 生命周期、RAG 集成、自动化测试
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.2.0 — 添加 Prompt Engineering 指南（2026-06-22）
- 新增 `prompt-engineering/` 完整板块（5 章）
- 覆盖：LLM 配置、基础技术、高级推理、代码提示、最佳实践
- 来源：Google Prompt Engineering Whitepaper（Lee Boonstra）

### v0.1.1 — 添加 C++ 风格指南 + 深挖（2026-06-22）
- 新增 `dev-notes/cpp-style-guide/` 完整板块（8 章）
- 来源：Google C++ 编程风格指南（edisonpeng 整理版）

### v0.1.0 — 初始化（2026-06-22）
- 初始化 Docusaurus 3 项目
- 建立 5 大分区骨架（dev-notes / ue5-caveats / world-building / project-mgmt / mmo-dev）
- 建版 VERSION、SKILL/ 目录、版本系统、prebuild 校验钩子
- Git tag: `v0.1.0`

---

## 🔖 版本管理

版本号格式：**major.minor.patch**（语义化版本）

> 🚫 **主线原则**：只在 `master` 分支工作。**不做临时版本、测试版本、分支版本、预览版本**。所有修改直接提交到主分支，版本号随内容变更递增。

| 类型 | 适用场景 | 命令 |
|------|---------|------|
| **patch** | 新增内容、修复、小改动 | `npm run version patch` |
| **minor** | 新增板块、大功能 | `npm run version minor` |
| **major** | 重大重构、不兼容变更 | `npm run version major` |

```bash
# 查看当前版本
cat VERSION

# 升级版本
npm run version patch

# 构建时自动校验版本一致性
npm run build          # 自动触发 prebuild → verify-version

# 一键 release（bump + commit 一步到位）
npm run release
```

### 内容更新工作流

每次增删改内容后：

```
1. 更新文档内容
2. npm start 本地预览确认
3. 编辑本文件 SKILL.md 的「内容更新日志」章节
4. npm run version patch（或 minor / major）
5. git add -A && git commit -m "类型: 变更说明"
6. git tag v$(cat VERSION)
7. npm run build 确认编译通过
```

提交信息格式：

```
类型    说明
───     ──
✨ add   新增文档/板块
📗       深挖增强已有文档
🐛 fix   修复错误/断链
♻️  refactor 重构/重写
🏗️  chore   基础设施/配置/版本
```

---

## ✍️ 写作规范

### Markdown 前置元数据

```markdown
---
title: 文章标题      # 可选，默认取一级标题
sidebar_position: 2   # 侧边栏排序（越小越前）
tags: [ue5, networking]  # 可选，分类标签
---
```

### 语言
- 使用**简体中文**（zh-Hans）
- 术语保留英文原文 + 中文说明（中英对照）
- 代码注释使用英文

### 图片
图片放在 `static/img/` 目录下，引用方式：
```markdown
![alt 文本](/img/your-image.png)
```

### 代码块
````
```cpp
// C++ code here
```
````

### 引用原文
引用白皮书/指南原文时，使用 blockquote：
```markdown
> 原文内容
```

---

## 🚀 常用命令

```bash
npm start              # 本地预览（热更新，默认 localhost:3000）
npm run build          # 构建生产版本（含 prebuild 校验）
npm run serve          # 本地预览构建结果
npm run clear          # 清理缓存
npm run version patch  # 升级版本号
npm run verify-version # 校验版本一致性
npm run release        # bump + git commit 一步完成
```

---

## 📦 添加新文档

1. 在 `docs/` 对应目录下创建 `.md` 文件
2. 写入内容，加上 front matter
3. `npm start` 预览
4. 更新 `SKILL.md` 内容更新日志
5. `npm run version patch`
6. `git add -A && git commit -m "add: 新文档描述"`
7. `git tag v$(cat VERSION)`

侧边栏自动扫描 `docs/` 下的文件和目录结构，无需手动修改 `sidebars.ts`。

---

## 🌐 首次部署

```bash
npm run build
# 部署到 GitHub Pages
GIT_USER=你的用户名 npm run deploy
# 或手动上传 build/ 目录到静态托管
```
