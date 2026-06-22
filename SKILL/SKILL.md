# SKILL: GameDevelopementWiki

本 Wiki 基于 **Docusaurus 3** 构建，内容编辑采用纯 Markdown + Git 工作流。

项目根：`H:\3D Game Dev\GameDevelopementWiki`

---

## 📁 目录结构

```
GameDevelopementWiki/
├── VERSION                    ← 版本号（唯一来源）
├── SKILL/
│   └── SKILL.md               ← 本文件
├── scripts/
│   ├── bump-version.js        ← 版本升级脚本
│   └── verify-version.js      ← 版本校验（prebuild 钩子）
├── docs/                      ← 所有文档内容
│   ├── intro.md               ← 首页
│   ├── dev-notes/             ← 程序开发笔记
│   │   └── cpp-style-guide/   ← C++ 风格指南
│   ├── ue5-caveats/           ← UE5 踩坑记录
│   ├── world-building/        ← 世界观
│   ├── project-mgmt/          ← 项目管理
│   └── mmo-dev/              ← 网游开发
├── blog/                      ← 开发日志（文章/周记）
├── src/
│   ├── version.ts             ← 版本信息模块（导出 VERSION）
│   └── css/custom.css         ← 自定义样式
├── static/                    ← 静态资源（图片等）
├── sidebars.ts                ← 侧边栏配置
└── docusaurus.config.ts       ← 站点配置（自动读取 VERSION）
```

## 🔖 版本管理

版本号格式：**major.minor.patch**（语义化版本）

```bash
# 查看当前版本
cat VERSION

# 升级补丁版本（修复 bug、小改动）
npm run version patch

# 升级次版本（新增内容、功能）
npm run version minor

# 升级主版本（重大重构、不兼容变更）
npm run version major

# 构建时自动校验版本一致性
npm run build          # 自动触发 prebuild → verify-version
```

每次增删改内容后：
1. `npm run version patch`（或 minor/major）
2. `git add -A && git commit -m "描述变更"`
3. `npm run build` 确认编译通过

## ✍️ 写作规范

### Markdown 前置元数据

```markdown
---
title: 文章标题      # 可选，默认取一级标题
sidebar_position: 2  # 侧边栏排序（越小越前）
tags: [ue5, networking]  # 可选
---
```

### 语言
- 使用简体中文（zh-Hans）
- 代码注释使用英文

### 图片
图片放在 `static/img/` 目录下，引用方式：
```markdown
![alt 文本](/img/your-image.png)
```

### 代码块
```cpp
// C++ code here
```

## 🚀 常用命令

```bash
npm start              # 本地预览（热更新）
npm run build          # 构建生产版本（含 prebuild 校验）
npm run serve          # 本地预览构建结果
npm run clear          # 清理缓存
npm run version patch  # 升级版本号
npm run verify-version # 校验版本一致性
```

## 📦 添加新文档

1. 在 `docs/` 对应目录下创建 `.md` 文件
2. 写入内容，加上 front matter
3. `npm start` 预览
4. `npm run version patch`
5. `git add -A && git commit -m "add: 新文档"`
6. `npm run build` 验证

侧边栏自动扫描 `docs/` 下的文件和目录结构，无需手动修改 `sidebars.ts`。

## 🌐 首次部署

```bash
npm run build
# 部署到 GitHub Pages
GIT_USER=你的用户名 npm run deploy
# 或手动上传 build/ 目录到静态托管
```
