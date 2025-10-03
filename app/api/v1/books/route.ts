import { NextRequest } from "next/server";
import { z } from "zod";

import { bookInputSchema } from "@/app/books/schemas";
import { validationIssuesToMessage } from "@/lib/api/errors";
import { serializeBook, serializeBookListItem } from "@/lib/api/serializers";
import { failure, success } from "@/lib/api/response";
import { createBook, listBooks } from "@/lib/book-service";

const createBookBodySchema = bookInputSchema;

export async function GET() {
  const books = await listBooks();
  return success({
    items: books.map(serializeBookListItem),
    total: books.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBookBodySchema.safeParse(body);

    if (!parsed.success) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(parsed.error),
        data: parsed.error.issues
      });
    }

    const created = await createBook(parsed.data);
    return success(serializeBook(created), { status: 201, code: 200, message: "创建成功" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    if (error instanceof z.ZodError) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(error),
        data: error.issues
      });
    }

    console.error("[API] /api/v1/books POST", error);
    return failure({ status: 500, code: 500, message: error instanceof Error ? error.message : "服务器内部错误" });
  }
}
