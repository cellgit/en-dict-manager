import { NextRequest } from "next/server";

import { handleApiError } from "@/lib/api/errors";
import { serializeWordListItem } from "@/lib/api/serializers";
import { success } from "@/lib/api/response";
import { deleteAllWordsInBook } from "@/lib/book-service";
import { listWords } from "@/lib/word-service";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePositiveInt = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const pageSizeRaw = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);
    const rawQuery = searchParams.get("query");
    const query = rawQuery?.trim() ?? undefined;
    const exactParam = searchParams.get("exact");
    const exactProvided = exactParam !== null;
    const exact = exactProvided && (exactParam === "true" || exactParam === "1");
    const skip = (page - 1) * pageSize;

    if (!exactProvided && query && page === DEFAULT_PAGE) {
      const exactResult = await listWords({
        bookId: params.bookId,
        query,
        skip: 0,
        take: pageSize,
        exact: true
      });

      if (exactResult.total > 0) {
        return success({
          items: exactResult.items.map(serializeWordListItem),
          total: exactResult.total,
          page,
          pageSize
        });
      }
    }

    const result = await listWords({
      bookId: params.bookId,
      query,
      skip,
      take: pageSize,
      exact
    });

    return success({
      items: result.items.map(serializeWordListItem),
      total: result.total,
      page,
      pageSize
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const deletedCount = await deleteAllWordsInBook(params.bookId);
    return success({ deletedCount }, { message: "已删除全部词条" });
  } catch (error) {
    return handleApiError(error);
  }
}
