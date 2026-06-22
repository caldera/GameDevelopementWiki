---
sidebar_position: 7
tags: [ai, prompt-engineering, best-practices, tips]
---

# 最佳实践 / Best Practices

> Finding the right prompt requires tinkering. Vertex AI Studio (or Language Studio) is a perfect place to play around with your prompts, with the ability to test against various models.

## 提供示例 / Provide Examples

> The most important best practice is to provide (one shot / few shot) examples within a prompt.

示例充当了强大的教学工具，为模型提供参考点或目标。示例应该：
- 与目标任务相关
- 多样化、高质量、编写良好
- **包含边界情况**（edge cases）——异常或意外的输入，模型仍然应该能处理

> One small mistake can confuse the model and will result in undesired output.

## 简洁设计 / Design with Simplicity

Prompt 应该简洁、清晰、易于你和模型双方理解。

> As a rule of thumb, if it's already confusing for you it will likely be also confusing for the model.

**不好的方式：**
```
I am visiting New York right now, and I'd like to hear more
about great locations. I am with two 3 year old kids.
Where should we go during our vacation?
```

**改后：**
```
Act as a travel guide for tourists. Describe great places to
visit in New York Manhattan with a 3 year old.
```

**推荐使用的动作动词：**
Act, Analyze, Categorize, Classify, Contrast, Compare, Create, Describe, Define, Evaluate, Extract, Find, Generate, Identify, List, Measure, Organize, Parse, Pick, Predict, Provide, Rank, Recommend, Return, Retrieve, Rewrite, Select, Show, Sort, Summarize, Translate, Write.

## 明确输出 / Be Specific About the Output

简洁的指令可能不足以引导 LLM。通过 system 或 context prompting 提供具体细节。

**应该：**
```
Generate a 3 paragraph blog post about the top 5 video game consoles.
The blog post should be informative and engaging, and it should
be written in a conversational style.
```

**不应该：**
```
Generate a blog post about video game consoles.
```

## 指令优先于约束 / Use Instructions Over Constraints

> Growing research suggests that focusing on positive instructions in prompting can be more effective than relying heavily on constraints.

| 对比 | 说明 |
|------|------|
| **指令（Instruction）** | 明确说明期望的输出格式、风格或内容 |
| **约束（Constraint）** | 对响应设置限制或边界，说明什么不该做 |

**优先使用正向指令：** 不做"不要列出游戏名称"，而做"只讨论主机、制造商、年份和总销量"。

```
DO: Generate a 1 paragraph blog post about the top 5 video game
consoles. Only discuss the console, the company who made it, the
year, and total sales.

DO NOT: Generate a 1 paragraph blog post about the top 5 video
game consoles. Do not list video game names.
```

**约束仍有价值的情况：**
- 防止生成有害或偏见内容
- 需要严格的输出格式或风格

> As a best practice, start by prioritizing instructions, clearly stating what you want the model to do and only use constraints when necessary for safety, clarity or specific requirements.

## 控制 Token 长度 / Control the Max Token Length

通过配置设置最大 token 限制，或在 prompt 中明确指定长度：

```
"Explain quantum physics in a tweet length message."
```

## 使用变量 / Use Variables in Prompts

使用变量让 prompt 可复用、更动态：

```
VARIABLES
{city} = "Amsterdam"

PROMPT
You are a travel guide. Tell me a fact about the city: {city}
```

> Variables can save you time and effort by allowing you to avoid repeating yourself. This makes a lot of sense when integrating prompts into your own applications.

## 尝试输入格式和写作风格 / Experiment with Formats & Styles

同一个目标可以用不同方式表述，效果各异：

| 类型 | 示例 |
|------|------|
| **Question** | What was the Sega Dreamcast and why was it revolutionary? |
| **Statement** | The Sega Dreamcast was a sixth-generation video game console... |
| **Instruction** | Write a single paragraph that describes the Sega Dreamcast... |

## 分类任务中混排类别 / Mix Up Classes for Few-shot

做分类任务时，确保 few-shot 示例中**混排不同的响应类别**，避免模型过拟合到示例顺序。如果所有正面示例在前、负面在后，模型可能学会的是"看位置分类"而非"看内容分类"。

> By mixing up the possible response classes, you can ensure that the model is learning to identify the key features of each class, rather than simply memorizing the order of the examples.

> A good rule of thumb is to start with 6 few shot examples and start testing the accuracy from there.

## 适应模型更新 / Adapt to Model Updates

关注模型架构变化、新增数据和能力。尝试新模型版本并调整 prompts 以利用新特性。

> It's important for you to stay on top of model architecture changes, added data, and capabilities. Try out newer model versions and adjust your prompts to better leverage new model features.

**Vertex AI Studio 的优势：** 可以保存 prompts，在不同模型版本上测试，追踪超链接，一键重新运行。

## 尝试输出格式 / Experiment with Output Formats

对于非创意类任务（提取、选择、解析、排序、分类），尝试让输出返回 JSON 或 XML：

> By prompting for a JSON format it forces the model to create a structure and limit hallucinations.

JSON 返回的额外好处：可以直接在应用中使用排序后的数据（对 datetime 对象特别有用），无需手动构造。

## Prompt 的完整生命周期 / The Prompt Lifecycle

一个好的 prompt 会经历完整的生命周期：

```
迭代测试 → 文档化 → 放入代码库 → 系统化运营 → 自动化测试 → 持续优化
```

### 1️⃣ 迭代测试（Iterative Testing）

在 Vertex AI Studio 等 playground 中反复测试。每次修改温度、采样参数、措辞、结构，记录结果。

### 2️⃣ 文档化尝试（Document the Attempts）

> We can't stress enough how important it is: document your prompt attempts in full detail so you can learn over time what went well and what did not.

Prompt outputs can differ across models, across sampling settings, and even across different versions of the same model. Moreover, even across identical prompts to the same model, small differences in output sentence formatting and word choice can occur (if two tokens have the same predicted probability, ties may be broken randomly).

**推荐的 Prompt 文档模板（源自白皮书 Table 21）：**

| 字段 | 值/说明 |
|------|---------|
| **Name** | `[name and version of your prompt]` |
| **Goal** | `[One sentence explanation of this attempt]` |
| **Model** | `[name and version of the used model]` |
| **Temperature** | `[value between 0–1]` |
| **Token Limit** | `[number]` |
| **Top-K** | `[number]` |
| **Top-P** | `[number]` |
| **Prompt** | `[Write all the full prompt]` |
| **Output** | `[Write out the output or multiple outputs]` |

此外建议追踪：
- **Prompt 版本**（迭代次数，如 v1、v2）
- **结果评估**（OK / NOT OK / SOMETIMES OK）
- **反馈备注**
- **Vertex AI Studio 保存链接** — 一键点击重新运行

### 3️⃣ 放入代码库（Take It to the Codebase）

> Once you feel the prompt is close to perfect, take it to your project codebase. And in the codebase, **save prompts in a separate file from code**, so it's easier to maintain.

**推荐做法：** 将 prompts 保存在独立的文件（如 YAML、JSON、或专用的 prompts 目录）中，与业务代码分离。这样非开发人员也能阅读和修改 prompts。

### 4️⃣ 运营化系统（Operationalized System）

> Ideally your prompts are part of an operationalized system, and as a prompt engineer you should rely on **automated tests and evaluation procedures** to understand how well your prompt generalizes to a task.

建立自动化测试流程，验证 prompt 在不同输入下的表现，确保模型升级或 prompt 修改不破坏已有功能。

### 5️⃣ 与 RAG 系统的集成

> When working on a **retrieval augmented generation (RAG) system**, you should also capture the specific aspects of the RAG system that impact what content was inserted into the prompt, including the query, chunk settings, chunk output, and other information.

如果你使用的是 RAG 系统（检索增强生成），还需要追踪：查询语句、分块设置（chunk settings）、分块输出等影响 prompt 中填充内容的因素。

## 与其他工程师协作 / Experiment Together

> If you are in a situation where you have to try to come up with a good prompt, you might want to find **multiple people to make an attempt**. When everyone follows the best practices, you are going to see a variance in performance between all the different prompt attempts.

多人分别尝试 → 对比性能差异 → 选取最优或融合。

## CoT 最佳实践 / CoT Best Practices

1. **答案放在推理之后：** 推理的生成会改变模型预测最终答案时的 tokens
2. **从 prompt 中分离提取最终答案：** 将推理与最终答案分开，便于程序化解析
3. **Temperature 设为 0：** CoT 基于贪婪解码，推理时通常只有一个正确答案

## 核心原则

> Prompt engineering is an iterative process. Craft and test different prompts, analyze, and document the results. Refine your prompt based on the model's performance. Keep experimenting until you achieve the desired output. When you change a model or model configuration, go back and keep experimenting with the previously used prompts.
