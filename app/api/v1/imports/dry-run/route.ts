import { NextRequest } from "next/server";
import { z } from "zod";

import { validationIssuesToMessage } from "@/lib/api/errors";
import { serializeImportSummary } from "@/lib/api/serializers";
import { failure, success } from "@/lib/api/response";
import { importWords } from "@/lib/data-import";

const dryRunBodySchema = z.object({
  words: z.array(z.unknown()).nonempty("words 不能为空"),
  sourceName: z.string().trim().optional().nullable()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = dryRunBodySchema.safeParse(body);

    if (!parsed.success) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(parsed.error),
        data: parsed.error.issues
      });
    }

    const summary = await importWords(parsed.data.words, {
      dryRun: true,
      sourceName: parsed.data.sourceName ?? null
    });

    return success(serializeImportSummary(summary), {
      message: "Dry Run 完成"
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    console.error("[API] /api/v1/imports/dry-run POST", error);
    return failure({ status: 500, code: 500, message: error instanceof Error ? error.message : "服务器内部错误" });
  }
}
