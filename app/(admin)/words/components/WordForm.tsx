import { useCallback, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { WordFormProps } from "@/app/(admin)/words/types";
import type { NormalizedWordInput } from "@/app/words/schemas";
import {
  createEmptyDefinition,
  createEmptyExample,
  createEmptyPhrase,
  createEmptyRelatedWord,
  createEmptySynonymGroup
} from "@/lib/word-normalizer";
import type {
  DefinitionForm,
  ExampleForm,
  SynonymGroupForm,
  PhraseForm,
  RelatedWordForm
} from "@/app/(admin)/words/types";
import { getYoudaoDictVoicePair } from "@/lib/utils";

export function WordForm({ formData, setFormData }: WordFormProps) {
  const updateField = useCallback(
    <K extends keyof NormalizedWordInput>(key: K, value: NormalizedWordInput[K]) => {
      if (key === "headword") {
        const nextHeadword = typeof value === "string" ? value : String(value ?? "");
        const voice = getYoudaoDictVoicePair(nextHeadword);
        setFormData({
          ...formData,
          headword: nextHeadword,
          audioUs: voice.us,
          audioUk: voice.uk
        });
        return;
      }

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
          <div className="space-y-2 md:col-span-2">
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
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              系统基于有道 DictVoice 接口自动生成，随词头更新。
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUk" className="text-sm font-medium">
              英式音频链接
            </Label>
            <Input
              id="audioUk"
              value={formData.audioUk ?? ""}
              readOnly
            />
            <p className="text-xs text-muted-foreground">
              类型参数为 2（英音），无需手动维护。
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
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
            onClick={() => updateField("definitions", [...formData.definitions, createEmptyDefinition()])}
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
                  <DefinitionExamples
                    definition={definition}
                    definitionIndex={index}
                    updateDefinition={updateDefinition}
                    updateDefinitionExample={updateDefinitionExample}
                  />
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
            onClick={() => updateField("examples", [...formData.examples, createEmptyExample()])}
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
            onClick={() => updateField("synonymGroups", [...formData.synonymGroups, createEmptySynonymGroup()])}
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
                  <SynonymItems
                    group={group}
                    groupIndex={index}
                    updateSynonymGroup={updateSynonymGroup}
                  />
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
            onClick={() => updateField("phrases", [...formData.phrases, createEmptyPhrase()])}
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
            onClick={() => updateField("relatedWords", [...formData.relatedWords, createEmptyRelatedWord()])}
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

function DefinitionExamples({
  definition,
  definitionIndex,
  updateDefinition,
  updateDefinitionExample
}: {
  definition: DefinitionForm;
  definitionIndex: number;
  updateDefinition: (index: number, definition: DefinitionForm) => void;
  updateDefinitionExample: (definitionIndex: number, exampleIndex: number, example: ExampleForm) => void;
}) {
  return (
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
            updateDefinition(definitionIndex, {
              ...definition,
              examples: [...definition.examples, createEmptyExample()]
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
            const examplePrefix = `definition-${definitionIndex}-example-${exampleIndex}`;
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
                      updateDefinition(definitionIndex, {
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
                      updateDefinitionExample(definitionIndex, exampleIndex, {
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
                      updateDefinitionExample(definitionIndex, exampleIndex, {
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
  );
}

function SynonymItems({
  group,
  groupIndex,
  updateSynonymGroup
}: {
  group: SynonymGroupForm;
  groupIndex: number;
  updateSynonymGroup: (index: number, group: SynonymGroupForm) => void;
}) {
  return (
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
            updateSynonymGroup(groupIndex, {
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
            const itemId = `synonym-${groupIndex}-item-${itemIndex}`;
            return (
              <div key={itemId} className="flex items-center gap-2">
                <Input
                  id={itemId}
                  value={item ?? ""}
                  onChange={(event) => {
                    const items = [...group.items];
                    items[itemIndex] = event.target.value;
                    updateSynonymGroup(groupIndex, { ...group, items });
                  }}
                  placeholder="写入近义词"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const items = group.items.filter((_, i) => i !== itemIndex);
                    updateSynonymGroup(groupIndex, { ...group, items });
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
