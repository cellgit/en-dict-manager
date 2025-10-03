# en-dict-manager

  使用 **ChatGPT-5 Codex** 开发一个“单词录入中后台管理”项目，要求：
 
  1. **技术栈**：
 
     * 使用 **Next.js 全栈** 实现前后端一体化。
     * 后端通过 **Next.js API Routes / App Router Server Actions** 处理请求。
  * 数据库使用 **PostgreSQL（默认连接阿里云 RDS 实例）**，通过 **Prisma** 进行 ORM 管理。
     * Next.js最新版本是15.5.4, 请使用最新版本的Next.js: https://github.com/vercel/next.js

  2. **数据库设计**：
 
     * 数据表需**结构化建模**，涵盖：单词、释义、例句、近义词等。
     * 表与字段必须包含**详细注释**。
  3. **功能需求**：
 
     * 后台管理界面支持单词的增删改查（CRUD）。
     * 支持批量导入清洗后的词典数据。
  4. **测试要求**：
 
     * 使用 **Jest** 编写自动化测试，覆盖核心逻辑（数据清洗、导入、CRUD）。
  5. **代码质量**：
 
     * 保持模块化目录结构（如 `app/`, `lib/`, `prisma/`）。
     * 代码与数据库模型均需有注释，便于维护。

## 快速开始

1. **准备依赖**：请确保本地已安装 [Node.js 18+](https://nodejs.org/)。如需改用本地数据库（而非默认的阿里云实例），请额外安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。
2. **安装依赖**：在项目根目录执行 `npm install`。
3. **一键启动**：运行 `npm run dev`。

   该命令会自动完成以下动作：

  - 生成默认 `.env`（如不存在），预置指向阿里云 RDS 的 `DATABASE_URL`；
  - 当 `.env` 中的 `DATABASE_URL` 指向 `localhost/127.0.0.1/0.0.0.0` 等本地地址时，自动启动 Docker 中的 PostgreSQL 并等待就绪；
  - 仅在本地数据库模式下执行 `prisma db push` 与（可选的）数据种子；
  - 无论数据库模式，都会生成 Prisma Client；
   - 启动 Next.js Dev Server，浏览器访问 <http://localhost:3000> 即可体验完整中后台功能。

   若仅需启动 Next.js 服务，可使用隐藏脚本 `npm run dev:next`（要求数据库已就绪）。

> ℹ️ **关于线上数据库**：默认 `.env` 指向阿里云 PostgreSQL（`bear_dict` 库，账号 `Bear_translate`）。脚本会检测并跳过 Prisma schema 推送与种子，以避免误改线上数据。若需在远程数据库上同步最新 Schema ，请执行：
>
> ```bash
> FORCE_REMOTE_DB_SYNC=1 npm run db:sync
> ```
>
> 可选变量：`DB_SYNC_MODE=push`（默认 `migrate`）、`RUN_DB_SEED=1`。若需继续使用本地 Docker 数据库，只需将 `.env` 中的 `DATABASE_URL` 改回本地地址即可。


6. **PRD文档和技术实现文档**：

    * `word-admin-prd.md`和`word-admin-technical.md`为项目的文档资料，包含了产品需求和技术实现的详细信息。

7. `word-admin-prd.md`和`word-admin-technical.md`中的字段和以下json示例`键`不一致的,以json示例中的字段为准.


以下是json示例:
```
[
  {
    "book_id": "PEPXiaoXue3_1",
    "content": {
      "word": {
        "content": {
          "rel_word": {
            "desc": "同根",
            "rels": [
              {
                "pos": "adj",
                "words": [
                  {
                    "hwd": "ruling",
                    "tran": " 统治的；主要的；支配的；流行的，普遍的"
                  },
                  {
                    "hwd": "ruled",
                    "tran": " 有横隔线的；有直线行的；受统治的"
                  }
                ]
              },
              {
                "pos": "n",
                "words": [
                  {
                    "hwd": "rule",
                    "tran": " 统治；规则"
                  },
                  {
                    "hwd": "ruling",
                    "tran": " 统治，支配；裁定"
                  },
                  {
                    "hwd": "rulership",
                    "tran": " 统治者的地位；职权或任期"
                  }
                ]
              },
              {
                "pos": "v",
                "words": [
                  {
                    "hwd": "ruled",
                    "tran": " 统治；裁决（rule的过去分词）"
                  }
                ]
              },
              {
                "pos": "vi",
                "words": [
                  {
                    "hwd": "rule",
                    "tran": " 统治；管辖；裁定"
                  }
                ]
              },
              {
                "pos": "vt",
                "words": [
                  {
                    "hwd": "rule",
                    "tran": " 统治；规定；管理；裁决；支配"
                  }
                ]
              }
            ]
          },
          "rem_method": {
            "desc": "记忆",
            "val": " 没有规矩(rule)， 不成方圆， 尺子(ruler)可以用来规划图形"
          },
          "sentence": {
            "desc": "例句",
            "sentences": [
              {
                "s_cn": "一把12英寸的尺子",
                "s_content": "a 12-inch ruler"
              }
            ]
          },
          "syno": {
            "desc": "同近",
            "synos": [
              {
                "hwds": [
                  {
                    "w": "governor"
                  },
                  {
                    "w": "dominator"
                  }
                ],
                "pos": "n",
                "tran": "[计量]尺；统治者；[测]划线板，划线的人"
              }
            ]
          },
          "trans": [
            {
              "desc_cn": "中释",
              "desc_other": "英释",
              "tran_cn": "尺子",
              "tran_other": "a long flat straight piece of plastic, metal, or wood that you use for measuring things or drawing straight lines"
            }
          ],
          "ukphone": "'ruːlə",
          "ukspeech": "ruler&type=1",
          "usphone": "'rulɚ",
          "usspeech": "ruler&type=2"
        },
        "word_head": "ruler",
        "word_id": "PEPXiaoXue3_1_1"
      }
    },
    "head_word": "ruler",
    "word_rank": 1
  },
  {
    "book_id": "PEPXiaoXue3_1",
    "content": {
      "word": {
        "content": {
          "phrase": {
            "desc": "短语",
            "phrases": [
              {
                "p_cn": "蓝铅笔（用于删改书稿或剧本等的）",
                "p_content": "blue pencil"
              },
              {
                "p_cn": "文具盒",
                "p_content": "pencil case"
              },
              {
                "p_cn": "铅笔盒",
                "p_content": "pencil box"
              },
              {
                "p_cn": "卷笔刀",
                "p_content": "pencil sharpener"
              },
              {
                "p_cn": "眉笔",
                "p_content": "eyebrow pencil"
              },
              {
                "p_cn": "铅笔心",
                "p_content": "pencil lead"
              },
              {
                "p_cn": "n. 铅笔",
                "p_content": "lead pencil"
              },
              {
                "p_cn": "彩色铅笔",
                "p_content": "color pencil"
              },
              {
                "p_cn": "自动铅笔",
                "p_content": "mechanical pencil"
              },
              {
                "p_cn": "铅笔厂",
                "p_content": "pencil factory"
              },
              {
                "p_cn": "素描",
                "p_content": "pencil sketch"
              },
              {
                "p_cn": "n. 测电笔，电笔；试验笔",
                "p_content": "test pencil"
              }
            ]
          },
          "rel_word": {
            "desc": "同根",
            "rels": [
              {
                "pos": "adj",
                "words": [
                  {
                    "hwd": "penciled",
                    "tran": " 用铅笔写的；光线锥的"
                  },
                  {
                    "hwd": "pencilled",
                    "tran": " 用铅笔写的"
                  }
                ]
              },
              {
                "pos": "v",
                "words": [
                  {
                    "hwd": "pencilled",
                    "tran": " 用笔写（pencil的过去分词）"
                  }
                ]
              }
            ]
          },
          "sentence": {
            "desc": "例句",
            "sentences": [
              {
                "s_cn": "尖尖的铅笔",
                "s_content": "a sharp pencil"
              },
              {
                "s_cn": "蓝色铅笔",
                "s_content": "a blue pencil"
              },
              {
                "s_cn": "铅笔速写",
                "s_content": "a pencil sketch"
              }
            ]
          },
          "trans": [
            {
              "desc_cn": "中释",
              "desc_other": "英释",
              "tran_cn": "铅笔",
              "tran_other": "an instrument that you use for writing or drawing, consisting of a wooden stick with a thin piece of a black or coloured substance in the middle"
            }
          ],
          "ukphone": "'pens(ə)l; -sɪl",
          "ukspeech": "pencil&type=1",
          "usphone": "'pɛnsl",
          "usspeech": "pencil&type=2"
        },
        "word_head": "pencil",
        "word_id": "PEPXiaoXue3_1_2"
      }
    },
    "head_word": "pencil",
    "word_rank": 2
  },
  {
    "book_id": "PEPXiaoXue3_1",
    "content": {
      "word": {
        "content": {
          "phrase": {
            "desc": "短语",
            "phrases": [
              {
                "p_cn": "橡皮擦工具；擦除工具",
                "p_content": "eraser tool"
              },
              {
                "p_cn": "n. 黑板擦",
                "p_content": "blackboard eraser"
              }
            ]
          },
          "rel_word": {
            "desc": "同根",
            "rels": [
              {
                "pos": "adj",
                "words": [
                  {
                    "hwd": "erasable",
                    "tran": " 可消除的；可抹去的；可删除的"
                  }
                ]
              },
              {
                "pos": "n",
                "words": [
                  {
                    "hwd": "erasure",
                    "tran": " 消除；涂擦的痕迹；消磁"
                  }
                ]
              },
              {
                "pos": "vi",
                "words": [
                  {
                    "hwd": "erase",
                    "tran": " 被擦去，被抹掉"
                  }
                ]
              },
              {
                "pos": "vt",
                "words": [
                  {
                    "hwd": "erase",
                    "tran": " 抹去；擦除"
                  }
                ]
              }
            ]
          },
          "sentence": {
            "desc": "例句",
            "sentences": [
              {
                "s_cn": "按调出橡皮擦工具，或在你的工具栏里找到它。",
                "s_content": "Press to bring up the eraser tool, orfind it in your Toolbox.",
                "s_content_eng": "Press to bring up the eraser tool, orfind it in your Toolbox.",
                "s_speech": "Press+to+bring+up+the+eraser+tool%2C+orfind+it+in+your+Toolbox.&le=eng"
              },
              {
                "s_cn": "信任就像橡皮擦，在一次一次的错误中慢慢损耗变小。",
                "s_content": "Trust is like an eraser. It gets smaller and smaller after every mistake.",
                "s_content_eng": "Trust is like an eraser. It gets smaller and smaller after every mistake.",
                "s_speech": "Trust+is+like+an+eraser.+It+gets+smaller+and+smaller+after+every+mistake.&le=eng"
              },
              {
                "s_cn": "在海斯的最新研究中，他招集了87 个健康的志愿者，检查了这些人舌头的一块区域——大约铅笔上的橡皮擦头部大小。",
                "s_content": "In Hayes’ most recent study, he recruited 87 healthy volunteers and examined an area of their tongues about the size of the head of a pencil eraser.",
                "s_content_eng": "In Hayes’ most recent study, he recruited 87 healthy volunteers and examined an area of their tongues about the size of the head of a pencil eraser.",
                "s_speech": "In+Hayes%E2%80%99+most+recent+study%2C+he+recruited+87+healthy+volunteers+and+examined+an+area+of+their+tongues+about+the+size+of+the+head+of+a+pencil+eraser.&le=eng"
              }
            ]
          },
          "syno": {
            "desc": "同近",
            "synos": [
              {
                "hwds": [
                  {
                    "w": "cleaning machine"
                  },
                  {
                    "w": "disposer"
                  }
                ],
                "pos": "n",
                "tran": "[计]擦除器；清除器"
              }
            ]
          },
          "trans": [
            {
              "desc_cn": "中释",
              "desc_other": "英释",
              "tran_cn": "橡皮",
              "tran_other": "a small piece of rubber that you use to remove pencil or pen marks from paper"
            }
          ],
          "ukphone": "ɪ'reɪzə",
          "ukspeech": "eraser&type=1",
          "usphone": "ɪ'resɚ",
          "usspeech": "eraser&type=2"
        },
        "word_head": "eraser",
        "word_id": "PEPXiaoXue3_1_3"
      }
    },
    "head_word": "eraser",
    "word_rank": 3
  },
  {
    "book_id": "PEPXiaoXue3_1",
    "content": {
      "word": {
        "content": {
          "sentence": {
            "desc": "例句",
            "sentences": [
              {
                "s_cn": "他用蜡笔给画上色。",
                "s_content": "He coloured the picture with crayon.",
                "s_content_eng": "He coloured the picture with crayon.",
                "s_speech": "He+coloured+the+picture+with+crayon.&le=eng"
              },
              {
                "s_cn": "谁拿了我的蜡笔盒？",
                "s_content": "Who took my crayon box?",
                "s_content_eng": "Who took my crayon box?",
                "s_speech": "Who+took+my+crayon+box%3F&le=eng"
              },
              {
                "s_cn": "他们寄信，有一次甚至是蜡笔写的，详细的描述了他们的权利和我如何违反了某些1700年代的海上条约。",
                "s_content": "They send letters — one time in crayon — detailing their rights and how I am violating some maritime treaty from the 1700s.",
                "s_content_eng": "They send letters — one time in crayon — detailing their rights and how I am violating some maritime treaty from the 1700s.",
                "s_speech": "They+send+letters+%E2%80%94+one+time+in+crayon+%E2%80%94+detailing+their+rights+and+how+I+am+violating+some+maritime+treaty+from+the+1700s.&le=eng"
              }
            ]
          },
          "syno": {
            "desc": "同近",
            "synos": [
              {
                "hwds": [
                  {
                    "w": "pastels"
                  }
                ],
                "pos": "n",
                "tran": "[轻]蜡笔，有色粉笔"
              }
            ]
          },
          "trans": [
            {
              "desc_cn": "中释",
              "desc_other": "英释",
              "tran_cn": "蜡笔",
              "tran_other": "a stick of coloured  wax  or  chalk  that children use to draw pictures"
            }
          ],
          "ukphone": "ˈkreɪən",
          "ukspeech": "crayon&type=1",
          "usphone": "kreən",
          "usspeech": "crayon&type=2"
        },
        "word_head": "crayon",
        "word_id": "PEPXiaoXue3_1_4"
      }
    },
    "head_word": "crayon",
    "word_rank": 4
  }
]
```

  ## 开发环境启动

  1. 准备依赖：
    - Node.js ≥ 18
    - Docker Desktop（脚本会自动启动 Postgres）。
  2. 安装依赖：
    ```bash
    npm install
    ```
  3. 一键启动（创建本地数据库、推送 schema、种子真实数据并启动 Next.js）：
    ```bash
    npm run dev
    ```
  4. 若希望仅启动前端，可在数据库服务已运行的前提下执行：
    ```bash
    npm run dev:next
    ```

  ## 可用脚本

  | 命令 | 说明 |
  | ---- | ---- |
  | `npm run lint` | 运行 ESLint 检查代码质量。 |
  | `npm run build` | 构建生产版本并执行 TypeScript 校验。 |
  | `npm run test` | 使用 Jest 运行核心单元测试。 |

  ## 批量导入使用指南

  - 导入入口位于后台导航的“批量导入”页（`/import`）。
  - 支持粘贴两种结构：
    - 已清洗的 `NormalizedWord` 数组（见下方示例）；
    - 原始教材 JSON（如 `PEPXiaoXue3_1.json`）中的条目数组，系统会自动规范化并导入。
  - `NormalizedWord` 结构示例：
    ```json
    [
     {
      "headword": "ruler",
      "rank": 1,
      "bookId": "PEPXiaoXue3_1",
      "phoneticUs": null,
      "phoneticUk": "'ruːlə",
      "memoryTip": null,
      "definitions": [],
      "examples": [],
      "synonymGroups": [],
      "phrases": [],
      "relatedWords": []
     }
    ]
    ```
  - 先点击 **Dry Run 校验** 查看解析结果与错误列表；确认无误后执行 **正式导入**。正式导入会创建导入批次、写入日志并刷新单词列表。
  - 失败或跳过的条目会展示原因，同时写入 `dict_import_log` 表。

  ## 自动化测试

  - 项目使用 Jest + ts-jest。执行 `npm run test` 即可运行当前的导入服务核心用例。测试环境为 Node，将 `@/lib/prisma` 与 `@/lib/word-service` 进行了 mock，关注导入流程的计数与日志行为。
