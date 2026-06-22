---
sidebar_position: 11
tags: [ue5, ue5-8, nne, neural-network, ai, onnx, tensor]
---

# NNE 神经网络引擎深度分析

**模块名：** NNE（Neural Network Engine）  
**源码路径：** `Engine/Source/Runtime/NNE/`  
**编辑器扩展：** `Engine/Source/Editor/NNEEditor/`  
**第三方依赖：** `Engine/Source/Runtime/ThirdParty/DirectML/`（Windows GPU DirectML 后端）  

NNE 是 UE5 内置的**神经网络推理引擎**。它不是一个训练框架，而是一个**推理运行时**——接受训练好的模型（如 ONNX 格式）并在游戏运行时高效执行。

---

## 🧠 核心设计原理

NNE 的设计围绕三个核心抽象：

```
模型数据层（UNNEModelData）   ← 资产级别的模型存储
       ↓
模型层（IModelCPU/GPU/NPU）   ← 可创建推理实例的模型
       ↓
推理实例层（IModelInstance）   ← 实际的推理执行
```

### 设计原则

| 原则 | 说明 |
|------|------|
| **运行时无关** | NNE 定义接口，不绑定具体后端。实际推理由注册的 `INNERuntime` 实现 |
| **资产驱动的导入流程** | ONNX 模型作为资产导入→编辑器时被各 Runtime 缓存优化→运行时使用预优化数据 |
| **所有权明确** | 输入/输出内存由调用者管理，NNE 不持有数据 |
| **RDG 集成** | 通过 `NNERuntimeRDG` 可以将推理直接插入渲染管线 Pass 中 |
| **可扩展的 Runtime 注册** | 任何插件可以注册自己的 Runtime（CPU/GPU/NPU/RDG） |

---

## 🏗️ 架构分层

```
┌────────────────────────────────────────────────────────┐
│                   你的 UE 项目代码                        │
│  UE::NNE::GetRuntime<T>("RuntimeName")                  │
│  → Runtime->CreateModelCPU(ModelData)                   │
│  → ModelCPU->CreateModelInstanceCPU()                   │
│  → InstanceCPU->RunSync(Inputs, Outputs)                │
└────────────────────────────────────────────────────────┘
                      │
┌────────────────────────────────────────────────────────┐
│  NNE 核心模块 (Runtime/NNE/)                             │
│  ├── NNE.h         ← FRegistry 运行时注册表              │
│  ├── NNEModelData  ← UNNEModelData 资产（.onnx 导入）    │
│  ├── NNTypes       ← TensorShape, TensorDesc, 数据类型   │
│  ├── NNEStatus     ← 状态码                              │
│  └── NNERuntime*.h ← CPU/GPU/NPU/RDG 接口定义            │
└────────────────────────────────────────────────────────┘
                      │
┌────────────────────────────────────────────────────────┐
│  NNEEditor 编辑器模块                                    │
│  ├── NNEEditorOnnxTools.dll ← ONNX 解析/优化            │
│  └── 资产工厂 + DDC 缓存管理                              │
└────────────────────────────────────────────────────────┘
                      │
┌────────────────────────────────────────────────────────┐
│  Runtime 实现（平台/插件提供）                            │
│  ├── DirectML Runtime (Windows GPU)                    │
│  ├── CPU Runtime  (内建)                                │
│  ├── GPU Runtime  (各平台)                              │
│  ├── NPU Runtime  (专用 NPU 设备)                       │
│  └── RDG Runtime  (渲染 Pass 内推理)                    │
└────────────────────────────────────────────────────────┘
```

---

## 📦 核心类型详解

### 1. 张量类型（`NNETypes.h`）

```cpp
enum class ENNETensorDataType : uint8
{
    None, Char, Boolean,
    Half,       // 16-bit float
    Float,      // 32-bit float（最常用）
    Double,     // 64-bit float
    Int8, Int16, Int32, Int64,
    UInt8, UInt16, UInt32, UInt64,
    Complex64, Complex128,
    BFloat16    // Google Brain 16-bit float
};
```

### 2. 张量形状（`FSymbolicTensorShape` / `FTensorShape`）

```cpp
// 符号形状——导入时确定，可能有可变维度（-1 表示可变）
FSymbolicTensorShape SymbolicShape = 
    FSymbolicTensorShape::Make({ -1, 3, 224, 224 });  // batch可变, 3x224x224

// 具体形状——运行时确定的固定维度
FTensorShape ConcreteShape = 
    FTensorShape::Make({ 1, 3, 224, 224 });
```

### 3. 张量描述（`FTensorDesc`）

```cpp
FTensorDesc Desc = FTensorDesc::Make(
    TEXT("input"),                    // 张量名称
    FSymbolicTensorShape::Make({ -1, 3, 224, 224 }),  // 形状
    ENNETensorDataType::Float         // 数据类型
);
```

### 4. 张量绑定（`FTensorBindingCPU`）

```cpp
// 输入/输出的内存绑定——调用者管理的裸内存
struct FTensorBindingCPU
{
    void*   Data;         // 指向数据的指针
    uint64  SizeInBytes;  // 缓冲区大小
};
```

---

## 🔌 运行时接口体系

### 基础运行时接口（`INNERuntime`）

| 方法 | 功能 |
|------|------|
| `GetRuntimeName()` | 返回运行时名字 |
| `CanCreateModelData()` | 检查能否处理指定模型数据 |
| `CreateModelData()` | 创建运行时特定的优化模型数据 |
| `GetModelDataIdentifier()` | 模型数据唯一 ID（用于 DDC 缓存） |
| `CreateDefaultRuntimeSettings()` | 返回运行时设置对象 |

### 各平台运行时接口

| 接口 | 模型创建 | 实例创建 | 推理方式 | 适用场景 |
|------|---------|---------|---------|---------|
| `INNERuntimeCPU` | `CreateModelCPU()` | `CreateModelInstanceCPU()` | `RunSync(CPU内存)` | 通用、兼容性最好 |
| `INNERuntimeGPU` | `CreateModelGPU()` | `CreateModelInstanceGPU()` | `RunSync(GPU内存)` | GPU 加速推理 |
| `INNERuntimeNPU` | `CreateModelNPU()` | `CreateModelInstanceNPU()` | `RunSync(NPU内存)` | 专用 AI 芯片加速 |
| `INNERuntimeRDG` | `CreateModelRDG()` | `CreateModelInstanceRDG()` | `EnqueueRDG(RDGBuilder)` | 渲染管线内推理 |

### 推理实例接口（`IModelInstanceRunSync`）

```cpp
// 1. 获取模型输入输出描述
TConstArrayView<FTensorDesc> GetInputTensorDescs();
TConstArrayView<FTensorDesc> GetOutputTensorDescs();

// 2. 设置输入形状（必须先调用）
ESetInputTensorShapesStatus SetInputTensorShapes(
    TConstArrayView<FTensorShape> InInputShapes);

// 3. 获取输出形状（SetInputTensorShapes 后可获取）
TConstArrayView<FTensorShape> GetInputTensorShapes();
TConstArrayView<FTensorShape> GetOutputTensorShapes();

// 4. 同步推理
ERunSyncStatus RunSync(
    TConstArrayView<FTensorBindingCPU> InInputTensors,
    TConstArrayView<FTensorBindingCPU> InOutputTensors);
```

### RDG 推理接口（`IModelInstanceRDG`）

```cpp
// 在渲染管线的 Render Graph 中注册推理 Pass
EEnqueueRDGStatus EnqueueRDG(
    FRDGBuilder& RDGBuilder,
    TConstArrayView<FTensorBindingRDG> Inputs,
    TConstArrayView<FTensorBindingRDG> Outputs);
```

---

## 📋 完整推理流程

### CPU 推理示例

```cpp
// 1. 获取运行时
TWeakInterfacePtr<INNERuntimeCPU> Runtime = 
    UE::NNE::GetRuntime<INNERuntimeCPU>(TEXT("MyCPURuntimeName"));
if (!Runtime.IsValid()) return;

// 2. 从 ModelData 创建模型
TSharedPtr<UE::NNE::IModelCPU> Model = 
    Runtime->CreateModelCPU(MyModelDataAsset);
if (!Model.IsValid()) return;

// 3. 创建推理实例
TSharedPtr<UE::NNE::IModelInstanceCPU> Instance = 
    Model->CreateModelInstanceCPU();
if (!Instance.IsValid()) return;

// 4. 设置输入形状
TArray<UE::NNE::FTensorShape> InputShapes;
InputShapes.Add(UE::NNE::FTensorShape::Make({1, 3, 224, 224}));
Instance->SetInputTensorShapes(InputShapes);

// 5. 准备输入/输出缓冲区
TArray<UE::NNE::FTensorBindingCPU> Inputs;
Inputs.Add({InputData, InputSizeBytes});

TArray<UE::NNE::FTensorBindingCPU> Outputs;
Outputs.Add({OutputData, OutputSizeBytes});

// 6. 执行推理
Instance->RunSync(Inputs, Outputs);
```

### GPU/RDG 推理

RDG 推理可以将 NN 作为渲染 Pass 加入渲染管线：

```cpp
// 在 Renderer 的某个 Pass 中：
RDGBuilder.AddPass(RDGEventName,
    ERDGPassFlags::Compute,
    [&](FRDGComputePassContext& Context)
    {
        InstanceRDG->EnqueueRDG(
            Context.GraphBuilder, 
            RDGInputs, RDGOutputs);
    });
```

---

## 🔄 模型导入流程

```
1. 在编辑器中导入 .onnx 文件
       ↓
2. UNNEModelData::Init() 保存原始数据
       ↓
3. INNERuntime::CanCreateModelData() 检查支持
       ↓
4. INNERuntime::CreateModelData() 创建优化数据
       ↓
5. DDC（DerivedDataCache）缓存优化结果
       ↓
6. 烹饪（Cook）时：优化数据被打包
       ↓
7. 运行时：UNNEModelData::GetModelData() 反序列化优化数据
       ↓
8. INNERuntimeCPU/GPU::CreateModelCPU/GPU() 创建模型
```

---

## 🤖 是否可以接入大模型 API？

### 直接结论

**NNE 本身不能直接接入大模型 API（如 OpenAI GPT、Claude、Gemini）。** 理由如下：

| 限制 | 说明 |
|------|------|
| **NNE 是推理引擎，不是 HTTP 客户端** | NNE 运行本地 ONNX 模型，不支持 HTTP 请求 |
| **NNE 不支持 Transformer 大模型** | NNE 面向小型专用模型（分类器、姿态检测等），而非百亿参数 LLM |
| **没有内置网络通信能力** | NNE 的 `RunSync` 是纯本地同步推理 |
| **输入/输出是张量（Tensor）** | LLM 需要 tokenizer 和文本输入，NNE 底层是 `float[]` |

### 在 UE5 中接入 LLM API 的正确方式

NNE **不直接支持** LLM 调用，但你可以在 UE5 中通过以下方式接入大模型：

| 方式 | 实现 | 适用场景 |
|------|------|---------|
| **`FHttpModule` + HTTP 请求** | 直接调用 REST API | 调用 GPT/Claude/Gemini 等云 API |
| **WebSocket** | 长连接流式交互 | 实时对话、流式输出 |
| **插件市场方案** | 已有第三方插件 | 封装好的 LLM 集成 |
| **自建 UE-LLM 桥接** | UE 作为客户端，服务端运行 LLM | 本地部署的 LLM（如 LLaMA） |

### 接入云 LLM API 的示例代码

```cpp
// 使用 FHttpModule 调用 OpenAI API
void UMyAIComponent::CallLLM(const FString& Prompt)
{
    FHttpRequestRef Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TEXT("https://api.openai.com/v1/chat/completions"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("Authorization"), 
        FString::Printf(TEXT("Bearer %s"), *ApiKey));

    TSharedPtr<FJsonObject> JsonObj = MakeShareable(new FJsonObject);
    // ... 构建请求体 ...
    
    Request->OnProcessRequestComplete().BindLambda(
        [this](FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess)
        {
            if (bSuccess && Response.IsValid())
            {
                // 解析 LLM 回复
                FString Reply = Response->GetContentAsString();
                // 在游戏中应用
            }
        });
    
    Request->ProcessRequest();
}
```

### NNE 可以做什么（与 LLM 配合）

虽然 NNE 不能直接运行 LLM，但可以：

| 场景 | 用 NNE 做 | 配合 LLM 做 |
|------|----------|------------|
| 智能 NPC | NNE 运行轻量动作/姿态分类模型 | LLM 生成对话内容 |
| 游戏 AI | NNE 运行视觉/音频特征提取 | LLM 做决策推理 |
| 内容生成 | NNE 运行 upscaler/风格迁移 | LLM 生成 prompt/文案 |
| 数据分析 | NNE 运行玩家行为预测（小型模型） | LLM 分析汇总报告 |

---

## 📊 NNE 适用场景总结

| 场景 | 是否适合 NNE | 原因 |
|------|------------|------|
| 图像分类（ScanNet、ResNet 等） | ✅ 非常适合 | 标准 ONNX 模型，CPU/GPU 高性能 |
| 姿态/动作识别 | ✅ 非常适合 | 轻量模型，实时推理 |
| 语音指令识别 | ✅ 适合 | 小型音频模型 |
| 智能 NPC 行为决策 | ⚠️ 可以，但只适用于小型模型 | 复杂决策链建议用 BehaviorTree |
| 引用大语言模型（GPT/Claude） | ❌ 不支持 | NNE 不是 LLM 推理引擎 |
| 本地运行 LLaMA | ❌ 不支持 | 需要专用 LLM 推理框架 |
| 材质/纹理 AI 生成 | ⚠️ 部分支持 | 通过 RDG Runtime 集成到渲染管线 |
