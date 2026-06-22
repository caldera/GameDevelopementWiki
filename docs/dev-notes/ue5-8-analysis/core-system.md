---
sidebar_position: 2
tags: [ue5, ue5-8, core, uobject, engine-core]
---

# 核心系统 Core & CoreUObject

Core 和 CoreUObject 是 UE5 引擎的基石。`Core` 提供基础数据类型和工具，`CoreUObject` 构建了 UObject 反射系统。

## Core 模块结构 (737 .cpp)

```
Core/
├── Public/
│   ├── Containers/    ← 容器：TArray, TMap, TSet, TQueue, TStaticArray...
│   ├── String/        ← 字符串：FString, FText, FName, TStringView...
│   ├── Math/          ← 数学：FVector, FRotator, FMatrix, FTransform, FQuat...
│   ├── Async/         ← 异步：TFuture, TPromise, FTask, ParallelFor...
│   ├── HAL/           ← 硬件抽象层：平台文件、内存、线程、时间...
│   ├── Misc/          ← 杂项：FGuid, FFilename, Crc, Parse, Assert...
│   ├── Templates/     ← 模板工具：TUniquePtr, TSharedPtr, TWeakPtr, TFunction...
│   ├── Traits/        ← 类型萃取
│   ├── UObject/       ← (Core 自带的 UObject 工具)
│   └── Delegates/     ← 委托
```

### 关键容器对比

| 容器 | 特性 | 适用场景 |
|------|------|---------|
| `TArray` | 动态数组，连续内存 | 最常用，适合任何顺序访问 |
| `TArray<TUniquePtr>` | 指针数组 | 多态对象集合 |
| `TMap<Key, Value>` | 哈希表 | KV 查询 |
| `TSet<T>` | 哈希集合 | 去重、快速存在检测 |
| `TSortedMap<Key, Value>` | 排序映射 | 有序 KV |
| `TQueue<T>` | 线程安全队列 | 生产者-消费者 |
| `TStaticArray<T, N>` | 固定大小数组 | 编译时常量大小 |
| `TArrayView<T>` | 数组视图 | 函数参数传递数组切片 |

### 字符串系统

| 类型 | 特性 | 使用 |
|------|------|------|
| `FString` | 可变 UTF-16 字符串 | 显示、拼接 |
| `FText` | 本地化文本 | 所有 UI 文案 |
| `FName` | 原子化、不可变、快速比较 | 标识符、关键字 |
| `TStringView` | 字符串视图（不持有内存） | 函数参数 |
| `FTCHARToUTF8` | 编码转换工具 | 编码转换 |

### 智能指针

| 类型 | 所有权 | 线程安全版本 |
|------|--------|------------|
| `TUniquePtr` | 独占 | — |
| `TSharedPtr` | 共享引用计数 | `TSharedRef`（非空保证）|
| `TWeakPtr` | 弱引用 | 打破循环引用 |
| `TScopeGuard` | 作用域守卫 | — |

## CoreUObject 模块 (403 .cpp)

```
CoreUObject/Public/UObject/
├── UObject.h           ← 所有 UObject 的基类
├── Class.h             ← UClass（元类）
├── Package.h           ← UPackage（包）
├── Property.h          ← 属性系统
├── GarbageCollection.h ← GC 垃圾回收
├── Serialization.h     ← 序列化
├── ObjectPtr.h         ← FObjectPtr（UObject 安全引用）
└── ObjectSaveContext.h ← 保存上下文
```

### UObject 核心机制

| 机制 | 说明 |
|------|------|
| **反射** | 通过 `UCLASS()` / `UPROPERTY()` / `UFUNCTION()` 宏标记，在运行时暴露类型信息 |
| **GC 垃圾回收** | 基于标记-清扫（Mark-Sweep）算法，自动回收无引用 UObject |
| **序列化** | 支持版本化的属性序列化（兼容引擎版本升级） |
| **网络复制** | 通过 `UPROPERTY(Replicated)` 自动同步属性 |
| **包和资产** | `UPackage` 管理资源文件，支持引用追踪和依赖解析 |

### 关键类层级

```
UObject （万物之源）
├── UClass         ← 类的元信息（反射核心）
├── UFunction      ← 函数的元信息
├── UProperty      ← 属性的元信息（已废弃，使用 FProperty）
├── UEnum          ← 枚举的元信息
├── UStruct        ← 结构体的元信息
│   └── UScriptStruct ← 脚本结构
└── UField           ← 字段基类
```

### GC 工作流

```
1. 对象创建 → Register 到 GC 系统
2. 引用追踪 → Mark 可达对象
3. 清扫阶段 → Sweep 未标记对象
4. 析构 → 调用 ConditionalBeginDestroy()
5. 回收 → Free 内存
```

### FObjectPtr 与安全引用

UE5 引入了 `FObjectPtr`（对 UObject 的智能指针封装），解决了原始指针在 GC 过程中可能失效的问题：

- `TObjectPtr<T>` — 可空的 UObject 引用（替代原始指针的最佳选择）
- `TStrongObjectPtr<T>` — 强引用，阻止 GC
- `TWeakObjectPtr<T>` — 弱引用，不阻止 GC，自动置空

> UE5.8 中 `TObjectPtr` 已经成为 UPROPERTY 引用的默认推荐方式。
