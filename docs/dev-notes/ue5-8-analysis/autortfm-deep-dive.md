---
sidebar_position: 15
tags: [ue5, ue5-8, autortfm, transactions, memory, verse]
---

# AutoRTFM 事务内存系统

**源码路径：** `Engine/Source/Runtime/AutoRTFM/`  
**文档路径：** `Engine/Source/Runtime/AutoRTFM/Documentation/`  
**官方博客：** [Bringing Verse Transactional Memory Semantics to C++](https://www.unrealengine.com/en-US/tech-blog/bringing-verse-transactional-memory-semantics-to-c)

AutoRTFM (Automatic Runtime Transactional Memory) 是一种编译器集成的事务内存系统，使 C++ 代码能够自动支持**原子执行 + 失败回滚**语义，是 Verse 语言失败处理能力的底层实现。

---

## 1. 背景

### 为什么需要 AutoRTFM？

Verse 语言的核心特性之一是"失败即回滚"——当代码执行失败时，所有副作用被自动撤销，仿佛什么都没发生过。传统 C++ 通过 `try/catch` 实现，但 Verse 的失败范围（failure scope）可以嵌套任意深度。

在 AutoRTFM 之前，回滚靠手动回调（`Verse::Stm`）实现。服务器端现已全面使用 AutoRTFM 自动处理回滚。

> Live in Production: 截至 UE 5.8 (Release 36.20, July 2025)，AutoRTFM 已**全面启用**于所有 VkPlay / VkEdit 会话。计划在后续版本中废弃禁用路径。

---

## 2. 核心概念

### 2.1 Open 与 Closed 双模式编译

AutoRTFM 基于 Epic 内部定制的 Clang 编译器，每个函数编译两次：

```
源代码 → 两次编译：
  ├── Open（未插桩）  ← 普通 C++ 执行
  └── Closed（插桩）  ← 事务追踪写入、可回滚
```

| 模式 | 代码 | 特点 |
|------|------|------|
| **Open** | 无插桩的普通函数 | 执行不可回滚，无开销 |
| **Closed** | 带事务追踪的函数 | 记录所有堆写入，支持回滚 |

程序从 Open 状态启动。当需要回滚能力时，调用 `AutoRTFM::Transact` 切换到 Closed 模式。

### 2.2 事务生命周期

```
Transact({  // 进入 Closed——开始事务
    int* Data = new int(42);
    Process(Data);     // 堆写入被追踪
    ...
    if (failed) {
        AbortTransaction();  // 回滚一切！
    }
});  // 到达末尾 → 提交（Commit），应用所有变更
```

### 2.3 Open 与 Closed 间切换

| API | 作用 |
|-----|------|
| `AutoRTFM::Transact(lambda)` | 在 Closed 中启动事务 |
| `AutoRTFM::Open(lambda)` | 在事务中临时回到 Open 执行不可回滚代码 |
| `AutoRTFM::Close(lambda)` | 从 Open 切回 Closed |
| `AutoRTFM::AbortTransaction()` | 立即中止当前事务（回滚所有变更）|
| `AutoRTFM::CascadingAbortTransaction()` | 级联中止所有嵌套事务 |

### 2.4 事务回调

| 回调 | 时机 | FIFO/LIFO |
|------|------|-----------|
| `OnCommit(work)` | 事务提交时 | FIFO |
| `OnPreAbort(work)` | 事务中止前（内存回滚前） | LIFO |
| `OnAbort(work)` | 事务中止后（内存回滚后） | LIFO |
| `OnComplete(work)` | 最外层事务完成或中止后 | FIFO |
| `OnRetry(work)` | 级联重试时 | FIFO |

### 2.5 事务结果

```cpp
enum class ETransactionResult
{
    Committed,                   // 提交成功
    AbortedByRequest,            // 主动调用 AbortTransaction
    AbortedByLanguage,           // 未处理的语言构造（原子操作等）
    AbortedByCascadingAbort,     // 级联中止
    RejectedTransactDuringUnwind,// 展开过程中尝试新事务
    RejectedTransactDuringCommit,// 提交过程中尝试新事务
    // ...
};
```

---

## 3. 五种函数模式

每个编译的 AutoRTFM 函数都有一种模式：

| 模式 | 属性宏 | 说明 |
|------|--------|------|
| **Enabled** | `AUTORTFM_ENABLE` | 默认模式。生成 Closed 变体，可在 Open/Closed 中调用 |
| **Disabled** | `AUTORTFM_DISABLE` | 不生成 Closed 变体。**不能在 Closed 中调用！** |
| **Open** | `AUTORTFM_OPEN` | Closed 调用时自动切换到 Open，执行完切回 |
| **OpenNoSanitize** | `AUTORTFM_OPEN_NO_SANITIZE` | 同上，但禁用 sanitizer |
| **Inferred** | `AUTORTFM_INFER` | 模板专用——根据模板参数推断模式 |
| **Internal** | — | 仅供 AutoRTFM 运行时内部使用 |

### 模式传播规则

```
class AUTORTFM_DISABLE MyClass
{
    // 类级别的 DISABLE → 所有方法默认为 Disabled
    void DefaultDisabled();          // Disabled
    
    // 显式覆盖
    AUTORTFM_ENABLE void ExplicitlyEnabled();  // Enabled
    
    // 嵌套类继承外层模式
    class NestedClass { /* Disabled */ };
};
```

---

## 4. 危险操作（Hazards）

### 4.1 事务不安全的操作

| 操作 | 风险 |
|------|------|
| `std::atomic<>` | 跨线程通信，无法自动回滚 |
| `FThreadSafeCounter` | 同上 |
| `FCriticalSection` / `FMutex` | 锁在事务中释放会导致状态暴露 |
| 预编译二进制（Oodle、EOS） | 没有 Closed 变体 |
| ISPC 编译器生成的代码 | 没有 Closed 变体 |

### 4.2 安全替代品

```cpp
// ❌ 事务不安全
FCriticalSection Lock;
FMutex Mutex;

// ✅ 事务安全
FTransactionallySafeCriticalSection SafeLock;
FTransactionallySafeMutex SafeMutex;
```

### 4.3 调用 Open 代码的原则

在 Closed 中调用没有 Closed 变体的 Open 函数时，需要：

```cpp
UE_AUTORTFM_OPEN {
    // 在这里调用 Oodle、EOS 等
    OodleCompress(Data, Size);
    
    // **必须**手动告知运行时堆写入
    AutoRTFM::RecordOpenWrite(Data, Size);
};
```

**重要原则：** 不要在 Closed 和 Open 之间混合修改同一块内存。会导致难以调试的回滚失败。

### 4.4 编译错误与修复

```
error: Cannot call AutoRTFM-disabled function from an AutoRTFM-enabled function
```

| 修复方法 | 说明 |
|---------|------|
| 给调用函数加 `AUTORTFM_DISABLE` | 长期优化方案——减少代码膨胀 |
| 加 `AutoRTFM::UnreachableIfClosed()` | 短期方案——运行时断言不可达 |
| 加 `AUTORTFM_INFER` | 模板场景——根据参数推断 |

---

## 5. 命令行控制

```ini
-dpcvars=AutoRTFMRuntimeEnabled=off     # 禁用
-dpcvars=AutoRTFMRuntimeEnabled=on      # 启用
-dpcvars=AutoRTFMRuntimeEnabled=forceoff # 强制禁用
-dpcvars=AutoRTFMRuntimeEnabled=forceon  # 强制启用
-dpcvars=AutoRTFMRetryTransactions=1     # 重试非嵌套事务
-dpcvars=AutoRTFMRetryTransactions=2     # 重试嵌套事务
```

---

## 6. 在游戏项目中的应用

| 场景 | 可行性 | 说明 |
|------|--------|------|
| **Verse 开发** | ✅ 底层支持 | AutoRTFM 是 Verse 失败回滚的基础 |
| **多线程代码** | ⚠️ 需改造 | 需要替换为 `FTransactionallySafe*` 系列 |
| **大型复杂事务** | ⚠️ 性能考量 | 大量堆写入追踪有开销 |
| **纯单线程游戏逻辑** | ✅ 理论上可用 | `Transact { ... }` 自动回滚 |
| **UE 原生 API 调用** | ⚠️ 很多 API 是 Disabled | 需要 `UE_AUTORTFM_OPEN` 包裹 |

> **核心结论：** AutoRTFM 目前主要用于 Verse 运行时和服务器端。对常规 UE5 游戏项目，直接使用场景有限，但理解其原理有助于编写事务安全的 Verse 代码。
