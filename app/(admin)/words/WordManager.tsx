'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import type { ListWordsResult, ListWordsResultItem } from '@/lib/types';
import type { NormalizedWordInput } from '@/app/words/schemas';
import type { WordWithRelations } from '@/lib/word-service';
import {
  createWordAction,
  deleteWordAction,
  getWordDetailAction,
  listWordsAction,
  updateWordAction
} from '@/app/words/actions';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { cn } from '@/lib/utils';

type WordManagerProps = {
  initialList: ListWordsResult;
};

type FormMode = 'create' | 'edit';

type DefinitionForm = NormalizedWordInput['definitions'][number];
type ExampleForm = NormalizedWordInput['examples'][number];
type SynonymGroupForm = NormalizedWordInput['synonymGroups'][number];
type PhraseForm = NormalizedWordInput['phrases'][number];
type RelatedWordForm = NormalizedWordInput['relatedWords'][number];

type WordListState = {
  query: string;
  items: ListWordsResultItem[];
  total: number;
};

type WordDefinitionRecord = WordWithRelations['definitions'][number];
type WordDefinitionExampleRecord = WordDefinitionRecord['exampleSentences'][number];
type WordExampleRecord = WordWithRelations['exampleSentences'][number];
type WordSynonymGroupRecord = WordWithRelations['synonymGroups'][number];
type WordSynonymRecord = WordSynonymGroupRecord['synos'][number];
type WordPhraseRecord = WordWithRelations['phrases'][number];
type WordRelatedRecord = WordWithRelations['relatedWords'][number];
type WordImportLogRecord = WordWithRelations['importLogs'][number];

type InputChangeEvent = ChangeEvent<HTMLInputElement>;
type TextareaChangeEvent = ChangeEvent<HTMLTextAreaElement>;

const emptyDefinition = (): DefinitionForm => ({
  partOfSpeech: null,
  meaningCn: null,
  meaningEn: null,
  note: null,
  examples: []
});

const emptyExample = (): ExampleForm => ({
  source: '',
  translation: null,
  meta: null
});

const emptySynonymGroup = (): SynonymGroupForm => ({
  partOfSpeech: null,
  meaningCn: null,
  note: null,
  items: []
});

const emptyPhrase = (): PhraseForm => ({
  content: '',
  meaningCn: null,
  meaningEn: null
});

const emptyRelatedWord = (): RelatedWordForm => ({
  headword: '',
  partOfSpeech: null,
  meaningCn: null
});

const emptyWord = (): NormalizedWordInput => ({
  headword: '',
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

const toStringOrEmpty = (value: string | null | undefined) => value ?? '';

const toNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const mapWordToForm = (word: WordWithRelations): NormalizedWordInput => ({
  headword: word.headword,
  rank: word.rank,
  bookId: word.book_id,
  phoneticUs: word.phonetic_us,
  phoneticUk: word.phonetic_uk,
  audioUs: word.audio_us,
  audioUk: word.audio_uk,
  memoryTip: word.memory_tip,
  definitions: word.definitions.map((definition: WordDefinitionRecord) => ({
    partOfSpeech: definition.part_of_speech,
    meaningCn: definition.meaning_cn,
    meaningEn: definition.meaning_en,
    note: definition.note,
    examples: definition.exampleSentences.map((example: WordDefinitionExampleRecord) => ({
      source: example.source,
      translation: example.translation ?? null,
      meta: example.meta ? (example.meta as Record<string, unknown>) : null
    }))
  })),
  examples: word.exampleSentences.map((example: WordExampleRecord) => ({
    source: example.source,
    translation: example.translation ?? null,
    meta: example.meta ? (example.meta as Record<string, unknown>) : null
  })),
  synonymGroups: word.synonymGroups.map((group: WordSynonymGroupRecord) => ({
    partOfSpeech: group.part_of_speech,
    meaningCn: group.meaning_cn,
    note: group.note,
    items: group.synos.map((syn: WordSynonymRecord) => syn.value)
  })),
  phrases: word.phrases.map((phrase: WordPhraseRecord) => ({
    content: phrase.content,
    meaningCn: phrase.meaning_cn,
    meaningEn: phrase.meaning_en
  })),
  relatedWords: word.relatedWords.map((related: WordRelatedRecord) => ({
    headword: related.headword,
    partOfSpeech: related.part_of_speech,
    meaningCn: related.meaning_cn
  }))
});

const sanitizeForm = (form: NormalizedWordInput): NormalizedWordInput => ({
  headword: form.headword.trim(),
  rank: form.rank ?? null,
  bookId: toNullableString(toStringOrEmpty(form.bookId ?? '')),
  phoneticUs: toNullableString(toStringOrEmpty(form.phoneticUs ?? '')),
  phoneticUk: toNullableString(toStringOrEmpty(form.phoneticUk ?? '')),
  audioUs: toNullableString(toStringOrEmpty(form.audioUs ?? '')),
  audioUk: toNullableString(toStringOrEmpty(form.audioUk ?? '')),
  memoryTip: toNullableString(toStringOrEmpty(form.memoryTip ?? '')),
  definitions: form.definitions.map((definition: DefinitionForm) => ({
    partOfSpeech: toNullableString(toStringOrEmpty(definition.partOfSpeech ?? '')),
    meaningCn: toNullableString(toStringOrEmpty(definition.meaningCn ?? '')),
    meaningEn: toNullableString(toStringOrEmpty(definition.meaningEn ?? '')),
    note: toNullableString(toStringOrEmpty(definition.note ?? '')),
    examples: definition.examples
      .map((example: ExampleForm) => ({
        source: example.source.trim(),
        translation: toNullableString(toStringOrEmpty(example.translation ?? '')),
        meta: example.meta ?? null
      }))
      .filter((example: ExampleForm) => example.source.length > 0)
  })),
  examples: form.examples
    .map((example: ExampleForm) => ({
      source: example.source.trim(),
      translation: toNullableString(toStringOrEmpty(example.translation ?? '')),
      meta: example.meta ?? null
    }))
    .filter((example: ExampleForm) => example.source.length > 0),
  synonymGroups: form.synonymGroups.map((group: SynonymGroupForm) => ({
    partOfSpeech: toNullableString(toStringOrEmpty(group.partOfSpeech ?? '')),
    meaningCn: toNullableString(toStringOrEmpty(group.meaningCn ?? '')),
    note: toNullableString(toStringOrEmpty(group.note ?? '')),
    items: group.items
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0)
  })),
  phrases: form.phrases
    .map((phrase: PhraseForm) => ({
      content: phrase.content.trim(),
      meaningCn: toNullableString(toStringOrEmpty(phrase.meaningCn ?? '')),
      meaningEn: toNullableString(toStringOrEmpty(phrase.meaningEn ?? ''))
    }))
    .filter((phrase: PhraseForm) => phrase.content.length > 0),
  relatedWords: form.relatedWords
    .map((related: RelatedWordForm) => ({
      headword: related.headword.trim(),
      partOfSpeech: toNullableString(toStringOrEmpty(related.partOfSpeech ?? '')),
      meaningCn: toNullableString(toStringOrEmpty(related.meaningCn ?? ''))
    }))
    .filter((related: RelatedWordForm) => related.headword.length > 0)
});

export default function WordManager({ initialList }: WordManagerProps) {
  const [listState, setListState] = useState<WordListState>({
    query: '',
    items: initialList.items,
    total: initialList.total
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<WordWithRelations | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [formData, setFormData] = useState<NormalizedWordInput>(emptyWord());

  const listAction = useAction(listWordsAction, {
    onSuccess: (result: ListWordsResult) => {
      setListState((prev: WordListState) => ({ ...prev, items: result.items, total: result.total }));
    }
  });

  const detailAction = useAction(getWordDetailAction, {
    onSuccess: (word: WordWithRelations) => {
      setSelectedWord(word);
      setFormMode(null);
    }
  });

  const createAction = useAction(createWordAction, {
    onSuccess: (word: WordWithRelations) => {
      setSelectedWord(word);
      setSelectedId(word.id);
      setFormMode(null);
      void refreshList();
    }
  });

  const updateAction = useAction(updateWordAction, {
    onSuccess: (word: WordWithRelations) => {
      setSelectedWord(word);
      setSelectedId(word.id);
      setFormMode(null);
      void refreshList();
    }
  });

  const deleteAction = useAction(deleteWordAction, {
    onSuccess: () => {
      setSelectedWord(null);
      setSelectedId(null);
      void refreshList();
    }
  });

  const refreshList = useCallback(
    async (nextQuery?: string) => {
      const query = nextQuery ?? listState.query;
      setListState((prev: WordListState) => ({ ...prev, query }));
      await listAction.execute({ query, skip: 0, take: 20 });
    },
    [listAction, listState.query]
  );

  const handleSelect = useCallback(
    async (id: string) => {
      setSelectedId(id);
      await detailAction.execute({ id });
    },
    [detailAction]
  );

  const handleCreate = () => {
    setFormMode('create');
    setFormData(emptyWord());
    setSelectedWord(null);
    setSelectedId(null);
  };

  const handleEdit = useCallback(() => {
    if (!selectedWord) return;
    setFormMode('edit');
    setFormData(mapWordToForm(selectedWord));
  }, [selectedWord]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    // eslint-disable-next-line no-alert
    if (globalThis.confirm?.('确定要删除该词条吗？操作不可撤销。')) {
      void deleteAction.execute({ id: selectedId });
    }
  }, [deleteAction, selectedId]);

  const submitDisabled = createAction.status === 'executing' || updateAction.status === 'executing';

  const handleSubmit = async () => {
    const sanitized = sanitizeForm(formData);
    if (formMode === 'create') {
      await createAction.execute({ word: sanitized });
    } else if (formMode === 'edit' && selectedId) {
      await updateAction.execute({ id: selectedId, word: sanitized });
    }
  };

  const listLoading = listAction.status === 'executing';

  const selectedImportLogs = useMemo<WordWithRelations['importLogs']>(
    () => selectedWord?.importLogs ?? [],
    [selectedWord]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Input
            value={listState.query}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setListState((prev: WordListState) => ({ ...prev, query: event.target.value }))
            }
            placeholder="搜索词头"
          />
          <Button variant="secondary" onClick={() => void refreshList()} disabled={listLoading}>
            搜索
          </Button>
          <Button onClick={handleCreate}>新建词条</Button>
        </div>
        <div className="mt-4 text-sm text-slate-500">
          共 {listState.total} 条记录
        </div>
        <ul className="mt-4 divide-y divide-slate-200">
          {listState.items.map((item: ListWordsResultItem) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void handleSelect(item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-4 px-2 py-3 text-left transition hover:bg-slate-50',
                  selectedId === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                )}
              >
                <div>
                  <div className="font-medium">{item.headword}</div>
                  <div className="text-xs text-slate-500">
                    {item.phoneticUs ? `[美 ${item.phoneticUs}]` : ''}
                    {item.phoneticUk ? ` [英 ${item.phoneticUk}]` : ''}
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  更新于 {new Date(item.updatedAt).toLocaleString()}
                </div>
              </button>
            </li>
          ))}
          {listState.items.length === 0 && (
            <li className="py-10 text-center text-sm text-slate-400">暂无数据</li>
          )}
        </ul>
      </section>

      <section className="space-y-4">
        {formMode ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {formMode === 'create' ? '新建词条' : '编辑词条'}
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setFormMode(null)}>
                  取消
                </Button>
                <Button onClick={() => void handleSubmit()} disabled={submitDisabled}>
                  保存
                </Button>
              </div>
            </header>
            <WordForm formData={formData} onChange={setFormData} />
          </div>
        ) : selectedWord ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{selectedWord.headword}</h2>
                <p className="text-sm text-slate-500">
                  {selectedWord.rank ? `词频：${selectedWord.rank}` : ''}
                  {selectedWord.book_id ? ` · 教材：${selectedWord.book_id}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleEdit}>
                  编辑
                </Button>
                <Button variant="ghost" onClick={handleDelete}>
                  删除
                </Button>
              </div>
            </header>
            <WordDetail word={selectedWord} />
            {selectedImportLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700">最近导入日志</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {selectedImportLogs.map((log: WordImportLogRecord) => (
                    <li key={log.id} className="rounded border border-slate-200 p-2">
                      <div>
                        <span className="font-medium">状态：</span>
                        {log.status}
                        {log.message ? `（${log.message}）` : ''}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded border border-dashed border-slate-300 p-10 text-sm text-slate-500">
            请选择左侧词条查看详情，或新建词条。
          </div>
        )}
      </section>
    </div>
  );
}

type WordFormProps = {
  formData: NormalizedWordInput;
  onChange: (value: NormalizedWordInput) => void;
};

function WordForm({ formData, onChange }: WordFormProps) {
  const updateField = <K extends keyof NormalizedWordInput>(key: K, value: NormalizedWordInput[K]) => {
    onChange({ ...formData, [key]: value });
  };

  const updateDefinition = (index: number, value: DefinitionForm) => {
    const next = [...formData.definitions];
    next[index] = value;
    updateField('definitions', next);
  };

  const updateDefinitionExample = (definitionIndex: number, exampleIndex: number, value: ExampleForm) => {
    const nextDefinitions = [...formData.definitions];
    const definition = { ...nextDefinitions[definitionIndex] };
    const examples = [...(definition.examples ?? [])];
    examples[exampleIndex] = value;
    definition.examples = examples;
    nextDefinitions[definitionIndex] = definition;
    updateField('definitions', nextDefinitions);
  };

  const updateExample = (index: number, value: ExampleForm) => {
    const next = [...formData.examples];
    next[index] = value;
    updateField('examples', next);
  };

  const updateSynonymGroup = (index: number, value: SynonymGroupForm) => {
    const next = [...formData.synonymGroups];
    next[index] = value;
    updateField('synonymGroups', next);
  };

  const updatePhrase = (index: number, value: PhraseForm) => {
    const next = [...formData.phrases];
    next[index] = value;
    updateField('phrases', next);
  };

  const updateRelatedWord = (index: number, value: RelatedWordForm) => {
    const next = [...formData.relatedWords];
    next[index] = value;
    updateField('relatedWords', next);
  };

  return (
  <form className="space-y-6" onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
      <section className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">词头 *</label>
          <Input
            required
            value={formData.headword}
            onChange={(event: InputChangeEvent) => updateField('headword', event.target.value)}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">词频</label>
            <Input
              type="number"
              value={formData.rank ?? ''}
              onChange={(event: InputChangeEvent) =>
                updateField('rank', toNullableNumber(event.target.value))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">教材编号</label>
            <Input
              value={formData.bookId ?? ''}
              onChange={(event: InputChangeEvent) => updateField('bookId', event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">美式音标</label>
            <Input
              value={formData.phoneticUs ?? ''}
              onChange={(event: InputChangeEvent) => updateField('phoneticUs', event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">英式音标</label>
            <Input
              value={formData.phoneticUk ?? ''}
              onChange={(event: InputChangeEvent) => updateField('phoneticUk', event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">美式音频链接</label>
            <Input
              value={formData.audioUs ?? ''}
              onChange={(event: InputChangeEvent) => updateField('audioUs', event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">英式音频链接</label>
            <Input
              value={formData.audioUk ?? ''}
              onChange={(event: InputChangeEvent) => updateField('audioUk', event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">记忆提示</label>
          <Textarea
            value={formData.memoryTip ?? ''}
            onChange={(event: TextareaChangeEvent) => updateField('memoryTip', event.target.value)}
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">释义</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('definitions', [...formData.definitions, emptyDefinition()])}
          >
            添加释义
          </Button>
        </div>
        {formData.definitions.length === 0 && (
          <p className="text-sm text-slate-400">尚未添加释义。</p>
        )}
        <div className="space-y-4">
          {formData.definitions.map((definition: DefinitionForm, index: number) => (
            <div key={`definition-${index}`} className="rounded border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">释义 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateField(
                      'definitions',
                      formData.definitions.filter((_, i) => i !== index)
                    )
                  }
                >
                  删除
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">词性</label>
                  <Input
                    value={definition.partOfSpeech ?? ''}
                    onChange={(event: InputChangeEvent) =>
                      updateDefinition(index, { ...definition, partOfSpeech: event.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">备注</label>
                  <Input
                    value={definition.note ?? ''}
                    onChange={(event: InputChangeEvent) =>
                      updateDefinition(index, { ...definition, note: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">中文释义</label>
                  <Textarea
                    value={definition.meaningCn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updateDefinition(index, { ...definition, meaningCn: event.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">英文释义</label>
                  <Textarea
                    value={definition.meaningEn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updateDefinition(index, { ...definition, meaningEn: event.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">例句</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateDefinition(index, {
                        ...definition,
                        examples: [...definition.examples, emptyExample()]
                      })
                    }
                  >
                    添加例句
                  </Button>
                </div>
                {definition.examples.length === 0 && (
                  <p className="text-xs text-slate-400">尚未添加例句。</p>
                )}
                <div className="space-y-2">
                  {definition.examples.map((example: ExampleForm, exampleIndex: number) => (
                    <div key={`definition-${index}-example-${exampleIndex}`} className="rounded border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">例句 {exampleIndex + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateDefinition(index, {
                              ...definition,
                              examples: definition.examples.filter((_, i) => i !== exampleIndex)
                            })
                          }
                        >
                          删除
                        </Button>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">原文 *</label>
                        <Textarea
                          value={example.source}
                          onChange={(event: TextareaChangeEvent) =>
                            updateDefinitionExample(index, exampleIndex, {
                              ...example,
                              source: event.target.value
                            })
                          }
                          rows={2}
                        />
                      </div>
                      <div className="mt-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">译文</label>
                        <Textarea
                          value={example.translation ?? ''}
                          onChange={(event: TextareaChangeEvent) =>
                            updateDefinitionExample(index, exampleIndex, {
                              ...example,
                              translation: event.target.value
                            })
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">独立例句</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('examples', [...formData.examples, emptyExample()])}
          >
            添加例句
          </Button>
        </div>
        {formData.examples.length === 0 && <p className="text-sm text-slate-400">尚未添加例句。</p>}
        <div className="space-y-2">
          {formData.examples.map((example: ExampleForm, index: number) => (
            <div key={`example-${index}`} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">例句 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField('examples', formData.examples.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">原文 *</label>
                <Textarea
                  value={example.source}
                  onChange={(event: TextareaChangeEvent) =>
                    updateExample(index, {
                      ...example,
                      source: event.target.value
                    })
                  }
                  rows={2}
                />
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">译文</label>
                <Textarea
                  value={example.translation ?? ''}
                  onChange={(event: TextareaChangeEvent) =>
                    updateExample(index, {
                      ...example,
                      translation: event.target.value
                    })
                  }
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">近义词组</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('synonymGroups', [...formData.synonymGroups, emptySynonymGroup()])}
          >
            添加分组
          </Button>
        </div>
        {formData.synonymGroups.length === 0 && <p className="text-sm text-slate-400">尚未添加近义词。</p>}
        <div className="space-y-3">
          {formData.synonymGroups.map((group: SynonymGroupForm, groupIndex: number) => (
            <div key={`synonym-group-${groupIndex}`} className="rounded border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">分组 {groupIndex + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateField(
                      'synonymGroups',
                      formData.synonymGroups.filter((_, i) => i !== groupIndex)
                    )
                  }
                >
                  删除
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">词性</label>
                  <Input
                    value={group.partOfSpeech ?? ''}
                    onChange={(event: InputChangeEvent) =>
                      updateSynonymGroup(groupIndex, {
                        ...group,
                        partOfSpeech: event.target.value
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">中文释义</label>
                  <Textarea
                    value={group.meaningCn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updateSynonymGroup(groupIndex, {
                        ...group,
                        meaningCn: event.target.value
                      })
                    }
                    rows={2}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">词条</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      updateSynonymGroup(groupIndex, {
                        ...group,
                        items: [...group.items, '']
                      })
                    }
                  >
                    添加词条
                  </Button>
                </div>
                {group.items.length === 0 && <p className="text-xs text-slate-400">尚未添加词条。</p>}
                <div className="space-y-2">
                  {group.items.map((item: string, itemIndex: number) => (
                    <div key={`synonym-${groupIndex}-${itemIndex}`} className="flex items-center gap-2">
                      <Input
                        value={item}
                        onChange={(event: InputChangeEvent) =>
                          updateSynonymGroup(groupIndex, {
                            ...group,
                            items: group.items.map((value, idx) =>
                              idx === itemIndex ? event.target.value : value
                            )
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateSynonymGroup(groupIndex, {
                            ...group,
                            items: group.items.filter((_, i) => i !== itemIndex)
                          })
                        }
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">短语</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('phrases', [...formData.phrases, emptyPhrase()])}
          >
            添加短语
          </Button>
        </div>
        {formData.phrases.length === 0 && <p className="text-sm text-slate-400">尚未添加短语。</p>}
        <div className="space-y-2">
          {formData.phrases.map((phrase: PhraseForm, index: number) => (
            <div key={`phrase-${index}`} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">短语 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField('phrases', formData.phrases.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">内容 *</label>
                <Input
                  value={phrase.content}
                  onChange={(event: InputChangeEvent) =>
                    updatePhrase(index, { ...phrase, content: event.target.value })
                  }
                />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">中文释义</label>
                  <Textarea
                    value={phrase.meaningCn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updatePhrase(index, { ...phrase, meaningCn: event.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">英文释义</label>
                  <Textarea
                    value={phrase.meaningEn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updatePhrase(index, { ...phrase, meaningEn: event.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">相关词</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => updateField('relatedWords', [...formData.relatedWords, emptyRelatedWord()])}
          >
            添加相关词
          </Button>
        </div>
        {formData.relatedWords.length === 0 && <p className="text-sm text-slate-400">尚未添加相关词。</p>}
        <div className="space-y-2">
          {formData.relatedWords.map((related: RelatedWordForm, index: number) => (
            <div key={`related-${index}`} className="rounded border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">相关词 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => updateField('relatedWords', formData.relatedWords.filter((_, i) => i !== index))}
                >
                  删除
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">词头 *</label>
                  <Input
                    value={related.headword}
                    onChange={(event: InputChangeEvent) =>
                      updateRelatedWord(index, { ...related, headword: event.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">词性</label>
                  <Input
                    value={related.partOfSpeech ?? ''}
                    onChange={(event: InputChangeEvent) =>
                      updateRelatedWord(index, { ...related, partOfSpeech: event.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-slate-600">中文释义</label>
                  <Textarea
                    value={related.meaningCn ?? ''}
                    onChange={(event: TextareaChangeEvent) =>
                      updateRelatedWord(index, { ...related, meaningCn: event.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}

function WordDetail({ word }: { word: WordWithRelations }) {
  return (
    <div className="space-y-6 text-sm text-slate-700">
      <section className="grid gap-2 md:grid-cols-2">
        <DetailRow label="美式音标" value={word.phonetic_us} />
        <DetailRow label="英式音标" value={word.phonetic_uk} />
        <DetailRow label="美式音频" value={word.audio_us} isLink />
        <DetailRow label="英式音频" value={word.audio_uk} isLink />
        <DetailRow label="记忆提示" value={word.memory_tip} fullWidth />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">释义</h3>
        {word.definitions.length === 0 ? (
          <p className="text-slate-400">暂无释义。</p>
        ) : (
          <div className="space-y-3">
            {word.definitions.map((definition) => (
              <div key={definition.id} className="rounded border border-slate-200 p-3">
                <div className="text-xs text-slate-500">
                  {definition.part_of_speech || '—'}
                </div>
                <div className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {definition.meaning_cn || definition.meaning_en || '—'}
                </div>
                {definition.exampleSentences.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {definition.exampleSentences.map((example) => (
                      <li key={example.id}>
                        <span className="font-medium text-slate-700">• </span>
                        {example.source}
                        {example.translation ? ` — ${example.translation}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">独立例句</h3>
        {word.exampleSentences.length === 0 ? (
          <p className="text-slate-400">暂无例句。</p>
        ) : (
          <ul className="space-y-2">
            {word.exampleSentences.map((example) => (
              <li key={example.id} className="rounded border border-slate-200 p-2">
                <div>{example.source}</div>
                {example.translation && (
                  <div className="text-xs text-slate-500">{example.translation}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">近义词</h3>
        {word.synonymGroups.length === 0 ? (
          <p className="text-slate-400">暂无近义词。</p>
        ) : (
          <ul className="space-y-2">
            {word.synonymGroups.map((group) => (
              <li key={group.id} className="rounded border border-slate-200 p-2">
                <div className="text-xs text-slate-500">
                  {group.part_of_speech || '—'} {group.meaning_cn || ''}
                </div>
                <div className="text-sm text-slate-700">
                  {group.synos.map((syn) => syn.value).join('、') || '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">短语</h3>
        {word.phrases.length === 0 ? (
          <p className="text-slate-400">暂无短语。</p>
        ) : (
          <ul className="space-y-2">
            {word.phrases.map((phrase) => (
              <li key={phrase.id} className="rounded border border-slate-200 p-2">
                <div className="font-medium text-slate-700">{phrase.content}</div>
                <div className="text-xs text-slate-500">
                  {[phrase.meaning_cn, phrase.meaning_en].filter(Boolean).join(' / ') || '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">相关词</h3>
        {word.relatedWords.length === 0 ? (
          <p className="text-slate-400">暂无相关词。</p>
        ) : (
          <ul className="space-y-2">
            {word.relatedWords.map((related) => (
              <li key={related.id} className="rounded border border-slate-200 p-2">
                <div className="font-medium text-slate-700">{related.headword}</div>
                <div className="text-xs text-slate-500">
                  {[related.part_of_speech, related.meaning_cn].filter(Boolean).join(' · ') || '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink,
  fullWidth
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={cn(fullWidth ? 'md:col-span-2' : '', 'space-y-1 rounded border border-slate-200 p-3')}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          {value}
        </a>
      ) : (
        <div className="text-sm text-slate-700">{value}</div>
      )}
    </div>
  );
}
