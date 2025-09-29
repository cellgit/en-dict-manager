/** @jest-environment node */

import type { ImportSummary } from "@/lib/data-import";
import { importWords } from "@/lib/data-import";
import { prisma } from "@/lib/prisma";
import {
  createWordWithinTransaction,
  replaceWordWithinTransaction
} from "@/lib/word-service";
import type { NormalizedWord } from "@/lib/types";

jest.mock("@/lib/prisma", () => {
  const tx = {
    dict_word: {
      findFirst: jest.fn()
    },
    dict_import_log: {
      create: jest.fn()
    }
  };

  return {
    prisma: {
      dict_import_batch: {
        create: jest.fn(),
        update: jest.fn()
      },
      dict_import_log: {
        create: jest.fn()
      },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
      _tx: tx
    }
  };
});

jest.mock("@/lib/word-service", () => ({
  createWordWithinTransaction: jest.fn(),
  replaceWordWithinTransaction: jest.fn()
}));

const sampleWord: NormalizedWord = {
  headword: "ruler",
  rank: 1,
  bookId: "Book-1",
  phoneticUs: null,
  phoneticUk: null,
  audioUs: null,
  audioUk: null,
  memoryTip: null,
  definitions: [],
  examples: [],
  synonymGroups: [],
  phrases: [],
  relatedWords: []
};

const getPrismaMock = () => prisma as unknown as {
  dict_import_batch: {
    create: jest.Mock;
    update: jest.Mock;
  };
  dict_import_log: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
  _tx: {
    dict_word: {
      findFirst: jest.Mock;
    };
    dict_import_log: {
      create: jest.Mock;
    };
  };
};

const getWordServiceMock = () => ({
  createWordWithinTransaction: createWordWithinTransaction as jest.Mock,
  replaceWordWithinTransaction: replaceWordWithinTransaction as jest.Mock
});

const resetMocks = () => {
  const prismaMock = getPrismaMock();
  prismaMock.dict_import_batch.create.mockReset();
  prismaMock.dict_import_batch.update.mockReset();
  prismaMock.dict_import_log.create.mockReset();
  prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock._tx));
  prismaMock._tx.dict_word.findFirst.mockReset();
  prismaMock._tx.dict_import_log.create.mockReset();

  const wordServiceMock = getWordServiceMock();
  wordServiceMock.createWordWithinTransaction.mockReset();
  wordServiceMock.replaceWordWithinTransaction.mockReset();
};

describe("importWords", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("returns summary without touching database in dry run", async () => {
    const wordServiceMock = getWordServiceMock();
    const prismaMock = getPrismaMock();

    const summary = await importWords([sampleWord], { dryRun: true });

    const expected: ImportSummary = {
      total: 1,
      success: 1,
      skipped: 0,
      failed: 0,
      batchId: null,
      errors: []
    };

    expect(summary).toEqual(expected);
    expect(prismaMock.dict_import_batch.create).not.toHaveBeenCalled();
    expect(wordServiceMock.createWordWithinTransaction).not.toHaveBeenCalled();
  });

  it("creates words and logs successes when not dry run", async () => {
    const prismaMock = getPrismaMock();
    const wordServiceMock = getWordServiceMock();

    prismaMock.dict_import_batch.create.mockResolvedValue({ id: "batch-123" });
    prismaMock._tx.dict_word.findFirst.mockResolvedValue(null);
    wordServiceMock.createWordWithinTransaction.mockResolvedValue("word-123");
    prismaMock._tx.dict_import_log.create.mockResolvedValue({});
    prismaMock.dict_import_batch.update.mockResolvedValue({});

    const summary = await importWords([sampleWord], { dryRun: false, sourceName: "Dataset" });

    expect(summary.batchId).toBe("batch-123");
    expect(summary.success).toBe(1);
    expect(summary.failed).toBe(0);
    expect(wordServiceMock.createWordWithinTransaction).toHaveBeenCalledWith(expect.anything(), sampleWord);
    expect(prismaMock._tx.dict_import_log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "success", word_id: "word-123" })
      })
    );
    expect(prismaMock.dict_import_batch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "batch-123" },
        data: expect.objectContaining({ success_count: 1 })
      })
    );
  });

  it("records skipped entries when validation fails", async () => {
    const prismaMock = getPrismaMock();
    prismaMock.dict_import_batch.create.mockResolvedValue({ id: "batch-skip" });
    prismaMock.dict_import_batch.update.mockResolvedValue({});

    const invalidEntry = { foo: "bar" };
    const summary = await importWords([invalidEntry], { dryRun: false });

    expect(summary.skipped).toBe(1);
    expect(summary.success).toBe(0);
    expect(summary.errors[0].status).toBe("skipped");
    expect(prismaMock.dict_import_log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "skipped" })
      })
    );
  });

  it("records failures when word persistence throws", async () => {
    const prismaMock = getPrismaMock();
    const wordServiceMock = getWordServiceMock();

    prismaMock.dict_import_batch.create.mockResolvedValue({ id: "batch-fail" });
    prismaMock.dict_import_batch.update.mockResolvedValue({});
    prismaMock._tx.dict_word.findFirst.mockResolvedValue({ id: "existing" });
    wordServiceMock.replaceWordWithinTransaction.mockRejectedValue(new Error("boom"));

    const summary = await importWords([sampleWord], { dryRun: false });

    expect(summary.failed).toBe(1);
    expect(summary.errors[0]).toEqual(
      expect.objectContaining({
        headword: sampleWord.headword,
        status: "failed"
      })
    );
    expect(prismaMock.dict_import_log.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "failed", message: "boom" })
      })
    );
  });
});
