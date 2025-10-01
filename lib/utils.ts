import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const zhCnDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

/**
 * 合并 Tailwind class。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 将日期统一格式化为 “YYYY/MM/DD HH:mm:ss” 样式，强制使用 Asia/Shanghai 时区，避免 SSR 与客户端时区差异导致的 Hydration mismatch。
 */
export function formatDateTime(input: Date | string | number | null | undefined): string {
  if (!input) {
    return "";
  }

  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return zhCnDateTimeFormatter.format(value);
}
