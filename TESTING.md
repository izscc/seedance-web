# 测试记录

日期：2026-05-02

## 通过

- `npm install` 成功。
- `npm run build` 成功。
- `npm run dev` 成功启动：`http://localhost:3000`。
- 首页 HTTP 访问返回 `200 OK`。

## Seedance API 连通性

使用用户提供的临时 key 对 `https://api.zscc.in/v1/video/generations` 发起最小文生视频请求，New API 网关可达，但上游返回：

```json
{"code":"do_request_failed","message":"do request failed: upstream error: do request failed","data":null}
```

同时尝试官方任务路径 `/api/v3/contents/generations/tasks`，New API 返回 Invalid URL。当前应用已经实现双路径适配：官方任务接口优先，失败后回退 New API `/v1/video/generations`；待中转服务侧完成 Seedance 官方任务路径或视频模型路由配置后，Web 端无需大改即可复测。
