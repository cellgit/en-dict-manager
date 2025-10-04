/** @jest-environment node */

import { listWords } from "@/lib/word-service";
import { prisma } from "@/lib/prisma";

type DictWordRow = {
  id: string;
  headword: string;
  rank: number | null;
  book_id: string | null;
  phonetic_us: string | null;
  phonetic_uk: string | null;
  updated_at: Date;
};

jest.mock("@/lib/prisma", () => {
  const findMany = jest.fn();
  const count = jest.fn();
  const $queryRaw = jest.fn();

  return {
    prisma: {
      dict_word: {
        findMany,
        count
      },
      $queryRaw,
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) => Promise.all(operations))
    }
  };
});

describe("listWords exact search", () => {
  const sampleRow: DictWordRow = {
    id: "word-1",
    headword: "apple",
    rank: 1,
    book_id: null,
    phonetic_us: "ˈæpəl",
    phonetic_uk: "ˈæp(ə)l",
    updated_at: new Date("2024-01-01T00:00:00Z")
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a single result when headword matches exactly", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([sampleRow]);

    const result = await listWords({ query: "apple", exact: true });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ headword: "apple" });
  });

  it("returns empty result when no word matches exactly", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

    const result = await listWords({ query: "banana", exact: true });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it("includes book filter when provided", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([sampleRow]);

    await listWords({ query: "apple", exact: true, bookId: "Book-A" });

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    const sqlArg = (prisma.$queryRaw as jest.Mock).mock.calls[0][0] as { values?: unknown[] };
    expect(sqlArg?.values ?? []).toContain("Book-A");
  });

  it("respects pagination skip for exact match", async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([sampleRow]);

    const result = await listWords({ query: "apple", exact: true, skip: 1 });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(0);
  });
});
