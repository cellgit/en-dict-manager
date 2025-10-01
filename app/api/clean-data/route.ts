import { NextRequest, NextResponse } from "next/server";
import { cleanJsonData, type CleanResult } from "@/lib/clean-data";

/**
 * POST /api/clean-data
 * 清洗原始 JSON 数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rawData } = body;

    if (!rawData || typeof rawData !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "缺少 rawData 参数或参数类型错误",
          logs: []
        } satisfies CleanResult,
        { status: 400 }
      );
    }

    // 执行清洗
    const result = await cleanJsonData(rawData);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 422 }); // Unprocessable Entity
    }
  } catch (error) {
    console.error("[clean-data] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "清洗数据时发生未知错误",
        logs: []
      } satisfies CleanResult,
      { status: 500 }
    );
  }
}
