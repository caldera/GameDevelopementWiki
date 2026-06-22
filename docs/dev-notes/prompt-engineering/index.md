---
sidebar_position: 2
tags: [ai, prompt-engineering, llm, gemini, best-practices]
---

# Google Prompt Engineering 指南

**来源：** Google Prompt Engineering Whitepaper（2024）  
**作者：** Lee Boonstra  
**本文翻译、整理自 Google 官方白皮书，中英对照，涵盖所有核心 Prompt 技术与最佳实践。**

Prompt Engineering（提示工程）是指设计和优化输入提示（prompt）以引导大语言模型（LLM）产生准确输出的一整套方法论。你不需要是数据科学家或机器学习工程师——每个人都可以写 prompt，但要写出高效的 prompt 则需要系统性的技巧。

## 章节导航

| # | 章节 | 内容 |
|---|------|------|
| 1 | [LLM 输出配置](llm-config) | Temperature / Top-K / Top-P / Token 长度 |
| 2 | [基础提示技术](basic-techniques) | Zero-shot / Few-shot / System / Role / Contextual Prompting |
| 3 | [高级推理技术](advanced-techniques) | Step-back / Chain of Thought / Self-consistency / Tree of Thoughts / ReAct / APE |
| 4 | [代码提示](code-prompting) | 编写/解释/翻译/调试代码的 Prompt 技术 |
| 5 | [最佳实践](best-practices) | 提供示例、简洁设计、明确输出、指令优先、文档化迭代 |

## 什么是 Prompt Engineering？

> 当你写一个 prompt 时，你是在试图设置 LLM 去预测正确的 token 序列。Prompt engineering 就是设计高质量 prompts 的过程，引导 LLMs 产生精确输出。

一个 prompt 可以用于各种理解和生成任务：文本摘要、信息提取、问答、文本分类、翻译、代码生成、代码文档、推理等。

除了 prompt 本身，你还需要调整 LLM 的各种**配置参数**，以及选择合适的**提示技术**。

---

*本文内容基于 Google Prompt Engineering Whitepaper，适用于 Gemini、GPT、Claude、Gemma、LLaMA 等各种模型。*
