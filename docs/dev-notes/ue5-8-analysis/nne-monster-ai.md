---
sidebar_position: 12
tags: [ue5, ue5-8, nne, ai, monster, gameplay, async]
---

# NNE 绑怪实战：怪物 AI 的神经网络推理

**问题：** NNE 是否可以绑定到怪物身上，用作怪物 AI 的决策/感知/行为网络？

**答案：技术上可行，战术上建议「混合架构」。**

---

## 源码依据

NNE 的模型和实例体系天然支持多实例共享：

```cpp
// 一个模型权重 → 多个推理实例
// （源码 NNERuntimeCPU.h 原文）
class IModelCPU
{
    /**
     * The runtime have the opportunity to share the model weights among
     * multiple IModelInstanceCPU created from an IModelCPU instance,
     * however this is not mandatory.
     */
    virtual TSharedPtr<UE::NNE::IModelInstanceCPU> CreateModelInstanceCPU() = 0;
};
```

翻译过来：**多个怪物可以共享同一套模型权重**，各自持有独立的推理实例，互不干扰。

---

## 架构方案

### 方案一：共享模型 + 多实例（同类怪物）

```
一个 UNNEModelData 资产
  └── IModelCPU（共享权重）
      ├── IModelInstanceCPU ← Monster 1
      ├── IModelInstanceCPU ← Monster 2
      ├── IModelInstanceCPU ← Monster 3
      └── IModelInstanceCPU ← Monster N
```

**适合：** 同类型怪物共享同一行为模型。权重只加载一次，内存开销极小。

### 方案二：每类怪物独立模型

```
UNNEModelData_Goblin → IModelCPU_Goblin → 所有哥布林共享
UNNEModelData_Ogre  → IModelCPU_Ogre  → 所有食人魔共享
UNNEModelData_Boss  → IModelCPU_Boss  → Boss 专用
```

**适合：** 不同类型的怪物需要完全不同的 AI 行为。

### 方案三：混合架构（推荐）

```
BehaviorTree（策略层） ← BBBB 框架
  │
  ├── NNE（感知/预测/分类）
  │   ├── 状态分类器（玩家距离/血量 → 攻击模式）
  │   ├── 轨迹预测器（历史路径 → 下一位置）
  │   └── 动画选择器（速度/方向 → 动画权重）
  │
  ├── EQS（环境查询）
  ├── NavMesh（寻路）
  └── 规则系统（硬约束）
```

**适合：** 大多数游戏项目。BehaviorTree 负责决策流程，NNE 负责数据驱动的感知和预测。

---

## 完整代码实现

### 怪物组件声明

```cpp
// MonsterAIComponent.h
UCLASS()
class UMonsterNNComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    // 在蓝图中选择推理模型
    UPROPERTY(EditAnywhere, Category = "NNE")
    TObjectPtr<UNNEModelData> NNEModelData;

    // 推理频率（避免每帧推理）
    UPROPERTY(EditAnywhere, Category = "NNE", meta = (ClampMin = "0.1"))
    float InferenceInterval = 0.5f;

    // 输入特征
    TArray<float> InputBuffer;
    // 输出结果
    TArray<float> OutputBuffer;

    // 推理实例（与同类怪物共享模型权重）
    TSharedPtr<UE::NNE::IModelInstanceCPU> Instance;

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType,
        FActorComponentTickFunction* ThisTickFunction) override;

private:
    float TimeSinceLastInference = 0.0f;

    void InitializeNNE();
    void RunInferenceAsync();
    void ApplyResult(const TArray<float>& Result);
};
```

### 初始化 NNE

```cpp
void UMonsterNNComponent::InitializeNNE()
{
    if (!NNEModelData) return;

    // 1. 获取 CPU Runtime
    TWeakInterfacePtr<INNERuntimeCPU> Runtime =
        UE::NNE::GetRuntime<INNERuntimeCPU>(TEXT("SomeCPURuntime"));
    if (!Runtime.IsValid()) return;

    // 2. 从模型数据创建模型（共享权重）
    //    如果同类怪物已创建，可以直接复用
    TSharedPtr<UE::NNE::IModelCPU> Model =
        Runtime->CreateModelCPU(NNEModelData);
    if (!Model.IsValid()) return;

    // 3. 创建推理实例
    Instance = Model->CreateModelInstanceCPU();
    if (!Instance.IsValid()) return;

    // 4. 设置输入形状
    TArray<UE::NNE::FTensorShape> InputShapes;
    InputShapes.Add(UE::NNE::FTensorShape::Make({1, InputFeatureSize}));
    Instance->SetInputTensorShapes(InputShapes);

    // 5. 准备输入/输出 buffer
    int64 OutputSizeBytes = ...; // 根据模型输出计算
    InputBuffer.SetNum(InputFeatureSize);
    OutputBuffer.SetNum(OutputSizeBytes / sizeof(float));

    UE_LOG(LogTemp, Log, TEXT("Monster NNE initialized for %s"),
        *GetOwner()->GetName());
}
```

### 异步推理（关键！）

```cpp
void UMonsterNNComponent::TickComponent(float DeltaTime, ELevelTick TickType,
    FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

    if (!Instance.IsValid()) return;

    TimeSinceLastInference += DeltaTime;
    if (TimeSinceLastInference < InferenceInterval) return;
    TimeSinceLastInference = 0.0f;

    RunInferenceAsync();
}

void UMonsterNNComponent::RunInferenceAsync()
{
    // 填充输入数据（基于当前怪物状态）
    FillInputData(InputBuffer);

    // 复制 buffer 防止竞态
    TArray<float> LocalInput = InputBuffer;
    TArray<float> LocalOutput;
    LocalOutput.SetNum(OutputBuffer.Num());

    // 构造 tensor bindings（裸指针，必须在异步中保持有效）
    TArray<UE::NNE::FTensorBindingCPU> Inputs;
    Inputs.Add({LocalInput.GetData(),
        LocalInput.Num() * sizeof(float)});

    TArray<UE::NNE::FTensorBindingCPU> Outputs;
    Outputs.Add({LocalOutput.GetData(),
        LocalOutput.Num() * sizeof(float)});

    // 在线程池中推理
    TWeakPtr<UE::NNE::IModelInstanceCPU> WeakInstance = Instance;
    TWeakObjectPtr<UMonsterNNComponent> WeakThis = this;

    Async(EAsyncExecution::ThreadPool,
        [WeakInstance, Inputs, Outputs, LocalInput,
         LocalOutput = MoveTemp(LocalOutput)]() mutable
        {
            auto PinnedInstance = WeakInstance.Pin();
            if (!PinnedInstance.IsValid()) return;

            // 阻塞推理（在后台线程）
            PinnedInstance->RunSync(Inputs, Outputs);

            // 回到 GameThread 应用结果
            Async(EAsyncExecution::TaskGraphMainThread,
                [WeakThis, Result = MoveTemp(LocalOutput)]()
                {
                    if (auto* Comp = WeakThis.Get())
                    {
                        Comp->ApplyResult(Result);
                    }
                });
        });
}

void UMonsterNNComponent::ApplyResult(const TArray<float>& Result)
{
    OutputBuffer = Result;

    // 将推理结果写入 BehaviorTree 黑板
    if (AAIController* AIC = GetOwner()->GetInstigatorController<AAIController>())
    {
        if (UBlackboardComponent* BB = AIC->GetBlackboardComponent())
        {
            // 例如：攻击模式选择
            int32 AttackMode = FMath::Clamp(
                FMath::RoundToInt(Result[0]), 0, 3);
            BB->SetValueAsInt("AttackMode", AttackMode);

            // 例如：威胁评估
            float ThreatLevel = Result[1];
            BB->SetValueAsFloat("ThreatLevel", ThreatLevel);
        }
    }
}
```

### Batch 推理（大批怪物优化）

如果需要同时推理大量同类怪物，**Batch 推理**比逐个推理高效得多：

```cpp
// 把所有怪物的输入拼成一个大 batch
int32 NumMonsters = 100;
int32 InputSize = 10;

TArray<float> BatchInputData;
BatchInputData.SetNum(NumMonsters * InputSize);

// 第 i 个怪物的输入放在 [i*InputSize .. (i+1)*InputSize)
for (int i = 0; i < NumMonsters; i++)
{
    FMemory::Memcpy(&BatchInputData[i * InputSize],
        Monsters[i]->InputData.GetData(),
        InputSize * sizeof(float));
}

FTensorShape BatchShape = FTensorShape::Make({NumMonsters, InputSize});
Instance->SetInputTensorShapes({BatchShape});

TArray<UE::NNE::FTensorBindingCPU> BatchInputs;
BatchInputs.Add({BatchInputData.GetData(),
    BatchInputData.Num() * sizeof(float)});

// 一次推理出所有怪物的结果
Instance->RunSync(BatchInputs, BatchOutputs);

// 结果按同样布局排列
for (int i = 0; i < NumMonsters; i++)
{
    float* MonsterOutput = &BatchOutputData[i * OutputSize];
    Monsters[i]->ApplyResult(MonsterOutput);
}
```

---

## 关键约束

| 约束 | 说明 | 应对 |
|------|------|------|
| **`RunSync` 是同步阻塞的** | 在 GameThread 直接调用会卡帧 | 用 `Async(ThreadPool)` 后台推理 |
| **Buffer 由调用者管理** | `FTensorBindingCPU.Data` 是裸指针 | 确保异步期间 buffer 有效 |
| **模型体积有限** | NNE 面向轻量 ONNX 模型 | 不适合大模型，分类器/MLP 最佳 |
| **无内置 GPU 推理管线** | GPU 推理需 RDG Runtime 和渲染 Pass | CPU 推理通常够用 |

---

## 适合/不适合的怪物 AI 场景

| 怪物行为 | NNE 方案 | 评价 |
|---------|---------|------|
| **攻击模式选择** | 分类器输入：玩家距离/血量/状态 → 输出攻击类型 | ✅ 非常适合 |
| **移动路径预测** | 轻量 LSTM，输入历史轨迹 → 输出下一位置 | ✅ 适合 |
| **动画状态混合** | MLP 输入速度/方向 → 输出动画骨骼权重 | ✅ 适合 |
| **玩家行为预测** | 小 Transformer 输入玩家操作序列 | ⚠️ 可作为补充 |
| **复杂策略决策** | — | ❌ 交给 BehaviorTree |
| **对话/文本生成** | — | ❌ 交给 LLM API |
| **Boss 多阶段切换** | 分类器感知阶段条件 | ✅ 适合作为触发器 |

---

## 总结架构

```
AActor (Monster)
  └── UActorComponent (MonsterNNComponent)
      ├── UNNEModelData*（编辑器指定模型资产）
      ├── TSharedPtr<IModelInstanceCPU>（推理实例）
      ├── Async ThreadPool（后台推理）
      └── ApplyResult → BehaviorTree Blackboard

每个 Tick:
  1. 收集状态 → 填充 InputBuffer
  2. Async ThreadPool → Instance->RunSync()
  3. 回到 GameThread → ApplyResult
  4. BehaviorTree 读取黑板值 → 决策执行
```

## 核心结论

> **NNE 可以绑到怪物身上，但推荐混合架构：BehaviorTree 做策略框架，NNE 做感知/预测/分类模块。**

NNE 不是 BehaviorTree 的替代品，而是**数据驱动的感知层**，为传统决策框架提供更丰富的输入信号。
