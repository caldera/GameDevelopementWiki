---
sidebar_position: 6
tags: [ai, prompt-engineering, code-generation, debugging, json]
---

# 代码提示 / Code Prompting

Gemini（和其他 LLM）同样适用于代码相关的任务。作为开发者，这些技术可以显著提高编码效率。

## 编写代码 / Writing Code

让 LLM 根据需求生成代码片段。

**示例：Bash 脚本批量重命名文件**

| 设置 | 值 |
|------|-----|
| Model | gemini-pro |
| Temperature | 0.1 |
| Token Limit | 1024 |

```
Write a code snippet in Bash, which asks for a folder name.
Then it takes the contents of the folder and renames all the
files inside by prepending the name draft to the file name.
```

```bash
#!/bin/bash
echo "Enter the folder name: "
read folder_name
if [ ! -d "$folder_name" ]; then
    echo "Folder does not exist."
    exit 1
fi
files=( "$folder_name"/* )
for file in "${files[@]}"; do
    new_file_name="draft_$(basename "$file")"
    mv "$file" "$new_file_name"
done
echo "Files renamed successfully."
```

> Since LLMs can't reason, and repeat training data, **it's essential to read and test your code first.**

**白皮书的测试过程：**
1. 复制输出（去掉 ``` 包裹）
2. 保存到文件：`rename_files.sh`
3. 用测试文件夹验证：`./rename_files.sh` → 输入测试目录 → 检查文件是否被正确重命名
4. 验证结果：所有文件正确重命名为 `draft_filename.txt`

## 解释代码 / Explaining Code

让 LLM 解释他人（或自己以前写）的代码。

```
Explain to me the below Bash code:
[code snippet without comments]
```

**输出示例：**
- **User Input**: 提示用户输入文件夹名称
- **Folder Existence Check**: 检查文件夹是否存在
- **File Listing**: 列出文件夹下所有文件
- **File Renaming**: 遍历每个文件并重命名
- **Success Message**: 输出成功消息

## 翻译代码 / Translating Code

将代码从一种语言翻译到另一种。

**示例：Bash → Python**

```
Translate the below Bash code to a Python snippet.
```

> NOTE: When prompting for Python code in Vertex AI Studio, click the 'Markdown' button. Otherwise you will receive plain text which is missing proper indenting.

## 调试和审查代码 / Debugging & Reviewing Code

将错误信息和代码一起作为 prompt 输入，让 LLM 诊断并修复。

**示例：传入错误信息**

```
The below Python code gives an error:
Traceback (most recent call last):
  File "rename_files.py", line 7, in <module>
    text = toUpperCase(prefix)
NameError: name 'toUpperCase' is not defined

Debug what's wrong and explain how I can improve the code.
```

**LLM 不仅修正了错误**（`toUpperCase` → `prefix.upper()`），还额外提供了：
1. 保留文件扩展名
2. 处理文件夹名中的空格
3. 使用 f-string 提高可读性
4. 添加 try...except 错误处理

> That's great. Not only did it tell me how to solve the problem, it also figured out that my code had more bugs and how to solve them, too.

## JSON 输出模式 / JSON Output Patterns

对于非创意类代码任务（提取、选择、解析、排序、分类），要求模型返回 **JSON 格式** 有显著优势。

**示例：电影评论分类返回 JSON**

```
Classify movie reviews as positive, neutral or negative. Return valid JSON:

Schema:
MOVIE: {
  "sentiment": String "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "name": String
}
MOVIE REVIEWS: {
  "movie_reviews": [MOVIE]
}

JSON Response:
```

```json
{
  "movie_reviews": [
    {
      "sentiment": "NEGATIVE",
      "name": "Her"
    }
  ]
}
```

**JSON 输出的三大好处：**

| 好处 | 说明 |
|------|------|
| **结构化** | 强迫模型生成有结构的内容，便于下游处理 |
| **排序返回** | In a real-world application I don't need to manually create this JSON format, I can already return the data in a sorted order (very handy when working with datetime objects) |
| **抑制幻觉** | By prompting for a JSON format it forces the model to create a structure and limit hallucinations |

## 代码提示的关键原则

| 原则 | 说明 |
|------|------|
| **指定语言和版本** | "Write a Bash script" / "Translate to Python 3.11" |
| **低 Temperature** | 代码生成使用 0.1 或更低，确保确定性输出 |
| **去掉 Markdown 包裹** | 使用前去掉 ``` 标记，避免运行时错误 |
| **先在测试环境运行** | 永远不要在生产环境直接运行生成的代码 |
| **用错误信息做 prompt** | 将 traceback 粘贴到 prompt 中，让 LLM 提供修复 |
| **要求解释改进** | 不仅修复错误，还让 LLM 说明为什么和如何改进 |

## 多模态提示 / Multimodal Prompting

> Prompting for code still uses the same regular large language model. Multimodal prompting is a separate concern, it refers to a technique where you use multiple input formats to guide a large language model, instead of just relying on text. This can include combinations of text, images, audio, code, or even other formats, depending on the model's capabilities and the task at hand.

多模态提示是独立的话题，本文聚焦于纯文本和代码提示。多模态场景下你可以结合：
- **文本 + 图片**：截图 + "解释这段代码"
- **文本 + 代码**：已有代码 + "添加功能 X"
- **文本 + 音频**：语音描述 + "写实现代码"
