import { Prisma } from "@prisma/client";
import { normalizedWordSchema } from "@/app/words/schemas";
import { normalizeDictionaryEntry } from "@/lib/dataset-normalizer";
import { prisma } from "@/lib/prisma";
import type { NormalizedWord } from "@/lib/types";
import {
  createWordWithinTransaction,
  replaceWordWithinTransaction
} from "@/lib/word-service";

export type ImportErrorStatus = "skipped" | "failed";

export interface ImportErrorDetail {
  index: number;
  headword: string;
  reason: string;
  status: ImportErrorStatus;
}

export interface ImportSummary {
  total: number;
  success: number;
  skipped: number;
  failed: number;
  batchId: string | null;
  errors: ImportErrorDetail[];
}

export interface ImportOptions {
  dryRun?: boolean;
  sourceName?: string | null;
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `数据库错误 (${error.code})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "未知错误";
};

const pickHeadword = (value: unknown, fallback: string) => {
  if (value && typeof value === "object" && "headword" in value) {
    const head = (value as { headword?: unknown }).headword;
    if (typeof head === "string" && head.trim().length > 0) {
      return head.trim();
    }
  }
  return fallback;
};

export async function importWords(
  rawWords: unknown[],
  options: ImportOptions = {}
): Promise<ImportSummary> {
  const { dryRun = false, sourceName = null } = options;

  const summary: ImportSummary = {
    total: rawWords.length,
    success: 0,
    skipped: 0,
    failed: 0,
    batchId: null,
    errors: []
  };

  const errors: ImportErrorDetail[] = [];
  const validWords: { index: number; word: NormalizedWord }[] = [];

  rawWords.forEach((entry, index) => {
    const parsed = normalizedWordSchema.safeParse(entry);
    if (parsed.success) {
      validWords.push({ index, word: parsed.data });
      return;
    }

    const normalizedResult = normalizeDictionaryEntry(entry);
    if (normalizedResult.ok) {
      validWords.push({ index, word: normalizedResult.word });
      return;
    }

    const schemaReason = parsed.error.errors.map((err) => err.message).join("；");
    const reasonParts = [schemaReason, normalizedResult.reason].filter(
      (value): value is string => Boolean(value && value.trim())
    );
    const reason = reasonParts.length > 0 ? [...new Set(reasonParts)].join("；") : "数据格式无法识别";

    errors.push({
      index,
      headword: pickHeadword(entry, `#${index + 1}`),
      reason,
      status: "skipped"
    });
    summary.skipped += 1;
  });

  const duplicateTracker = new Map<string, number>();
  const deduplicatedWords: { index: number; word: NormalizedWord }[] = [];

  for (const item of validWords) {
    const key = `${item.word.headword.trim().toLowerCase()}::${item.word.bookId ?? ""}`;
    if (!duplicateTracker.has(key)) {
      duplicateTracker.set(key, item.index);
      deduplicatedWords.push(item);
      continue;
    }

    const firstIndex = duplicateTracker.get(key)!;
    errors.push({
      index: item.index,
      headword: item.word.headword,
      reason: `与第 ${firstIndex + 1} 条的数据 (word/book_id) 完全相同，已跳过`,
      status: "skipped"
    });
    summary.skipped += 1;
  }

  let batchId: string | null = null;

  if (!dryRun) {
    const batch = await prisma.dict_import_batch.create({
      data: {
        source_name: sourceName,
        total_count: summary.total,
        success_count: 0,
        skipped_count: summary.skipped,
        error_details: Prisma.JsonNull
      }
    });
    batchId = batch.id;
    summary.batchId = batch.id;

    for (const detail of errors.filter((error) => error.status === "skipped")) {
      await prisma.dict_import_log.create({
        data: {
          batch_id: batch.id,
          word_id: null,
          raw_headword: detail.headword,
          status: "skipped",
          message: detail.reason
        }
      });
    }
  }

  for (const item of deduplicatedWords) {
    if (dryRun) {
      summary.success += 1;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.dict_word.findFirst({
          where: {
            headword: item.word.headword.trim(),
            book_id: item.word.bookId ?? null
          },
          select: { id: true }
        });

        let wordId: string;
        if (existing) {
          await replaceWordWithinTransaction(tx, existing.id, item.word);
          wordId = existing.id;
        } else {
          wordId = await createWordWithinTransaction(tx, item.word);
        }

        await tx.dict_import_log.create({
          data: {
            batch_id: batchId!,
            word_id: wordId,
            raw_headword: item.word.headword,
            status: "success",
            message: existing ? "updated" : "created"
          }
        });
      });

      summary.success += 1;
    } catch (error) {
      const reason = getErrorMessage(error);
      errors.push({
        index: item.index,
        headword: item.word.headword,
        reason,
        status: "failed"
      });
      summary.failed += 1;

      if (batchId) {
        await prisma.dict_import_log.create({
          data: {
            batch_id: batchId,
            word_id: null,
            raw_headword: item.word.headword,
            status: "failed",
            message: reason
          }
        });
      }
    }
  }

  summary.errors = errors;
  summary.failed = Math.max(0, summary.total - summary.success - summary.skipped);

  if (!dryRun && batchId) {
    await prisma.dict_import_batch.update({
      where: { id: batchId },
      data: {
        success_count: summary.success,
        skipped_count: summary.skipped,
        error_details: errors.length > 0 ? (errors as unknown as Prisma.InputJsonValue) : Prisma.JsonNull
      }
    });
  }

  return summary;
}
