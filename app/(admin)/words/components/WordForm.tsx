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
  createEmptySynonymGroup,
  createEmptyAntonym,
  createEmptyExamChoice,
  createEmptyExamQuestion,
  createEmptyRealExamSentence
} from "@/lib/word-normalizer";
import type {
  DefinitionForm,
  ExampleForm,
  SynonymGroupForm,
  PhraseForm,
  RelatedWordForm,
  AntonymForm,
  RealExamSentenceForm,
  ExamQuestionForm,
  ExamChoiceForm
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

  const updateAntonym = useCallback(
    (index: number, antonym: AntonymForm) => {
      const antonyms = [...formData.antonyms];
      antonyms[index] = antonym;
      updateField("antonyms", antonyms);
    },
    [formData.antonyms, updateField]
  );

  const updateRealExamSentence = useCallback(
    (index: number, sentence: RealExamSentenceForm) => {
      const realExamSentences = [...formData.realExamSentences];
      realExamSentences[index] = sentence;
      updateField("realExamSentences", realExamSentences);
    },
    [formData.realExamSentences, updateField]
  );

  const updateExamQuestion = useCallback(
    (index: number, question: ExamQuestionForm) => {
      const examQuestions = [...formData.examQuestions];
      examQuestions[index] = question;
      updateField("examQuestions", examQuestions);
    },
    [formData.examQuestions, updateField]
  );

  const updateExamChoice = useCallback(
    (questionIndex: number, choiceIndex: number, choice: ExamChoiceForm) => {
      const targetQuestion = formData.examQuestions[questionIndex];
      const choices = [...targetQuestion.choices];
      choices[choiceIndex] = choice;
      updateExamQuestion(questionIndex, { ...targetQuestion, choices });
    },
    [formData.examQuestions, updateExamQuestion]
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
            <Label htmlFor="star" className="text-sm font-medium">
              星级
            </Label>
            <Input
              id="star"
              type="number"
              value={formData.star ?? ""}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                updateField("star", Number.isNaN(next) ? null : next);
              }}
              placeholder="例如：3"
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
            <Label htmlFor="sourceWordId" className="text-sm font-medium">
              来源词条 ID
            </Label>
            <Input
              id="sourceWordId"
              value={formData.sourceWordId ?? ""}
              onChange={(event) => updateField("sourceWordId", event.target.value)}
              placeholder="同步来源的唯一标识"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="pictureUrl" className="text-sm font-medium">
              图片链接
            </Label>
            <Input
              id="pictureUrl"
              value={formData.pictureUrl ?? ""}
              onChange={(event) => updateField("pictureUrl", event.target.value)}
              placeholder="可选，展示相关插图"
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phonetic" className="text-sm font-medium">
              音标（综合）
            </Label>
            <Input
              id="phonetic"
              value={formData.phonetic ?? ""}
              onChange={(event) => updateField("phonetic", event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speech" className="text-sm font-medium">
              读音提示 (speech)
            </Label>
            <Input
              id="speech"
              value={formData.speech ?? ""}
              onChange={(event) => updateField("speech", event.target.value)}
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
        </div>

        <Separator className="my-6" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="audioUs" className="text-sm font-medium">
              美式音频链接
            </Label>
            <Input
              id="audioUs"
              value={formData.audioUs ?? ""}
              onChange={(event) => updateField("audioUs", event.target.value)}
              placeholder="留空则自动根据词头生成"
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
              placeholder="留空则自动根据词头生成"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUsRaw" className="text-sm font-medium">
              美式音频原始数据
            </Label>
            <Textarea
              id="audioUsRaw"
              value={formData.audioUsRaw ?? ""}
              onChange={(event) => updateField("audioUsRaw", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioUkRaw" className="text-sm font-medium">
              英式音频原始数据
            </Label>
            <Textarea
              id="audioUkRaw"
              value={formData.audioUkRaw ?? ""}
              onChange={(event) => updateField("audioUkRaw", event.target.value)}
              rows={2}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="记忆与说明">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label htmlFor="memoryTipDesc" className="text-sm font-medium">
              记忆提示说明
            </Label>
            <Textarea
              id="memoryTipDesc"
              value={formData.memoryTipDesc ?? ""}
              onChange={(event) => updateField("memoryTipDesc", event.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sentenceDesc" className="text-sm font-medium">
              例句描述
            </Label>
            <Textarea
              id="sentenceDesc"
              value={formData.sentenceDesc ?? ""}
              onChange={(event) => updateField("sentenceDesc", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="synonymDesc" className="text-sm font-medium">
              近义词描述
            </Label>
            <Textarea
              id="synonymDesc"
              value={formData.synonymDesc ?? ""}
              onChange={(event) => updateField("synonymDesc", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phraseDesc" className="text-sm font-medium">
              固定搭配描述
            </Label>
            <Textarea
              id="phraseDesc"
              value={formData.phraseDesc ?? ""}
              onChange={(event) => updateField("phraseDesc", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relatedDesc" className="text-sm font-medium">
              相关词说明
            </Label>
            <Textarea
              id="relatedDesc"
              value={formData.relatedDesc ?? ""}
              onChange={(event) => updateField("relatedDesc", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="antonymDesc" className="text-sm font-medium">
              反义词描述
            </Label>
            <Textarea
              id="antonymDesc"
              value={formData.antonymDesc ?? ""}
              onChange={(event) => updateField("antonymDesc", event.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="realExamSentenceDesc" className="text-sm font-medium">
              真题例句描述
            </Label>
            <Textarea
              id="realExamSentenceDesc"
              value={formData.realExamSentenceDesc ?? ""}
              onChange={(event) => updateField("realExamSentenceDesc", event.target.value)}
              rows={2}
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
                  <div className="grid gap-4 md:grid-cols-3">
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
                      <Label
                        htmlFor={`${prefix}-pos-tag`}
                        className="text-xs font-medium text-muted-foreground"
                      >
                        POS 标签
                      </Label>
                      <Input
                        id={`${prefix}-pos-tag`}
                        value={definition.pos ?? ""}
                        onChange={(event) =>
                          updateDefinition(index, {
                            ...definition,
                            pos: event.target.value
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

      <FormSection
        title="反义词"
        description="维护与该词条相关的反义词信息。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("antonyms", [...formData.antonyms, createEmptyAntonym()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加反义词
          </Button>
        }
      >
        {formData.antonyms.length === 0 ? (
          <FormEmpty message="尚未添加反义词。" />
        ) : (
          <div className="space-y-3">
            {formData.antonyms.map((antonym, index) => {
              const prefix = `antonym-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      反义词 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "antonyms",
                          formData.antonyms.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-headword`} className="text-xs font-medium text-muted-foreground">
                        反义词 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`${prefix}-headword`}
                        value={antonym.headword}
                        onChange={(event) =>
                          updateAntonym(index, {
                            ...antonym,
                            headword: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-meta`} className="text-xs font-medium text-muted-foreground">
                        附加信息 (只读)
                      </Label>
                      <Textarea
                        id={`${prefix}-meta`}
                        value={antonym.meta ? JSON.stringify(antonym.meta, null, 2) : ""}
                        readOnly
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
        title="真题例句"
        description="记录真题出处及关联信息，便于学习参考。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("realExamSentences", [...formData.realExamSentences, createEmptyRealExamSentence()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加例句
          </Button>
        }
      >
        {formData.realExamSentences.length === 0 ? (
          <FormEmpty message="尚未添加真题例句。" />
        ) : (
          <div className="space-y-3">
            {formData.realExamSentences.map((sentence, index) => {
              const prefix = `real-exam-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      真题例句 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "realExamSentences",
                          formData.realExamSentences.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-content`} className="text-xs font-medium text-muted-foreground">
                      例句原文 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`${prefix}-content`}
                      value={sentence.content}
                      onChange={(event) =>
                        updateRealExamSentence(index, {
                          ...sentence,
                          content: event.target.value
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-level`} className="text-xs font-medium text-muted-foreground">
                        等级
                      </Label>
                      <Input
                        id={`${prefix}-level`}
                        value={sentence.level ?? ""}
                        onChange={(event) =>
                          updateRealExamSentence(index, {
                            ...sentence,
                            level: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-paper`} className="text-xs font-medium text-muted-foreground">
                        真题试卷/出处
                      </Label>
                      <Input
                        id={`${prefix}-paper`}
                        value={sentence.paper ?? ""}
                        onChange={(event) =>
                          updateRealExamSentence(index, {
                            ...sentence,
                            paper: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-source-type`} className="text-xs font-medium text-muted-foreground">
                        类型
                      </Label>
                      <Input
                        id={`${prefix}-source-type`}
                        value={sentence.sourceType ?? ""}
                        onChange={(event) =>
                          updateRealExamSentence(index, {
                            ...sentence,
                            sourceType: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-year`} className="text-xs font-medium text-muted-foreground">
                        年份
                      </Label>
                      <Input
                        id={`${prefix}-year`}
                        value={sentence.year ?? ""}
                        onChange={(event) =>
                          updateRealExamSentence(index, {
                            ...sentence,
                            year: event.target.value
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-order`} className="text-xs font-medium text-muted-foreground">
                        排序
                      </Label>
                      <Input
                        id={`${prefix}-order`}
                        type="number"
                        value={sentence.order ?? ""}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          updateRealExamSentence(index, {
                            ...sentence,
                            order: Number.isNaN(next) ? null : next
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-source-info`} className="text-xs font-medium text-muted-foreground">
                      来源信息 (只读)
                    </Label>
                    <Textarea
                      id={`${prefix}-source-info`}
                      value={sentence.sourceInfo ? JSON.stringify(sentence.sourceInfo, null, 2) : ""}
                      readOnly
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
        title="真题练习题"
        description="为词条补充真题练习与选项。"
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField("examQuestions", [...formData.examQuestions, createEmptyExamQuestion()])}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加题目
          </Button>
        }
      >
        {formData.examQuestions.length === 0 ? (
          <FormEmpty message="尚未添加真题练习题。" />
        ) : (
          <div className="space-y-3">
            {formData.examQuestions.map((question, index) => {
              const prefix = `exam-question-${index}`;
              return (
                <div
                  key={prefix}
                  className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      练习题 {index + 1}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateField(
                          "examQuestions",
                          formData.examQuestions.filter((_, i) => i !== index)
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${prefix}-question`} className="text-xs font-medium text-muted-foreground">
                      题干 <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`${prefix}-question`}
                      value={question.question}
                      onChange={(event) =>
                        updateExamQuestion(index, {
                          ...question,
                          question: event.target.value
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-exam-type`} className="text-xs font-medium text-muted-foreground">
                        题型
                      </Label>
                      <Input
                        id={`${prefix}-exam-type`}
                        type="number"
                        value={question.examType ?? ""}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          updateExamQuestion(index, {
                            ...question,
                            examType: Number.isNaN(next) ? null : next
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${prefix}-right-index`} className="text-xs font-medium text-muted-foreground">
                        正确选项序号
                      </Label>
                      <Input
                        id={`${prefix}-right-index`}
                        type="number"
                        value={question.rightIndex ?? ""}
                        onChange={(event) => {
                          const next = Number.parseInt(event.target.value, 10);
                          updateExamQuestion(index, {
                            ...question,
                            rightIndex: Number.isNaN(next) ? null : next
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor={`${prefix}-explanation`} className="text-xs font-medium text-muted-foreground">
                        解析
                      </Label>
                      <Textarea
                        id={`${prefix}-explanation`}
                        value={question.explanation ?? ""}
                        onChange={(event) =>
                          updateExamQuestion(index, {
                            ...question,
                            explanation: event.target.value
                          })
                        }
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        选项
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateExamQuestion(index, {
                            ...question,
                            choices: [...question.choices, createEmptyExamChoice()]
                          })
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" /> 添加选项
                      </Button>
                    </div>
                    {question.choices.length === 0 ? (
                      <FormEmpty message="暂无选项，请添加。" />
                    ) : (
                      <div className="space-y-3">
                        {question.choices.map((choice, choiceIndex) => {
                          const choicePrefix = `${prefix}-choice-${choiceIndex}`;
                          return (
                            <div
                              key={choicePrefix}
                              className="grid gap-3 rounded-lg border border-dashed border-border/50 bg-muted/15 p-3 md:grid-cols-[1fr,160px,auto]"
                            >
                              <div className="space-y-2">
                                <Label htmlFor={`${choicePrefix}-value`} className="text-xs font-medium text-muted-foreground">
                                  选项内容 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`${choicePrefix}-value`}
                                  value={choice.value}
                                  onChange={(event) =>
                                    updateExamChoice(index, choiceIndex, {
                                      ...choice,
                                      value: event.target.value
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`${choicePrefix}-index`} className="text-xs font-medium text-muted-foreground">
                                  选项序号
                                </Label>
                                <Input
                                  id={`${choicePrefix}-index`}
                                  type="number"
                                  value={choice.index ?? ""}
                                  onChange={(event) => {
                                    const next = Number.parseInt(event.target.value, 10);
                                    updateExamChoice(index, choiceIndex, {
                                      ...choice,
                                      index: Number.isNaN(next) ? null : next
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-end justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateExamQuestion(index, {
                                      ...question,
                                      choices: question.choices.filter((_, i) => i !== choiceIndex)
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
