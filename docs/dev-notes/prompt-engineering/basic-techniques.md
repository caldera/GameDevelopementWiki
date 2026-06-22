---
sidebar_position: 4
tags: [ai, prompt-engineering, zero-shot, few-shot, system-prompt, role-prompt]
---

# 基础提示技术 / Basic Prompting Techniques

## Zero-shot（零样本提示）

Zero-shot prompt 是最简单的提示类型，只提供任务描述和一些文本让 LLM 开始生**成。**名称中的 zero-shot 表示"没有示例"。

**何时使用：** 任务简单明确，模型可以轻松理解时。

**示例：电影评论分类**

| 设置 | 值 |
|------|-----|
| Model | gemini-pro |
| Temperature | 0.1 |
| Top-P | 1 |

```
Classify movie reviews as POSITIVE, NEUTRAL or NEGATIVE.
Review: "Her" is a disturbing study revealing the direction
humanity is headed if AI is allowed to keep evolving,
unchecked. I wish there were more movies like this masterpiece.
Sentiment:

→ POSITIVE
```

> When zero-shot doesn't work, you can provide demonstrations or examples in the prompt, which leads to "one-shot" and "few-shot" prompting.

## One-shot & Few-shot（单样本/少样本提示）

提供示例帮助模型理解任务。**One-shot** 提供一个示例，**Few-shot** 提供多个示例，展示模型需要遵循的模式。

**关键原则：**
- 至少使用 3-5 个示例用于 few-shot
- 使用与目标任务相关的、高质量的、多样化的示例
- 包含边界情况（edge cases）以提高鲁棒性
- 一个小错误就可能误导模型

**示例：解析披萨订单为 JSON**

```
Parse a customer's pizza order into valid JSON:

EXAMPLE:
I want a small pizza with cheese, tomato sauce, and pepperoni.
JSON Response:
{
  "size": "small",
  "type": "normal",
  "ingredients": [["cheese", "tomato sauce", "peperoni"]]
}

EXAMPLE:
Can I get a large pizza with tomato sauce, basil and mozzarella
{
  "size": "large",
  "type": "normal",
  "ingredients": [["tomato sauce", "bazel", "mozzarella"]]
}

Now, I would like a large pizza, with the first half cheese and
mozzarella. And the other tomato sauce, ham and pineapple.
JSON Response:

→ {"size": "large", "type": "half-half", "ingredients": [["cheese","mozzarella"],["tomato sauce","ham","pineapple"]]}
```

## System / Contextual / Role Prompting（系统/上下文/角色提示）

这三种技术有不同的关注点，但可以组合使用：

| 类型 | 作用 | 英文 |
|------|------|------|
| **System Prompt** | 定义模型的整体目的和基本能力 | "providing an additional task to the system" |
| **Contextual Prompt** | 提供当前任务的具体细节或背景 | "provides immediate, task-specific information" |
| **Role Prompt** | 为模型分配特定的角色或身份 | "frames the model's output style and voice" |

### System Prompt 示例：限制输出格式

```
Classify movie reviews as positive, neutral or negative. Only
return the label in uppercase.
Review: "Her" is a disturbing study...
Sentiment:

→ NEGATIVE
```

### System Prompt 示例：返回 JSON

```
Classify movie reviews as positive, neutral or negative. Return valid JSON:

Schema:
MOVIE: { "sentiment": String "POSITIVE"|"NEGATIVE"|"NEUTRAL", "name": String }
MOVIE REVIEWS: { "movie_reviews": [MOVIE] }

JSON Response:

→ {"movie_reviews": [{"sentiment": "NEGATIVE", "name": "Her"}]}
```

> By prompting for a JSON format it forces the model to create a structure and limit hallucinations.

### Role Prompt 示例：旅行向导

```
I want you to act as a travel guide. I will write to you about
my location and you will suggest 3 places to visit near me.
My suggestion: "I am in Amsterdam and I want to visit only museums."

Travel Suggestions:
→ 1. Rijksmuseum: ... 2. Van Gogh Museum: ... 3. Stedelijk Museum ...
```

**角色风格选项：**
Confrontational, Descriptive, Direct, Formal, Humorous, Influential, Informal, Inspirational, Persuasive

### Contextual Prompt 示例：为文章推荐主题

```
Context: You are writing for a blog about retro 80's arcade video games.
Suggest 3 topics to write an article about with a few lines of
description of what this article should contain.

→ 1. The Evolution of Arcade Cabinet Design...
→ 2. Blast From The Past: Iconic Arcade Games of The 80's...
→ 3. The Rise and Retro Revival of Pixel Art...
```

> Distinguishing between system, contextual, and role prompts provides a framework for designing prompts with clear intent.
