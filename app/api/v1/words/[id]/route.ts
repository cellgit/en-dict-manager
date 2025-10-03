import { NextRequest } from "next/server";
import { z } from "zod";

import { normalizedWordSchema } from "@/app/words/schemas";
import { handleApiError, validationIssuesToMessage } from "@/lib/api/errors";
import { serializeWord } from "@/lib/api/serializers";
import { failure, success } from "@/lib/api/response";
import { deleteWord, getWordById, updateWord } from "@/lib/word-service";

const updateWordBodySchema = z.object({
  word: normalizedWordSchema
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const word = await getWordById(params.id);
    return success(serializeWord(word));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = updateWordBodySchema.safeParse(body);

    if (!parsed.success) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(parsed.error),
        data: parsed.error.issues
      });
    }

    const updated = await updateWord(params.id, parsed.data.word);
    return success(serializeWord(updated), { message: "更新成功" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteWord(params.id);
    return success({ success: true }, { message: "删除成功" });
  } catch (error) {
    return handleApiError(error);
  }
}
