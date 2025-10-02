import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDateTime } from "@/lib/utils";
import type { WordListState } from "@/app/(admin)/words/types";

type WordListPanelProps = {
  state: WordListState;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onSelect: (wordId: string) => void;
  onCreate: () => void;
  loading: boolean;
  selectedId: string | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  variant?: "card" | "plain";
};

export function WordListPanel({
  state,
  query,
  onQueryChange,
  onSearch,
  onSelect,
  onCreate,
  loading,
  selectedId,
  onPageChange,
  onPageSizeChange,
  variant = "card"
}: WordListPanelProps) {
  const isPlain = variant === "plain";
  const totalPages = Math.max(1, Math.ceil(state.total / Math.max(1, state.pageSize)));
  const canGoPrev = state.page > 0;
  const canGoNext = state.page + 1 < totalPages;
  const rangeStart = state.total === 0 ? 0 : state.page * state.pageSize + 1;
  const rangeEnd = state.total === 0 ? 0 : Math.min(state.total, rangeStart + Math.max(0, state.items.length - 1));
  const defaultPageSizes = [10, 20, 50, 100] as const;
  const pageSizes = Array.from(new Set([...defaultPageSizes, state.pageSize])).sort((a, b) => a - b);

  const footerContent = (
    <div
      className={cn(
        "flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        isPlain && "rounded-lg border border-dashed border-border/60 bg-background/50 p-3"
      )}
    >
      <div>
        {state.total === 0 ? "暂无数据" : `显示第 ${rangeStart}-${rangeEnd} 条，共 ${state.total} 条`}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span>每页</span>
          <select
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            value={state.pageSize}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(next) && next !== state.pageSize) {
                onPageSizeChange(next);
              }
            }}
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 text-xs">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canGoPrev}
            onClick={() => onPageChange(Math.max(0, state.page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[6rem] text-center font-medium">
            第 {Math.min(state.page + 1, totalPages)} / {totalPages} 页
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canGoNext}
            onClick={() => onPageChange(Math.min(totalPages - 1, state.page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/80",
        isPlain && "border-none bg-transparent shadow-none"
      )}
    >
      <CardHeader className={cn("space-y-4", isPlain && "p-0 pb-5")}
>
        <CardTitle className="text-lg font-semibold">词条管理</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          搜索、浏览或创建词条。
        </CardDescription>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearch();
              }
            }}
            placeholder="搜索词条或释义（实时搜索）"
            className={cn("pl-9", loading && "pr-9")}
          />
        </div>
        <Button type="button" onClick={onCreate} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          新建词条
        </Button>
      </CardHeader>
      <CardContent
        className={cn(
          "flex-1 overflow-hidden p-0",
          isPlain && "rounded-2xl border border-border/50 bg-background/60"
        )}
      >
        <ScrollArea className="h-full">
          <div className="space-y-2 p-4">
            {state.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                暂无词条，试着调整搜索条件。
              </div>
            ) : (
              state.items.map((item) => {
                const isActive = selectedId === item.id;
                const updatedDisplay = formatDateTime(item.updatedAt) || "未知时间";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "w-full rounded-lg border bg-card p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      isActive
                        ? "border-primary/70 bg-primary/10 hover:bg-primary/15"
                        : "border-transparent hover:border-border/80 hover:bg-card/80"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{item.headword}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.phoneticUs ? `美: ${item.phoneticUs}` : ""}
                          {item.phoneticUs && item.phoneticUk ? " · " : ""}
                          {item.phoneticUk ? `英: ${item.phoneticUk}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                        {item.bookId ? <Badge variant="outline">{item.bookId}</Badge> : null}
                        <span>更新于 {updatedDisplay}</span>
                      </div>
                    </div>
                    {item.rank ? (
                      <div className="mt-3 text-xs text-muted-foreground">Rank {item.rank}</div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {isPlain ? <div className="mt-4">{footerContent}</div> : <CardFooter>{footerContent}</CardFooter>}
    </Card>
  );
}
