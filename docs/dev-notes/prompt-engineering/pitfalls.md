---
sidebar_position: 9
tags: [ai, prompt-engineering, pitfalls, debugging, challenges]
---

# 常见陷阱与挑战 / Common Pitfalls & Challenges

> Inadequate prompts can lead to ambiguous, inaccurate responses, and can hinder the model's ability to provide meaningful output.

白皮书指出，很多因素都会影响 prompt 的效果：模型选择、训练数据、模型配置、用词选择、风格语气、结构和上下文。以下是常见的陷阱和应对方法。

## 1. 输出不够具体的陷阱

**问题：** Prompt 太笼统，LLM 给出泛泛而谈的回复。

**表现：** 内容宽泛、缺乏深度、无法直接使用。

**解决：** 使用 system prompting 或 contextual prompting 提供具体细节。指定输出长度、格式、角度。

```
❌ "Generate a blog post about video game consoles."
✅ "Generate a 3 paragraph blog post about the top 5 video game
   consoles. The blog post should be informative and engaging,
   and it should be written in a conversational style. Only
   discuss the console, the company who made it, the year, and
   total sales."
```

## 2. 零样本失败的陷阱

**问题：** 只用文字描述任务而没有示例，模型不理解你期望的输出格式。

**表现：** 输出结构与预期不符，格式混乱。

**解决：** 提供 one-shot 或 few-shot 示例。示例应该多样化、高质量、包含边界情况。

> When zero-shot doesn't work, you can provide demonstrations or examples in the prompt, which leads to "one-shot" and "few-shot" prompting.

## 3. 约束过多的陷阱

**问题：** 用大量"不要"开头的约束限制模型，而不是告诉它应该怎么做。

**表现：** 模型困惑、输出质量下降。

**解决：** 优先使用正向指令（instructions）而非负向约束（constraints）。

```
❌ "Do not list video game names. Do not include pricing."
✅ "Only discuss the console, the company who made it, the year,
   and total sales."
```

> Growing research suggests that focusing on positive instructions in prompting can be more effective than relying heavily on constraints.

## 4. 数学与推理失败的陷阱

**问题：** LLM 在数学计算和逻辑推理上经常出错——即使是最简单的乘法。

**原因：** LLM 训练于大量文本数据，数学推理需要不同的处理方式。

> LLMs often struggle with mathematical tasks and can provide incorrect answers — even for a task as simple as multiplying two numbers.

**解决：** 使用 Chain of Thought prompting + Temperature = 0。

```
❌ "When I was 3, my partner was 3 times my age. Now I am 20.
    How old is my partner?"  → 63 (错误)
✅ 加上 "Let's think step by step." → 26 (正确)
```

## 5. 配置参数不当的陷阱

| 参数 | 设错的风险 |
|------|-----------|
| **Temperature 太高** | 输出随机、离题、不可靠 |
| **Temperature = 0 但期望创造力** | 输出死板、缺乏多样性 |
| **Token Limit 太低** | 输出截断、不完整 |
| **Token Limit 太高** | 成本增加、延迟增加 |
| **不设采样参数** | 使用默认值可能导致意外的创造性 |

> With more freedom (higher temperature, top-K, top-P, and output tokens), the LLM might generate text that is less relevant.

**推荐策略：** 先确定任务的"确定性需求"，再从推荐的起始参数开始调整。

## 6. 示例质量陷阱

**问题：** few-shot 示例包含错误、不一致或缺乏多样性。

**表现：** 模型学习到错误的模式，输出质量下降。

> One small mistake can confuse the model and will result in undesired output.

**关键原则：**
- 示例必须与目标任务相关
- 示例必须高质量、无错误
- 示例必须多样化（包含边界情况）
- 分类任务中混排各类别

## 7. 忽视模型差异的陷阱

**问题：** 为一个模型优化的 prompt 不经测试就用在另一个模型上。

**表现：** 输出质量显著下降。

**原因：** 不同模型（Gemini / GPT / Claude / Gemma / LLaMA）的训练数据、架构和参数配置方式不同。

> Prompts might need to be optimized for your specific model. When you change a model or model configuration, go back and keep experimenting with the previously used prompts.

## 8. 不记录 Prompt 版本的陷阱

**问题：** 只在脑子里记着哪个 prompt 好用，没有系统记录。

**后果：** 几周后完全记不住当初的参数和理由。

> You'd be surprised how much you can forget after just a short break.

**解决：** 使用模板记录每次 prompt 尝试（名称、目标、模型、参数、完整 prompt、输出）。

## 9. CoT 的代价与取舍

**优点：**
- 低投入高效果，无需微调
- 可解释性强（能看到推理步骤）
- 在模型版本升级时表现更稳定

**缺点：**
- 输出 token 更多 → 成本更高、延迟更长
- 需要从输出中解析最终答案

> The LLM response includes the chain of thought reasoning, which means more output tokens, which means predictions cost more money and take longer.

## 10. ReAct 的额外陷阱

ReAct 需要持续重新发送之前的 prompt/response 到模型中，并**修剪额外生成的内容**。

> ReAct prompting in practice requires understanding that you continually have to resend the previous prompts/responses (and do trimming of the extra generated content) as well as set up the model with appropriate examples/instructions.

## 调试 checklist

当 prompt 效果不理想时，按以下顺序检查：

```
□ 1. Temperature 设置是否正确？（事实任务=0，创意任务=0.9）
□ 2. Token Limit 是否足够？
□ 3. 有提供 few-shot 示例吗？
□ 4. 示例质量高吗？有边界情况吗？
□ 5. 是正向指令多还是负向约束多？
□ 6. 输出格式是否明确指定了？
□ 7. 这个 prompt 在别的模型上试过吗？
□ 8. 有无记录版本，方便回退？
□ 9. 需要 CoT / step-back 等高级技术吗？
□ 10. 参数是否设在极端值导致相互抵消？（见 LLM 配置页）
```
