---
sidebar_position: 6
tags: [ai, prompt-engineering, code-generation, debugging]
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

## 多模态提示 / Multimodal Prompting

Multimodal prompting 指使用多种输入格式（文本、图像、音频、代码等）引导 LLM。这是一个独立的话题，本文主要聚焦于纯文本和代码提示。
