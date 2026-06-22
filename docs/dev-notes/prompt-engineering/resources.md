---
sidebar_position: 8
tags: [ai, prompt-engineering, references, gemini, resources]
---

# 参考资料与扩展阅读 / References & Resources

本页面汇总了白皮书中引用的所有资源，以及各模型的对比信息。

## 白皮书原文资源

白皮书中引用的 Google 官方资源：

| # | 资源 | 链接 |
|---|------|------|
| 1 | Gemini by Google | https://gemini.google.com |
| 2 | Gemini for Google Workspace Prompt Guide | https://inthecloud.withgoogle.com/gemini-for-google-workspace-prompt-guide/ |
| 3 | Google Cloud — Introduction to Prompting | https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/introduction-prompt-design |
| 4 | Google Cloud — Top-P & Top-K Sampling | https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/text#request_body |
| 6 | Google Cloud Model Garden | https://cloud.google.com/model-garden |
| 10 | CoT & ReAct Notebook (GitHub) | https://github.com/GoogleCloudPlatform/generative-ai/blob/main/language/prompts/examples/chain_of_thought_react.ipynb |
| 14 | Advanced Prompting: CoT & ReAct (GitHub) | https://github.com/GoogleCloudPlatform/applied-ai-engineering-samples/blob/main/genai-on-vertex-ai/advanced_prompting_training/cot_react.ipynb |

## 学术论文索引

白皮书中引用的核心论文：

| 技术 | 论文 | 链接 |
|------|------|------|
| **Zero-shot** | Wei, J., et al. (2023) — Fine-Tuned Language Models are Zero-Shot Learners | https://arxiv.org/pdf/2109.01652.pdf |
| **Few-shot** | Brown, T., et al. (2023) — Language Models are Few-Shot Learners | https://arxiv.org/pdf/2005.14165.pdf |
| **Step-back** | Zheng, L., et al. (2023) — Take a Step Back: Evoking Reasoning via Abstraction in LLMs | https://openreview.net/pdf?id=3bq3jsvcQ1 |
| **Chain of Thought** | Wei, J., et al. (2023) — Chain-of-Thought Prompting Elicits Reasoning in Large Language Models | https://arxiv.org/pdf/2201.11903.pdf |
| **Self-consistency** | Wang, X., et al. (2023) — Self-Consistency Improves Chain of Thought Reasoning in LLMs | https://arxiv.org/pdf/2203.11171.pdf |
| **Tree of Thoughts** | Yao, S., et al. (2023) — Tree of Thoughts: Deliberate Problem Solving with LLMs | https://arxiv.org/pdf/2305.10601.pdf |
| **ReAct** | Yao, S., et al. (2023) — ReAct: Synergizing Reasoning and Acting in Language Models | https://arxiv.org/pdf/2210.03629.pdf |
| **APE** | Zhou, C., et al. (2023) — Large Language Models are Human-Level Prompt Engineers | https://arxiv.org/pdf/2211.01910.pdf |

## 模型对比 / Model Comparison

白皮书指出，prompt engineering 的方法虽然通用，但不同模型各有特点：

> Prompts might need to be optimized for your specific model, regardless of whether you use Gemini language models in Vertex AI, GPT, Claude, or an open source model like Gemma or LLaMA.

| 模型 | 提供商 | 特点 |
|------|--------|------|
| **Gemini** (Vertex AI) | Google Cloud | 白皮书使用的主要模型，可通过 API 或 Vertex AI Studio 访问完整配置参数 |
| **Gemini** (chatbot) | Google | 消费者版聊天机器人，**不提供** temperature 等参数配置 |
| **GPT** | OpenAI | 参数配置方式类似，prompt 技术通用 |
| **Claude** | Anthropic | 强调安全性和长上下文 |
| **Gemma** | Google | 开源轻量模型，可在本地部署 |
| **LLaMA** | Meta | 开源模型，社区活跃 |

> **关键区别：** Vertex AI Studio (for Language) provides a playground to test prompts with the ability to configure temperature, top-K, top-P, and token limits. 消费者聊天机器人（如 Gemini chatbot）则没有这些配置选项。

## Vertex AI Studio 速查

白皮书中提到的 Vertex AI Studio 是 Google Cloud 提供的 Prompt 实验平台。

| 功能 | 说明 |
|------|------|
| **Playground** | 可视化测试 prompt 的环境 |
| **模型选择** | 可在不同模型和版本间切换 |
| **参数配置** | Temperature、Top-K、Top-P、Token Limit |
| **保存和版本管理** | 保存 prompt 及其版本，生成可分享链接 |
| **Markdown 模式** | 代码输出时确保缩进正确（对 Python 尤其重要） |

> If you're lucky enough to be using Vertex AI Studio, save your prompts (using the same name and version as listed in your documentation) and track the hyperlink to the saved prompt in the table. This way, you're always one click away from re-running your prompts.

## Prompt 文档表模板

白皮书通篇使用统一的表格格式来记录 prompt。这个格式本身就是一种最佳实践：

```
Name:    [名称和版本号]
Goal:    [一句话目标]
Model:   [模型名称和版本]
Temperature: [0–1]   Token Limit: [数字]
Top-K:   [数字]       Top-P: [数字]

Prompt:
[完整的 prompt 文本]

Output:
[输出结果]
```

**白皮书强调：** The table format as used below is a great way of documenting prompts. Your prompts will likely go through many iterations before they end up in a codebase, so it's important to keep track of your prompt engineering work in a disciplined, structured way.
