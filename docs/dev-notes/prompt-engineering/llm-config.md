---
sidebar_position: 3
tags: [ai, prompt-engineering, llm, temperature, sampling]
---

# LLM 输出配置 / LLM Output Configuration

选择合适的模型后，还需要调整 LLM 的各种配置参数。这些参数控制输出的质量和风格。

## 输出长度 / Output Length

生成的 token 数量是重要的配置选项。生成更多 tokens 需要更多计算，导致更高的能耗、更慢的响应时间和更高的成本。

> Reducing the output length doesn't cause the LLM to become more succinct in the output it creates — it just causes the LLM to stop predicting more tokens once the limit is reached.

对于某些技术（如 ReAct），输出长度限制尤为重要，因为 LLM 在生成完所需回复后还会继续输出无用的 tokens。

## 采样控制 / Sampling Controls

LLM 并不正式预测单个 token，而是为词汇表中的每个 token 预测概率，然后通过**采样**决定实际输出哪个 token。`Temperature`、`Top-K` 和 `Top-P` 是最常见的采样配置。

### Temperature（温度）

Temperature 控制 token 选择的随机程度。

| 设置 | 效果 |
|------|------|
| **Temperature = 0**（贪婪解码） | 确定性最高，始终选择概率最高的 token |
| **低 Temperature（0.1-0.3）** | 输出稳定、可预测，适合事实类任务 |
| **中 Temperature（0.5-0.8）** | 一些创造性，适合内容生成 |
| **高 Temperature（≥1）** | 高度随机、多样化，适合创意探索 |

> A temperature of 0 is deterministic: the highest probability token is always selected. Higher temperatures make a wider range of tokens more acceptable.

### Top-K

Top-K 采样从模型预测分布中选择概率最高的 K 个 tokens 作为候选。

| 设置 | 效果 |
|------|------|
| **Top-K = 1** | 等同于贪婪解码 |
| **较低的 Top-K** | 输出更克制、更事实性 |
| **较高的 Top-K** | 输出更有创意、更多样化 |

### Top-P（核心采样 / Nucleus Sampling）

Top-P 选择累积概率不超过 P 值的 tokens 作为候选。

| 设置 | 效果 |
|------|------|
| **Top-P = 0** | 贪婪解码 |
| **Top-P = 1** | 词汇表中所有 tokens 均为候选 |

> The best way to choose between top-K and top-P is to experiment with both methods (or both together) and see which one produces the results you are looking for.

## 综合运用 / Putting It All Together

当 temperature、top-K 和 top-P 同时可用时（如 Vertex AI Studio），处理流程为：

1. 同时满足 top-K 和 top-P 的 tokens 成为下一 token 的候选
2. Temperature 应用于这些候选 tokens 上进行采样

### 极端值相互抵消的关系

| 设置 | 效果 |
|------|------|
| Temperature = 0 | top-K 和 top-P 失效 |
| Temperature 极高（>10） | Temperature 失效，top-K/P 决定 |
| Top-K = 1 | Temperature 和 top-P 失效 |
| Top-P = 0（极低） | 仅最可能的 token 通过，Temperature 和 top-K 失效 |
| Top-P = 1 | 任何非零 token 都通过，无筛选效果 |

### 推荐的起始参数

| 场景 | Temperature | Top-P | Top-K |
|------|-------------|-------|-------|
| **一般场景（平衡）** | 0.2 | 0.95 | 30 |
| **创意场景** | 0.9 | 0.99 | 40 |
| **低创意场景** | 0.1 | 0.9 | 20 |
| **有唯一正确答案** | 0 | — | — |

> NOTE: With more freedom (higher temperature, top-K, top-P, and output tokens), the LLM might generate text that is less relevant.
