"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Loader2, Edit3, Trash2, GraduationCap, Users } from "lucide-react";

import type { BookListItem } from "@/lib/book-service";
import {
  listBooksAction,
  createBookAction,
  updateBookAction,
  deleteBookAction
} from "@/app/books/actions";
import type { BookInput } from "@/app/books/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/utils";

type BookManagerProps = {
  readonly initialBooks: BookListItem[];
};

type FormMode = "create" | "edit";

const emptyBook = (): BookInput => ({
  bookId: "",
  name: "",
  description: null,
  coverUrl: null,
  grade: null,
  level: null,
  publisher: null,
  tags: [],
  sortOrder: null,
  isActive: true
});

export default function BookManager({ initialBooks }: BookManagerProps) {
  const router = useRouter();
  const [books, setBooks] = useState<BookListItem[]>(initialBooks);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [editingBook, setEditingBook] = useState<BookListItem | null>(null);
  const [formData, setFormData] = useState<BookInput>(emptyBook());
  const [error, setError] = useState<string | null>(null);

  const listAction = useAction(listBooksAction, {
    onSuccess: (result) => {
      setBooks(result);
      setError(null);
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "加载单词书列表失败";
      setError(message);
    }
  });

  const createAction = useAction(createBookAction, {
    onSuccess: () => {
      setError(null);
      setFormMode(null);
      void listAction.execute({});
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "创建单词书失败";
      setError(message);
    }
  });

  const updateAction = useAction(updateBookAction, {
    onSuccess: () => {
      setError(null);
      setFormMode(null);
      setEditingBook(null);
      void listAction.execute({});
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "更新单词书失败";
      setError(message);
    }
  });

  const deleteAction = useAction(deleteBookAction, {
    onSuccess: () => {
      setError(null);
      void listAction.execute({});
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "删除单词书失败";
      setError(message);
    }
  });

  const handleCreate = useCallback(() => {
    setFormMode("create");
    setEditingBook(null);
    setFormData(emptyBook());
    setError(null);
  }, []);

  const handleEdit = useCallback((book: BookListItem) => {
    setFormMode("edit");
    setEditingBook(book);
    setFormData({
      bookId: book.bookId,
      name: book.name,
      description: null,
      coverUrl: book.coverUrl,
      grade: book.grade,
      level: book.level,
      publisher: book.publisher,
      tags: [],
      sortOrder: book.sortOrder,
      isActive: book.isActive
    });
    setError(null);
  }, []);

  const handleDelete = useCallback(
    (book: BookListItem) => {
      if (book.wordCount > 0) {
        setError(`无法删除：该单词书还有 ${book.wordCount} 个单词。请先删除或转移单词。`);
        return;
      }

      // eslint-disable-next-line no-alert
      if (globalThis.confirm?.(`确定要删除单词书"${book.name}"吗？`)) {
        void deleteAction.execute({ id: book.id });
      }
    },
    [deleteAction]
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (formMode === "create") {
        void createAction.execute({ book: formData });
      } else if (formMode === "edit" && editingBook) {
        void updateAction.execute({ id: editingBook.id, book: formData });
      }
    },
    [createAction, editingBook, formData, formMode, updateAction]
  );

  const handleSheetClose = useCallback(() => {
    setFormMode(null);
    setEditingBook(null);
    setError(null);
  }, []);

  const handleViewWords = useCallback(
    (book: BookListItem) => {
      router.push(`/books/${book.bookId}`);
    },
    [router]
  );

  const submitting = createAction.status === "executing" || updateAction.status === "executing";

  return (
    <>
      <Sheet open={formMode !== null} onOpenChange={(open) => !open && handleSheetClose()}>
        <div className="space-y-10">
          <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-background">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/20 blur-3xl opacity-60" />
            <div className="relative flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-5">
                <Badge variant="outline" className="w-fit border-primary/60 bg-primary/10 text-primary">
                  单词书管理中心
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    管理你的单词书库
                  </h1>
                  <p className="text-base text-muted-foreground sm:text-lg">
                    创建和管理不同教材的单词书，组织学习内容。
                  </p>
                </div>
                <Button type="button" onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建单词书
                </Button>
              </div>

              <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-background/80 p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    单词书总数
                  </span>
                  <span className="text-2xl font-semibold">{books.length}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-background/80 p-4 shadow-sm">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    单词总数
                  </span>
                  <span className="text-2xl font-semibold">
                    {books.reduce((sum, b) => sum + b.wordCount, 0)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {error && !formMode ? (
            <Alert variant="destructive">
              <AlertTitle>操作失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card
                key={book.id}
                className="group transition-all hover:border-primary/50 hover:shadow-md"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-lg">{book.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {book.bookId}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{book.wordCount} 词</Badge>
                  </div>
                  {book.grade || book.level || book.publisher ? (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {book.grade ? (
                        <span className="inline-flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {book.grade}
                        </span>
                      ) : null}
                      {book.level ? <Badge variant="outline">{book.level}</Badge> : null}
                      {book.publisher ? (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {book.publisher}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    更新于 {formatDateTime(book.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleViewWords(book)}
                      className="flex-1"
                    >
                      <BookOpen className="mr-2 h-3.5 w-3.5" />
                      查看单词
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(book)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(book)}
                      disabled={deleteAction.status === "executing"}
                    >
                      {deleteAction.status === "executing" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {books.length === 0 ? (
              <Card className="col-span-full flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">暂无单词书</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  点击上方按钮创建你的第一本单词书
                </p>
              </Card>
            ) : null}
          </div>
        </div>

        {formMode ? (
          <BookEditorSheet
            mode={formMode}
            formData={formData}
            onClose={handleSheetClose}
            onSubmit={handleSubmit}
            submitting={submitting}
            setFormData={setFormData}
            error={error}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function BookEditorSheet({
  mode,
  formData,
  onClose,
  onSubmit,
  submitting,
  setFormData,
  error
}: {
  mode: FormMode;
  formData: BookInput;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  setFormData: (value: BookInput) => void;
  error: string | null;
}) {
  const title = mode === "create" ? "新建单词书" : "编辑单词书";

  const updateField = useCallback(
    <K extends keyof BookInput>(key: K, value: BookInput[K]) => {
      setFormData({ ...formData, [key]: value });
    },
    [formData, setFormData]
  );

  return (
    <SheetContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-2xl flex-col gap-0 p-0">
      <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>填写单词书信息，保存后将立即生效。</SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="bookId">
              单词书 ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="bookId"
              required
              value={formData.bookId}
              onChange={(e) => updateField("bookId", e.target.value)}
              placeholder="例如: PEPXiaoXue3_1"
              disabled={mode === "edit"}
            />
            <p className="text-xs text-muted-foreground">
              用于标识单词书的唯一ID，创建后不可修改
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              单词书名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="例如: 人教版小学三年级上册"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) => updateField("description", e.target.value || null)}
              rows={3}
              placeholder="单词书的详细描述"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="grade">年级</Label>
              <Input
                id="grade"
                value={formData.grade ?? ""}
                onChange={(e) => updateField("grade", e.target.value || null)}
                placeholder="例如: 三年级"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">难度等级</Label>
              <Input
                id="level"
                value={formData.level ?? ""}
                onChange={(e) => updateField("level", e.target.value || null)}
                placeholder="例如: 初级"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">出版社</Label>
            <Input
              id="publisher"
              value={formData.publisher ?? ""}
              onChange={(e) => updateField("publisher", e.target.value || null)}
              placeholder="例如: 人民教育出版社"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">排序</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder ?? ""}
              onChange={(e) => {
                const val = e.target.value === "" ? null : parseInt(e.target.value, 10);
                updateField("sortOrder", val);
              }}
              placeholder="数字越小越靠前"
            />
          </div>
        </div>

        <SheetFooter className="gap-4 border-t border-border/60 px-6 py-4">
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>提交失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <SheetClose asChild>
              <Button type="button" variant="ghost" onClick={onClose}>
                取消
              </Button>
            </SheetClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : mode === "create" ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  创建单词书
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  保存修改
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
