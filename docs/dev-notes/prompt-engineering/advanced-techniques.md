---
sidebar_position: 5
tags: [ai, prompt-engineering, chain-of-thought, react, self-consistency, tree-of-thoughts]
---

# 高级推理技术 / Advanced Reasoning Techniques

## Step-back Prompting（退一步提示）

Step-back prompting 是一种通过先让 LLM 考虑与任务相关的**更通用的问题**，然后将该通用答案作为后续 prompt 的上下文，来提高性能的技术。

> This "step back" allows the LLM to activate relevant background knowledge and reasoning processes before attempting to solve the specific problem.

**流程：**
1. 问一个通用/原则性问题 → 获取背景知识
2. 将通用答案作为上下文，回到原始任务

**Step-back 的额外好处：**

> It can help to mitigate biases in LLM responses, by focusing on general principles instead of specific details.

通过先聚焦通用原则而非具体细节，可以减少 LLM 回复中的偏见。

**示例：FPS 游戏关卡设计**

传统 prompt 的输出可能比较泛泛。先退一步问：

```
Based on popular first-person shooter action games, what are
5 fictional key settings that contribute to a challenging and
engaging level storyline in a first-person shooter video game?

→ 1. Abandoned Military Base
→ 2. Cyberpunk City
→ 3. Alien Spaceship
→ 4. Zombie-Infested Town
→ 5. Underwater Research Facility
```

然后将这些设定作为上下文重新提问，输出会更有深度。

## Chain of Thought（CoT，思维链）

Chain of Thought (CoT) prompting 是一种通过生成**中间推理步骤**来提高 LLM 的推理能力的技术。你可以将其与 few-shot 结合，在复杂推理任务上获得更好结果。

### CoT 的优势与劣势

| 优势 | 说明 |
|------|------|
| **低投入高效果** | 无需微调模型，直接用在现成 LLM 上 |
| **可解释性** | 可以看到 LLM 的推理步骤，出现问题可以定位 |
| **跨版本鲁棒性** | Chain of thought appears to improve robustness when moving between different LLM versions — prompt 在不同模型版本间的性能漂移更小 |
| **适用广泛** | 任何可以通过"逐步讲解"解决的问题都是 CoT 的候选：代码生成、合成数据、数学推理、逻辑分析 |

| 劣势 | 说明 |
|------|------|
| **成本更高** | 输出 token 数增加 → 预测成本上升 |
| **延迟更长** | 更多的 token 生成需要更多时间 |
| **需要解析** | 最终答案需要从推理过程中分离出来 |

> The LLM response includes the chain of thought reasoning, which means more output tokens, which means predictions cost more money and take longer.

### CoT 的常见应用场景

- **代码生成：** 将请求分解为几个步骤，映射到特定代码行
- **合成数据创建：** 给定一个 seed（如"产品叫 XYZ"），引导模型逐步写出描述
- **数学推理和逻辑分析**
- **任何你能够解释步骤去解决的问题**

> Generally, any task that can be solved by 'talking through' is a good candidate for a chain of thought. If you can explain the steps to solve the problem, try chain of thought.

### CoT 的关键原则

> For CoT prompting, **putting the answer after the reasoning is required** because the generation of the reasoning changes the tokens that the model gets when it predicts the final answer.

也就是说：推理在前，答案在后。推理步骤的生成会改变模型预测最终答案时看到的 tokens，所以必须先输出推理过程，再给出结论。

> With CoT and self-consistency you need to be able to extract the final answer from your prompt, separated from the reasoning.

**实践上需要能从输出中分离提取最终答案**，与推理过程分开。这通常意味着：答案在最后一行，或使用特定格式标记。

> For CoT prompting, set the temperature to 0. Chain of thought prompting is based on **greedy decoding**, predicting the next word in a sequence based on the highest probability. Generally speaking, when using reasoning to come up with the final answer, there's likely one single correct answer.

CoT 的温度应始终设为 **0**，因为推理场景通常只有一个正确答案，不需要随机性。

### Zero-shot CoT 示例

```
When I was 3 years old, my partner was 3 times my age.
Now, I am 20 years old. How old is my partner? Let's think step by step.

→ 1. When I was 3, my age was 3 years.
→ 2. My partner's age was 3 × 3 = 9 years.
→ 3. Now I am 20, which is an increase of 20 - 3 = 17 years.
→ 4. My partner's age increased by the same 17 years.
→ 5. My partner is now 9 + 17 = 26 years old.
```

> The magic phrase: **"Let's think step by step."**

### Few-shot CoT 示例

提供带有推理链的示例，引导模型按照类似方式思考：

```
Q: When my brother was 2 years old, I was double his age.
Now I am 40 years old. How old is my brother? Let's think step by step.
A: When my brother was 2 years, I was 2 × 2 = 4 years old.
That's an age difference of 2 years and I am older.
Now I am 40 years old, so my brother is 40 - 2 = 38 years old. The answer is 38.

Q: When I was 3 years old, my partner was 3 times my age.
Now, I am 20 years old. How old is my partner?
A:
```

## Self-consistency（自一致性）

Self-consistency 结合了**采样**和**多数投票**来生成多样化的推理路径并选择最一致的答案。

> Self-consistency gives a pseudo-probability likelihood of an answer being correct, but obviously has high costs.

**流程：**
1. **生成多样化推理路径：** 对同一 prompt 多次请求，使用高 temperature 鼓励不同的推理路径
2. **从每个响应中提取答案**
3. **选择最常见的答案**

**示例：邮件分类**

同一封含有安全漏洞提醒的邮件，LLM 在不同尝试中可能得出 IMPORTANT 或 NOT IMPORTANT。通过多次采样并取多数，可获得更一致的正确答案。

## Tree of Thoughts（ToT，思维树）

ToT 是 CoT 的泛化，允许 LLM 同时探索**多个不同的推理路径**，而不是只遵循单一的线性思维链。

```
思维链 (CoT):  → Step1 → Step2 → Step3 → 答案
思维树 (ToT):  → Step1 → [Step2a, Step2b, Step2c]
                 → [Step3...] → 评估 → 最优答案
```

> This approach makes ToT particularly well-suited for complex tasks that require exploration.

ToT 通过维护一棵"思维树"来工作，其中每个"思维"代表一个连贯的语言序列，是解决问题的中间步骤。模型可以从树的不同节点分支出不同的推理路径进行探索。

白皮书引用的相关 notebook（基于论文"Large Language Model Guided Tree-of-Thought"）提供了更多实现细节。

## ReAct（推理+行动）

ReAct（Reason & Act）是一种让 LLM 使用自然语言推理结合**外部工具**（搜索、代码解释器等）来解决复杂任务的范式。它是 **Agent 建模**的第一步。

> ReAct prompting is a paradigm for enabling LLMs to solve complex tasks using natural language reasoning combined with external tools, allowing the LLM to perform certain actions, such as interacting with external APIs to retrieve information which is a first step towards agent modeling.

### 工作原理

ReAct 模仿人类在现实世界中的运作方式——我们同时进行语言推理和行动获取信息。

> ReAct mimics how humans operate in the real world, as we reason verbally and can take actions to gain information.

**Thought-Action 循环：**
1. **Reason（推理）：** LLM 分析问题并生成行动计划
2. **Act（行动）：** 执行计划中的行动（如搜索 API）
3. **Observe（观察）：** 获取行动结果
4. **循环：** 用观察结果更新推理，生成新的行动计划
5. **直到：** 到达问题的解决方案

### Python 示例（使用 LangChain + VertexAI + SerpAPI）

```python
from langchain.agents import load_tools
from langchain.agents import initialize_agent
from langchain.agents import AgentType
from langchain.llms import VertexAI

prompt = "How many kids do the band members of Metallica have?"
llm = VertexAI(temperature=0.1)
tools = load_tools(["serpapi"], llm=llm)
agent = initialize_agent(tools, llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True)
agent.run(prompt)
```

### 执行过程

```
Metallica has 4 members.
→ Search: How many kids does James Hetfield have?  → 3
→ Search: How many kids does Lars Ulrich have?     → 3
→ Search: How many kids does Kirk Hammett have?    → 2
→ Search: How many kids does Robert Trujillo have? → 2
→ Final Answer: 10
```

### ReAct 实战注意事项

> ReAct prompting in practice requires understanding that you continually have to **resend the previous prompts/responses** (and do **trimming of the extra generated content**) as well as set up the model with appropriate examples/instructions.

| 挑战 | 说明 |
|------|------|
| **上下文管理** | 每次迭代需要重新发送历史 prompt/response |
| **内容修剪** | 需要裁剪 LLM 额外生成的无用 tokens |
| **Token 限制** | 长对话可能超过上下文窗口 |
| **提示框架** | 需要合适的示例和指令配置 |
| **输出长度限制** | 尤其重要——LLM 在生成完回复后还会继续输出无用的 tokens |

## Automatic Prompt Engineering（APE，自动提示工程）

APE 是用一个模型来**生成更多 prompts**，然后评估它们，筛选出最优的。

> This method not only alleviates the need for human input but also enhances the model's performance in various tasks.

**流程：**
1. 写一个 prompt 生成多个 prompt 变体
2. 按指标（如 BLEU、ROUGE）评分
3. 选择评分最高的候选 prompt
4. 可进一步调整和重新评估

**示例：为 T 恤商店生成客服对话变体**

```
Prompt: We have a band merchandise t-shirt webshop, and to train a
chatbot we need various ways to order: "One Metallica t-shirt size S".
Generate 10 variants with the same semantics but keep the same meaning.

→ I'd like to purchase a Metallica t-shirt in size small.
→ One Metallica shirt, size small, please.
→ Small Metallica t-shirt, one please.
→ ...
```

## 技术选型决策指南

| 场景 | 推荐技术 | 原因 |
|------|---------|------|
| 简单分类/提取 | Zero-shot | 无需示例，最轻量 |
| 需要特定输出格式 | Few-shot | 提供格式示例，模型模仿 |
| 需要遵守角色/风格 | Role prompting | 分配身份 → 风格一致 |
| 事实型问答 | System + 低 Temperature | 控制输出格式，减少幻觉 |
| 复杂推理 | CoT + Temperature=0 | 分步推理，提高正确率 |
| 需要高可靠性 | Self-consistency | 多次采样 + 多数投票 |
| 需要探索多种方案 | Tree of Thoughts | 多路径并行，选最优 |
| 需要外部信息检索 | ReAct | 结合 LLM + 外部工具 |
| 需要自动优化 prompts | APE | 让 LLM 自己写 prompts |
| 需要克服 LLM 偏见 | Step-back | 先通用 → 再具体 |
