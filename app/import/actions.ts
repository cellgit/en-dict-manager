"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, actionClient } from "@/lib/safe-action";
import { importWords } from "@/lib/data-import";

const importWordsSchema = z.object({
  payload: z.string().min(1, "请粘贴要导入的 JSON 数据"),
  dryRun: z.boolean().optional(),
  sourceName: z.string().trim().optional().nullable()
});

export const importWordsAction = actionClient(importWordsSchema, async (input) => {
  const { payload, dryRun = false, sourceName } = input;

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch (error) {
    throw new ActionError("JSON 解析失败，请检查格式是否正确。");
  }

  if (!Array.isArray(parsed)) {
    throw new ActionError("导入数据必须是数组，每个元素代表一个单词。请确认格式。");
  }

  const summary = await importWords(parsed, { dryRun, sourceName: sourceName ?? null });

  if (!dryRun) {
    revalidatePath("/words");
  }

  return summary;
});
