import { NextRequest } from "next/server";

import { bookUpdateSchema } from "@/app/books/schemas";
import { handleApiError, validationIssuesToMessage } from "@/lib/api/errors";
import { success, failure } from "@/lib/api/response";
import { serializeBook } from "@/lib/api/serializers";
import {
  deleteBook,
  getBookByBookId,
  updateBook
} from "@/lib/book-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const book = await getBookByBookId(params.bookId);
    return success(serializeBook(book));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const body = await request.json();
    const parsed = bookUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(parsed.error),
        data: parsed.error.issues
      });
    }

    const existing = await getBookByBookId(params.bookId);
    const updated = await updateBook(existing.id, parsed.data);
    return success(serializeBook(updated), { message: "更新成功" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const existing = await getBookByBookId(params.bookId);
    await deleteBook(existing.id);
    return success({ success: true }, { message: "删除成功" });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("无法删除单词书")) {
      return failure({ status: 409, code: 409, message: error.message });
    }

    return handleApiError(error);
  }
}
