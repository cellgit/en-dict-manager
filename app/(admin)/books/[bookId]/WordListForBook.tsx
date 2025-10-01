"use client";

import { useMemo } from "react";
import type { ListWordsResult } from "@/lib/types";
import WordManager from "@/app/(admin)/words/WordManager";

type WordListForBookProps = {
  readonly initialList: ListWordsResult;
  readonly bookId: string;
  readonly bookName: string;
};

export default function WordListForBook({ initialList, bookId, bookName }: WordListForBookProps) {
  // 传递 bookId 作为筛选条件
  const contextInfo = useMemo(() => ({
    bookId,
    bookName
  }), [bookId, bookName]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">当前单词书: {bookName}</p>
        <p className="text-xs text-muted-foreground">
          以下是该单词书中的所有单词，您可以搜索、编辑或新建单词。
        </p>
      </div>

      {/* 复用 WordManager 组件,但传入 bookId 上下文 */}
      <WordManager initialList={initialList} filterBookId={bookId} />
    </div>
  );
}
