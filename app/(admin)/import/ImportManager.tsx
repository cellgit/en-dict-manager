'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { AlertCircle, CheckCircle2, FileWarning } from 'lucide-react';

import { importWordsAction } from '@/app/import/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ImportSummary } from '@/lib/data-import';

export default function ImportManager() {
  const [payload, setPayload] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [lastSummary, setLastSummary] = useState<ImportSummary | null>(null);
  const [lastModeDryRun, setLastModeDryRun] = useState<boolean | null>(null);

  const importAction = useAction(importWordsAction, {
    onSuccess: (summary, ctx) => {
      setLastSummary(summary);
      setLastModeDryRun(ctx?.input?.dryRun ?? false);
    }
  });

  const handleSubmit = useCallback(
    (dryRun: boolean) => {
      const trimmed = payload.trim();
      setLastSummary(null);
      setLastModeDryRun(null);
      void importAction.execute({
        payload: trimmed,
        dryRun,
        sourceName: sourceName.trim().length > 0 ? sourceName.trim() : null
      });
    },
    [importAction, payload, sourceName]
  );

  const isLoading = importAction.status === 'executing';
  const serverError = importAction.result?.serverError;
  const validationErrors = importAction.result?.validationErrors;

  const summaryMetrics = useMemo(() => {
    if (!lastSummary) return [];
    return [
      { label: '总数', value: lastSummary.total },
      { label: '成功', value: lastSummary.success },
      { label: '跳过', value: lastSummary.skipped },
      { label: '失败', value: lastSummary.failed }
    ];
  }, [lastSummary]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Badge variant="secondary" className="rounded-md uppercase tracking-wide">
          Import Pipeline
        </Badge>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">批量导入</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            支持原始教材 JSON 或标准化格式，默认执行语义校验，可一键完成 Dry Run 检查与正式导入。
          </p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>准备导入数据</CardTitle>
          <CardDescription>
            建议先执行一次 Dry Run，确认数据结构与字段通过校验后再进行正式导入。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">数据来源（可选）</div>
              <p className="text-xs text-muted-foreground">
                例如教材或批次编号，将用于标记导入日志，便于追踪。
              </p>
            </div>
            <div className="md:col-span-2">
              <Input
                value={sourceName}
                onChange={(event) => setSourceName(event.target.value)}
                placeholder="例如：PEPXiaoXue3_1"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">JSON 数据</div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                粘贴一个由单词条目组成的数组。系统会自动识别是否为标准化结构，并在必要时进行格式转换。
              </p>
            </div>
            <div className="md:col-span-2">
              <Textarea
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                placeholder={`[ { "headword": "ruler", "definitions": [...] }, ... ]`}
                rows={18}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                支持最大 500 条的批量导入；如需导入更大数据，请分批处理以获得更好反馈体验。
              </p>
            </div>
          </div>

          {validationErrors && Object.keys(validationErrors).length > 0 ? (
            <Alert variant="warning" className="border-dashed">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>请求参数不完整</AlertTitle>
              <AlertDescription className="space-y-1">
                {Object.entries(validationErrors).map(([field, messages]) => (
                  <p key={field}>
                    <span className="font-medium">{field}：</span>
                    {(messages as string[]).join('；')}
                  </p>
                ))}
              </AlertDescription>
            </Alert>
          ) : null}

          {serverError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>导入失败</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Dry Run 仅进行校验，不写入数据库；正式导入会自动同步词条列表。
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isLoading}
            >
              {isLoading ? '校验中...' : 'Dry Run 校验'}
            </Button>
            <Button type="button" onClick={() => handleSubmit(false)} disabled={isLoading}>
              {isLoading ? '导入中...' : '正式导入'}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {lastSummary ? (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                {lastSummary.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                导入结果
              </CardTitle>
              <CardDescription className="text-sm">
                模式：{lastModeDryRun ? 'Dry Run 校验' : '正式导入'}
                {lastSummary.batchId ? ` · 批次 ID：${lastSummary.batchId}` : ''}
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
              {summaryMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={cn(
                    'rounded-lg border bg-muted/40 px-3 py-2 text-left',
                    metric.label === '失败' && metric.value > 0 && 'border-amber-400 text-amber-600',
                    metric.label === '成功' && metric.value > 0 && 'border-emerald-300 text-emerald-600'
                  )}
                >
                  <div className="text-[11px] uppercase tracking-wide">{metric.label}</div>
                  <div className="text-lg font-semibold text-foreground">{metric.value}</div>
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {lastSummary.errors.length === 0 ? (
              <Alert variant="success" className="border border-emerald-500/30">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>全部通过</AlertTitle>
                <AlertDescription>
                  所有单词均已成功处理，您可以继续导入下一批数据或前往词条列表查看结果。
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  以下条目在导入过程中出现问题，请根据原因调整数据后重试：
                </p>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/60">
                        <TableHead className="w-20">序号</TableHead>
                        <TableHead>词头</TableHead>
                        <TableHead className="w-32">状态</TableHead>
                        <TableHead>原因</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastSummary.errors.map((error) => (
                        <TableRow key={`${error.status}-${error.index}`} className="text-sm">
                          <TableCell>{error.index + 1}</TableCell>
                          <TableCell className="font-medium">{error.headword}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">{error.status}</TableCell>
                          <TableCell>{error.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
