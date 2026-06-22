---
sidebar_position: 1
---

# Google C++ 编程风格指南

**来源：** Google C++ Style Guide（中文版）  
**整理：** edisonpeng (2009)  
**说明：** 本文整合了 Google C++ 编程风格的核心规范，既是团队编码的参考标准，也是 UE5 C++ 开发中遵循一致风格的重要依据。

## 章节导航

| # | 章节 | 内容概要 |
|---|------|----------|
| 1 | [头文件](/dev-notes/cpp-style-guide/headers) | #define保护、头文件依赖、内联函数、-inl.h、参数顺序、包含次序 |
| 2 | [作用域](/dev-notes/cpp-style-guide/scoping) | 命名空间、嵌套类、非成员函数、局部变量、全局变量 |
| 3 | [C++ 类](/dev-notes/cpp-style-guide/classes) | 构造函数、默认/显式/拷贝构造函数、struct vs class、继承、多重继承、接口、运算符重载、声明次序 |
| 4 | [智能指针与其他特性](/dev-notes/cpp-style-guide/smart-pointers) | 智能指针、引用参数、函数重载、缺省参数、变长数组、友元、异常、RTTI、类型转换、流、const、整型、预处理宏、Boost |
| 5 | [命名约定](/dev-notes/cpp-style-guide/naming) | 文件/类型/变量/常量/函数/命名空间/枚举/宏的命名规则 |
| 6 | [代码注释](/dev-notes/cpp-style-guide/comments) | 文件/类/函数/变量注释、实现注释、TODO 注释 |
| 7 | [格式](/dev-notes/cpp-style-guide/formatting) | 行长度、缩进、函数声明/定义/调用、条件/循环/switch、指针引用、布尔表达式、类格式、空白 |
| 8 | [规则之例外](/dev-notes/cpp-style-guide/exceptions) | 现有不一致代码、Windows 代码的特殊处理 |

## 核心理念

> **一致性高于一切。** 保持统一的编码风格意味着其他人可以根据"模式匹配"规则快速理解代码的含义。创建通用的、必需的习惯用语和模式可以使代码更加容易理解。

> **最好的代码本身就是文档。** 清晰明确的命名比冗长的注释更有价值。
