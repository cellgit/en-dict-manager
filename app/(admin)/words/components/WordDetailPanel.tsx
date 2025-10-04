import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime, getYoudaoDictVoicePair } from "@/lib/utils";
import type { WordViewModel } from "@/app/(admin)/words/types";
import {
  Clock,
  Edit3,
  FileClock,
  Loader2,
  Trash2,
  Volume2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type WordDetailPanelProps = {
  word: WordViewModel | null;
  loading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
};

export function WordDetailPanel({ word, loading, onEdit, onDelete, deleting }: WordDetailPanelProps) {
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

  const voicePair = getYoudaoDictVoicePair(word.headword);
  const audioUsUrl = word.audioUs ?? voicePair.us;
  const audioUkUrl = word.audioUk ?? voicePair.uk;

  const partsOfSpeech = word.definitions
    .map((definition) => definition.pos)
    .filter((value): value is string => Boolean(value))
    .join(" · ");

  const describeRawAudio = (value: string | null): string =>
    value && value.length > 0 ? `已提供（${value.length} 字符）` : "未提供";

  const describeNullable = (value: string | null, fallback = "未提供") =>
    value && value.trim().length > 0 ? value : fallback;

  const truncate = (value: string, length = 60) =>
    value.length > length ? `${value.slice(0, length)}…` : value;

  const baseInfoRows = [
    {
      label: "Rank",
      value: word.rank !== null ? `#${word.rank}` : "未提供"
    },
    {
      label: "星级",
      value: word.star !== null ? String(word.star) : "未提供"
    },
    {
      label: "教材/分组",
      value: describeNullable(word.bookId)
    },
    {
      label: "来源词条 ID",
      value: describeNullable(word.sourceWordId)
    },
    {
      label: "综合音标",
      value: describeNullable(word.phonetic)
    },
    {
      label: "读音提示",
      value: describeNullable(word.speech)
    },
    {
      label: "美式音标",
      value: describeNullable(word.phoneticUs)
    },
    {
      label: "英式音标",
      value: describeNullable(word.phoneticUk)
    },
    {
      label: "美式音频链接",
      value: audioUsUrl ?? "未能生成（检查词头）"
    },
    {
      label: "英式音频链接",
      value: audioUkUrl ?? "未能生成（检查词头）"
    },
    {
      label: "美式音频原始",
      value: describeRawAudio(word.audioUsRaw)
    },
    {
      label: "英式音频原始",
      value: describeRawAudio(word.audioUkRaw)
    },
    {
      label: "图片链接",
      value: word.pictureUrl ? truncate(word.pictureUrl) : "未提供"
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

  const definitionsContent = word.definitions.length === 0 ? (
    <EmptyState title="暂无释义" description="该词条尚未配置释义内容。" />
  ) : (
    word.definitions.map((definition, index) => {
      const tags = [definition.pos].filter(Boolean);
      return (
        <DetailTile
          key={`${word.id}-definition-${index}`}
          title={`释义 ${index + 1}`}
          description={tags.length > 0 ? tags.join(" / ") : undefined}
        >
          <div className="space-y-3 text-sm">
            {definition.tranCn ? (
              <DetailRow label="中文翻译" value={definition.tranCn} />
            ) : null}
            {definition.tranOther ? (
              <DetailRow label="其他翻译" value={definition.tranOther} />
            ) : null}
            {definition.descCn ? (
              <DetailRow label="中文描述" value={definition.descCn} />
            ) : null}
            {definition.descOther ? (
              <DetailRow label="其他描述" value={definition.descOther} />
            ) : null}
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
      );
    })
  );

  const examplesContent = word.examples.length === 0 ? (
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

  const synonymsContent = word.synonymGroups.length === 0 ? (
    <EmptyState title="暂无近义词" description="为词条添加同义词组可以帮助记忆。" />
  ) : (
    word.synonymGroups.map((group, index) => (
      <DetailTile
        key={`${word.id}-synonym-${index}`}
        title={group.pos || "近义词组"}
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

  const phrasesContent = word.phrases.length === 0 ? (
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

  const relationsContent = word.relatedWords.length === 0 ? (
    <EmptyState title="暂无相关词条" description="可以在编辑页关联近反义词或派生词。" />
  ) : (
    word.relatedWords.map((related, index) => (
      <DetailTile
        key={`${word.id}-related-${index}`}
        title={related.headword}
  description={related.pos ?? undefined}
      >
        {related.meaningCn ? (
          <p className="text-sm text-muted-foreground">{related.meaningCn}</p>
        ) : null}
      </DetailTile>
    ))
  );

  const antonymsContent = word.antonyms.length === 0 ? (
    <EmptyState title="暂无反义词" description="可在编辑页补充反义词信息。" />
  ) : (
    word.antonyms.map((antonym, index) => (
      <DetailTile key={`${word.id}-antonym-${index}`} title={antonym.value}>
        {antonym.meta ? (
          <pre className="overflow-x-auto rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            {JSON.stringify(antonym.meta, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-muted-foreground">暂无附加信息。</p>
        )}
      </DetailTile>
    ))
  );

  const realExamSentencesContent = word.realExamSentences.length === 0 ? (
    <EmptyState title="暂无真题例句" description="导入或编辑词条时可同步真题例句。" />
  ) : (
    word.realExamSentences.map((sentence, index) => {
      const metaItems = [
        sentence.level ? `等级：${sentence.level}` : null,
        sentence.paper ? `试卷：${sentence.paper}` : null,
        sentence.sourceType ? `类型：${sentence.sourceType}` : null,
        sentence.year ? `年份：${sentence.year}` : null,
        sentence.order !== null ? `排序：${sentence.order}` : null
      ].filter(Boolean);

      return (
        <DetailTile
          key={`${word.id}-real-exam-${index}`}
          title={`真题例句 ${index + 1}`}
          description={metaItems.length ? metaItems.join(" · ") : undefined}
        >
          <p className="text-sm font-medium text-foreground">{sentence.content}</p>
          {sentence.sourceInfo ? (
            <pre className="mt-3 overflow-x-auto rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
              {JSON.stringify(sentence.sourceInfo, null, 2)}
            </pre>
          ) : null}
        </DetailTile>
      );
    })
  );

  const examQuestionsContent = word.examQuestions.length === 0 ? (
    <EmptyState title="暂无真题练习题" description="导入或编辑词条以补充练习题。" />
  ) : (
    word.examQuestions.map((question, index) => (
      <DetailTile
        key={`${word.id}-exam-${index}`}
        title={`练习题 ${index + 1}`}
        description={question.examType !== null ? `题型：${question.examType}` : undefined}
      >
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">{question.question}</p>
          {question.explanation ? (
            <p className="text-muted-foreground">解析：{question.explanation}</p>
          ) : null}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">选项</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {question.choices.map((choice, choiceIndex) => {
                const isCorrect =
                  question.rightIndex !== null && choice.index === question.rightIndex;
                return (
                  <li key={`${word.id}-exam-${index}-choice-${choiceIndex}`} className={isCorrect ? "font-semibold text-foreground" : undefined}>
                    {choice.index !== null ? `${choice.index}. ` : ""}
                    {choice.value}
                    {isCorrect ? "（正确）" : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </DetailTile>
    ))
  );

  const logsContent = word.importLogs.length === 0 ? (
    <EmptyState title="暂无导入记录" description="该词条尚未记录导入来源。" />
  ) : (
    word.importLogs.map((log) => (
      <div key={log.id} className="rounded-lg border border-border/70 bg-card/40 p-4 text-sm">
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

  const playAudio = (src: string | null) => {
    if (!src) {
      return;
    }
    const audio = new Audio(src);
    void audio.play();
  };

  return (
    <Card className="flex h-full flex-col border-border/80">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-foreground">{word.headword}</h2>
              {word.phoneticUs ? <Badge variant="secondary">美: {word.phoneticUs}</Badge> : null}
              {word.phoneticUk ? <Badge variant="secondary">英: {word.phoneticUk}</Badge> : null}
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
                  {word.memoryTip.slice(0, 24)}
                  {word.memoryTip.length > 24 ? "…" : ""}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {audioUsUrl ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={() => playAudio(audioUsUrl)}>
                    <Volume2 className="mr-2 h-4 w-4" />美音
                  </Button>
                </TooltipTrigger>
                <TooltipContent>播放美式读音</TooltipContent>
              </Tooltip>
            ) : null}
            {audioUkUrl ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="outline" size="sm" onClick={() => playAudio(audioUkUrl)}>
                    <Volume2 className="mr-2 h-4 w-4" />英音
                  </Button>
                </TooltipTrigger>
                <TooltipContent>播放英式读音</TooltipContent>
              </Tooltip>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="mr-2 h-4 w-4" />编辑
            </Button>
            <ConfirmDialog
              title="确认删除该词条？"
              description={(
                <div className="space-y-2 text-sm">
                  <p>
                    您即将删除词条 <strong className="text-foreground">{word.headword}</strong>。
                  </p>
                  <p className="text-muted-foreground">
                    此操作不可撤销，将移除该词条的所有释义、例句、近义词及导入记录。
                  </p>
                </div>
              )}
              confirmLabel="确认删除"
              loadingText="删除中..."
              renderTrigger={({ disabled }) => {
                const triggerDisabled = disabled || deleting;
                const showSpinner = deleting || disabled;
                return (
                  <Button type="button" variant="destructive" size="sm" disabled={triggerDisabled}>
                    {showSpinner ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    删除
                  </Button>
                );
              }}
              onConfirm={onDelete}
            />
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
            <TabsTrigger value="antonyms" className="whitespace-nowrap">
              反义词
            </TabsTrigger>
            <TabsTrigger value="real-exam" className="whitespace-nowrap">
              真题例句
            </TabsTrigger>
            <TabsTrigger value="exam-questions" className="whitespace-nowrap">
              真题练习
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
                {word.memoryTipDesc ? (
                  <DetailTile title="记忆提示说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.memoryTipDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="释义" content={definitionsContent} />
                {word.sentenceDesc ? (
                  <DetailTile title="例句说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.sentenceDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="独立例句" content={examplesContent} />
                {word.synonymDesc ? (
                  <DetailTile title="近义词说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.synonymDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="近义词" content={synonymsContent} />
                {word.phraseDesc ? (
                  <DetailTile title="固定搭配说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.phraseDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="固定搭配" content={phrasesContent} />
                {word.relatedDesc ? (
                  <DetailTile title="相关词条说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.relatedDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="相关词条" content={relationsContent} />
                {word.antonymDesc ? (
                  <DetailTile title="反义词说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.antonymDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="反义词" content={antonymsContent} />
                {word.realExamSentenceDesc ? (
                  <DetailTile title="真题例句说明">
                    <p className="text-sm leading-relaxed text-muted-foreground">{word.realExamSentenceDesc}</p>
                  </DetailTile>
                ) : null}
                <SectionBlock title="真题例句" content={realExamSentencesContent} />
                <SectionBlock title="真题练习题" content={examQuestionsContent} />
                <SectionBlock title="导入记录" content={logsContent} />
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

              <TabsContent value="antonyms" className="space-y-4 pt-4">
                {antonymsContent}
              </TabsContent>

              <TabsContent value="real-exam" className="space-y-4 pt-4">
                {realExamSentencesContent}
              </TabsContent>

              <TabsContent value="exam-questions" className="space-y-4 pt-4">
                {examQuestionsContent}
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

function SectionBlock({ title, content }: { title: string; content: ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-4">{content}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 rounded border border-border/40 bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function DetailTile({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-card/40 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
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
