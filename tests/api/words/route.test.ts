/** @jest-environment node */

import type { NextRequest } from "next/server";

import { GET } from "@/app/api/v1/words/route";
import type { ListWordsResult } from "@/lib/types";
import { listWords } from "@/lib/word-service";

type MockNextRequest = NextRequest & {
  nextUrl: URL;
};

jest.mock("@/lib/word-service", () => ({
  listWords: jest.fn()
}));

const createRequest = (url: string): MockNextRequest => ({
  nextUrl: new URL(url)
}) as unknown as MockNextRequest;

const sampleWord = {
  id: "word-1",
  headword: "Apple",
  rank: 1,
  bookId: null,
  phoneticUs: null,
  phoneticUk: null,
  updatedAt: new Date("2024-01-01T00:00:00Z")
};

describe("GET /api/v1/words", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("short-circuits to exact search when query matches", async () => {
    (listWords as jest.Mock).mockResolvedValueOnce({
      total: 1,
      items: [sampleWord]
    } satisfies ListWordsResult);

    const response = await GET(createRequest("http://localhost/api/v1/words?query=Apple"));
    const body = await response.json();

    expect(listWords).toHaveBeenCalledTimes(1);
    expect(listWords).toHaveBeenCalledWith({
      query: "Apple",
      bookId: undefined,
      skip: 0,
      take: 20,
      exact: true
    });
    expect(body.data.total).toBe(1);
    expect(body.data.items).toHaveLength(1);
  });

  it("falls back to fuzzy search when exact match not found", async () => {
    (listWords as jest.Mock)
      .mockResolvedValueOnce({ total: 0, items: [] })
      .mockResolvedValueOnce({
        total: 2,
        items: [sampleWord, { ...sampleWord, id: "word-2" }]
      } satisfies ListWordsResult);

    const response = await GET(createRequest("http://localhost/api/v1/words?query=app&page=1&pageSize=10"));
    const body = await response.json();

    expect(listWords).toHaveBeenCalledTimes(2);
    expect((listWords as jest.Mock).mock.calls[0][0]).toEqual({
      query: "app",
      bookId: undefined,
      skip: 0,
      take: 10,
      exact: true
    });
    expect((listWords as jest.Mock).mock.calls[1][0]).toEqual({
      query: "app",
      bookId: undefined,
      skip: 0,
      take: 10,
      exact: false
    });
    expect(body.data.total).toBe(2);
    expect(body.data.items).toHaveLength(2);
  });

  it("respects explicit exact parameter", async () => {
    (listWords as jest.Mock).mockResolvedValueOnce({
      total: 0,
      items: []
    } satisfies ListWordsResult);

    await GET(createRequest("http://localhost/api/v1/words?query=Apple&exact=false"));

    expect(listWords).toHaveBeenCalledTimes(1);
    expect(listWords).toHaveBeenCalledWith({
      query: "Apple",
      bookId: undefined,
      skip: 0,
      take: 20,
      exact: false
    });
  });
});
