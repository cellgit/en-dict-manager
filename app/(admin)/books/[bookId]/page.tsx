import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getBookByBookId } from "@/lib/book-service";
import { listWords } from "@/lib/word-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WordListForBook from "@/app/(admin)/books/[bookId]/WordListForBook";

type PageProps = {
  params: Promise<{ bookId: string }>;
};

export default async function BookDetailPage(props: PageProps) {
  const params = await props.params;
  const bookId = params.bookId;

  try {
    const book = await getBookByBookId(bookId);
    const wordList = await listWords({ bookId, take: 20 });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/books">
              <ChevronLeft className="mr-2 h-4 w-4" />
              返回单词书列表
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">{book.name}</h1>
                <p className="text-sm text-muted-foreground">{book.bookId}</p>
              </div>
              <Badge variant="secondary" className="text-base">
                {book.wordCount} 个单词
              </Badge>
            </div>

            {book.description ? (
              <p className="text-sm text-muted-foreground">{book.description}</p>
            ) : null}

            <div className="flex flex-wrap gap-2 text-sm">
              {book.grade ? (
                <Badge variant="outline">年级: {book.grade}</Badge>
              ) : null}
              {book.level ? (
                <Badge variant="outline">难度: {book.level}</Badge>
              ) : null}
              {book.publisher ? (
                <Badge variant="outline">出版社: {book.publisher}</Badge>
              ) : null}
            </div>
          </div>
        </div>

        <WordListForBook initialList={wordList} bookId={bookId} bookName={book.name} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
