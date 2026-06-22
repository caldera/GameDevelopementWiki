# SKILL: GameDevelopementWiki

本 Wiki 基于 **Docusaurus 3** 构建，内容编辑采用纯 Markdown + Git 工作流。

## 目录结构

```
GameDevelopementWiki/
├── docs/                    ← 所有文档内容
│   ├── intro.md             ← 首页
│   ├── dev-notes/           ← 程序开发笔记
│   ├── ue5-caveats/         ← UE5 踩坑记录
│   ├── world-building/      ← 世界观
│   │   ├── lore/
│   │   ├── factions/
│   │   ├── geography/
│   │   └── characters/
│   ├── project-mgmt/        ← 项目管理
│   └── mmo-dev/            ← 网游开发
│       ├── networking/
│       ├── server-arch/
│       ├── replication/
│       └── scaling/
├── blog/                    ← 开发日志（文章/周记）
├── src/                     ← 自定义 React 组件
├── static/                  ← 静态资源（图片等）
├── sidebars.ts              ← 侧边栏配置
├── docusaurus.config.ts     ← 站点配置
└── SKILL.md                 ← 本文件
```

## 写作规范

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
UE5 C++ 代码：
````
```cpp
// C++ code here
```
````

蓝图/文本配置等：
````
```yaml
DefaultEngine.ini 配置
```
````

## 常用命令

```bash
# 本地预览（热更新）
npm start

# 构建生产版本
npm run build

# 本地预览构建结果
npm run serve

# 清理缓存
npm run clear
```

## 添加新文档

1. 在 `docs/` 对应目录下创建 `.md` 文件
2. 写入内容，加上 front matter
3. 本地 `npm start` 预览
4. 提交 Git

侧边栏自动扫描 `docs/` 下的文件和目录结构，无需手动修改 `sidebars.ts`（除非需要自定义顺序）。

## 首次部署

```bash
# 构建
npm run build

# 部署到 GitHub Pages
GIT_USER=你的用户名 npm run deploy

# 或手动上传 build/ 目录到静态托管
```
