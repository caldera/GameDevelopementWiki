---
sidebar_position: 8
---

# 格式

代码风格和格式确实比较随意，但一个项目中所有人遵循同一风格是非常重要的。

## 1. 行长度

每一行代码字符数不超过 **80**。

**例外：**
- 包含超过 80 字符的命令或 URL 的注释
- 包含长路径的可以超出（尽量避免）
- 头文件保护可以无视该原则

## 2. 非 ASCII 字符

尽量不使用非 ASCII 字符，使用时必须使用 **UTF-8** 格式。

## 3. 空格还是制表位

**只使用空格，每次缩进 2 个空格。** 不要在你的代码中使用 Tab，设定编辑器将 Tab 转为空格。

## 4. 函数声明与定义

返回类型和函数名在同一行，合适的话，参数也放在同一行：

```cpp
ReturnType ClassName::FunctionName(Type par_name1, Type par_name2) {
  DoSomething();
  ...
}
```

如果一行放不下所有参数：

```cpp
ReturnType ClassName::ReallyLongFunctionName(Type par_name1,
                                             Type par_name2,
                                             Type par_name3) {
  DoSomething();
  ...
}
```

**要点：**
- 返回值总是和函数名在同一行
- 左圆括号总是和函数名在同一行
- 函数名和左圆括号间**没有空格**
- 圆括号与参数间**没有空格**
- 左大括号总是在最后一个参数同一行的末尾处
- 右大括号总是单独位于函数最后一行
- 缺省缩进为 2 个空格
- 独立封装的参数保持 4 个空格的缩进

**未使用的参数：** 在函数定义处将参数名注释起来：

```cpp
void Circle::Rotate(double /*radians*/) {}
```

## 5. 函数调用

尽量放在同一行，否则将实参封装在圆括号中：

```cpp
bool retval = DoSomething(argument1, argument2, argument3);

// 多行时对齐
bool retval = DoSomething(averyveryveryverylongargument1,
                          argument2, argument3);

// 参数较多时每行一个参数
bool retval = DoSomething(argument1,
                          argument2,
                          argument3,
                          argument4);
```

## 6. 条件语句

最常见的是在圆括号和条件之间没有空格：

```cpp
if (condition) {    // 好
  ...
} else {
  ...
}
```

- 所有情况下 `if` 和左圆括号间有个空格
- 右圆括号和左大括号间有个空格
- 单行语句可以在没有 `else` 子句时写在同一行：

```cpp
if (x == kFoo) return new Foo();
```

- 如果语句中哪一分支使用了大括号的话，其他部分也必须使用

## 7. 循环和开关选择语句

```cpp
switch (var) {
  case 0: {
    ...
    break;
  }
  case 1: {
    ...
    break;
  }
  default: {
    assert(false);
  }
}
```

空循环体应使用 `{}` 或 `continue`，而不是一个简单的分号：

```cpp
while (condition) {}         // 好
while (condition) continue;  // 好
while (condition);           // 坏——看起来像 do/while 的一部分
```

## 8. 指针和引用表达式

句点 `.` 或箭头 `->` 前后不要有空格。指针/地址操作符 `*`、`&` 后不要有空格。

```cpp
x = *p;
p = &x;
x = r.y;
x = r->y;

char *c;            // 好：星号靠近变量
const string &str;  // 好

char* c;            // 也可接受：星号靠近类型
const string& str;  // 也可接受
```

## 9. 布尔表达式

如果一个布尔表达式超过标准行宽，逻辑与 `&&` 操作符总位于行尾：

```cpp
if (this_one_thing > this_other_thing &&
    a_third_thing == a_fourth_thing &&
    yet_another & last_one) {
  ...
}
```

## 10. 函数返回值

`return` 表达式中不要使用圆括号：

```cpp
return x;         // 好
return(x);        // 坏
```

## 11. 变量及数组初始化

下面的形式都是正确的：

```cpp
int x = 3;
int x(3);
string name("Some Name");
string name = "Some Name";
```

## 12. 预处理指令

预处理指令**不要缩进**，从行首开始：

```cpp
  if (lopsided_score) {
#if DISASTER_PENDING     // 好——从行首开始
    DropEverything();
#endif
    BackToNormal();
  }
```

## 13. 类格式

```cpp
class MyClass : public OtherClass {
 public:           // 注意 1 个空格缩进！
  MyClass();
  explicit MyClass(int var);
  ~MyClass() {}

  void SomeFunction();
  int some_var() const { return some_var_; }

 private:
  bool SomeInternalFunction();

  int some_var_;
  int some_other_var_;
  DISALLOW_COPY_AND_ASSIGN(MyClass);
};
```

- `public:`、`protected:`、`private:` 要缩进 1 个空格
- 除第一个关键词（一般是 `public:`）外，其他关键词前空一行
- `public` 放在最前面，然后是 `protected` 和 `private`

## 14. 初始化列表

```cpp
// 全部放在一行：
MyClass::MyClass(int var) : some_var_(var), some_other_var_(var + 1) {
}

// 多行时，4 格缩进：
MyClass::MyClass(int var)
    : some_var_(var),
      some_other_var_(var + 1) {
  DoSomething();
}
```

## 15. 命名空间格式化

命名空间内容**不缩进**：

```cpp
namespace {

void foo() {    // 正确——命名空间内不额外缩进
  ...
}

}  // namespace
```

## 16. 水平空白

- 赋值运算符总有空格：`x = 0;`
- 一元运算符和其参数间没有空格：`x = -5;` `++x;`
- 二元运算符通常有空格：`v = w * x + y / z;`
- 圆括号内没有空格：`if (condition)` `v = w * (x + z);`
- 不要添加多余的空格

## 17. 垂直空白

垂直空白越少越好。

- 不要在函数定义之间空超过 2 行
- 函数体头、尾不要有空行
- 代码块头、尾不要有空行
- `if-else` 块之间空一行还可以接受

> 基本原则：同一屏可以显示越多的代码，程序的控制流就越容易理解。

## 小结

1. 行宽原则上不超过 80 列
2. 尽量不使用非 ASCII 字符
3. 使用 2 空格缩进，不用 Tab
4. 左大括号置于行尾，右大括号独立成行
5. `.` / `->` 操作符前后不留空格，`*` / `&` 不要前后都留
6. 预处理指令/命名空间不使用额外缩进
7. `return` 不要加 `()`
8. 水平/垂直留白不要滥用
