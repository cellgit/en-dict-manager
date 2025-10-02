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
import { formatDateTime } from "@/lib/utils";
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

  const partsOfSpeech = word.definitions
    .map((definition) => definition.partOfSpeech)
    .filter(Boolean)
    .join(" · ");

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

  const definitionsContent = word.definitions.length === 0 ? (
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
        description={related.partOfSpeech ?? undefined}
      >
        {related.meaningCn ? (
          <p className="text-sm text-muted-foreground">{related.meaningCn}</p>
        ) : null}
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
                <SectionBlock title="释义" content={definitionsContent} />
                <SectionBlock title="独立例句" content={examplesContent} />
                <SectionBlock title="近义词" content={synonymsContent} />
                <SectionBlock title="固定搭配" content={phrasesContent} />
                <SectionBlock title="相关词条" content={relationsContent} />
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
