import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  createWordAction,
  deleteWordAction,
  getWordDetailAction,
  listWordsAction,
  updateWordAction
} from "@/app/words/actions";
import type { NormalizedWordInput } from "@/app/words/schemas";
import type { ListWordsResult } from "@/lib/types";
import type { WordWithRelations } from "@/lib/word-service";
import {
  createEmptyWordInput,
  sanitizeWordInputForForm
} from "@/lib/word-normalizer";
import {
  type FormMode,
  type WordListState,
  type WordViewModel
} from "@/app/(admin)/words/types";
import { mapWordToForm, mapWordToViewModel } from "@/app/(admin)/words/utils/mappers";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

type UseWordManagerOptions = {
  initialList: ListWordsResult;
  filterBookId?: string;
};

export type MetricItem = {
  label: string;
  value: string;
  description: string;
};

type ListRequestSnapshot = {
  page: number;
  pageSize: number;
  query: string;
};

export function useWordManager({ initialList, filterBookId }: UseWordManagerOptions) {
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
  const [formData, setFormData] = useState<NormalizedWordInput>(() => {
    const base = createEmptyWordInput();
    if (filterBookId) {
      base.bookId = filterBookId;
    }
    return base;
  });
  const createBlankFormData = useCallback((): NormalizedWordInput => {
    const base = createEmptyWordInput();
    if (filterBookId) {
      base.bookId = filterBookId;
    }
    return base;
  }, [filterBookId]);

  const [error, setError] = useState<string | null>(null);
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const listRequestRef = useRef<ListRequestSnapshot>({
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
        setFormData(createBlankFormData());
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

  const listExecuteRef = useRef(listAction.execute);
  useEffect(() => {
    listExecuteRef.current = listAction.execute;
  }, [listAction.execute]);

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
      setFormData(createBlankFormData());
      void refreshList();
    },
    onError: (actionError) => {
      const message = actionError.serverError ?? actionError.fetchError ?? "删除词条失败，请稍后再试。";
      setError(message);
    }
  });

  const detailExecuteRef = useRef(detailAction.execute);
  useEffect(() => {
    detailExecuteRef.current = detailAction.execute;
  }, [detailAction.execute]);

  useEffect(() => {
    setListState({
      items: initialList.items,
      total: initialList.total,
      page: 0,
      pageSize: PAGE_SIZE
    });

    const newSelectedId = initialList.items[0]?.id ?? null;

    setSelectedId((previous) => (previous === newSelectedId ? previous : newSelectedId));

    if (!newSelectedId) {
      setSelectedWord(null);
      setFormData(createBlankFormData());
      return;
    }

    if (selectedIdRef.current !== newSelectedId) {
      setSelectedWord(null);
      void detailExecuteRef.current({ id: newSelectedId });
    }
  }, [createBlankFormData, initialList]);

  useEffect(() => {
    if (initialSelectedId) {
      void detailExecuteRef.current({ id: initialSelectedId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshList = useCallback(
    async (options?: { query?: string; page?: number; pageSize?: number }) => {
      const previous = listRequestRef.current;
      const nextQuery = options?.query ?? previous.query;
      const sizeOverride = options?.pageSize;
      const desiredPageSize = sizeOverride ?? previous.pageSize;
      const nextPageSize = Math.max(1, Math.min(desiredPageSize, 100));
      const nextPage = Math.max(0, options?.page ?? (sizeOverride !== undefined ? 0 : previous.page));

      listRequestRef.current = { page: nextPage, pageSize: nextPageSize, query: nextQuery };
      setQuery(nextQuery);

      await listExecuteRef.current({
        query: nextQuery ? nextQuery : undefined,
        bookId: filterBookId,
        skip: nextPage * nextPageSize,
        take: nextPageSize
      });
    },
    [filterBookId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshList({ page: 0, query });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, refreshList]);

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
    setFormData(createBlankFormData());
    setError(null);
    setListSheetOpen(false);
  }, [createBlankFormData]);

  const openListSheet = useCallback(() => {
    setListSheetOpen(true);
  }, []);

  const handleSearchSubmit = useCallback(() => {
    void refreshList({ page: 0, query });
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

  const handleDelete = useCallback(async () => {
    if (!selectedId) {
      return;
    }
    await deleteAction.execute({ id: selectedId });
  }, [deleteAction, selectedId]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const payload = sanitizeWordInputForForm(formData);

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
      setFormData(createBlankFormData());
    }
  }, [createBlankFormData, selectedWord]);

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

  const viewModel: WordViewModel | null = useMemo(() => {
    if (!selectedWord) {
      return null;
    }
    return mapWordToViewModel(selectedWord);
  }, [selectedWord]);

  const lastUpdatedAt = viewModel?.updatedAt ?? null;

  const metrics: MetricItem[] = useMemo(
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

  const loadingList = listAction.status === "executing";
  const loadingDetail = detailAction.status === "executing";
  const submitting = createAction.status === "executing" || updateAction.status === "executing";
  const deleting = deleteAction.status === "executing";

  return {
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
  };
}
