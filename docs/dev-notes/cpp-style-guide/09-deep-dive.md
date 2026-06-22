---
sidebar_position: 10
tags: [cpp, google-style, deep-dive, pitfalls, windows]
---

# 深度话题 / Deep Dive

本文覆盖谷歌风格指南中触及但未展开的若干深度话题，以及 C++ 开发中常见的"陷阱区"。

## 1. Stream vs Printf：为什么 Google 选后者

谷歌风格指南最受争议的决定之一：**禁止使用 iostream，除非用于日志**，其他情况使用 `printf` + `read/write`。

### 流的问题

| 问题 | 说明 |
|------|------|
| **隐式类型错误** | `cout << this` 输出地址，`cout << *this` 输出内容——编译器不会报错 |
| **难以格式化** | 像 `%.*s` 这样的格式化操作用 stream 非常困难 |
| **不支持重排序** | 国际化需要 `%1s` 这样的重排序，stream 不支持 |
| **操作符重载滥用** | `<<` 被重载使得意图混淆 |

```cpp
// Stream 版 —— 冗长且参数顺序难以追踪
cerr << "Error connecting to '" << foo->bar()->hostname.first
     << ":" << foo->bar()->hostname.second << ": "
     << strerror(errno);

// printf 版 —— 格式化字符串清晰，参数一目了然
fprintf(stderr, "Error connecting to '%s:%u: %s",
        foo->bar()->hostname.first,
        foo->bar()->hostname.second,
        strerror(errno));
```

> 每种方式都是各有利弊，"没有最好，只有更好"，简单化的教条告诫我们必须从中选择其一。最后的多数决定是 printf + read/write。

**对 UE5 开发者的意义：** UE5 使用 `UE_LOG` 宏（本质上是自定义的格式化日志系统），不直接使用 iostream，与 Google 的立场一致。

## 2. 无符号整型的陷阱

风格指南强烈建议**不要使用无符号类型**，除非表示位组（bit pattern）。

### 经典的无限循环 bug

```cpp
// 永远不终止！i >= 0 对 unsigned 永远为真
for (unsigned int i = foo.Length() - 1; i >= 0; --i) { ... }
```

### C 的类型提升机制

> 如果 foo.Length() 返回 0，`foo.Length() - 1` 会环绕到一个极大的正数。这是因为无符号整型的**环绕行为**。

有符号 vs 无符号混合比较时，C 的类型提升规则会导致意外结果：

```cpp
int a = -1;
unsigned int b = 1;
if (a < b)  // false! a 被提升为 unsigned，变成 0xFFFFFFFF
```

**建议：** 使用断言声明变量为非负数，不要使用无符号型。即使数值不会为负值也尽量不要使用。

## 3. RAII 与异常安全

风格指南禁止使用异常，但提到了 RAII 在异常安全中的角色。

> 异常安全需要 RAII 和不同编码实践。轻松、正确编写异常安全代码需要大量支撑。

**RAII（Resource Acquisition Is Initialization）** 是 C++ 的核心资源管理范式：
- 资源在构造函数中获取
- 在析构函数中释放
- 无论是否存在异常，析构函数都会被调用

即使 Google 禁用异常，RAII 仍然是推荐的资源管理方式（通过 scoped_ptr 等智能指针）。

## 4. 循环引用与引用计数

> 引用计数指针的问题是容易导致循环引用或其他导致对象无法删除的异常条件，而且在每次拷贝或赋值时原子操作都会很慢。

```cpp
class A {
    shared_ptr<B> b_ptr;
};
class B {
    shared_ptr<A> a_ptr;  // ← 循环引用！两个对象都无法释放
};
```

**解决方案：** 使用 `weak_ptr` 打破循环，或者重新设计所有权结构。

## 5. mutable 关键字与线程安全

> 关键字 mutable 可以使用，但是在多线程中是不安全的，使用时首先要考虑线程安全。

`mutable` 允许在 `const` 方法中修改成员变量。常见用途：
- 缓存（cache）或惰性求值
- 互斥锁（mutex）

但在多线程环境中，`mutable` 成员上的修改操作需要自行保证线程安全。

## 6. 匈牙利命名法为什么被禁

Windows 程序员习惯的匈牙利命名法（如 `iNum` 表示整型变量、`pszName` 表示指向 null-terminated string 的指针）在 Google 风格中**被禁用**。

```cpp
int iNum;          // 匈牙利命名法 —— 禁止
int num_errors;    // Google 风格 —— 使用描述性名称
```

> 不要使用匈牙利命名法，使用 Google 命名约定。

## 7. 宏的高级应用（# 和 ##）

风格指南虽然不推荐使用宏，但承认在某些底库代码中宏有其用武之地。

| 宏操作 | 说明 | 用途 |
|--------|------|------|
| `#` | 字符串化（stringifying） | `#x` → `"x"` |
| `##` | 连接（concatenation） | `x##y` → `xy` |

**使用宏的原则：**
1. 不要在 `.h` 文件中定义宏
2. 使用前正确 `#define`，使用后正确 `#undef`
3. 不要只对已经存在的宏使用 `#undef`，选择不会冲突的名称
4. 不使用会导致不稳定 C++ 构造的宏，至少文档说明其行为

## 8. 编译器警告级别

> 使用 Microsoft Visual C++ 编译时，将警告级别设置为 3 或更高，并将所有 warnings 当作 errors 处理。

## 9. 预处理宏的"不平衡构造"风险

> 不要使用会导致不稳定 C++ 构造（unbalanced C++ constructs）的宏。

所谓不平衡构造，比如一个宏展开出一个 `{` 但没有对应的 `}`，或者包含不完整的 if/else 结构——这会导致宏的展开点周围代码结构被破坏。

```cpp
// 坏宏 —— 展开后会破坏周围代码的结构
#define BEGIN_BLOCK {
#define END_BLOCK }

// 更好的做法 —— 用模板或内联函数替代
```

## 10. MSVC 特定扩展封装原则

对于 `__declspec(dllimport)` 和 `__declspec(dllexport)`，必须通过 `DLLIMPORT` 和 `DLLEXPORT` 等宏封装：

```cpp
// 不直接使用 __declspec，而是通过宏
#ifdef COMPILING_DLL
#define DLLEXPORT __declspec(dllexport)
#else
#define DLLEXPORT __declspec(dllimport)
#endif

class DLLEXPORT MyClass { ... };
```

这样其他人共享代码时更容易放弃这些非标准扩展。
