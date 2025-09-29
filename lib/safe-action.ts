import "server-only";

import { DEFAULT_SERVER_ERROR, createSafeActionClient } from "next-safe-action";

/**
 * 统一的业务错误类型，便于在客户端展示自定义消息。
 */
export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * 统一的 Server Action 客户端，集中处理错误日志与错误消息映射。
 */
export const actionClient = createSafeActionClient({
  handleServerErrorLog(error: Error) {
    console.error("[ServerActionError]", error);
  },
  handleReturnedServerError(error: Error) {
    if (error instanceof ActionError) {
      return error.message;
    }
    return DEFAULT_SERVER_ERROR;
  }
});
