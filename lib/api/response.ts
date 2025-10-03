import { NextResponse } from "next/server";

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message: string;
}

export type SuccessResponseInit = {
  status?: number;
  code?: number;
  message?: string;
};

export type ErrorResponseInit = {
  status?: number;
  code?: number;
  message?: string;
  data?: unknown;
};

export function success<T>(
  data: T,
  init: SuccessResponseInit = {}
): NextResponse<ApiEnvelope<T>> {
  const { status = 200, code = 200, message = "成功" } = init;
  return NextResponse.json<ApiEnvelope<T>>(
    {
      code,
      data,
      message
    },
    { status }
  );
}

export function failure(
  init: ErrorResponseInit = {}
): NextResponse<ApiEnvelope<unknown>> {
  const { status = 500, code, message = "服务器内部错误", data = null } = init;
  return NextResponse.json<ApiEnvelope<unknown>>(
    {
      code: code ?? status,
      data,
      message
    },
    { status }
  );
}
