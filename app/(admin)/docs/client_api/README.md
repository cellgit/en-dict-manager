# 客户端 API 参考

> 更新时间：2025-10-03

本文汇总词汇管理后台目前公开的 HTTP 接口，适用于客户端（Web、移动端、自动化脚本）对接。

## 基础约定

- **Base URL**：`/api`
- **版本前缀**：主要业务接口位于 `/api/v1/*`
- **鉴权**：当前版本未启用额外鉴权，未来扩展可接入 Token 或 API Key。
- **统一响应格式**：所有接口均返回如下结构，其中 `code` 与 HTTP 状态码保持一致，`message` 提供人类可读说明。

```json
{
  "code": 200,
  "data": {},
  "message": "成功"
}
```

- **错误处理**：
  - `400`：请求体解析失败。
  - `404`：资源不存在。
  - `409`：业务冲突，例如删除仍有关联词条的词书。
  - `422`：参数校验失败，`data` 字段会包含 Zod issues。
  - `500`：服务器内部错误。

---

## 词书管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/books` | 获取全部激活词书（含词条统计）。|
| POST | `/api/v1/books` | 新建词书。|
| GET | `/api/v1/books/{bookId}` | 根据业务 ID 获取词书详情。|
| PUT | `/api/v1/books/{bookId}` | 更新词书信息。|
| DELETE | `/api/v1/books/{bookId}` | 删除词书（需确保无关联词条）。|
| GET | `/api/v1/books/{bookId}/words` | 分页获取指定词书下的词条。|
| DELETE | `/api/v1/books/{bookId}/words` | 删除指定词书下的所有词条。|

### GET `/api/v1/books`
- **查询参数**：无。
- **响应示例**：

```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "uuid",
        "bookId": "PEPXiaoXue3_1",
        "name": "PEP 小学三年级上册",
        "wordCount": 1200,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-08T10:00:00.000Z"
      }
    ],
    "total": 1
  },
  "message": "成功"
}
```

### POST `/api/v1/books`
- **请求体**：

```json
{
  "bookId": "Oxford-01",
  "name": "牛津英语·Starter",
  "description": "牛津英语 Starter 版词汇",
  "isActive": true
}
```

- **响应体**：返回新建词书的完整信息。

### GET `/api/v1/books/{bookId}`
- **路径参数**：`bookId`（业务 ID）。
- **响应体**：返回单词书详情。

### PUT `/api/v1/books/{bookId}`
- **请求体**：与创建类似，字段均为可选，用于部分更新。
- **响应体**：更新后的词书详情。

### DELETE `/api/v1/books/{bookId}`
- **作用**：删除词书。若仍有关联词条将返回 `409`。
- **响应体**：`{"success": true}`。

### GET `/api/v1/books/{bookId}/words`
- **查询参数**：
  - `page`（可选，默认 1）
  - `pageSize`（可选，默认 20，最大 100）
  - `query`（可选，词头模糊匹配）
- **响应体**：包含分页信息与词条列表。

### DELETE `/api/v1/books/{bookId}/words`
- **作用**：清空指定词书下所有词条。
- **响应体**：`{"deletedCount": number}`。

---

## 单词管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/words` | 分页检索词条。|
| POST | `/api/v1/words` | 创建新词条。|
| GET | `/api/v1/words/{id}` | 获取词条详情。|
| PUT | `/api/v1/words/{id}` | 更新词条。|
| DELETE | `/api/v1/words/{id}` | 删除词条。|

### GET `/api/v1/words`
- **查询参数**：
  - `query`（可选，词头模糊搜索）
  - `bookId`（可选，过滤指定词书）
  - `page`、`pageSize`
  - `exact`（可选，`true`/`false`。不传时接口会先尝试大小写不敏感的精确匹配，若命中则直接返回单词详情，否则回退到模糊搜索）
- **响应体**：分页结果，包含 `items`、`total`、`page`、`pageSize`。

### POST `/api/v1/words`
- **请求体**：`normalizedWordSchema` 结构，例如：

```json
{
  "word": {
    "headword": "abandon",
    "bookId": "Oxford-01",
    "definitions": [
      {
        "pos": "v.",
        "tranCn": "放弃",
        "descCn": "停止计划或行动",
        "tranOther": null,
        "examples": [
          {
            "source": "They had to abandon the project.",
            "translation": "他们不得不放弃该项目。"
          }
        ]
      }
    ],
    "synonymGroups": [],
    "phrases": [],
    "relatedWords": []
  }
}
```

- **响应体**：新建词条的完整详情。

> ℹ️ 音频字段 `audioUs` / `audioUk` 由服务端根据词头自动生成链接 `https://dict.youdao.com/dictvoice?audio=单词&type={1|2}`，无需在请求体中显式提供。

### GET `/api/v1/words/{id}`
- **路径参数**：`id`（词条 UUID）。
- **响应体**：词条详情（含释义、例句、短语、同义词组等）。

### PUT `/api/v1/words/{id}`
- **请求体**：与创建结构一致。
- **响应体**：更新后的词条详情。

### DELETE `/api/v1/words/{id}`
- **作用**：删除目标词条。
- **响应体**：`{"success": true}`。

---

## 批量导入

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/v1/imports/dry-run` | 仅校验导入数据，不写库。|
| POST | `/api/v1/imports` | 正式导入，写入数据库并生成日志。|

### 公共请求体

```json
{
  "words": [
    {
      "headword": "abandon",
      "bookId": "PEPXiaoXue3_1",
      "definitions": [
        {
          "pos": "v.",
          "tranCn": "放弃；抛弃",
          "descCn": null,
          "tranOther": null
        }
      ]
    }
  ],
  "sourceName": "Oxford Sheet"
}
```

### Dry Run `/api/v1/imports/dry-run`
- **作用**：校验结构、归一化数据，返回导入摘要。
- **响应示例**：

```json
{
  "code": 200,
  "data": {
    "total": 10,
    "success": 8,
    "skipped": 2,
    "failed": 0,
    "errors": [
      {
        "index": 1,
        "headword": "abandon",
        "reason": "headword/bookId 重复",
        "status": "skipped"
      }
    ]
  },
  "message": "校验完成"
}
```

### 正式导入 `/api/v1/imports`
- **作用**：写库并生成导入批次、日志。
- **响应示例**：在 Dry Run 返回字段基础上新增 `batchId`。

---

## 工具接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/clean-data` | 清洗第三方词典 JSON，返回规范化结果。|

### POST `/api/clean-data`
- **请求体**：

```json
{
  "rawData": "[{\"head_word\":\"ruler\"}]"
}
```

- **响应体**：

```json
{
  "code": 200,
  "data": {
    "success": true,
    "cleaned": [],
    "logs": []
  },
  "message": "成功"
}
```

---

## 文档导出

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/swagger` | 下载 OpenAPI 3.0 JSON（兼容 Swagger UI / Postman）。|

### GET `/api/swagger`
- **响应**：返回 `application/json` 格式的 OpenAPI 文档。
- **示例**：

```bash
curl https://{your-domain}/api/swagger -o api-schema.json
```

---

## 附录

- 所有时间字段采用 ISO 8601 格式，时区参考服务器配置（推荐统一为 UTC）。
- 列表接口分页参数均为正整数，超出范围时会退回默认值。
- 推荐在客户端对 `code` 与 HTTP 状态双重兜底，确保异常场景可感知。
