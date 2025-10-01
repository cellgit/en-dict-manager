"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import {
  Clock,
  Edit3,
  FileClock,
  Loader2,
  Plus,
  Search,
  Trash2,
  Volume2,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from "lucide-react";

import {
  createWordAction,
  deleteWordAction,
  getWordDetailAction,
  listWordsAction,
  updateWordAction
} from "@/app/words/actions";
import type { NormalizedWordInput } from "@/app/words/schemas";
import type { ListWordsResult, ListWordsResultItem } from "@/lib/types";
import type { WordWithRelations } from "@/lib/word-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { cn, formatDateTime } from "@/lib/utils";

type WordManagerProps = {
  readonly initialList: ListWordsResult;
};

type FormMode = "create" | "edit";

type DefinitionForm = NormalizedWordInput["definitions"][number];
type ExampleForm = NormalizedWordInput["examples"][number];
type SynonymGroupForm = NormalizedWordInput["synonymGroups"][number];
type PhraseForm = NormalizedWordInput["phrases"][number];
type RelatedWordForm = NormalizedWordInput["relatedWords"][number];

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

type WordListState = {
  items: ListWordsResultItem[];
  total: number;
  page: number;
  pageSize: number;
};

type WordViewModel = {
  id: string;
  headword: string;
  rank: number | null;
  bookId: string | null;
  phoneticUs: string | null;
  phoneticUk: string | null;
  audioUs: string | null;
  audioUk: string | null;
  memoryTip: string | null;
  createdAt: Date;
  updatedAt: Date;
  definitions: Array<{
    partOfSpeech: string | null;
    meaningCn: string | null;
    meaningEn: string | null;
    note: string | null;
    examples: Array<{ source: string; translation: string | null }>;
  }>;
  examples: Array<{ source: string; translation: string | null }>;
  synonymGroups: Array<{
    partOfSpeech: string | null;
    meaningCn: string | null;
    note: string | null;
    items: string[];
  }>;
  phrases: Array<{ content: string; meaningCn: string | null; meaningEn: string | null }>;
  relatedWords: Array<{ headword: string; partOfSpeech: string | null; meaningCn: string | null }>;
  importLogs: Array<{ id: string; status: string; message: string | null; createdAt: Date; rawHeadword: string }>;
};

const PAGE_SIZE = 20;

const emptyDefinition = (): DefinitionForm => ({
  partOfSpeech: "",
  meaningCn: "",
  meaningEn: "",
  note: "",
  examples: []
});

const emptyExample = (): ExampleForm => ({
  source: "",
  translation: "",
  meta: null
});

const emptySynonymGroup = (): SynonymGroupForm => ({
  partOfSpeech: "",
  meaningCn: "",
  note: "",
  items: [""]
});

const emptyPhrase = (): PhraseForm => ({
  content: "",
  meaningCn: "",
  meaningEn: ""
});

const emptyRelatedWord = (): RelatedWordForm => ({
  headword: "",
  partOfSpeech: "",
  meaningCn: ""
});

const emptyWord = (): NormalizedWordInput => ({
  headword: "",
  rank: null,
  bookId: null,
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
});

const toNullableString = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeForm = (form: NormalizedWordInput): NormalizedWordInput => ({
  headword: form.headword.trim(),
  rank: form.rank ?? null,
  bookId: toNullableString(form.bookId),
  phoneticUs: toNullableString(form.phoneticUs),
  phoneticUk: toNullableString(form.phoneticUk),
  audioUs: toNullableString(form.audioUs),
  audioUk: toNullableString(form.audioUk),
  memoryTip: toNullableString(form.memoryTip),
  definitions: form.definitions
    .map((definition) => ({
      partOfSpeech: toNullableString(definition.partOfSpeech),
      meaningCn: toNullableString(definition.meaningCn),
      meaningEn: toNullableString(definition.meaningEn),
      note: toNullableString(definition.note),
      examples: definition.examples
        .map((example) => ({
          source: example.source.trim(),
          translation: toNullableString(example.translation),
          meta: example.meta ?? null
        }))
        .filter((example) => example.source.length > 0)
    }))
    .filter(
      (definition) =>
        definition.partOfSpeech !== null ||
        definition.meaningCn !== null ||
        definition.meaningEn !== null ||
        definition.note !== null ||
        definition.examples.length > 0
    ),
  examples: form.examples
    .map((example) => ({
      source: example.source.trim(),
      translation: toNullableString(example.translation),
      meta: example.meta ?? null
    }))
    .filter((example) => example.source.length > 0),
  synonymGroups: form.synonymGroups
    .map((group) => ({
      partOfSpeech: toNullableString(group.partOfSpeech),
      meaningCn: toNullableString(group.meaningCn),
      note: toNullableString(group.note),
      items: group.items
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }))
    .filter(
      (group) =>
        group.partOfSpeech !== null ||
        group.meaningCn !== null ||
        group.note !== null ||
        group.items.length > 0
    ),
  phrases: form.phrases
    .map((phrase) => ({
      content: phrase.content.trim(),
      meaningCn: toNullableString(phrase.meaningCn),
      meaningEn: toNullableString(phrase.meaningEn)
    }))
    .filter((phrase) => phrase.content.length > 0),
  relatedWords: form.relatedWords
    .map((related) => ({
      headword: related.headword.trim(),
      partOfSpeech: toNullableString(related.partOfSpeech),
      meaningCn: toNullableString(related.meaningCn)
    }))
    .filter((related) => related.headword.length > 0)
});

const mapWordToForm = (word: WordWithRelations): NormalizedWordInput => ({
  headword: word.headword,
  rank: word.rank,
  bookId: word.book_id,
  phoneticUs: word.phonetic_us,
  phoneticUk: word.phonetic_uk,
  audioUs: word.audio_us,
  audioUk: word.audio_uk,
  memoryTip: word.memory_tip,
  definitions: word.definitions.map((definition) => ({
    partOfSpeech: definition.part_of_speech,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: definition.exampleSentences.map((example) => ({
      source: example.source,
      translation: example.translation ?? null,
      meta: example.meta ? (example.meta as Record<string, unknown>) : null
    }))
  })),
  examples: word.exampleSentences.map((example) => ({
    source: example.source,
    translation: example.translation ?? null,
    meta: example.meta ? (example.meta as Record<string, unknown>) : null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: group.synos.map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  }))
});

const mapWordToViewModel = (word: WordWithRelations): WordViewModel => ({
  id: word.id,
  headword: word.headword,
  rank: word.rank,
  bookId: word.book_id,
  phoneticUs: word.phonetic_us,
  phoneticUk: word.phonetic_uk,
  audioUs: word.audio_us,
  audioUk: word.audio_uk,
  memoryTip: word.memory_tip,
  createdAt: new Date(word.created_at),
  updatedAt: new Date(word.updated_at),
  definitions: word.definitions.map((definition) => ({
    partOfSpeech: definition.part_of_speech,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: definition.exampleSentences.map((example) => ({
      source: example.source,
      translation: example.translation ?? null
    }))
  })),
  examples: word.exampleSentences.map((example) => ({
    source: example.source,
    translation: example.translation ?? null
  })),
  synonymGroups: word.synonymGroups.map((group) => ({
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: group.synos.map((syn) => syn.value)
  })),
  phrases: word.phrases.map((phrase) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related) => ({
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  })),
  importLogs: (word.importLogs ?? []).map((log) => ({
    id: log.id,
    status: log.status,
    message: log.message,
    rawHeadword: log.raw_headword,
    createdAt: new Date(log.created_at)
  }))
});

export default function WordManager({ initialList }: WordManagerProps) {
  const initialSelectedId = initialList.items[0]?.id ?? null;

  const [query, setQuery] = useState<string>("");
  const [listState, setListState] = useState<WordListState>({
    items: initialList.items,
    total: initialList.total,
    page: 0,
    pageSize: PAGE_SIZE
  });
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [selectedWord, setSelectedWord] = useState<WordWithRelations | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState<NormalizedWordInput>(emptyWord());
  const [error, setError] = useState<string | null>(null);
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const listRequestRef = useRef<{ page: number; pageSize: number; query: string }>({
    page: 0,
    pageSize: PAGE_SIZE,
    query: ""
  });

  const selectedIdRef = useRef<string | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const detailAction = useAction(getWordDetailAction, {
    onSuccess: (word) => {
      setSelectedWord(word ?? null);
      setError(null);
      if (word) {
        setFormData(mapWordToForm(word));
      }
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "获取词条详情失败，请稍后再试。";
      setError(message);
    }
  });

  const listAction = useAction(listWordsAction, {
    onSuccess: (result) => {
      setError(null);
      const { page, pageSize } = listRequestRef.current;
      setListState({
        items: result.items,
        total: result.total,
        page,
        pageSize
      });

      if (result.items.length === 0) {
        setSelectedId(null);
        setSelectedWord(null);
        setFormData(emptyWord());
        return;
      }

      const currentSelectedId = selectedIdRef.current;
      const exists = currentSelectedId
        ? result.items.some((item) => item.id === currentSelectedId)
        : false;

      if (!exists) {
        const firstId = result.items[0]?.id;
        if (firstId) {
          setSelectedId(firstId);
          void detailAction.execute({ id: firstId });
        }
      }
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "加载词条列表失败，请稍后再试。";
      setError(message);
    }
  });

  const createAction = useAction(createWordAction, {
    onSuccess: (created) => {
      setError(null);
      setFormMode(null);
      setSelectedId(created.id);
      setSelectedWord(created);
      setFormData(mapWordToForm(created));
      void refreshList({ page: 0 });
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "创建词条失败，请稍后再试。";
      setError(message);
    }
  });

  const updateAction = useAction(updateWordAction, {
    onSuccess: (updated) => {
      setError(null);
      setFormMode(null);
      setSelectedWord(updated);
      setFormData(mapWordToForm(updated));
      void refreshList();
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "更新词条失败，请稍后再试。";
      setError(message);
    }
  });

  const deleteAction = useAction(deleteWordAction, {
    onSuccess: () => {
      setError(null);
      setFormMode(null);
      setSelectedId(null);
      setSelectedWord(null);
      setFormData(emptyWord());
      void refreshList();
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "删除词条失败，请稍后再试。";
      setError(message);
    }
  });

  useEffect(() => {
    if (initialSelectedId) {
      void detailAction.execute({ id: initialSelectedId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadingList = listAction.status === "executing";
  const loadingDetail = detailAction.status === "executing";
  const submitting =
    createAction.status === "executing" || updateAction.status === "executing";
  const deleting = deleteAction.status === "executing";

  const refreshList = useCallback(
    async (options?: { query?: string; page?: number; pageSize?: number }) => {
      const nextQuery = options?.query ?? query;
      const sizeOverride = options?.pageSize;
      const desiredPageSize = sizeOverride ?? listState.pageSize;
      const nextPageSize = Math.max(1, Math.min(desiredPageSize, 100));
      const nextPage = Math.max(0, options?.page ?? (sizeOverride !== undefined ? 0 : listState.page));
      listRequestRef.current = { page: nextPage, pageSize: nextPageSize, query: nextQuery };
      setQuery(nextQuery);
      await listAction.execute({
        query: nextQuery ? nextQuery : undefined,
        skip: nextPage * nextPageSize,
        take: nextPageSize
      });
    },
    [listAction, listState.page, listState.pageSize, query]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      void detailAction.execute({ id });
      setListSheetOpen(false);
    },
    [detailAction]
  );

  const handleCreate = useCallback(() => {
    setFormMode("create");
    setFormData(emptyWord());
    setError(null);
    setListSheetOpen(false);
  }, []);

  const handleOpenList = useCallback(() => {
    setListSheetOpen(true);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    void refreshList({ page: 0, query });
    setListSheetOpen(true);
  }, [query, refreshList]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      void refreshList({ page: nextPage });
    },
    [refreshList]
  );

  const handlePageSizeChange = useCallback(
    (nextSize: number) => {
      void refreshList({ page: 0, pageSize: nextSize });
    },
    [refreshList]
  );

  const handleEdit = useCallback(() => {
    if (!selectedWord) {
      return;
    }
    setFormMode("edit");
    setFormData(mapWordToForm(selectedWord));
    setError(null);
  }, [selectedWord]);

  const handleDelete = useCallback(() => {
    if (!selectedId) {
      return;
    }
    // eslint-disable-next-line no-alert
    if (globalThis.confirm?.("确定要删除该词条吗？操作不可撤销。")) {
      void deleteAction.execute({ id: selectedId });
    }
  }, [deleteAction, selectedId]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const payload = sanitizeForm(formData);

      if (formMode === "create") {
        void createAction.execute({ word: payload });
        return;
      }

      if (formMode === "edit" && selectedId) {
        void updateAction.execute({ id: selectedId, word: payload });
      }
    },
    [createAction, formData, formMode, selectedId, updateAction]
  );

  const handleSheetClose = useCallback(() => {
    setFormMode(null);
    setError(null);
    if (selectedWord) {
      setFormData(mapWordToForm(selectedWord));
    } else {
      setFormData(emptyWord());
    }
  }, [selectedWord]);

  const submitDisabled = useMemo(() => {
    if (!formData.headword.trim()) {
      return true;
    }

    if (
      formData.definitions.some((definition) =>
        definition.examples.some((example) => !example.source.trim())
      )
    ) {
      return true;
    }

    if (formData.examples.some((example) => !example.source.trim())) {
      return true;
    }

    return false;
  }, [formData]);

  const viewModel = useMemo(() => {
    if (!selectedWord) {
      return null;
    }
    return mapWordToViewModel(selectedWord);
  }, [selectedWord]);

  const lastUpdatedAt = viewModel?.updatedAt ?? null;

  const metrics = useMemo(
    () => [
      {
        label: "词条总数",
        value: listState.total.toLocaleString("zh-CN"),
        description: "当前数据库中可管理的词条数量。"
      },
      {
        label: "当前列表",
        value: `${listState.items.length} / ${listState.pageSize}`,
        description: `第 ${listState.page + 1} 页正在浏览的词条数量。`
      },
      {
        label: "最近更新",
        value: lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "选择词条以查看",
        description: lastUpdatedAt
          ? `${viewModel?.headword ?? ""} 最近于此时间更新。`
          : "请选择列表中的词条即可查看最新的更新时间。"
      }
    ],
    [lastUpdatedAt, listState.items.length, listState.page, listState.pageSize, listState.total, viewModel?.headword]
  );

  return (
    <TooltipProvider delayDuration={150}>
      <>
        <Sheet open={formMode !== null} onOpenChange={(open) => !open && handleSheetClose()}>
          <div className="space-y-10">
            <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-background">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/20 blur-3xl opacity-60 md:left-auto md:right-0 md:translate-x-1/3" />
              <div className="relative flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
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
                    <Button
                      type="button"
                      variant="secondary"
                      className="xl:hidden"
                      onClick={handleOpenList}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      浏览词条
                    </Button>
                  </div>
                </div>

                <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3">
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

            <div className="grid gap-6 xl:grid-cols-[460px,1fr] 2xl:grid-cols-[520px,1fr]">
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
                  <Button size="sm" variant="secondary" onClick={handleOpenList}>
                    <Search className="mr-2 h-3.5 w-3.5" />浏览
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
          <SheetContent
            side="left"
            className="flex w-full max-w-lg flex-col gap-0 border-border/60 p-0"
          >
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

function WordListPanel({
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
}: {
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
}) {
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
  <CardHeader className={cn("space-y-4", isPlain && "p-0 pb-5")}>
        <CardTitle className="text-lg font-semibold">词条管理</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          搜索、浏览或创建词条。
        </CardDescription>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearch();
                }
              }}
              placeholder="搜索词条或释义"
              className="pl-9"
            />
          </div>
          <Button type="button" variant="secondary" onClick={onSearch} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}搜索
          </Button>
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

function WordDetailPanel({
  word,
  loading,
  onEdit,
  onDelete,
  deleting
}: {
  word: WordViewModel | null;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  if (loading) {
    return (
      <Card className="flex h-full flex-col border-border/80">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!word) {
    return (
      <Card className="flex h-full flex-col items-center justify-center border-border/80 text-center">
        <CardContent className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileClock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">选择一个词条开始预览</h3>
            <p className="text-sm text-muted-foreground">搜索并选择词条，即可查看详情、编辑或删除。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const partsOfSpeech = word.definitions
    .map((definition) => definition.partOfSpeech)
    .filter(Boolean)
    .join(" · ");

  const playAudio = (src: string | null) => {
    if (!src) {
      return;
    }
    const audio = new Audio(src);
    void audio.play();
  };

  const baseInfoRows = [
    {
      label: "Rank",
      value: word.rank !== null ? `#${word.rank}` : "未提供"
    },
    {
      label: "教材/分组",
      value: word.bookId ?? "未提供"
    },
    {
      label: "美式音标",
      value: word.phoneticUs ?? "未提供"
    },
    {
      label: "英式音标",
      value: word.phoneticUk ?? "未提供"
    },
    {
      label: "美式音频链接",
      value: word.audioUs ?? "未提供"
    },
    {
      label: "英式音频链接",
      value: word.audioUk ?? "未提供"
    },
    {
      label: "创建时间",
      value: formatDateTime(word.createdAt) || "未提供"
    },
    {
      label: "最近更新",
      value: formatDateTime(word.updatedAt) || "未提供"
    }
  ];

  const definitionsContent =
    word.definitions.length === 0 ? (
      <EmptyState title="暂无释义" description="该词条尚未配置释义内容。" />
    ) : (
      word.definitions.map((definition, index) => (
        <DetailTile
          key={`${word.id}-definition-${index}`}
          title={`释义 ${index + 1}`}
          description={definition.partOfSpeech ?? undefined}
        >
          <div className="space-y-3 text-sm">
            {definition.meaningCn ? (
              <DetailRow label="中文释义" value={definition.meaningCn} />
            ) : null}
            {definition.meaningEn ? (
              <DetailRow label="英文释义" value={definition.meaningEn} />
            ) : null}
            {definition.note ? <DetailRow label="备注" value={definition.note} /> : null}
            {definition.examples.length ? (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  例句
                </h4>
                <div className="space-y-3">
                  {definition.examples.map((example, exampleIndex) => (
                    <div
                      key={`${word.id}-definition-${index}-example-${exampleIndex}`}
                      className="rounded-lg border border-border/70 bg-card/60 p-3 text-sm"
                    >
                      <p className="font-medium text-foreground">{example.source}</p>
                      {example.translation ? (
                        <p className="mt-2 text-muted-foreground">{example.translation}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DetailTile>
      ))
    );

  const examplesContent =
    word.examples.length === 0 ? (
      <EmptyState title="暂无独立例句" description="可以在编辑页为词条补充更多例句。" />
    ) : (
      word.examples.map((example, index) => (
        <DetailTile key={`${word.id}-example-${index}`} title={`例句 ${index + 1}`}>
          <p className="text-sm font-medium text-foreground">{example.source}</p>
          {example.translation ? (
            <p className="mt-2 text-sm text-muted-foreground">{example.translation}</p>
          ) : null}
        </DetailTile>
      ))
    );

  const synonymsContent =
    word.synonymGroups.length === 0 ? (
      <EmptyState title="暂无近义词" description="为词条添加同义词组可以帮助记忆。" />
    ) : (
      word.synonymGroups.map((group, index) => (
        <DetailTile
          key={`${word.id}-synonym-${index}`}
          title={group.partOfSpeech || "近义词组"}
          description={group.meaningCn ?? undefined}
        >
          {group.items.length ? (
            <div className="flex flex-wrap gap-2">
              {group.items.map((item, itemIndex) => (
                <Badge key={`${word.id}-synonym-${index}-item-${itemIndex}`} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无同义词。</p>
          )}
        </DetailTile>
      ))
    );

  const phrasesContent =
    word.phrases.length === 0 ? (
      <EmptyState title="暂无固定搭配" description="添加固定搭配可以丰富学习素材。" />
    ) : (
      word.phrases.map((phrase, index) => (
        <DetailTile
          key={`${word.id}-phrase-${index}`}
          title={phrase.content}
          description={phrase.meaningCn ?? undefined}
        >
          {phrase.meaningEn ? (
            <p className="text-sm text-muted-foreground">{phrase.meaningEn}</p>
          ) : null}
        </DetailTile>
      ))
    );

  const relationsContent =
    word.relatedWords.length === 0 ? (
      <EmptyState title="暂无相关词条" description="可以在编辑页关联近反义词或派生词。" />
    ) : (
      word.relatedWords.map((related, index) => (
        <DetailTile
          key={`${word.id}-related-${index}`}
          title={related.headword}
          description={related.partOfSpeech ?? undefined}
        >
          {related.meaningCn ? (
            <p className="text-sm text-muted-foreground">{related.meaningCn}</p>
          ) : null}
        </DetailTile>
      ))
    );

  const logsContent =
    word.importLogs.length === 0 ? (
      <EmptyState title="暂无导入记录" description="该词条尚未记录导入来源。" />
    ) : (
      word.importLogs.map((log) => (
        <div
          key={log.id}
          className="rounded-lg border border-border/70 bg-card/40 p-4 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-foreground">{log.rawHeadword}</span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <FileClock className="h-3 w-3" />
              {formatDateTime(log.createdAt) || "--"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="uppercase">
              {log.status}
            </Badge>
            {log.message ? <span>{log.message}</span> : null}
          </div>
        </div>
      ))
    );

  return (
    <Card className="flex h-full flex-col border-border/80">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-foreground">{word.headword}</h2>
              {word.phoneticUs ? (
                <Badge variant="secondary">美: {word.phoneticUs}</Badge>
              ) : null}
              {word.phoneticUk ? (
                <Badge variant="secondary">英: {word.phoneticUk}</Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {word.rank ? <Badge variant="outline">Rank {word.rank}</Badge> : null}
              {word.bookId ? (
                <Badge variant="outline" className="border-dashed">
                  {word.bookId}
                </Badge>
              ) : null}
              {partsOfSpeech ? (
                <span className="font-medium text-foreground/80">{partsOfSpeech}</span>
              ) : null}
              {word.memoryTip ? (
                <span className="inline-flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {word.memoryTip.slice(0, 24)}{word.memoryTip.length > 24 ? "…" : ""}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {word.audioUs ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={() => playAudio(word.audioUs)}>
                    <Volume2 className="mr-2 h-4 w-4" />美音
                  </Button>
                </TooltipTrigger>
                <TooltipContent>播放美式读音</TooltipContent>
              </Tooltip>
            ) : null}
            {word.audioUk ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={() => playAudio(word.audioUk)}>
                    <Volume2 className="mr-2 h-4 w-4" />英音
                  </Button>
                </TooltipTrigger>
                <TooltipContent>播放英式读音</TooltipContent>
              </Tooltip>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="mr-2 h-4 w-4" />编辑
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}删除
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <TabsList className="flex w-full justify-start overflow-auto px-6 py-2">
            <TabsTrigger value="overview" className="whitespace-nowrap">
              全部
            </TabsTrigger>
            <TabsTrigger value="definitions" className="whitespace-nowrap">
              释义
            </TabsTrigger>
            <TabsTrigger value="examples" className="whitespace-nowrap">
              例句
            </TabsTrigger>
            <TabsTrigger value="synonyms" className="whitespace-nowrap">
              近义词
            </TabsTrigger>
            <TabsTrigger value="phrases" className="whitespace-nowrap">
              固定搭配
            </TabsTrigger>
            <TabsTrigger value="relations" className="whitespace-nowrap">
              相关词条
            </TabsTrigger>
            <TabsTrigger value="logs" className="whitespace-nowrap">
              导入记录
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6 pb-6">
              <TabsContent value="overview" className="space-y-6 pt-4">
                <DetailTile title="基础信息">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {baseInfoRows.map((item) => (
                      <DetailRow key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                </DetailTile>
                {word.memoryTip ? (
                  <DetailTile title="记忆提示">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.memoryTip}</p>
                  </DetailTile>
                ) : null}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">释义</h3>
                  <div className="space-y-4">{definitionsContent}</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">独立例句</h3>
                  <div className="space-y-4">{examplesContent}</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">近义词</h3>
                  <div className="space-y-4">{synonymsContent}</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">固定搭配</h3>
                  <div className="space-y-4">{phrasesContent}</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">相关词条</h3>
                  <div className="space-y-4">{relationsContent}</div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">导入记录</h3>
                  <div className="space-y-4">{logsContent}</div>
                </div>
              </TabsContent>

              <TabsContent value="definitions" className="space-y-6 pt-4">
                {definitionsContent}
              </TabsContent>

              <TabsContent value="examples" className="space-y-4 pt-4">
                {examplesContent}
              </TabsContent>

              <TabsContent value="synonyms" className="space-y-4 pt-4">
                {synonymsContent}
              </TabsContent>

              <TabsContent value="phrases" className="space-y-4 pt-4">
                {phrasesContent}
              </TabsContent>

              <TabsContent value="relations" className="space-y-4 pt-4">
                {relationsContent}
              </TabsContent>

              <TabsContent value="logs" className="space-y-4 pt-4">
                {logsContent}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function DetailTile({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-center">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function WordEditorSheet({
  mode,
  formData,
  onClose,
  onSubmit,
  submitting,
  submitDisabled,
  setFormData,
  error
}: {
  mode: FormMode;
  formData: NormalizedWordInput;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  submitDisabled: boolean;
  setFormData: (value: NormalizedWordInput) => void;
  error: string | null;
}) {
  const title = mode === "create" ? "新建词条" : "编辑词条";

  return (
    <SheetContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-4xl flex-col gap-0 p-0">
      <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
        <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
        <SheetDescription>完善词条内容，保存后将立即生效。</SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 px-6 py-6">
            <WordForm formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <SheetFooter className="gap-4 border-t border-border/60 px-6 py-4">
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>提交失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={submitDisabled || submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Edit3 className="mr-2 h-4 w-4" />
              )}
              {mode === "create" ? "创建词条" : "保存修改"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}

function WordForm({
  formData,
  setFormData
}: {
  formData: NormalizedWordInput;
  setFormData: (value: NormalizedWordInput) => void;
}) {
  const updateField = useCallback(
    <K extends keyof NormalizedWordInput>(key: K, value: NormalizedWordInput[K]) => {
      setFormData({ ...formData, [key]: value });
    },
    [formData, setFormData]
  );

  const updateDefinition = useCallback(
    (index: number, definition: DefinitionForm) => {
      const definitions = [...formData.definitions];
      definitions[index] = definition;
      updateField("definitions", definitions);
    },
    [formData.definitions, updateField]
  );

  const updateDefinitionExample = useCallback(
    (definitionIndex: number, exampleIndex: number, example: ExampleForm) => {
      const definition = formData.definitions[definitionIndex];
      const examples = [...definition.examples];
      examples[exampleIndex] = example;
      updateDefinition(definitionIndex, { ...definition, examples });
    },
    [formData.definitions, updateDefinition]
  );

  const updateExample = useCallback(
    (index: number, example: ExampleForm) => {
      const examples = [...formData.examples];
      examples[index] = example;
      updateField("examples", examples);
    },
    [formData.examples, updateField]
  );

  const updateSynonymGroup = useCallback(
    (index: number, group: SynonymGroupForm) => {
      const synonymGroups = [...formData.synonymGroups];
      synonymGroups[index] = group;
      updateField("synonymGroups", synonymGroups);
    },
    [formData.synonymGroups, updateField]
  );

  const updatePhrase = useCallback(
    (index: number, phrase: PhraseForm) => {
      const phrases = [...formData.phrases];
      phrases[index] = phrase;
      updateField("phrases", phrases);
    },
    [formData.phrases, updateField]
  );

  const updateRelatedWord = useCallback(
    (index: number, related: RelatedWordForm) => {
      const relatedWords = [...formData.relatedWords];
      relatedWords[index] = related;
      updateField("relatedWords", relatedWords);
    },
    [formData.relatedWords, updateField]
  );

  return (
    <div className="space-y-6">
      <FormSection title="基础信息">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="headword" className="text-sm font-medium">
              词头 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="headword"
              required
              value={formData.headword}
              onChange={(event) => updateField("headword", event.target.value)}
              placeholder="例如: incredible"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rank" className="text-sm font-medium">
              Rank
            </Label>
            <Input
              id="rank"
              type="number"
              value={formData.rank ?? ""}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                updateField("rank", Number.isNaN(next) ? null : next);
              }}
              placeholder="例如：120"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bookId" className="text-sm font-medium">
              教材/分组
            </Label>
            <Input
              id="bookId"
              value={formData.bookId ?? ""}
              onChange={(event) => updateField("bookId", event.target.value)}
              placeholder="例如：人教版三年级"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneticUs" className="text-sm font-medium">
              美式音标
            </Label>
            <Input
              id="phoneticUs"
              value={formData.phoneticUs ?? ""}
              onChange={(event) => updateField("phoneticUs", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneticUk" className="text-sm font-medium">
              英式音标
            </Label>
            <Input
              id="phoneticUk"
              value={formData.phoneticUk ?? ""}
              onChange={(event) => updateField("phoneticUk", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUs" className="text-sm font-medium">
              美式音频链接
            </Label>
            <Input
              id="audioUs"
              value={formData.audioUs ?? ""}
              onChange={(event) => updateField("audioUs", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUk" className="text-sm font-medium">
              英式音频链接
            </Label>
            <Input
              id="audioUk"
              value={formData.audioUk ?? ""}
              onChange={(event) => updateField("audioUk", event.target.value)}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="memoryTip" className="text-sm font-medium">
              记忆提示
            </Label>
            <Textarea
              id="memoryTip"
              value={formData.memoryTip ?? ""}
              onChange={(event) => updateField("memoryTip", event.target.value)}
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="释义"
        description="为词条添加多个释义，可在释义下维护对应例句。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("definitions", [...formData.definitions, emptyDefinition()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加释义
          </Button>
        }
      >
        {formData.definitions.length === 0 ? (
          <FormEmpty message="尚未添加释义。" />
        ) : (
          <div className="space-y-4">
            {formData.definitions.map((definition, index) => {
              const prefix = `definition-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-4 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                      释义 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "definitions",
                          formData.definitions.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-pos`} className="text-xs font-medium text-muted-foreground">
                        词性
                      </Label>
                      <Input
                        id={`${prefix}-pos`}
                        value={definition.partOfSpeech ?? ""}
                        onChange={(event) =>
                          updateDefinition(index, {
                            ...definition,
                            partOfSpeech: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-note`} className="text-xs font-medium text-muted-foreground">
                        备注
                      </Label>
                      <Input
                        id={`${prefix}-note`}
                        value={definition.note ?? ""}
                        onChange={(event) =>
                          updateDefinition(index, {
                            ...definition,
                            note: event.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-cn`} className="text-xs font-medium text-muted-foreground">
                        中文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-cn`}
                        value={definition.meaningCn ?? ""}
                        onChange={(event) =>
                          updateDefinition(index, {
                            ...definition,
                            meaningCn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-en`} className="text-xs font-medium text-muted-foreground">
                        英文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-en`}
                        value={definition.meaningEn ?? ""}
                        onChange={(event) =>
                          updateDefinition(index, {
                            ...definition,
                            meaningEn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        例句
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateDefinition(index, {
                            ...definition,
                            examples: [...definition.examples, emptyExample()]
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> 添加例句
                      </Button>
                    </div>
                    {definition.examples.length === 0 ? (
                      <FormEmpty message="尚未添加例句。" />
                    ) : (
                      <div className="space-y-3">
                        {definition.examples.map((example, exampleIndex) => {
                          const examplePrefix = `${prefix}-example-${exampleIndex}`;
                          return (
                            <div
                              key={examplePrefix}
                              className="rounded-lg border border-border/60 bg-card/50 p-3 text-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">
                                  例句 {exampleIndex + 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateDefinition(index, {
                                      ...definition,
                                      examples: definition.examples.filter((_, i) => i !== exampleIndex)
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${examplePrefix}-source`} className="text-xs font-medium text-muted-foreground">
                                  原文 <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                  id={`${examplePrefix}-source`}
                                  value={example.source}
                                  onChange={(event) =>
                                    updateDefinitionExample(index, exampleIndex, {
                                      ...example,
                                      source: event.target.value
                                    })
                                  }
                                  rows={2}
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${examplePrefix}-translation`} className="text-xs font-medium text-muted-foreground">
                                  译文
                                </Label>
                                <Textarea
                                  id={`${examplePrefix}-translation`}
                                  value={example.translation ?? ""}
                                  onChange={(event) =>
                                    updateDefinitionExample(index, exampleIndex, {
                                      ...example,
                                      translation: event.target.value
                                    })
                                  }
                                  rows={2}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        title="独立例句"
        description="未绑定释义的额外例句。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("examples", [...formData.examples, emptyExample()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加例句
          </Button>
        }
      >
        {formData.examples.length === 0 ? (
          <FormEmpty message="尚未添加例句。" />
        ) : (
          <div className="space-y-3">
            {formData.examples.map((example, index) => {
              const prefix = `example-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      例句 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "examples",
                          formData.examples.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-source`} className="text-xs font-medium text-muted-foreground">
                      原文 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`${prefix}-source`}
                      value={example.source}
                      onChange={(event) =>
                        updateExample(index, {
                          ...example,
                          source: event.target.value
                        })
                      }
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-translation`} className="text-xs font-medium text-muted-foreground">
                      译文
                    </Label>
                    <Textarea
                      id={`${prefix}-translation`}
                      value={example.translation ?? ""}
                      onChange={(event) =>
                        updateExample(index, {
                          ...example,
                          translation: event.target.value
                        })
                      }
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        title="近义词组"
        description="根据不同词性维护同义词集合。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("synonymGroups", [...formData.synonymGroups, emptySynonymGroup()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加同义词组
          </Button>
        }
      >
        {formData.synonymGroups.length === 0 ? (
          <FormEmpty message="尚未添加近义词。" />
        ) : (
          <div className="space-y-4">
            {formData.synonymGroups.map((group, index) => {
              const prefix = `synonym-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                      词性组 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "synonymGroups",
                          formData.synonymGroups.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-pos`} className="text-xs font-medium text-muted-foreground">
                        词性
                      </Label>
                      <Input
                        id={`${prefix}-pos`}
                        value={group.partOfSpeech ?? ""}
                        onChange={(event) =>
                          updateSynonymGroup(index, {
                            ...group,
                            partOfSpeech: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-cn`} className="text-xs font-medium text-muted-foreground">
                        中文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-cn`}
                        value={group.meaningCn ?? ""}
                        onChange={(event) =>
                          updateSynonymGroup(index, {
                            ...group,
                            meaningCn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-note`} className="text-xs font-medium text-muted-foreground">
                      备注
                    </Label>
                    <Textarea
                      id={`${prefix}-note`}
                      value={group.note ?? ""}
                      onChange={(event) =>
                        updateSynonymGroup(index, {
                          ...group,
                          note: event.target.value
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        同义词
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateSynonymGroup(index, {
                            ...group,
                            items: [...group.items, ""]
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> 添加词汇
                      </Button>
                    </div>
                    {group.items.length === 0 ? (
                      <FormEmpty message="尚未添加同义词。" />
                    ) : (
                      <div className="space-y-2">
                        {group.items.map((item, itemIndex) => {
                          const itemId = `${prefix}-item-${itemIndex}`;
                          return (
                            <div key={itemId} className="flex items-center gap-2">
                              <Input
                                id={itemId}
                                value={item ?? ""}
                                onChange={(event) => {
                                  const items = [...group.items];
                                  items[itemIndex] = event.target.value;
                                  updateSynonymGroup(index, { ...group, items });
                                }}
                                placeholder="写入近义词"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const items = group.items.filter((_, i) => i !== itemIndex);
                                  updateSynonymGroup(index, { ...group, items });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        title="固定搭配"
        description="维护与该词相关的常用短语或固定搭配。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("phrases", [...formData.phrases, emptyPhrase()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加固定搭配
          </Button>
        }
      >
        {formData.phrases.length === 0 ? (
          <FormEmpty message="尚未添加固定搭配。" />
        ) : (
          <div className="space-y-3">
            {formData.phrases.map((phrase, index) => {
              const prefix = `phrase-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      搭配 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "phrases",
                          formData.phrases.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-phrase`} className="text-xs font-medium text-muted-foreground">
                      短语 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`${prefix}-phrase`}
                      value={phrase.content}
                      onChange={(event) =>
                        updatePhrase(index, {
                          ...phrase,
                          content: event.target.value
                        })
                      }
                      placeholder="短语或固定搭配"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-cn`} className="text-xs font-medium text-muted-foreground">
                        中文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-cn`}
                        value={phrase.meaningCn ?? ""}
                        onChange={(event) =>
                          updatePhrase(index, {
                            ...phrase,
                            meaningCn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-en`} className="text-xs font-medium text-muted-foreground">
                        英文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-en`}
                        value={phrase.meaningEn ?? ""}
                        onChange={(event) =>
                          updatePhrase(index, {
                            ...phrase,
                            meaningEn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        title="相关词条"
        description="可包含派生词、反义词等。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("relatedWords", [...formData.relatedWords, emptyRelatedWord()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加词条
          </Button>
        }
      >
        {formData.relatedWords.length === 0 ? (
          <FormEmpty message="尚未添加相关词条。" />
        ) : (
          <div className="space-y-3">
            {formData.relatedWords.map((related, index) => {
              const prefix = `related-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      相关词 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "relatedWords",
                          formData.relatedWords.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-word`} className="text-xs font-medium text-muted-foreground">
                        词条 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${prefix}-word`}
                        value={related.headword}
                        onChange={(event) =>
                          updateRelatedWord(index, {
                            ...related,
                            headword: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-pos`} className="text-xs font-medium text-muted-foreground">
                        词性
                      </Label>
                      <Input
                        id={`${prefix}-pos`}
                        value={related.partOfSpeech ?? ""}
                        onChange={(event) =>
                          updateRelatedWord(index, {
                            ...related,
                            partOfSpeech: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meaning-cn`} className="text-xs font-medium text-muted-foreground">
                        中文释义
                      </Label>
                      <Textarea
                        id={`${prefix}-meaning-cn`}
                        value={related.meaningCn ?? ""}
                        onChange={(event) =>
                          updateRelatedWord(index, {
                            ...related,
                            meaningCn: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FormSection>
    </div>
  );
}

function FormSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-card/50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <Separator className="bg-border/50" />
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FormEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}
