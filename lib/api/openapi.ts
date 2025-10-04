import type { OpenAPIV3 } from "openapi-types";

const jsonEnvelopeResponse = (
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
): OpenAPIV3.ResponseObject => ({
  description: "成功",
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/ApiEnvelope" },
          {
            type: "object",
            properties: {
              data: schema
            }
          }
        ]
      }
    }
  }
});

const emptySuccessResponse = (): OpenAPIV3.ResponseObject => ({
  description: "成功",
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ApiEnvelope"
      }
    }
  }
});
const validationErrorResponse: OpenAPIV3.ResponseObject = {
  description: "参数错误",
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/ApiEnvelope" },
          {
            type: "object",
            properties: {
              code: { type: "integer", example: 422 },
              message: { type: "string", example: "字段校验失败" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    path: { type: "array", items: { type: "string" } },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        ]
      }
    }
  }
};

const notFoundResponse: OpenAPIV3.ResponseObject = {
  description: "资源不存在",
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/ApiEnvelope" },
          {
            type: "object",
            properties: {
              code: { type: "integer", example: 404 },
              message: { type: "string", example: "词条不存在或已被删除" }
            }
          }
        ]
      }
    }
  }
};

const responses = {
  success: jsonEnvelopeResponse,
  emptySuccess: emptySuccessResponse,
  validationError: validationErrorResponse,
  notFound: notFoundResponse
};

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "en-dict-manager API",
    version: "1.0.0",
    description:
      "词汇管理后台对外接口，覆盖词书、单词、批量导入及数据清洗能力，统一返回 { code, data, message } envelope。"
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "本地开发"
    }
  ],
  tags: [
    { name: "Books", description: "词书管理" },
    { name: "Words", description: "单词管理" },
    { name: "Imports", description: "导入流程" },
    { name: "Tools", description: "工具接口" }
  ],
  components: {
    schemas: {
      ApiEnvelope: {
        type: "object",
        required: ["code", "data", "message"],
        properties: {
          code: {
            type: "integer",
            example: 200
          },
          message: {
            type: "string",
            example: "成功"
          },
          data: {}
        }
      },
      BookListItem: {
        type: "object",
        required: [
          "id",
          "bookId",
          "name",
          "wordCount",
          "isActive",
          "createdAt",
          "updatedAt"
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          bookId: { type: "string" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          coverUrl: { type: "string", nullable: true },
          grade: { type: "string", nullable: true },
          level: { type: "string", nullable: true },
          publisher: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          sortOrder: { type: "integer", nullable: true },
          isActive: { type: "boolean" },
          wordCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      BookRequest: {
        type: "object",
        required: ["bookId", "name"],
        properties: {
          bookId: { type: "string", maxLength: 255 },
          name: { type: "string", maxLength: 255 },
          description: { type: "string", nullable: true },
          coverUrl: { type: "string", nullable: true },
          grade: { type: "string", nullable: true },
          level: { type: "string", nullable: true },
          publisher: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string" } },
          sortOrder: { type: "integer", nullable: true },
          isActive: { type: "boolean" }
        }
      },
      BookListResponse: {
        type: "object",
        required: ["items", "total"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/BookListItem" }
          },
          total: { type: "integer" }
        }
      },
      WordListItem: {
        type: "object",
        required: ["id", "headword", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          headword: { type: "string" },
          rank: { type: "integer", nullable: true },
          bookId: { type: "string", nullable: true },
          phoneticUs: { type: "string", nullable: true },
          phoneticUk: { type: "string", nullable: true },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      ExampleSentence: {
        type: "object",
        required: ["source"],
        properties: {
          id: { type: "string", format: "uuid" },
          source: { type: "string" },
          translation: { type: "string", nullable: true },
          meta: { type: "object", nullable: true, additionalProperties: true }
        }
      },
      WordDefinition: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          partOfSpeech: { type: "string", nullable: true },
          pos: { type: "string", nullable: true },
          meaningCn: { type: "string", nullable: true },
          meaningEn: { type: "string", nullable: true },
          note: { type: "string", nullable: true },
          examples: {
            type: "array",
            items: { $ref: "#/components/schemas/ExampleSentence" }
          }
        }
      },
      SynonymGroup: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          partOfSpeech: { type: "string", nullable: true },
          meaningCn: { type: "string", nullable: true },
          note: { type: "string", nullable: true },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                value: { type: "string" }
              }
            }
          }
        }
      },
      Phrase: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string" },
          meaningCn: { type: "string", nullable: true },
          meaningEn: { type: "string", nullable: true }
        }
      },
      RelatedWord: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          headword: { type: "string" },
          partOfSpeech: { type: "string", nullable: true },
          meaningCn: { type: "string", nullable: true }
        }
      },
      Antonym: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          value: { type: "string" },
          meta: { type: "object", nullable: true, additionalProperties: true }
        }
      },
      RealExamSentence: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string" },
          level: { type: "string", nullable: true },
          paper: { type: "string", nullable: true },
          sourceType: { type: "string", nullable: true },
          year: { type: "string", nullable: true },
          order: { type: "integer", nullable: true },
          sourceInfo: { type: "object", nullable: true, additionalProperties: true }
        }
      },
      ExamChoice: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          value: { type: "string" },
          index: { type: "integer", nullable: true }
        }
      },
      ExamQuestion: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          question: { type: "string" },
          examType: { type: "integer", nullable: true },
          explanation: { type: "string", nullable: true },
          rightIndex: { type: "integer", nullable: true },
          choices: {
            type: "array",
            items: { $ref: "#/components/schemas/ExamChoice" }
          }
        }
      },
      ImportLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          status: { type: "string" },
          message: { type: "string", nullable: true },
          rawHeadword: { type: "string" },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      WordDetail: {
        type: "object",
        required: ["id", "headword", "createdAt", "updatedAt"],
        properties: {
          id: { type: "string", format: "uuid" },
          headword: { type: "string" },
          rank: { type: "integer", nullable: true },
          bookId: { type: "string", nullable: true },
          phoneticUs: { type: "string", nullable: true },
          phoneticUk: { type: "string", nullable: true },
          phonetic: { type: "string", nullable: true },
          speech: { type: "string", nullable: true },
          star: { type: "integer", nullable: true },
          audioUs: {
            type: "string",
            nullable: true,
            description: "美式读音播放链接，来自 https://dict.youdao.com/dictvoice?audio={word}&type=1"
          },
          audioUk: {
            type: "string",
            nullable: true,
            description: "英式读音播放链接，来自 https://dict.youdao.com/dictvoice?audio={word}&type=2"
          },
          audioUsRaw: { type: "string", nullable: true },
          audioUkRaw: { type: "string", nullable: true },
          memoryTip: { type: "string", nullable: true },
          memoryTipDesc: { type: "string", nullable: true },
          sentenceDesc: { type: "string", nullable: true },
          synonymDesc: { type: "string", nullable: true },
          phraseDesc: { type: "string", nullable: true },
          relatedDesc: { type: "string", nullable: true },
          antonymDesc: { type: "string", nullable: true },
          realExamSentenceDesc: { type: "string", nullable: true },
          pictureUrl: { type: "string", nullable: true },
          sourceWordId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          definitions: {
            type: "array",
            items: { $ref: "#/components/schemas/WordDefinition" }
          },
          examples: {
            type: "array",
            items: { $ref: "#/components/schemas/ExampleSentence" }
          },
          synonymGroups: {
            type: "array",
            items: { $ref: "#/components/schemas/SynonymGroup" }
          },
          phrases: {
            type: "array",
            items: { $ref: "#/components/schemas/Phrase" }
          },
          relatedWords: {
            type: "array",
            items: { $ref: "#/components/schemas/RelatedWord" }
          },
          antonyms: {
            type: "array",
            items: { $ref: "#/components/schemas/Antonym" }
          },
          realExamSentences: {
            type: "array",
            items: { $ref: "#/components/schemas/RealExamSentence" }
          },
          examQuestions: {
            type: "array",
            items: { $ref: "#/components/schemas/ExamQuestion" }
          },
          importLogs: {
            type: "array",
            items: { $ref: "#/components/schemas/ImportLog" }
          }
        }
      },
      ListWordsResponse: {
        type: "object",
        required: ["items", "total", "page", "pageSize"],
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/WordListItem" }
          },
          total: { type: "integer" },
          page: { type: "integer" },
          pageSize: { type: "integer" }
        }
      },
      NormalizedWordInput: {
        type: "object",
        required: ["headword"],
        properties: {
          headword: { type: "string" },
          rank: { type: "integer", nullable: true },
          bookId: { type: "string", nullable: true },
          phoneticUs: { type: "string", nullable: true },
          phoneticUk: { type: "string", nullable: true },
          phonetic: { type: "string", nullable: true },
          speech: { type: "string", nullable: true },
          star: { type: "integer", nullable: true },
          audioUs: {
            type: "string",
            nullable: true,
            description: "可留空，服务端会按照 headword 生成 DictVoice 美式读音"
          },
          audioUk: {
            type: "string",
            nullable: true,
            description: "可留空，服务端会按照 headword 生成 DictVoice 英式读音"
          },
          audioUsRaw: { type: "string", nullable: true },
          audioUkRaw: { type: "string", nullable: true },
          memoryTip: { type: "string", nullable: true },
          memoryTipDesc: { type: "string", nullable: true },
          sentenceDesc: { type: "string", nullable: true },
          synonymDesc: { type: "string", nullable: true },
          phraseDesc: { type: "string", nullable: true },
          relatedDesc: { type: "string", nullable: true },
          antonymDesc: { type: "string", nullable: true },
          realExamSentenceDesc: { type: "string", nullable: true },
          pictureUrl: { type: "string", nullable: true },
          sourceWordId: { type: "string", nullable: true },
          definitions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                partOfSpeech: { type: "string", nullable: true },
                pos: { type: "string", nullable: true },
                meaningCn: { type: "string", nullable: true },
                meaningEn: { type: "string", nullable: true },
                note: { type: "string", nullable: true },
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      source: { type: "string" },
                      translation: { type: "string", nullable: true },
                      meta: { type: "object", nullable: true, additionalProperties: true }
                    },
                    required: ["source"]
                  }
                }
              }
            }
          },
          examples: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source: { type: "string" },
                translation: { type: "string", nullable: true },
                meta: { type: "object", nullable: true, additionalProperties: true }
              },
              required: ["source"]
            }
          },
          synonymGroups: {
            type: "array",
            items: {
              type: "object",
              properties: {
                partOfSpeech: { type: "string", nullable: true },
                meaningCn: { type: "string", nullable: true },
                note: { type: "string", nullable: true },
                items: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          phrases: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                meaningCn: { type: "string", nullable: true },
                meaningEn: { type: "string", nullable: true }
              },
              required: ["content"]
            }
          },
          relatedWords: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headword: { type: "string" },
                partOfSpeech: { type: "string", nullable: true },
                meaningCn: { type: "string", nullable: true }
              },
              required: ["headword"]
            }
          },
          antonyms: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headword: { type: "string" },
                meta: { type: "object", nullable: true, additionalProperties: true }
              },
              required: ["headword"]
            }
          },
          realExamSentences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                level: { type: "string", nullable: true },
                paper: { type: "string", nullable: true },
                sourceType: { type: "string", nullable: true },
                year: { type: "string", nullable: true },
                order: { type: "integer", nullable: true },
                sourceInfo: { type: "object", nullable: true, additionalProperties: true }
              },
              required: ["content"]
            }
          },
          examQuestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                examType: { type: "integer", nullable: true },
                explanation: { type: "string", nullable: true },
                rightIndex: { type: "integer", nullable: true },
                choices: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      value: { type: "string" },
                      index: { type: "integer", nullable: true }
                    },
                    required: ["value"]
                  }
                }
              },
              required: ["question"]
            }
          }
        }
      },
      WordRequest: {
        type: "object",
        required: ["word"],
        properties: {
          word: { $ref: "#/components/schemas/NormalizedWordInput" }
        }
      },
      ImportSummary: {
        type: "object",
        required: ["total", "success", "skipped", "failed", "batchId", "errors"],
        properties: {
          total: { type: "integer" },
          success: { type: "integer" },
          skipped: { type: "integer" },
          failed: { type: "integer" },
          batchId: { type: "string", nullable: true },
          errors: {
            type: "array",
            items: {
              type: "object",
              required: ["index", "headword", "reason", "status"],
              properties: {
                index: { type: "integer" },
                headword: { type: "string" },
                reason: { type: "string" },
                status: { type: "string", enum: ["skipped", "failed"] }
              }
            }
          }
        }
      },
      ImportRequest: {
        type: "object",
        required: ["words"],
        properties: {
          words: { type: "array", items: { type: "object" } },
          sourceName: { type: "string", nullable: true }
        }
      },
      CleanDataRequest: {
        type: "object",
        required: ["rawData"],
        properties: {
          rawData: { type: "string" }
        }
      },
      CleanDataResult: {
        type: "object",
        required: ["success", "logs"],
        properties: {
          success: { type: "boolean" },
          cleaned: {
            type: "array",
            items: { type: "object" },
            nullable: true
          },
          logs: {
            type: "array",
            items: { type: "string" }
          },
          error: { type: "string", nullable: true }
        }
      }
    }
  },
  paths: {
    "/api/v1/books": {
      get: {
        tags: ["Books"],
        summary: "获取词书列表",
        responses: {
          200: responses.success({ $ref: "#/components/schemas/BookListResponse" })
        }
      },
      post: {
        tags: ["Books"],
        summary: "创建词书",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookRequest" }
            }
          }
        },
        responses: {
          201: responses.success({ $ref: "#/components/schemas/BookListItem" }),
          422: responses.validationError
        }
      }
    },
    "/api/v1/books/{bookId}": {
      parameters: [
        {
          name: "bookId",
          in: "path",
          required: true,
          schema: { type: "string" }
        }
      ],
      get: {
        tags: ["Books"],
        summary: "获取词书详情",
        responses: {
          200: responses.success({ $ref: "#/components/schemas/BookListItem" }),
          404: responses.notFound
        }
      },
      put: {
        tags: ["Books"],
        summary: "更新词书",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookRequest" }
            }
          }
        },
        responses: {
          200: responses.success({ $ref: "#/components/schemas/BookListItem" }),
          404: responses.notFound,
          422: responses.validationError
        }
      },
      delete: {
        tags: ["Books"],
        summary: "删除词书",
        responses: {
          200: responses.emptySuccess(),
          404: responses.notFound,
          409: responses.emptySuccess()
        }
      }
    },
    "/api/v1/books/{bookId}/words": {
      parameters: [
        {
          name: "bookId",
          in: "path",
          required: true,
          schema: { type: "string" }
        }
      ],
      get: {
        tags: ["Books"],
        summary: "列出词书下的词条",
        parameters: [
          {
            name: "query",
            in: "query",
            schema: { type: "string" }
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1 }
          },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 }
          }
        ],
        responses: {
          200: responses.success({ $ref: "#/components/schemas/ListWordsResponse" }),
          404: responses.notFound
        }
      },
      delete: {
        tags: ["Books"],
        summary: "删除词书内所有词条",
        responses: {
          200: responses.success({
            type: "object",
            required: ["deletedCount"],
            properties: {
              deletedCount: { type: "integer" }
            }
          }),
          404: responses.notFound
        }
      }
    },
    "/api/v1/words": {
      get: {
        tags: ["Words"],
        summary: "搜索词条",
        parameters: [
          { name: "query", in: "query", schema: { type: "string" } },
          { name: "bookId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }
        ],
        responses: {
          200: responses.success({ $ref: "#/components/schemas/ListWordsResponse" })
        }
      },
      post: {
        tags: ["Words"],
        summary: "创建词条",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WordRequest" }
            }
          }
        },
        responses: {
          201: responses.success({ $ref: "#/components/schemas/WordDetail" }),
          422: responses.validationError
        }
      }
    },
    "/api/v1/words/{id}": {
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" }
        }
      ],
      get: {
        tags: ["Words"],
        summary: "获取词条详情",
        responses: {
          200: responses.success({ $ref: "#/components/schemas/WordDetail" }),
          404: responses.notFound
        }
      },
      put: {
        tags: ["Words"],
        summary: "更新词条",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/WordRequest" }
            }
          }
        },
        responses: {
          200: responses.success({ $ref: "#/components/schemas/WordDetail" }),
          404: responses.notFound,
          422: responses.validationError
        }
      },
      delete: {
        tags: ["Words"],
        summary: "删除词条",
        responses: {
          200: responses.emptySuccess(),
          404: responses.notFound
        }
      }
    },
    "/api/v1/imports/dry-run": {
      post: {
        tags: ["Imports"],
        summary: "Dry Run 导入",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ImportRequest" }
            }
          }
        },
        responses: {
          200: responses.success({ $ref: "#/components/schemas/ImportSummary" }),
          422: responses.validationError
        }
      }
    },
    "/api/v1/imports": {
      post: {
        tags: ["Imports"],
        summary: "正式导入",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ImportRequest" }
            }
          }
        },
        responses: {
          201: responses.success({ $ref: "#/components/schemas/ImportSummary" }),
          422: responses.validationError
        }
      }
    },
    "/api/clean-data": {
      post: {
        tags: ["Tools"],
        summary: "清洗原始词典 JSON",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CleanDataRequest" }
            }
          }
        },
        responses: {
          200: responses.success({ $ref: "#/components/schemas/CleanDataResult" }),
          400: responses.validationError,
          422: responses.validationError
        }
      }
    },
    "/api/swagger": {
      get: {
        tags: ["Tools"],
        summary: "获取 OpenAPI 文档",
        responses: {
          200: {
            description: "成功",
            content: {
              "application/json": {
                schema: {
                  type: "object"
                }
              }
            }
          }
        }
      }
    }
  }
};
