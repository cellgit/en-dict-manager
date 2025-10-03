import { NextRequest } from "next/server";

import { failure, success } from "@/lib/api/response";
import { cleanJsonData } from "@/lib/clean-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawData } = body ?? {};

    if (typeof rawData !== "string" || rawData.trim().length === 0) {
      return failure({
        status: 400,
        code: 400,
        message: "缺少 rawData 参数或参数类型错误",
        data: null
      });
    }

    const result = await cleanJsonData(rawData);

    if (result.success) {
      return success(result, { status: 200, code: 200 });
    }

    return failure({
      status: 422,
      code: 422,
      message: result.error ?? "清洗数据失败",
      data: result
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return failure({ status: 400, code: 400, message: "请求体解析失败" });
    }

    console.error("[clean-data] Unexpected error:", error);
    return failure({ status: 500, code: 500, message: "清洗数据时发生未知错误" });
  }
}
