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

```cpp
ReturnType ClassName::FunctionName(Type par_name1, Type par_name2) {
  DoSomething();
  ...
}
```

**要点：**
- 返回值总是和函数名在同一行
- 左圆括号总是和函数名在同一行，之间**没有空格**
- 圆括号与参数间**没有空格**
- 左大括号总是在最后一个参数同一行的末尾处
- 右大括号总是单独位于函数最后一行
- 缺省缩进为 2 个空格；独立封装的参数保持 4 个空格缩进
- 如果函数为 `const`，`const` 与最后一个参数在同一行

**未使用的参数：** 将参数名注释起来：

```cpp
void Circle::Rotate(double /*radians*/) {}
```

## 5. 函数调用

尽量放在同一行，否则将实参对齐：

```cpp
bool retval = DoSomething(argument1, argument2, argument3);

bool retval = DoSomething(averyveryveryverylongargument1,
                          argument2, argument3);

// 参数较多时每行一个
bool retval = DoSomething(argument1,
                          argument2,
                          argument3,
                          argument4);
```

## 6. 条件语句

更提倡不在圆括号中添加空格，关键字 `else` 另起一行。

```cpp
if (condition) {    // 圆括号内无空格
  ...
} else {
  ...
}
```

**规则：**
- `if` 和左圆括号间**有一个空格**
- 右圆括号和左大括号间**有一个空格**
- 单行语句（无 `else` 时）可以写在同一行
- **如果任一分支使用了大括号，其他所有分支也必须使用**

## 7. 循环和开关选择语句

```cpp
switch (var) {
  case 0: {          // 2 空格缩进
    ...              // 4 空格缩进
    break;
  }
  default: {
    assert(false);   // 总包含 default
  }
}
```

**空循环体：** 使用 `{}` 或 `continue`，而不是单个分号：

```cpp
while (condition) {}         // 好
while (condition) continue;  // 好
while (condition);           // 坏——看起来像 do/while
```

## 8. 指针和引用表达式

句点 `.` 或箭头 `->` 前后不要有空格。指针操作符 `*`、`&` 后不要有空格。

```cpp
x = *p;  p = &x;
x = r.y;  x = r->y;

char *c;            // 星号靠近变量
char* c;            // 也可接受：星号靠近类型
char * c;           // 坏——两边都有空格
```

**关键原则：** 同一文件中保持一致。

## 9. 布尔表达式

逻辑与 `&&` 操作符总位于行尾：

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

以下形式都正确：

```cpp
int x = 3;                // = 风格
int x(3);                 // 构造函数风格
string name("Some Name");
string name = "Some Name";
```

## 12. 预处理指令

预处理指令**不要缩进**，即使位于代码块中：

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
 public:           // 1 个空格缩进
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

**要点：**
- 基类名尽量与子类名在同一行（80 列限制内）
- `public:` / `protected:` / `private:` 缩进 **1 个空格**
- 各访问控制块之间空一行（类较小可以不空）
- `public` 在前，`protected` 在中，`private` 在后

## 14. 初始化列表

```cpp
// 一行内：
MyClass::MyClass(int var) : some_var_(var), some_other_var_(var + 1) {}

// 多行时 4 格缩进：
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

void foo() {    // 不额外缩进
  ...
}

}  // namespace
```

## 16. 水平空白

**循环和条件：**
```cpp
if (b) {                    // 关键词后空格
} else {
while (test) {}             // 圆括号内无空格
for (int i = 0; i < 5; ++i) {
switch (i) {
  case 1:  ...              // case 冒号前无空格，后有空格的代码
  case 2: break;            // 冒号后有代码时加空格
```

**操作符：**
```cpp
x = 0;                          // 赋值符两侧空格
x = -5;                         // 一元符与参数无空格
++x;
if (x && !y) ...
v = w * x + y / z;              // 二元符两侧通常有空格
```

**模板和转换：**
```cpp
vector<string> x;               // 尖括号内无空格
y = static_cast<char*>(x);
set<list<string> > x;            // > > 间需要空格
```

**不要添加多余的空格。**

## 17. 垂直空白

> 垂直空白越少越好。同一屏可以显示越多的代码，程序的控制流就越容易理解。

- 函数定义之间不超过 2 行空行
- 函数体头、尾不要有空行
- 代码块头、尾不要有空行
- `if-else` 块之间空一行可以接受

## 小结

1. 行宽不超过 80 列
2. 尽量不使用非 ASCII 字符，使用 UTF-8
3. 使用 2 空格缩进，不用 Tab
4. 左大括号行尾，右大括号独立成行
5. `.` / `->` 前后不留空格，`*` / `&` 靠一边
6. 预处理指令/命名空间不缩进
7. `return` 不加 `()`
8. 水平/垂直留白不要滥用
9. 初始化用 `=` 或 `()` 都行，保持统一
10. 函数定义中的未使用参数用 `/* */` 注释掉
