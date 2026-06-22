---
sidebar_position: 7
---

# 代码注释

注释是给下一个需要理解你的代码的人写的——认真点，那下一个人很可能就是你自己。

## 1. 注释风格

使用 `//` 或 `/* */`，统一就好。`//` 使用更加广泛。

## 2. 文件注释

在每一个文件开头加入**版权公告**，然后是文件内容描述。

**版权和作者信息：**
1. 版权声明：如 `Copyright 2024 Google Inc.`
2. 许可版本：为项目选择合适的许可证版本
3. 作者：标识文件的原始作者

**文件内容说明：**
- `.h` 文件要对所声明的类的功能和用法作简单说明
- `.cc` 文件包含了更多的实现细节或算法讨论
- 不要在 `.h` 和 `.cc` 之间复制注释——复制的注释偏离了实际意义

## 3. 类注释

每个类的定义要附着描述类的功能和用法的注释。

```cpp
// Iterates over the contents of a GargantuanTable. Sample usage:
//   GargantuanTable_Iterator* iter = table->NewIterator();
//   for (iter->Seek("foo"); !iter->done(); iter->Next()) {
//     process(iter->key(), iter->value());
//   }
//   delete iter;
class GargantuanTable_Iterator {
  ...
};
```

## 4. 函数注释

**函数声明处：** 注释描述函数功能及用法。

```cpp
// Returns an iterator for this table. It is the client's
// responsibility to delete the iterator when it is done with it.
//
// This method is equivalent to:
//   Iterator* iter = table->NewIterator();
//   iter->Seek("");
//   return iter;
Iterator* GetIterator() const;
```

注释内容应包括：
- 输入及输出
- 对象是否需要保持引用参数，是否会释放这些参数
- 如果函数分配了空间，需要由调用者释放
- 参数是否可以为 NULL
- 函数使用的性能隐忧
- 同步前提

**函数定义处：** 注释说明函数功能和实现要点。

## 5. 变量注释

通常变量名本身足以说明变量用途，特定情况下需要额外注释说明。

```cpp
class Foo {
 private:
  // Keeps track of the total number of entries in the table.
  // Used to ensure we do not go over the limit. -1 means
  // that we don't yet know how many entries the table has.
  int num_total_entries_;
};
```

## 6. 实现注释

对实现代码中巧妙的、晦涩的、有趣的、重要的地方加以注释。

```cpp
// Divide result by two, taking into account that x
// contains the carry from the add.
for (int i = 0; i < result->size(); i++) {
  x = (x << 8) + (*result)[i];
  (*result)[i] = x >> 1;
  x &= 1;
}
```

**传入布尔值或整数时，要注释说明含义：**

```cpp
bool success = CalculateSomething(interesting_value,
                                  10,           // Default base value.
                                  false,        // Not the first time.
                                  NULL);        // No callback.
```

更好的做法是使用常量：

```cpp
const int kDefaultBaseValue = 10;
const bool kFirstTimeCalling = false;
Callback* null_callback = NULL;
bool success = CalculateSomething(interesting_value,
                                  kDefaultBaseValue,
                                  kFirstTimeCalling,
                                  null_callback);
```

**不要用自然语言翻译代码作为注释：**

```cpp
// 坏：用自然语言描述代码
// Now go through the b array and make sure that if i occurs,
// the next element is i+1.
```

## 7. 标点、拼写和语法

留意标点、拼写和语法。注释一般是包含适当大写和句点的完整句子。清晰的代码很重要，适当的标点、拼写和语法对此会有所帮助。

## 8. TODO 注释

对那些临时的、短期的解决方案，或已经够好但并不完美的代码使用 `TODO` 注释。

```cpp
// TODO(kl@gmail.com): Use a "*" here for concatenation operator.
// TODO(Zeke) change this to use relations.
// TODO: Fix by November 2024
// TODO: Remove this code when all clients can handle XML responses.
```
