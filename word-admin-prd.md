# 词汇管理后台技术实现说明

## 1. 项目概览
- **框架**：Next.js 14 App Router（Node.js 18+），结合 React Server Component 与 Client Component。
- **语言**：TypeScript、Tailwind CSS。
- **数据层**：Prisma ORM 连接 PostgreSQL。
- **运行模式**：前端与后端共用一套 Next.js 应用；所有写入通过 Next Server Actions + next-safe-action 进行类型安全校验。

## 2. 系统架构
```
[浏览器] --(fetch/action)--> [Next.js App Router]
   |                               |
   | Client Components (WordManager, ImportManager)
   v                               v
状态管理 (useState)         Server Actions (app/words/actions)
                                   |
                                   v
                            服务层 (lib/word-service, lib/data-import)
                                   |
                                   v
                                Prisma ORM
                                   |
                                   v
                              PostgreSQL
```

### 2.1 分层职责
- **UI 层** (`app/words`, `app/import`): 处理交互、状态、表单数据结构化。
- **Server Actions 层** (`app/words/actions.ts`, `app/import/actions.ts`):
  - 使用 `next-safe-action` 包裹，提供类型安全的请求/响应。
  - 集成 Zod schema 校验输入，返回统一的错误/成功结构。
  - 负责触发 revalidatePath 以刷新页面数据。
- **服务层** (`lib/word-service.ts`, `lib/data-import.ts`, `lib/dict-cleaner.ts`):
  - 处理业务逻辑、与 Prisma 的事务交互。
  - 提供 CRUD 及批量导入流程，并生成导入日志。
- **类型与工具** (`lib/types.ts`, `lib/safe-action.ts`): 定义规范化数据结构、统一的 safeAction 工具。

## 3. 环境与配置
- `.env` 关键变量：`DATABASE_URL` 指向 PostgreSQL 实例。
- 默认 `DATABASE_URL` 已配置为阿里云 RDS（库名 `bear_dict`，账号 `Bear_translate`）；如需本地 Docker 数据库可自行覆盖。
- 若远程数据库首次使用，需执行 `FORCE_REMOTE_DB_SYNC=1 npm run db:sync` 同步 Prisma Schema。
- Prisma 由 `prisma/schema.prisma` 定义；运行 `npx prisma migrate deploy` 应用迁移。
- Tailwind 配置、Next.js 配置保持默认；部署到 Vercel 或自建 Node 环境均可。

## 4. 数据模型
系统使用 Prisma 建模，共包含 9 张业务表。以下表格列出了每张表的全部字段、数据类型和约束，便于开发、测试及数据治理。

### 4.1 `dict_word`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `rank` | `Int?` | 词频或排序权重 | 可空 |
| `headword` | `String` | 单词文本 | 与 `book_id` 组成联合唯一 |
| `phonetic_us` | `String?` | 美式音标 | — |
| `phonetic_uk` | `String?` | 英式音标 | — |
| `audio_us` | `String?` | 美式音频地址 | — |
| `audio_uk` | `String?` | 英式音频地址 | — |
| `book_id` | `String?` | 数据来源或教材编号 | — |
| `memory_tip` | `String?` | 记忆提示 | — |
| `created_at` | `DateTime` | 创建时间 | `@default(now())` |
| `updated_at` | `DateTime` | 更新时间 | `@updatedAt` |

**索引/关系**：`@@unique([headword, book_id])`，`@@index([headword])`。一对多关联至 `dict_definition`、`dict_example_sentence`、`dict_synonym_group`、`dict_phrase`、`dict_related_word`、`dict_import_log`。

### 4.2 `dict_definition`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `word_id` | `Uuid` | 关联单词 ID | 外键至 `dict_word.id`，`onDelete: Cascade` |
| `part_of_speech` | `String?` | 词性 | — |
| `meaning_cn` | `String?` | 中文释义 | — |
| `meaning_en` | `String?` | 英文释义或解释 | — |
| `note` | `String?` | 备注说明 | — |
| `created_at` | `DateTime` | 创建时间 | `@default(now())` |

**关系**：一对多关联至 `dict_example_sentence`；由 `dict_word` 级联删除。

### 4.3 `dict_example_sentence`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `word_id` | `Uuid` | 关联单词 ID | `onDelete: Cascade` |
| `definition_id` | `Uuid?` | 可选释义 ID | 外键至 `dict_definition.id` |
| `source` | `String` | 原始例句文本 | — |
| `translation` | `String?` | 例句翻译 | — |
| `meta` | `Json?` | 附加元数据 | — |
| `created_at` | `DateTime` | 创建时间 | `@default(now())` |

**索引**：`@@index([word_id])`，`@@index([definition_id])`。

### 4.4 `dict_synonym_group`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `word_id` | `Uuid` | 关联单词 ID | `onDelete: Cascade` |
| `part_of_speech` | `String?` | 词性分组 | — |
| `meaning_cn` | `String?` | 中文释义 | — |
| `note` | `String?` | 备注 | — |

**索引/关系**：`@@index([word_id])`。一对多关联 `dict_synonym`。

### 4.5 `dict_synonym`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `group_id` | `Uuid` | 关联分组 ID | 外键至 `dict_synonym_group.id`，`onDelete: Cascade` |
| `value` | `String` | 近义词文本 | — |

**索引**：`@@index([group_id])`。

### 4.6 `dict_phrase`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `word_id` | `Uuid` | 关联单词 ID | `onDelete: Cascade` |
| `content` | `String` | 短语内容 | — |
| `meaning_cn` | `String?` | 中文释义 | — |
| `meaning_en` | `String?` | 英文释义 | — |

**索引**：`@@index([word_id])`。

### 4.7 `dict_related_word`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `word_id` | `Uuid` | 关联单词 ID | `onDelete: Cascade` |
| `part_of_speech` | `String?` | 词性 | — |
| `headword` | `String` | 相关词文本 | — |
| `meaning_cn` | `String?` | 相关词释义 | — |

**索引**：`@@index([word_id])`。

### 4.8 `dict_import_batch`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `source_name` | `String?` | 原始文件名 | — |
| `total_count` | `Int` | 导入总数 | — |
| `success_count` | `Int` | 成功写入数量 | — |
| `skipped_count` | `Int` | 被跳过数量 | — |
| `error_details` | `Json?` | 失败详情集合 | — |
| `created_at` | `DateTime` | 创建时间 | `@default(now())` |

**关系**：一对多关联 `dict_import_log`。

### 4.9 `dict_import_log`

| 字段 | 类型 | 说明 | 约束/映射 |
| ---- | ---- | ---- | --------- |
| `id` | `Uuid` | 主键 | `@id @default(uuid())` |
| `batch_id` | `Uuid` | 关联批次 ID | 外键至 `dict_import_batch.id`，`onDelete: Cascade` |
| `word_id` | `Uuid?` | 导入成功的词条 ID | 关联 `dict_word.id` |
| `raw_headword` | `String` | 原始词头 | — |
| `status` | `String` | `success` / `skipped` / `failed` | — |
| `message` | `String?` | 错误原因 | — |
| `created_at` | `DateTime` | 创建时间 | `@default(now())` |

**索引**：`@@index([batch_id])`，`@@index([word_id])`。与 `dict_word` 建立 `@relation("WordImportLogs")`。

## 5. 关键模块说明

### 5.1 `lib/word-service.ts`
- `listWords({ query, exact })`: 支持词头模糊搜索（默认）或精确匹配；当 `exact = true` 时会走 `LOWER(headword)` 函数索引，实现大小写不敏感的单条命中，返回值仍包含 `total`/分页信息。
- `getWordById(id)`: 返回词条完整结构，使用 Prisma `include` 加载关联实体。
- `createWord(input)`: 通过 `prisma.$transaction` 同步创建 Word、Definition、Example、Synonym、Phrase、RelatedWord。
- `deleteWord(id)`: 删除词条（自动清理子表）。
- 设计要点：
  - 使用 `upsert` 构建子表时避免重复。
  - 通过 `NormalizedWord` 接口统一输入结构，确保批量导入与单条创建复用。

### 5.2 `lib/data-import.ts`
- `normalizeRawWord(raw)`: 调用 `dict-cleaner` 清洗外部字段，输出 `NormalizedWord`。
- `importWords(words, { dryRun })`:
  1. 运行 `normalizeWords` 清洗数据。
  2. Dry Run 模式：仅执行验证，返回 `ImportSummary`。
  3. 正式模式：
     - 启动事务，逐条 `createOrUpdateWord`。
     - 记录成功/失败数量，并写入 `ImportBatch` + `ImportLog`。
- 错误处理：捕获 Zod 校验或 Prisma 异常，分类为 `skipped`、`failed`。

### 5.3 `lib/dict-cleaner.ts`
- 责任：
  - 统一字段命名、去除空字符串、默认空数组。
  - 处理音标、音频链接格式化。
  - 对近义词、短语、例句进行结构化。
- 返回 `NormalizedWord` 确保后续逻辑可靠。

### 5.4 `app/words/WordManager.tsx`
- Client Component。
- 主要状态：`selectedWordId`, `showDeleteConfirm`, `formData`。
- 操作：
  - `handleSearch`: 调用 `listWordsAction` 获取列表。
  - `handleSelect`: 获取详情并展示在侧栏。
  - `handleCreate`: 构建与服务层兼容的 payload，提交 `createWordAction`。
  - `handleDelete`: 二次确认后调用 `deleteWordAction`。
- UI 元素：
  - 列表 + 搜索框。
  - 详情抽屉显示 definitions/examples/phrases/synonyms/relatedWords。
  - 动态表单，可添加多个释义、例句、短语等子项。

### 5.5 `app/words/actions.ts`
- 使用 `safeAction` 创建安全 server action：
  - `listWordsAction`（GET 类查询），`getWordDetailAction`，`createWordAction`，`deleteWordAction`。
  - 配置 `input` Zod schema，对应 `listWordsInputSchema`, `createWordInputSchema` 等。
  - 创建/删除后调用 `revalidatePath("/words")` 刷新页面缓存。

### 5.6 `app/import` 模块
- `ImportManager.tsx`：
  - 文本区域输入 JSON，切换 Dry Run 和正式导入。
  - 展示 `ImportSummary`，含 `total/success/skipped/failed/errors`。
- `app/import/actions.ts`：
  - `importWordsAction`，解析 JSON 字符串 → `NormalizedWord[]`，调用服务层。
  - 返回统一的 `summary`，错误时设置 `fieldErrors` 或 `formError`。

## 6. 数据流程

### 6.1 词条查询流程
1. 用户在搜索框输入词头。
2. 前端调用 `listWordsAction`（POST fetch）。
3. Server Action 校验输入 → 调用 `wordService.listWords`。
4. 返回词条数组，前端更新列表。

### 6.2 词条详情
1. 用户点击列表项。
2. 调用 `getWordDetailAction` → Prisma 查询并 include 相关子表。
3. 前端渲染详情抽屉。

### 6.3 新建词条
1. 前端表单收集 `NormalizedWord` 结构。
2. `createWordAction` 校验（Zod schema）。
3. 服务层开启事务：创建 Word → 子表。
4. 成功：返回新词条 ID，刷新列表；失败：返回错误信息。

### 6.4 删除词条
1. 用户开启删除确认开关并点击删除。
2. `deleteWordAction` 执行 Prisma 删除。
3. 成功后 revalidate 列表。

### 6.5 批量导入
1. 用户输入 JSON 数组并选择 Dry Run。
2. Server Action 解析 JSON，调用 `importWords({ dryRun: true })`，返回统计信息。
3. Dry Run 通过后，切换正式模式再次提交。
4. 导入流程写入 ImportBatch 与 ImportLog 表，返回汇总。
5. 前端展示错误条目和原因。

## 7. 校验与错误处理
- **Zod Schema**：
  - `createWordInputSchema`、`definitionInputSchema` 等定义在 `app/words/schemas.ts`（若新增字段需同步更新）。
  - 导入流程使用 `normalizedWordSchema` 确保结构一致。
- **Error Handling**：
  - Server Action 捕获异常，统一返回 `formError`。
  - 服务层抛出自定义错误，包含失败词头与原因，ImportLog 记录详细信息。

## 8. 部署与运行
1. 安装依赖：`pnpm install`（或 `npm install`）。
2. 数据库迁移：`npx prisma migrate deploy`。
3. 开发环境：`pnpm dev`，默认端口 3000。
4. 生产部署：
   - 构建 `pnpm build`，启动 `pnpm start`。
   - 确保 `DATABASE_URL` 在运行环境可用。
   - 建议启用 Vercel Edge/SSR，或部署到自托管 Node 服务并配置反向代理。

## 9. 测试与质量保障
- 单元测试：使用 Jest 针对服务层函数（例如 `word-service`、`data-import`）。
- 集成流程：
  - Dry Run 覆盖合法数据、缺字段、重复词头三类用例。
  - 创建词条测试验证 Zod 校验、空数组默认值。
- 质量指标：持续监控导入成功率、数据库字段完整性。

## 10. 运维与监控建议
- 日志：使用次级工具（如 Logtail）收集 server action 抛出的异常。
- 指标：统计导入批次数、失败率；检测 Prisma 连接池用量。
- 备份：PostgreSQL 按天备份；保留最少 7 天历史。

## 11. 扩展方向
- 增加权限系统（角色：编辑、审核、只读）。
- UI 支持导出 CSV/JSON，方便离线分析。
- 导入日志页面化展示，支持筛选失败原因。
- 引入富文本编辑器，用于复杂释义或例句批注。

## 12. 依赖与第三方库

### 12.1 运行时依赖

| 包名 | 版本 | 作用 |
| ---- | ---- | ---- |
| `@prisma/client` | 5.20.0 | Prisma ORM 客户端，提供类型安全的数据库访问。 |
| `@tanstack/react-table` | 8.20.5 | 高性能表格渲染与分页、排序工具，用于列表展示。 |
| `clsx` | 2.1.1 | 条件拼接 CSS class。 |
| `lucide-react` | 0.471.0 | 图标库，提供统一的 UI 图标。 |
| `next` | 14.2.13 | Next.js App Router 框架，支撑 SSR/CSR 及 server actions。 |
| `next-safe-action` | 6.0.2 | Server Action 封装，提供输入校验与类型安全返回。 |
| `react` | 18.3.1 | React UI 库。 |
| `react-dom` | 18.3.1 | React DOM 渲染层。 |
| `zod` | 3.23.8 | 数据校验与类型推导，用于表单、导入校验。 |

### 12.2 开发/测试/构建依赖

| 包名 | 版本 | 作用 |
| ---- | ---- | ---- |
| `@testing-library/dom` | 10.4.0 | DOM 级别测试辅助。 |
| `@testing-library/jest-dom` | 6.6.3 | Jest 自定义断言。 |
| `@testing-library/react` | 16.0.1 | React 组件测试工具。 |
| `@testing-library/user-event` | 14.5.2 | 模拟用户交互。 |
| `@types/jest` | 29.5.12 | Jest TypeScript 类型定义。 |
| `@types/node` | 20.16.12 | Node.js 类型定义。 |
| `@types/react` | 18.3.4 | React 类型定义。 |
| `@types/react-dom` | 18.3.2 | React DOM 类型定义。 |
| `@typescript-eslint/eslint-plugin` | 7.18.0 | TypeScript ESLint 规则。 |
| `@typescript-eslint/parser` | 7.18.0 | TypeScript ESLint 解析器。 |
| `autoprefixer` | 10.4.20 | PostCSS 插件，自动补全 CSS 前缀。 |
| `eslint` | 8.57.1 | 代码风格与静态检查。 |
| `eslint-config-next` | 14.2.13 | Next.js 官方 ESLint 规则。 |
| `eslint-plugin-jest` | 27.9.0 | Jest 相关 ESLint 规则。 |
| `eslint-plugin-testing-library` | 6.5.0 | Testing Library ESLint 规则。 |
| `jest` | 29.7.0 | 单元测试框架。 |
| `jest-environment-jsdom` | 29.7.0 | 基于 jsdom 的 Jest 运行时。 |
| `postcss` | 8.4.47 | CSS 处理工具链。 |
| `prisma` | 5.20.0 | Prisma CLI，用于 schema 迁移和生成。 |
| `tailwindcss` | 3.4.15 | 原子化 CSS 框架。 |
| `ts-jest` | 29.2.5 | 在 Jest 中编译 TypeScript。 |
| `ts-node` | 10.9.2 | 直接运行 TypeScript 脚本。 |
| `typescript` | 5.6.3 | TypeScript 编译器。 |

## 13. 附录：Dry Run 返回示例
```json
{
  "total": 120,
  "success": 118,
  "skipped": 1,
  "failed": 1,
  "batchId": null,
  "errors": [
    { "headword": "abandon", "reason": "释义缺失" },
    { "headword": "ability", "reason": "重复词头与现有词冲突" }
  ]
}
```
