import { ZodError } from "zod";

import { NotFoundError, ValidationError } from "@/lib/errors";
import { failure } from "@/lib/api/response";

const ZOD_ERROR_SEPARATOR = "；";

export function validationIssuesToMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join(ZOD_ERROR_SEPARATOR);
}

export function handleApiError(error: unknown) {
  if (error instanceof NotFoundError) {
    return failure({ status: 404, code: 404, message: error.message });
  }

  if (error instanceof ValidationError) {
    return failure({ status: 422, code: 422, message: error.message });
  }

  if (error instanceof ZodError) {
    return failure({
      status: 422,
      code: 422,
      message: validationIssuesToMessage(error),
      data: error.issues
    });
  }

  if (error instanceof Error) {
    console.error("[API] Unexpected error", error);
    return failure({ status: 500, code: 500, message: error.message });
  }

  console.error("[API] Unknown error", error);
  return failure({ status: 500, code: 500, message: "服务器内部错误" });
}
