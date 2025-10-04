import { NextRequest } from "next/server";

import { createWordInputSchema } from "@/app/words/schemas";
import { handleApiError, validationIssuesToMessage } from "@/lib/api/errors";
import { serializeWord, serializeWordListItem } from "@/lib/api/serializers";
import { failure, success } from "@/lib/api/response";
import { createWord, listWords } from "@/lib/word-service";

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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE);
    const pageSizeRaw = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE);
    const pageSize = Math.min(pageSizeRaw, MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    const query = searchParams.get("query") ?? undefined;
    const bookId = searchParams.get("bookId") ?? undefined;
    const exactParam = searchParams.get("exact");
    const exact = exactParam === "true" || exactParam === "1";

    const listResult = await listWords({
      query,
      bookId,
      skip,
      take: pageSize,
      exact
    });

    return success({
      items: listResult.items.map(serializeWordListItem),
      total: listResult.total,
      page,
      pageSize
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createWordInputSchema.safeParse(body);

    if (!parsed.success) {
      return failure({
        status: 422,
        code: 422,
        message: validationIssuesToMessage(parsed.error),
        data: parsed.error.issues
      });
    }

    const created = await createWord(parsed.data.word);
    return success(serializeWord(created), { status: 201, code: 200, message: "创建成功" });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    return handleApiError(error);
  }
}
