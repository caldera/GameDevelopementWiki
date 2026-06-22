---
sidebar_position: 7
tags: [ai, prompt-engineering, best-practices, tips]
---

# 最佳实践 / Best Practices

> Finding the right prompt requires tinkering. Vertex AI Studio is a perfect place to play around with your prompts.

## 提供示例 / Provide Examples

> The most important best practice is to provide (one shot / few shot) examples within a prompt.

示例充当了强大的教学工具，为模型提供参考点或目标。示例应该：
- 与目标任务相关
- 多样化、高质量、编写良好
- 包含边界情况

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

**约束仍有价值的情况：**
- 防止生成有害或偏见内容
- 需要严格的输出格式或风格

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

## 尝试输入格式和写作风格 / Experiment with Formats & Styles

同一个目标可以用不同方式表述，效果各异：

| 类型 | 示例 |
|------|------|
| **Question** | What was the Sega Dreamcast and why was it revolutionary? |
| **Statement** | The Sega Dreamcast was a sixth-generation video game console... |
| **Instruction** | Write a single paragraph that describes the Sega Dreamcast... |

## 分类任务中混排类别 / Mix Up Classes for Few-shot

做分类任务时，确保 few-shot 示例中混排不同的响应类别，避免模型过拟合到示例顺序。

> A good rule of thumb is to start with 6 few shot examples and start testing the accuracy from there.

## 适应模型更新 / Adapt to Model Updates

关注模型架构变化、新增数据和能力。尝试新模型版本并调整 prompts 以利用新特性。

## 尝试输出格式 / Experiment with Output Formats

对于非创意类任务（提取、选择、解析、排序、分类），尝试让输出返回 JSON 或 XML：

> By prompting for a JSON format it forces the model to create a structure and limit hallucinations.

## 与其他工程师合作 / Experiment Together

多人遵循最佳实践各自尝试，然后比较不同 prompt 方案之间的性能差异。

## CoT 最佳实践 / CoT Best Practices

1. **答案放在推理之后：** 推理的生成会改变模型预测最终答案时的 tokens
2. **从 prompt 中分离提取最终答案：** 将推理与最终答案分开
3. **Temperature 设为 0：** CoT 基于贪婪解码，推理时通常只有一个正确答案

## 文档化每次尝试 / Document the Various Prompt Attempts

> We can't stress enough how important it is: document your prompt attempts in full detail so you can learn over time what went well and what did not.

**推荐的 Prompt 文档模板：**

| 字段 | 说明 |
|------|------|
| **Name** | prompt 的名称和版本号 |
| **Goal** | 该次尝试的一句话目标说明 |
| **Model** | 使用的模型名称和版本 |
| **Temperature** | Temperature 值 |
| **Token Limit** | Token 限制数 |
| **Top-K / Top-P** | 采样参数 |
| **Prompt** | 完整的 prompt 文本 |
| **Output** | 输出结果（或多个输出） |

此外建议追踪：
- Prompt 版本（迭代次数）
- 结果是否 OK / NOT OK / SOMETIMES OK
- 反馈备注
- 在 Vertex AI Studio 中的保存链接

> Prompt engineering is an iterative process. Craft and test different prompts, analyze, and document the results. Refine your prompt based on the model's performance. Keep experimenting until you achieve the desired output.
