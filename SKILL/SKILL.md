# SKILL: GameDevelopementWiki

本 Wiki 基于 **Docusaurus 3** 构建，内容编辑采用纯 Markdown + Git 工作流。

项目根：`H:\3D Game Dev\GameDevelopementWiki`

---

## 📁 目录结构

```
GameDevelopementWiki/
├── VERSION                    ← 版本号（唯一来源）
├── SKILL/
│   ├── SKILL.md               ← 本文件（操作指南）
│   └── CHANGELOG.md           ← 内容更新日志
├── scripts/
│   ├── bump-version.js        ← 版本升级脚本
│   └── verify-version.js      ← 版本校验（prebuild 钩子）
├── docs/                      ← 所有文档内容
│   ├── intro.md               ← 首页
│   ├── dev-notes/             ← 程序开发笔记
│   │   ├── cpp-style-guide/   ← Google C++ 风格指南（10 章）
│   │   ├── prompt-engineering/ ← Google Prompt Engineering 指南（7 章）
│   │   └── ue5-8-analysis/    ← UE5.8 引擎源码分析（13 章）
│   ├── ue5-caveats/           ← UE5 踩坑记录
│   ├── world-building/        ← 世界观（剧情/势力/地理/角色）
│   ├── project-mgmt/          ← 项目管理
│   └── mmo-dev/               ← 大型网游开发
├── blog/                      ← 开发日志
├── src/
│   ├── version.ts             ← 版本信息模块
│   └── css/custom.css         ← 自定义样式
├── static/img/                ← 图片资源
├── sidebars.ts                ← 侧边栏配置
└── docusaurus.config.ts       ← 站点配置（自动读取 VERSION）
```

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
npm run build          # 自动触发 prebuild → verify-version
npm run version patch  # 升级补丁版本
npm run version minor  # 升级次版本
npm run release        # bump + git commit 一步到位
```

### 内容更新工作流

```
1. 更新文档内容
2. npm start 本地预览确认
3. 编辑 SKILL/CHANGELOG.md 添加版本记录
4. npm run version patch（或 minor / major）
5. git add -A && git commit -m "类型: 变更说明"
6. git tag v$(cat VERSION)
7. npm run build 确认编译通过
```

提交信息格式：

```
✨ add   → 新增文档/板块
📗       → 深挖增强已有文档
🐛 fix   → 修复错误/断链
♻️ refactor → 重构/重写
🏗️ chore   → 基础设施/配置/版本
```

---

## ✍️ 写作规范

### Markdown 前置元数据

```markdown
---
title: 文章标题       # 可选，默认取一级标题
sidebar_position: 2   # 侧边栏排序（越小越前）
tags: [ue5, networking]  # 可选，分类标签
---
```

### 语言
- 使用**简体中文**（zh-Hans）
- 术语保留英文原文 + 中文说明（中英对照）
- 代码注释使用英文

### 图片
```markdown
![alt 文本](/img/your-image.png)
```
图片放在 `static/img/` 目录下。

### 代码块
````
```cpp
```
````

### 引用原文
> 白皮书/指南原文用 blockquote 包裹。

---

## 🚀 常用命令

```bash
npm start              # 本地预览（热更新，localhost:3000）
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
4. 更新 `SKILL/CHANGELOG.md`
5. `npm run version patch`
6. `git add -A && git commit -m "add: 新文档描述"`
7. `git tag v$(cat VERSION)`

侧边栏自动扫描 `docs/` 下的文件和目录结构，无需手动修改 `sidebars.ts`。

---

## 📋 更新日志

版本历史详见 [SKILL/CHANGELOG.md](./CHANGELOG.md)

当前版本：`v0.3.4` — Mass ECS 深度分析

---

## 🌐 首次部署

```bash
npm run build
# GitHub Pages
GIT_USER=你的用户名 npm run deploy
# 或手动上传 build/ 到静态托管
```
