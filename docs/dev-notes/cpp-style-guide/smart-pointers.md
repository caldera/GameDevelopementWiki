---
sidebar_position: 5
---

# 智能指针与其他 C++ 特性

## 智能指针

如果确实需要使用智能指针的话，`scoped_ptr` 完全可以胜任。在非常特殊的情况下（例如对 STL 容器中的对象），你应该只使用 `std::tr1::shared_ptr`。**任何情况下都不要使用 `auto_ptr`。**

一般来说，我们倾向于设计对象隶属明确的代码，最明确的对象隶属是根本不使用指针，直接将对象作为一个域或局部变量使用。引用计数指针的问题是容易导致循环引用或其他导致对象无法删除的异常状态。

## 引用参数

所以按引用传递的参数必须加上 `const`。

```cpp
void Foo(const string &in, string *out);
```

这是一个硬性约定：输入参数为值或常数引用，输出参数为指针。

## 函数重载

仅在输入参数类型不同、功能相同时使用重载函数（含构造函数），不要使用函数重载模仿缺省函数参数。

如果你想重载一个函数，考虑让函数名包含参数信息。例如，使用 `AppendString()`、`AppendInt()` 而不是 `Append()`。

## 缺省参数

**禁止使用缺省函数参数。** 所有参数必须明确指定。

## 变长数组和 alloca

**禁止使用变长数组和 `alloca()`。** 使用安全的分配器，如 `scoped_ptr` / `scoped_array`。

## 友元

允许合理使用友元类及友元函数。通常将友元定义在同一文件下。

```cpp
class Foo {
  friend class FooBuilder;
  // ...
};
```

友元延伸了（但没有打破）类的封装界线，使用友元通常比将其声明为 `public` 要好得多。

## 异常

**不要使用 C++ 异常。**

Google 现有的大多数 C++ 代码都没有异常处理，引入带有异常处理的新代码相当困难。对于 Windows 代码来说，这一点有个例外（在规则之例外中详细说明）。

## 运行时类型识别（RTTI）

**禁止使用 RTTI。** 除单元测试外，不要使用 RTTI。

如果你需要在运行期间确定一个对象的类型，这通常说明你需要重新考虑你的类的设计。

## 类型转换

使用 `static_cast<>()` 等 C++ 的类型转换，不要使用 `int y = (int)x` 或 `int y = int(x)`。

| 转换方式 | 用途 |
|---------|------|
| `static_cast` | 值的强制转换，或指针的父类到子类的明确向上转换 |
| `const_cast` | 移除 const 属性 |
| `reinterpret_cast` | 指针类型和整型或其他指针间不安全的相互转换 |
| `dynamic_cast` | 除测试外不要使用 |

## 流

**只在记录日志时使用流。** 其他情况使用 `printf` 之类的代替。

```cpp
// 日志接口可以使用流
LOG(INFO) << "Error connecting to " << hostname;

// 其他情况使用 printf 风格
fprintf(stderr, "Error connecting to '%s:%u': %s",
        hostname, port, strerror(errno));
```

## 前置自增和自减

对于迭代器和其他模板对象使用**前缀形式**（`++i`）的自增、自减运算符。

```cpp
for (auto it = v.begin(); it != v.end(); ++it)  // 好
for (int i = 0; i < n; ++i)                      // 好（数值类型无所谓）
```

## const 的使用

**强烈建议在任何可以使用的情况下都要使用 `const`。**

- 如果函数不会修改传入的引用或指针类型的参数，这样的参数应该为 `const`
- 尽可能将函数声明为 `const`
- 如果数据成员在对象构造之后不再改变，可将其定义为 `const`

`const` 位置：提倡 `const` 在前（`const int *foo`），但不要求，要保持代码一致性。

## 整型

C++ 内建整型中，唯一用到的是 `int`。如果需要不同大小的变量：
- 可以使用 `<stdint.h>` 中的精确宽度整型，如 `int16_t`
- 需要 64 位整型的话，可以使用 `int64_t` 或 `uint64_t`
- 不要使用 `uint32_t` 等无符号整型，除非表示一个位组而不是数值

```cpp
int i = 0;                       // 默认使用 int
int64_t big_value = 0x123456789LL;  // 64 位
```

## 预处理宏

使用宏时要谨慎，尽量以内联函数、枚举和常量代替之。

如果确实要使用：
1. 不要在 `.h` 文件中定义宏
2. 使用前正确 `#define`，使用后正确 `#undef`
3. 不要使用会导致不稳定的 C++ 构造的宏

## 0 和 NULL

- 整数用 `0`，实数用 `0.0`
- 指针用 `NULL`
- 字符（串）用 `'\0'`

## sizeof

尽可能用 `sizeof(varname)` 代替 `sizeof(type)`。

```cpp
Struct data;
memset(&data, 0, sizeof(data));       // 好——变量类型改变时自动同步
memset(&data, 0, sizeof(Struct));     // 不好——不同步
```

## Boost

只使用 Boost 中被认可的库。当前包括：
- `Compressed Pair`：`boost/compressed_pair.hpp`
- `Pointer Container`：`boost/ptr_container`（不包括 `ptr_array.hpp` 和序列化）
