---
sidebar_position: 16
tags: [ue5, ue5-8, verse, language, metaverse]
---

# Verse 语言分析

**源码路径：** `Engine/Source/Runtime/VerseCompiler/`（编译器）+ `Runtime/Solaris/`（运行时 VM）  
**核心子模块：** `uLangCore`（语言基础）/ `uLangJSON`（JSON）/ `uLangUE`（UE 集成）

Verse 是 Epic Games 为元宇宙/生态应用打造的一种新编程语言。它内建于 UE5，与 UE 游戏框架深度集成。

---

## 1. 语言定位

Verse 的设计哲学：

| 特性 | 说明 |
|------|------|
| **声明式** | 以条件/规则表达行为，而非步骤流程 |
| **事务性** | 内建失败回滚（基于 AutoRTFM） |
| **安全** | 引用不再泄露、内存自动管理 |
| **并发** | 内建异步构造 |
| **元数据驱动** | 支持在 UE 生态中创建可脚本化系统 |

---

## 2. 编译器架构

```
Verse 源代码
  ↓
ParserPass（解析器）→ 生成 VST（Verse Syntax Tree）
  ↓
SemanticAnalyzer（语义分析）→ 类型检查、去糖化、符号解析
  ↓
IRGenerator（IR 生成器）→ 生成中间表示
  ↓
PostIRFilter（后 IR 过滤器）→ 优化
  ↓
Solaris (uLang Runtime VM) → 执行
```

### 2.1 编译器模块

| 模块 | 文件 | 功能 |
|------|------|------|
| **ParserPass** | `Parser/ParserPass.cpp` | 词法/语法分析 |
| **SemanticAnalyzer** | `SemanticAnalyzer/SemanticAnalyzer.cpp` | 类型检查、语义分析 |
| **Desugarer** | `SemanticAnalyzer/Desugarer.cpp` | 去糖化（语法糖展开） |
| **IRGenerator** | `SemanticAnalyzer/IRGenerator.cpp` | 中间代码生成 |
| **DigestGenerator** | `SemanticAnalyzer/DigestGenerator.cpp` | 摘要生成（增量编译）|
| **Toolchain** | `Toolchain/Toolchain.cpp` | 编译流水线管理 |
| **ProgramBuildManager** | `Toolchain/ProgramBuildManager.cpp` | 程序构建管理 |

### 2.2 解析器栈

```
VerseGrammar.h ← 语法定义
  ↓
ParserPass.cpp ← 递归下降解析器
  ↓
ReservedSymbols.h ← 保留符号表（关键字、内置函数）
```

### 2.3 语义分析器

```
SemanticAnalyzer:
├── SemanticScope（作用域管理）
├── SemanticClass（类语义）
├── SemanticFunction（函数语义）
├── SemanticInterface（接口语义）
├── SemanticEnumeration（枚举语义）
├── SemanticProgram（程序语义）
├── SemanticTypes（类型系统）
├── CaptureScope（捕获作用域）
└── Effects（副作用追踪）
```

---

## 3. Solaris 运行时（uLang VM）

Solaris 是 Verse 的运行时虚拟机：

**源码路径：** `Runtime/Solaris/`

| 组件 | 文件 | 功能 |
|------|------|------|
| **uLangCore** | `uLangCore/Public/uLang/Common/` | 基础类型：字符串、容器、内存分配器 |
| **uLangJSON** | `uLangJSON/uLang/JSON/` | JSON 解析/序列化 |
| **uLangUE** | `uLangUE/Private/ULangUE.cpp` | UE 集成层（日志、工具函数） |

```
Verse 编译结果
  ↓
Solaris VM (uLang Runtime)
├── 内存分配器（ArenaAllocator）
├── 容器（Array、HashTable、Map、Set）
├── 字符串（UTF8String、Symbol）
├── 线程支持
└── 平台抽象（Windows/Linux/Mac/iOS/Android）
```

---

## 4. Verse 与 UE5 的集成

| 集成点 | 说明 |
|--------|------|
| **VerseBlueprints** | 使用 Verse 编写蓝图逻辑 |
| **Verse API** | 通过 UFunction 暴露的 Verse API |
| **Verse Integration** | Verse 调用 UE C++ 的能力 |
| **AutoRTFM 回滚** | Verse 的失败回滚由 AutoRTFM 底层实现 |
| **Creative Mode** | 用于 UEFN (Unreal Editor for Fortnite) 内容创作 |

## 5. 对游戏开发者的意义

| 角度 | 说明 |
|------|------|
| **当前使用场景** | 主要用于 Fortnite 生态 （UEFN/Creative）和 Verse 原生 API 开发 |
| **定位** | Verse 不是 C++ 替代品，而是 UE 的**脚本层第二语言**——如同 Blueprint 的文本版本 |
| **何时接触** | 当需要编写 UE 编辑器中可版本化、可协作的脚本化游戏规则时 |
| **底层支撑** | AutoRTFM 事务内存 + Solaris VM 提供稳定的运行时 |

> **核心结论：** Verse 是 Epic 为元宇宙生态打造的高级脚本语言。当前阶段对常规 UE5 游戏开发者的直接用途有限，但 Epic 正在逐步扩大它的覆盖范围（UEFN/Creative/Verse API）。建议关注，但无需立即投入学习。
