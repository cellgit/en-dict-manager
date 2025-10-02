"use client";

import { Plus, Search } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";

import { WordListPanel } from "./components/WordListPanel";
import { WordDetailPanel } from "./components/WordDetailPanel";
import { WordEditorSheet } from "./components/WordEditorSheet";
import { useWordManager } from "./hooks/useWordManager";
import type { ListWordsResult } from "@/lib/types";

type WordManagerProps = {
  readonly initialList: ListWordsResult;
  readonly filterBookId?: string;
};

export default function WordManager({ initialList, filterBookId }: WordManagerProps) {
  const {
    query,
    setQuery,
    listState,
    loadingList,
    selectedId,
    formMode,
    formData,
    setFormData,
    error,
    listSheetOpen,
    setListSheetOpen,
    openListSheet,
    handleSearchSubmit,
    handleSelect,
    handleCreate,
    handlePageChange,
    handlePageSizeChange,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleSheetClose,
    viewModel,
    loadingDetail,
    submitting,
    deleting,
    submitDisabled,
    metrics
  } = useWordManager({ initialList, filterBookId });

  return (
    <TooltipProvider delayDuration={150}>
      <>
        <Sheet open={formMode !== null} onOpenChange={(open) => !open && handleSheetClose()}>
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-background">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/20 opacity-60 blur-3xl md:left-auto md:right-0 md:translate-x-1/3" />
              <div className="relative flex flex-col gap-7 p-6 sm:p-8 lg:p-9 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl space-y-5">
                  <Badge variant="outline" className="w-fit border-primary/60 bg-primary/10 text-primary">
                    智能词条工作台
                  </Badge>
                  <div className="space-y-3">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      管理教材词条的中心舞台
                    </h1>
                    <p className="text-base text-muted-foreground sm:text-lg">
                      在同一处完成查询、创建与审阅，帮助团队保持教材与导入内容的一致性。
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      新建词条
                    </Button>
                    <Button type="button" variant="secondary" className="xl:hidden" onClick={openListSheet}>
                      <Search className="mr-2 h-4 w-4" />
                      浏览词条
                    </Button>
                  </div>
                </div>

                <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3">
                  {metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-background/80 p-4 shadow-sm backdrop-blur"
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {metric.label}
                      </span>
                      <span className="text-2xl font-semibold text-foreground">{metric.value}</span>
                      <span className="text-xs text-muted-foreground">{metric.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[560px,1fr] 2xl:grid-cols-[640px,1fr]">
              <div className="hidden xl:block">
                <WordListPanel
                  state={listState}
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearchSubmit}
                  onSelect={handleSelect}
                  onCreate={handleCreate}
                  loading={loadingList}
                  selectedId={selectedId}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground xl:hidden">
                  <div>
                    <p className="font-medium text-foreground">词条列表</p>
                    <p className="text-xs">共 {listState.total} 条词条，点击右侧按钮浏览与筛选。</p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={openListSheet}>
                    <Search className="mr-2 h-3.5 w-3.5" />
                    浏览
                  </Button>
                </div>

                {error && !formMode ? (
                  <Alert variant="destructive">
                    <AlertTitle>操作失败</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}

                <WordDetailPanel
                  word={viewModel}
                  loading={loadingDetail && !viewModel}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  deleting={deleting}
                />
              </div>
            </div>
          </div>

          {formMode ? (
            <WordEditorSheet
              mode={formMode}
              formData={formData}
              onClose={handleSheetClose}
              onSubmit={handleSubmit}
              submitting={submitting}
              submitDisabled={submitDisabled}
              setFormData={setFormData}
              error={error}
            />
          ) : null}
        </Sheet>

        <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
          <SheetContent side="left" className="flex w-full max-w-xl flex-col gap-0 border-border/60 p-0">
            <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
              <SheetTitle className="text-lg font-semibold">词条列表</SheetTitle>
              <SheetDescription>搜索、浏览或创建词条，所有操作实时同步。</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="px-6 py-5">
                <WordListPanel
                  state={listState}
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearchSubmit}
                  onSelect={handleSelect}
                  onCreate={handleCreate}
                  loading={loadingList}
                  selectedId={selectedId}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  variant="plain"
                />
              </div>
            </ScrollArea>
            <SheetFooter className="border-t border-border/60 px-6 py-4">
              <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                <span>共 {listState.total} 条结果</span>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm">
                    关闭
                  </Button>
                </SheetClose>
              </div>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </>
    </TooltipProvider>
  );
}
