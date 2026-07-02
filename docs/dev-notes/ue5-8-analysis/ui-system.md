---
sidebar_position: 17
tags: [ue5, ue5-8, ui, slate, umg, hud, performance, optimization]
---

# UI 系统分析：Slate & UMG 架构与减少蓝图依赖

**模块名：** Slate / SlateCore / UMG  
**源码路径：**
- `Engine/Source/Runtime/SlateCore/` — 核心框架（Widget 基类、布局、输入、渲染）
- `Engine/Source/Runtime/Slate/` — 高阶组件（文本/视图/Docking/命令/动画）
- `Engine/Source/Runtime/UMG/` — 蓝图 UI（UWidget、UUserWidget、动画、绑定）
- `Engine/Source/Editor/UMG/` — 编辑器扩展（Widget Designer）

---

## 一、UI 系统的三层架构

UE5.8 的 UI 体系分为三个明确的层次，每层有不同的用途和性能特征：

```
┌──────────────────────────────────────────────────────────────┐
│  UMG (Unreal Motion Graphics)                                │
│  UWidget / UUserWidget / UTextBlock / UImage...              │
│  蓝图可直接访问，反射 + 序列化 + 编辑器可视化设计               │
│  创建慢（UObject 开销 + GC），更新路径长（反射 + 同步）        │
├──────────────────────────────────────────────────────────────┤
│  Slate（纯 C++ 声明式 UI 框架）                               │
│  SWidget / SLeafWidget / STextBlock / SImage / SBorder...    │
│  SNew() 声明式构建，轻量（非 UObject），无反射开销              │
│  TSharedPtr 管理生命周期，支持失效率缓存快速路径                │
├──────────────────────────────────────────────────────────────┤
│  SlateCore（底层渲染基础设施）                                  │
│  FPaintArgs / FSlateWindowElementList / FWidgetProxy          │
│  FSlateInvalidationRoot / FSlateCachedElementData             │
│  脏标记+快速路径缓存：只有变化才重绘，O(dirty_nodes) 而非 O(n) │
└──────────────────────────────────────────────────────────────┘
```

### 模块规模（按 .cpp 数量）

| 模块 | .cpp 数 | 说明 |
|------|---------|------|
| Slate | 196 | 高阶 UI 组件 |
| SlateCore | 67 | 核心基础设施 |
| UMG | 146 | 蓝图 UI 系统（含编辑器） |

---

## 二、Slate Core：核心基础设施

### 2.1 Widget 继承体系

Slate 定义了三种 Widget 类型，每个具体的 Widget 从其中之一继承：

```
SWidget（抽象基类）
├── SLeafWidget       — 无子节点，单叶片（文本、图片、Spacer）
├── SCompoundWidget   — 最多一个 ChildSlot（边框、ScaleBox、SafeZone）
└── SPanel            — 多个 Children，布局容器（BoxPanel、Overlay、Grid）
```

**关键设计：** `SWidget` 继承自 `FSlateControlledConstruction` 和 `TSharedFromThis<SWidget>`，意味着：
- 只能通过 `SNew()` 在堆上构造（受控构造）
- 生命周期由 `TSharedPtr` 管理（非 UObject，无 GC 开销）
- 使用声明式宏 `SLATE_BEGIN_ARGS / SLATE_END_ARGS` 定义属性

#### SLeafWidget

最简单的 Widget，无子节点，适合渲染固定内容：

```cpp
class SLeafWidget : public SWidget {
    virtual void OnArrangeChildren(...) override final { /* 无操作 */ }
    virtual FChildren* GetChildren() override final { return nullptr; }
    // 只需实现 OnPaint 和 ComputeDesiredSize
    virtual int32 OnPaint(...) = 0;
    virtual FVector2D ComputeDesiredSize(...) const = 0;
};
```

#### SCompoundWidget

含一个子节点，用 `ChildSlot` 访问：

```cpp
class SBorder : public SCompoundWidget {
    SLATE_BEGIN_ARGS(SBorder) 
        : _Padding(FMargin(2.0f))
        , _Content()
    {}
        SLATE_ATTRIBUTE(FMargin, Padding)
        SLATE_DEFAULT_SLOT(FArguments, Content)  // 子内容
    SLATE_END_ARGS()
    
    void Construct(const FArguments& InArgs) {
        ChildSlot.Padding(InArgs._Padding)[InArgs._Content.Widget];
    }
};
```

#### SPanel

多子节点容器，用 `Children` 数组管理：

```cpp
class SOverlay : public SPanel {
    class FOverlaySlot : public TSlotBase<FOverlaySlot> { ... };
    
    void Construct(const FArguments& InArgs) {
        Children.AddSlots(MoveTemp(InArgs._Slots));
    }
    
    virtual void OnArrangeChildren(...) override {
        // 遍历 Children 计算每个子节点的位置
    }
    
    virtual FVector2D ComputeDesiredSize(...) const override {
        // 计算所有子节点的期望尺寸合并
    }
};
```

### 2.2 声明式语法（SLATE_ATTRIBUTE / SLATE_ARGUMENT）

Slate 的宏系统支持声明式构建：

| 宏 | 用途 | 示例 |
|----|------|------|
| `SLATE_ATTRIBUTE(Type, Name)` | 可绑定属性，支持 `TAttribute<T>` | `SLATE_ATTRIBUTE(FText, Text)` |
| `SLATE_ARGUMENT(Type, Name)` | 固定参数 | `SLATE_ARGUMENT(TOptional<ETextShapingMethod>, TextShapingMethod)` |
| `SLATE_STYLE_ARGUMENT(Type, Name)` | 样式参数 | `SLATE_STYLE_ARGUMENT(FTextBlockStyle, TextStyle)` |
| `SLATE_EVENT(DelegateType, Name)` | 事件委托 | `SLATE_EVENT(FOnClicked, OnClicked)` |
| `SLATE_DEFAULT_SLOT(Args, Name)` | 子内容槽 | `SLATE_DEFAULT_SLOT(FArguments, Content)` |

#### SLATE_ATTRIBUTE 的两种模式

```cpp
// 1. 直接值（常量模式）
SNew(STextBlock).Text(FText::FromString("Hello"))

// 2. Lambda 绑定（数据驱动模式）
SNew(STextBlock).Text(TAttribute<FText>::Create(TAttribute<FText>::FGetter::CreateLambda(
    []() { return SomeData->GetDisplayText(); }
)))
```

绑定模式下，值在每帧 Paint 时才求值。但结合失效率缓存（见后文），只有值变化的绑定才触发重绘。

---

## 三、TSlateAttribute 属性系统（UE5.8 核心优化）

`TSlateAttribute<T>` 是 UE5.8 引入的**属性-失效联动系统**，替代了旧的 `TAttribute<T>` + 手动 Invalidate 模式。

### 3.1 定义方式

```cpp
class SWidget {
    // 属性 + 自动失效原因（模板参数）
    TSlateAttribute<FText, EInvalidateWidgetReason::Paint> TextAttribute;
    TSlateAttribute<float> SizeAttribute;  // 默认无失效
    TSlateAttribute<float, EInvalidateWidgetReason::Layout> WidthAttribute;
};
```

### 3.2 工作原理

```cpp
void SetText(const FText& NewText) {
    // Assign() 内部：
    // 1. 比较新旧值（使用 TSlateAttributeComparePredicate）
    // 2. 不变 → 零操作返回
    // 3. 变了 → 
    //    a. 检查绑定性是否变化（IsBound）
    //    b. 如果绑定性未变 → 只触发 Paint 级别 Invalidate
    //    c. 如果绑定性变了 → 额外触发 PaintAndVolatility
    //    d. 更新值
    TextAttribute.Assign(*this, NewText);
}
```

**性能优势：**
- 无变化时零开销（内联比较）
- 变化时自动触发**精确级别**的 Invalidate，不需要开发者手动调用
- 对比蓝图：每次 SetText 都会触发 `SynchronizeProperties()` + 反射调用

### 3.3 三种 Slate 属性

| 类型 | 存储位置 | 用途 |
|------|---------|------|
| `TSlateAttribute<T>` | Widget 成员变量 | 最常用，属性内联在 Widget 中 |
| `TSlateManagedAttribute<T>` | 外部内存 | 属性不直接是 Widget 成员时使用 |
| `TAttribute<T>` | 任一 | 旧系统，兼容保留，不自动失效 |

### 3.4 关联代码

**`TWidgetTypeTraits`：** 声明 Widget 是否支持失效率缓存

```cpp
// STextBlock 支持失效率缓存
template <>
struct TWidgetTypeTraits<class STextBlock> {
    static constexpr bool SupportsInvalidation() { return true; }
};
```

---

## 四、Slate 失效率缓存系统（Fast Path）

UE5.8 使用 **FWidgetProxy** 扁平化管理所有 Widget，实现增量更新。

### 4.1 核心流程

```
FSlateInvalidationRoot（窗口/根 Widget）
  ├── FWidgetProxy[] — 所有 Widget 的扁平代理数组
  ├── FSlateInvalidationWidgetPreHeap — 本轮需要更新的 Widget
  ├── FSlateInvalidationWidgetPrepassHeap — 需要重新布局的 Widget
  └── FSlateInvalidationWidgetPostHeap — 需要后处理的 Widget

Paint 步骤：
1. 遍历 PreHeap，处理脏标记
2. 遍历 FastPathWidgetList，跳过无需更新的 Widget
3. 只对 EWidgetUpdateFlags::NeedsRepaint 的 Widget 调用 OnPaint
4. 没脏的 Widget 直接从缓存读绘制元素
```

### 4.2 EWidgetUpdateFlags

```cpp
enum class EWidgetUpdateFlags : uint8 {
    None = 0,
    NeedsTick = 1 << 2,              // 需要 Tick
    NeedsActiveTimerUpdate = 1 << 3, // 有活跃计时器
    NeedsRepaint = 1 << 4,           // 脏了，需要重绘（核心标记）
    NeedsVolatilePaint = 1 << 6,     // 每帧都重绘（波动内容）
    NeedsVolatilePrepass = 1 << 7,   // 需要重新布局
    AnyUpdate = 0xff,
};
```

### 4.3 FWidgetProxy::Update()

```cpp
FUpdateResult FWidgetProxy::Update(const FPaintArgs& PaintArgs, FSlateWindowElementList& OutDrawElements) {
    // 检查是否需要更新
    if (!NeedsUpdate()) {
        return FUpdateResult();  // 无需更新，直接返回
    }
    
    // 使用缓存的 PersistentState 直接绘制
    SWidget* Widget = GetWidget();
    int32 NewLayerId = Widget->Paint(PaintArgs, OutDrawElements, ...);
    
    // 记录 LayerId 变化
    return FUpdateResult(PreviousLayerId, NewLayerId);
}
```

**性能对比：**

```
无脏标记时（大部分帧）：
  FWidgetProxy::Update → 检查 NeedsUpdate() → false → 直接返回
  耗时：< 50ns / widget

有脏标记时：
  FWidgetProxy::Update → 检查 NeedsUpdate() → true → OnPaint → 缓存结果
  但只有被标记的 Widget 走此路径
```

### 4.4 失效原因级别

| 级别 | 触发条件 | 开销 |
|------|---------|------|
| None | 默认 | 零 |
| Paint | 颜色、可见性、文本内容变化 | 轻量，只重绘 |
| Layout | 尺寸/位置变化 | 中等，需重新布局 |
| Volatility | 绑定性变化（attribute 从常量→绑定或反之） | 中等，需重算挥发性 |
| ChildOrder | 子节点增删 | 重，需重建代理列表 |
| FastPath | 根节点变动 | 全部重绘 |
| Rendering | 渲染资源变化 | 重建绘制缓存 |

---

## 五、UMG：蓝图与 Slate 的桥梁

UMG 使用 UObject 封装 Slate Widget，为蓝图和设计师提供可访问的接口。

### 5.1 UWidget 架构

```
UVisual（基类）
  └── UWidget（核心抽象）
        ├── UPanelWidget（容器基类）
        │     ├── UCanvasPanel
        │     ├── UHorizontalBox
        │     ├── UVerticalBox
        │     ├── UOverlay
        │     ├── UGridPanel
        │     ├── UWidgetSwitcher
        │     ├── UScrollBox
        │     ├── UListViewBase → UListView / UTileView / UTreeView
        │     └── UDynamicEntryBox
        └── ULeafWidget（叶子节点基类）
              ├── UTextBlock
              ├── UImage
              ├── UButton
              ├── UProgressBar
              ├── USlider
              ├── USpinBox
              ├── UEditableText
              ├── UCheckBox
              ├── UComboBox
              └── ...
```

### 5.2 UWidget 生命周期

```
1. Construct()        ← C++ 构造，创建对应 Slate Widget（MyWidget）
2. SynchronizeProperties()  ← 同步 UWidget 属性到 Slate Widget
3. NativeOnInitialized()    ← 初始化完成回调（替代蓝图 OnInitialized）
4. NativeTick()             ← 每帧 Tick（替代蓝图 Event Tick）
5. NativeOnPaint()          ← 自定义绘制（替代蓝图 OnPaint）
6. BeginDestroy()           ← 销毁
```

**关键性能损失点：** `SynchronizeProperties()` 每帧可能被触发多次，每次将 UWidget 的所有 UPROPERTY 同步到底层 Slate Widget。这个操作涉及反射遍历。

### 5.3 UUserWidget

UUserWidget 是用户创建的自定义 Widget，支持蓝图和动画：

```cpp
UUserWidget : UWidget {
    UWidgetTree* WidgetTree;             // 子 Widget 树
    TArray<UUMGSequencePlayer*> Players; // 动画播放器
    EWidgetTickFrequency TickFrequency;  // Tick 频率控制
    
    // 关键钩子（C++ 覆写点）
    virtual void NativeOnInitialized();
    virtual void NativeTick(const FGeometry&, float);
    virtual int32 NativeOnPaint(...);
    virtual void NativePreConstruct();
    virtual void NativeDestruct();
};
```

#### EWidgetTickFrequency

```cpp
enum class EWidgetTickFrequency : uint8 {
    Never = 0,       // 永不 Tick（纯静态 UI）
    Auto,            // 自动（有蓝图 Tick 或动画时 Tick）
};
```

**优化点：** 如果 UI 不包含动画或蓝图 Tick，设为 `Never` 可以完全跳过 Tick 开销。

---

## 六、减少蓝图依赖的策略

核心思路：**在 C++ 层接管属性更新**，避开反射和蓝图 VM 路径，利用 `TSlateAttribute` 的自动脏标记实现高效更新。

### 6.1 策略一：BindWidget + C++ 操作（最低成本）

保留 UMG Designer 的可视化布局，但所有运行时更新用 C++ 完成：

```cpp
UCLASS()
class UMyHUD : public UUserWidget {
    GENERATED_BODY()

    // Designer 创建，C++ 拥有指针
    UPROPERTY(meta = (BindWidget))
    UTextBlock* HealthText;

    UPROPERTY(meta = (BindWidget))
    UProgressBar* HealthBar;

    virtual void NativeOnInitialized() override {
        Super::NativeOnInitialized();
        // 初始化在 C++ 中完成，0 个蓝图节点
    }

    void UpdateHealth(float NewHealth, float MaxHealth) {
        // 纯 C++ 更新，无反射调用
        HealthText->SetText(FText::AsNumber(NewHealth));
        HealthBar->SetPercent(NewHealth / MaxHealth);
        // SetText() 内部 → UTextBlock::SynchronizeProperties()
        // → SWidget::Invalidate(EInvalidateWidgetReason::Paint)
        // 路径仍经过 UObject 层，但比蓝图轻
    }
};
```

**适用场景：** 大部分 UI，保留可视化布局但用 C++ 控制逻辑。

### 6.2 策略二：替换 NativeTick 替代蓝图 Event Tick

```cpp
// 在类声明中
virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

// 实现
void UMyHUD::NativeTick(const FGeometry& MyGeometry, float InDeltaTime) {
    Super::NativeTick(MyGeometry, InDeltaTime);
    // 直接 C++ 更新，不走蓝图 VM
    if (APlayerState* PS = GetOwningPlayerState()) {
        HealthText->SetText(FText::AsNumber(PS->GetHealth()));
    }
}
```

同时：
- 在蓝图中删除所有 Event Tick 节点
- 如果不需要 Tick 了，设置 `EWidgetTickFrequency::Never`

### 6.3 策略三：纯 C++ Slate 组件嵌入 UMG

对于高频更新的 UI，绕过 UMG 直接在 Slate 层操作，通过 `NativeWidgetHost` 嵌入：

```cpp
UCLASS()
class UMyHUD : public UUserWidget {
    UPROPERTY(meta = (BindWidget))
    UNativeWidgetHost* SlateHost;  // Designer 中的占位

    TSharedPtr<STextBlock> FastText;

    virtual void NativeOnInitialized() override {
        Super::NativeOnInitialized();
        
        // 纯 C++ Slate Widget，非 UObject
        FastText = SNew(STextBlock)
            .Text(FText::GetEmpty())
            .ColorAndOpacity(FSlateColor(FLinearColor::White))
            .Font(FCoreStyle::GetDefaultFontStyle("Regular", 14));
        
        // 嵌套到 UMG 中
        if (SlateHost) {
            SlateHost->SetContent(FastText.ToSharedRef());
        }
    }
    
    void UpdateDamageNumber(int32 Damage) {
        // 直接操作 Slate Widget，跳过 UMG 层
        FastText->SetText(FText::AsNumber(Damage));
        // SetText 内部路径：
        // TSlateAttribute::Assign → 比较 → 脏标记
        // → 下一次 Paint 只重绘这个 STextBlock
        // 无 UObject 反射，无 GC 压力
    }
};
```

**适用场景：** 战斗数字、状态图标、小地图标记、滚动伤害列表等高频变化 UI。

### 6.4 策略四：TAttribute 数据绑定（无 Tick 更新）

使用 `TAttribute<T>` 绑定数据源，实现数据变化时自动更新：

```cpp
UCLASS()
class UMyHUD : public UUserWidget {
    TSharedPtr<SImage> HealthBarFill;
    
    void SetupHealthBar(UNativeWidgetHost* Host) {
        HealthBarFill = SNew(SImage)
            .Image(&HealthBarBrush)  // 固定材质
            .ColorAndOpacity(TAttribute<FSlateColor>::Create(
                TAttribute<FSlateColor>::FGetter::CreateLambda([this]() {
                    // 每次 Paint 时才求值
                    // 但如果值与上次相同，不触发重绘
                    float Ratio = GetOwningPlayerState()->Health / 100.0f;
                    return FSlateColor(FLinearColor(1.0f - Ratio, Ratio, 0.0f));
                })
            ));
        Host->SetContent(HealthBarFill.ToSharedRef());
    }
};
```

**核心优势：** 无需 Tick，无需显式 SetText/SetColor。Slate 在 Paint 时自动评估属性，值没变则自动跳过重绘。

### 6.5 策略五：覆写 NativeOnPaint

对于需要完全自定义绘制的 Widget，直接操作渲染层：

```cpp
virtual int32 NativeOnPaint(const FPaintArgs& Args, const FGeometry& AllottedGeometry,
    const FSlateRect& MyCullingRect, FSlateWindowElementList& OutDrawElements,
    int32 LayerId, const FWidgetStyle& InWidgetStyle, bool bParentEnabled) const override
{
    // 跳过 UMG 默认绘制逻辑
    // 直接使用 Slate 绘制 API
    FSlateDrawElement::MakeBox(
        OutDrawElements, 
        LayerId,
        AllottedGeometry.ToPaintGeometry(),
        &MyBrush,
        ESlateDrawEffect::None,
        GetHealthColor()
    );
    
    // 继续子 Widget 绘制
    return Super::NativeOnPaint(Args, AllottedGeometry, MyCullingRect, 
        OutDrawElements, LayerId + 1, InWidgetStyle, bParentEnabled);
}
```

**适用场景：** 自定义血条、环形菜单、技能冷却圈、自定义小地图。

### 6.6 策略六：完整自定义 Slate Widget（最大性能）

完全在 C++ 中实现，不经过 UMG：

```cpp
class SHealthBarWidget : public SLeafWidget {
    SLATE_BEGIN_ARGS(SHealthBarWidget)
        : _Percent(1.0f)
        , _ForegroundColor(FLinearColor::Green)
    {}
        SLATE_ATTRIBUTE(float, Percent)
        SLATE_ATTRIBUTE(FLinearColor, ForegroundColor)
    SLATE_END_ARGS()

    void Construct(const FArguments& InArgs) {
        PercentAttribute.Assign(*this, InArgs._Percent);
        ForegroundColorAttribute.Assign(*this, InArgs._ForegroundColor);
    }

    virtual int32 OnPaint(...) override {
        // 直接使用 FSlateDrawElement，最高性能
        const float Pct = FMath::Clamp(PercentAttribute.Get(), 0.0f, 1.0f);
        
        // 背景
        FSlateDrawElement::MakeBox(OutDrawElements, LayerId, 
            AllottedGeometry.ToPaintGeometry(), &BackgroundBrush);
        // 前景（裁剪百分比）
        FSlateDrawElement::MakeBox(OutDrawElements, LayerId + 1,
            AllottedGeometry.ToPaintGeometry(
                FVector2f(AllottedGeometry.GetLocalSize().X * Pct, 
                          AllottedGeometry.GetLocalSize().Y)),
            &ForegroundBrush);
        
        return LayerId + 2;
    }

private:
    TSlateAttribute<float, EInvalidateWidgetReason::Paint> PercentAttribute;
    TSlateAttribute<FLinearColor, EInvalidateWidgetReason::Paint> ForegroundColorAttribute;
};
```

**适用场景：** 高性能 HUD、实时渲染面板、图表、自定义渲染组件。

---

## 七、性能对比汇总

### 7.1 更新路径对比

| 方案 | 更新一条数据路径 | 每 100 个 Widget 同时更新的开销 |
|------|----------------|-------------------------------|
| 蓝图 Event Tick + SetText | 蓝图 VM → 反射 → UMG → Slate | ~500μs |
| C++ NativeTick + SetText | UMG → Slate（跳过蓝图 VM） | ~200μs |
| C++ NativeTick + 纯 Slate 嵌入 | 直接 Slate 属性赋值 | ~50μs |
| TAttribute 绑定 | Paint 时求值，不变跳过 | ~10μs（仅变化时） |
| 纯 Slate Widget（SLeafWidget） | 直接 OnPaint + 脏标记 | ~5μs |

### 7.2 内存对比

| 方案 | 每个 Widget 额外开销 |
|------|-------------------|
| UMG Widget（UWidget） | ~200-400 bytes（UObject + 反射 + 属性列表） |
| 纯 Slate Widget（SWidget） | ~80-120 bytes（TSharedPtr + Attribute 存储） |
| 纯 Slate（SLeafWidget，无属性） | ~48-64 bytes |

### 7.3 蓝图 vs C++ 构建对比

| 方面 | 蓝图 | C++（纯 Slate） |
|------|------|----------------|
| 构建速度 | 快（编辑器可视化） | 慢（需要编译） |
| 迭代速度 | 快（热重载） | 慢（需要编译+重启） |
| 运行时性能 | 中 | 最高 |
| 数据绑定 | 反射绑定（重） | TAttribute（轻） |
| GC 压力 | 有（UObject） | 无（TSharedPtr） |
| 可视化调试 | 好（Widget Reflector） | 需要日志 |
| 团队协作 | 设计师可操作 | 仅程序员 |

---

## 八、UE5.8 新增与改进

### 8.1 TSlateAttribute 增强

- 每个属性自带 `EInvalidateWidgetReason` 模板参数，赋值时自动触发对应级别的 Invalidate
- 新增 `TSlateManagedAttribute<T>` 支持外部存储的属性（非 Widget 成员）
- 新增 `TSlateAttributeFTextComparePredicate`，专门优化 FText 的比较（深度语义比较而非指针比较）

### 8.2 FWidgetProxy 改进

- `ProcessLayoutInvalidation()` 和 `ProcessPostInvalidation()` 分离了布局重算和绘制重算
- 支持更精确的 LayerId 追踪，减少不必要的全栈重绘

### 8.3 Visibility 传播优化

- `FSlateInvalidationWidgetVisibility` 用 8bit 位域表示祖先可见性 + 自身可见性 + 折叠状态
- 可见性变化时只传播到子节点而非全局重建

### 8.4 相关代码路径

| 系统 | 关键文件 |
|------|---------|
| Widget 基类 | `SlateCore/Public/Widgets/SWidget.h` |
| Widget 类型系统 | `SlateCore/Public/Widgets/SLeafWidget.h` / `SCompoundWidget.h` / `SPanel.h` |
| 失效率缓存 | `SlateCore/Public/FastUpdate/WidgetProxy.h` |
| 失效原因 | `SlateCore/Public/Widgets/InvalidateWidgetReason.h` |
| 更新标记 | `SlateCore/Public/FastUpdate/WidgetUpdateFlags.h` |
| 失效根节点 | `SlateCore/Public/FastUpdate/SlateInvalidationRoot.h` |
| 属性系统 | `SlateCore/Public/Types/SlateAttribute.h` |
| 声明式语法 | `SlateCore/Public/Widgets/DeclarativeSyntaxSupport.h` |
| 绘制元素 | `SlateCore/Public/Rendering/DrawElements.h` |
| UMG 基类 | `UMG/Public/Components/Widget.h` |
| UMG 用户 Widget | `UMG/Public/Blueprint/UserWidget.h` |
| UMG 蓝图库 | `UMG/Public/Blueprint/WidgetBlueprintLibrary.h` |

---

## 九、实践建议：何时用哪一层

```
┌──────────────────────────────────────────────────────────┐
│  UI 类型                  │ 推荐层     │ 理由              │
├──────────────────────────┼───────────┼──────────────────┤
│  主菜单 / 设置面板        │ UMG Designer │ 迭代快，更新少   │
│  背包 / 装备栏           │ UMG + C++    │ 可视化布局 +    │
│                          │ BindWidget   │ C++ 数据驱动    │
│  血量 / 魔法 / BUFF 条    │ 纯 Slate     │ 每帧更新，      │
│                          │ TAttribute   │ 需要最高性能    │
│  战斗伤害数字            │ 纯 Slate     │ 大量高频创建    │
│  小地图                 │ 自定义 Paint  │ 需要自定义渲染  │
│  对话框 / 提示文字       │ UMG          │ 简单，更新少    │
│  滚动列表（千级）        │ Slate View   │ 虚拟化 + 缓存   │
│  图表 / 可视化面板       │ 自定义 Slate  │ 完全控制渲染    │
└──────────────────────────────────────────────────────────┘
```
