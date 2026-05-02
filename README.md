# Seedance Web

本地单用户 Seedance 2.0 视频生成控制台。应用通过 New API / OpenAI 兼容中转地址调用 `doubao-seedance-2.0`，创建视频生成任务并把生成结果下载到本地目录。

## 功能

- 文生视频表单：prompt、negative prompt、时长、比例、清晰度、seed、原生音频开关。
- Seedance 2.0 多镜头提示词模板。
- 支持配置 Base URL、模型名、落盘目录。
- 任务状态轮询、视频预览、本地文件定位、复制路径、删除记录/文件。
- 自动记录 `.metadata.json`，包含提示词、参数、远程 URL 与本地路径。

## 快速开始

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local，填入你的 New API Key
npm run dev
```

打开 <http://localhost:3000>。

默认配置：

```env
SEEDANCE_BASE_URL=https://api.zscc.in/v1
SEEDANCE_MODEL=doubao-seedance-2.0
SEEDANCE_API_KEY=sk-your-key-here
```

## 接口适配说明

应用会优先尝试官方任务格式：

```http
POST /api/v3/contents/generations/tasks
GET  /api/v3/contents/generations/tasks/{task_id}
```

如果失败，会回退尝试 New API 的 OpenAI 风格视频接口：

```http
POST /v1/video/generations
```

如果你的 New API 对 Seedance 2.0 暴露了不同路径，可在页面的“端点模式”中固定一种模式，或调整 `app/lib/seedance.ts` 中的路径常量。

## 本地文件

默认输出目录为：

```text
./outputs/videos
```

每个成功下载的视频旁边会生成同名 `.metadata.json`。`outputs/` 已加入 `.gitignore`。

## 安全注意

- 不要提交 `.env.local`。
- 不要提交生成视频或临时 API Key。
- 页面中的临时 API Key 只用于当前请求，不会写入历史数据库。

## 发布检查

```bash
npm run build
git status --short
```
