---
sidebar_position: 6
---

# 命名约定

最重要的一致性规则是命名管理，命名风格可以直接确定命名实体是：类型、变量、函数、常量、宏等等，无需查找实体声明。

## 1. 通用命名规则

函数命名、变量命名、文件命名应具有描述性，不要过度缩写。类型和变量应该是名词，函数名可以用"命令性"动词。

```cpp
int num_errors;                     // 好
int num_completed_connections;      // 好
int n;                              // 坏——无意义
int nerr;                           // 坏——模糊缩写
int n_comp_conns;                   // 坏——模糊缩写
```

**缩写：** 除非放到项目外也非常明了，否则不要使用缩写。

```cpp
int num_dns_connections;   // 好——DNS 大家都懂
int wgc_connections;       // 坏——只有你小组知道
```

不要用省略字母的缩写：
```cpp
int error_count;    // 好
int error_cnt;      // 坏
```

## 2. 文件命名

文件名要**全部小写**，可以包含下划线（`_`）或短线（`-`）。

```cpp
my_useful_class.cc
my-useful-class.cc
myusefulclass.cc
```

- C++ 文件以 `.cc` 结尾，头文件以 `.h` 结尾
- 定义类时文件名一般成对出现，如 `foo_bar.h` 和 `foo_bar.cc`，对应类 `FooBar`
- 内联函数可以放到以 `-inl.h` 结尾的文件中

## 3. 类型命名

类型命名每个单词以**大写字母开头**，不包含下划线。

```cpp
class UrlTable { ... };
struct UrlTableProperties { ... };
typedef hash_map<UrlTableProperties *, string> PropertiesMap;
enum UrlTableErrors { ... };
```

## 4. 变量命名

变量名一律**小写**，单词间以下划线相连。类的成员变量以下划线结尾。

```cpp
string table_name;           // 好
string tableName;            // 坏——大小写混用

class MyClass {
 private:
  int my_exciting_member_variable_;  // 下划线结尾
};
```

结构体的数据成员和普通变量一样，不用像类那样接下划线：

```cpp
struct UrlTableProperties {
  string name;
  int num_entries;
};
```

全局变量可以以 `g_` 或其他易与局部变量区分的标志为前缀。

## 5. 常量命名

在名称前加 `k`，`k` 后接大写字母开头的单词：

```cpp
const int kDaysInAWeek = 7;
```

## 6. 函数命名

**普通函数：** 以大写字母开头，每个单词首字母大写，没有下划线。

```cpp
AddTableEntry()
DeleteUrl()
```

**存取函数：** 要与存取的变量名匹配。

```cpp
class MyClass {
 public:
  int num_entries() const { return num_entries_; }
  void set_num_entries(int num_entries) { num_entries_ = num_entries; }
 private:
  int num_entries_;
};
```

## 7. 命名空间命名

命名空间的名称是**全小写**的，其命名基于项目名称和目录结构：

```cpp
namespace google_awesome_project { ... }
```

## 8. 枚举命名

枚举值应**全部大写**，单词间以下划线相连。枚举名称属于类型，因此大小写混用。

```cpp
enum UrlTableErrors {
  OK = 0,
  ERROR_OUT_OF_MEMORY,
  ERROR_MALFORMED_INPUT,
};
```

## 9. 宏命名

如果绝对要使用宏，命名像枚举命名一样全部大写、使用下划线：

```cpp
#define ROUND(x) ...
#define PI_ROUNDED 3.0
```

## 小结

| 类别 | 风格 | 示例 |
|------|------|------|
| 文件 | 全小写 + 下划线/短线 | `my_class.cc` |
| 类型（类/结构体/枚举/typedef） | 大写开头 + 大小写混用 | `MyClass` |
| 变量（普通/成员） | 全小写 + 下划线，成员结尾 `_` | `table_name_` |
| 常量 | `k` + 大写开头 | `kDaysInAWeek` |
| 普通函数 | 大写开头 + 大小写混用 | `AddTableEntry()` |
| 存取函数 | 与变量名匹配 | `num_entries()` |
| 命名空间 | 全小写 | `my_namespace` |
| 枚举值 | 全大写 + 下划线 | `ERROR_OUT_OF_MEMORY` |
| 宏 | 全大写 + 下划线 | `MY_MACRO()` |
