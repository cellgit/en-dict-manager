'use client';

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { AlertCircle, CheckCircle2, FileWarning, Loader2, Sparkles, Trash2, UploadCloud } from 'lucide-react';

import { importWordsAction } from '@/app/import/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ImportSummary } from '@/lib/data-import';
import type { CleanResult } from '@/lib/clean-data';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

export default function ImportManager() {
  const [payload, setPayload] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [lastSummary, setLastSummary] = useState<ImportSummary | null>(null);
  const [lastModeDryRun, setLastModeDryRun] = useState<boolean | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [pendingMode, setPendingMode] = useState<'dry-run' | 'import' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [readingFile, setReadingFile] = useState(false);

  // 清洗功能相关状态
  const [needsCleaning, setNeedsCleaning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanLogs, setCleanLogs] = useState<string[]>([]);
  const [cleanError, setCleanError] = useState<string | null>(null);
  const [cleanedData, setCleanedData] = useState<string | null>(null); // 保存清洗后的数据

  const importAction = useAction(importWordsAction, {
    onSuccess: (summary, ctx) => {
      setLastSummary(summary);
      setLastModeDryRun(ctx?.input?.dryRun ?? false);
      setClientError(null);
      setPendingMode(null);
      setCleaning(false);
    },
    onError: () => {
      setPendingMode(null);
      setCleaning(false);
    }
  });

  // 执行清洗数据（独立按钮触发）
  const executeClean = useCallback(async () => {
    const trimmed = payload.trim();
    if (!trimmed) {
      setClientError('请先粘贴或上传要清洗的 JSON 数据。');
      return;
    }

    setCleaning(true);
    setCleanError(null);
    setCleanLogs([]);
    setCleanedData(null);
    setClientError(null);

    try {
      const response = await fetch('/api/clean-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawData: trimmed })
      });

      const result: CleanResult = await response.json();

      setCleanLogs(result.logs);

      if (result.success) {
        setCleanedData(result.cleanedData);
        setCleanError(null);
      } else {
        setCleanError(result.error);
        setCleanedData(null);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '清洗数据时发生网络错误';
      setCleanError(errorMsg);
      setCleanedData(null);
    } finally {
      setCleaning(false);
    }
  }, [payload]);

  const handleSubmit = useCallback(
    async (dryRun: boolean) => {
      setClientError(null);
      setLastSummary(null);
      setLastModeDryRun(null);

      // 决定使用哪份数据：如果开启清洗且有清洗后的数据，使用清洗数据；否则使用原始 payload
      let dataToImport = '';
      if (needsCleaning && cleanedData) {
        dataToImport = cleanedData;
      } else {
        const trimmed = payload.trim();
        if (!trimmed) {
          setClientError('请先粘贴或上传要导入的 JSON 数据。');
          return;
        }
        dataToImport = trimmed;
      }

      // 验证 JSON 格式
      try {
        const parsed = JSON.parse(dataToImport);
        if (!Array.isArray(parsed)) {
          setClientError('导入数据必须是数组，每个元素代表一个单词。');
          return;
        }
      } catch (error) {
        setClientError('JSON 解析失败，请检查文件或文本格式是否正确。');
        return;
      }

      setPendingMode(dryRun ? 'dry-run' : 'import');
      void importAction.execute({
        payload: dataToImport,
        dryRun,
        sourceName: sourceName.trim().length > 0 ? sourceName.trim() : null
      });
    },
    [cleanedData, importAction, needsCleaning, payload, sourceName]
  );

  const isLoading = importAction.status === 'executing';
  const serverError = importAction.result?.serverError;
  const validationErrors = importAction.result?.validationErrors;
  const hasPayload = payload.trim().length > 0;
  const disableSubmission = isLoading || readingFile || cleaning;

  // 如果开启清洗但还没有清洗成功的数据，禁用 Dry Run 和正式导入按钮
  const disableImportButtons = disableSubmission || !hasPayload || (needsCleaning && !cleanedData);

  const handlePayloadChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setPayload(event.target.value);
      setClientError(null);
      setLastSummary(null);
      setLastModeDryRun(null);
      setCleanedData(null); // 数据改变时清除清洗结果
      setCleanError(null);
      setCleanLogs([]);
      if (fileMeta) {
        setFileMeta(null);
      }
    },
    [fileMeta]
  );

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearFileSelection = useCallback(() => {
    setFileMeta(null);
    setClientError(null);
    setPayload('');
    setLastSummary(null);
    setLastModeDryRun(null);
    setCleanedData(null);
    setCleanError(null);
    setCleanLogs([]);
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setReadingFile(true);
    file
      .text()
      .then((text) => {
        setPayload(text);
        setClientError(null);
        setFileMeta({ name: file.name, size: file.size });
        setLastSummary(null);
        setLastModeDryRun(null);
        setCleanedData(null);
        setCleanError(null);
        setCleanLogs([]);
        setSourceName((prev) => {
          if (prev.trim().length > 0) {
            return prev;
          }
          return file.name.replace(/\.json$/i, '') || prev;
        });
      })
      .catch(() => {
        setClientError('读取文件失败，请重试或检查文件权限。');
        setFileMeta(null);
      })
      .finally(() => {
        setReadingFile(false);
      });

    // 允许选取同名文件
    event.target.value = '';
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!lastSummary) return [];
    return [
      { label: '总数', value: lastSummary.total },
      { label: '成功', value: lastSummary.success },
      { label: '跳过', value: lastSummary.skipped },
      { label: '失败', value: lastSummary.failed }
    ];
  }, [lastSummary]);

  const showClientError = Boolean(clientError) && !lastSummary;

  return (
    <div className="space-y-10">
      <section className="space-y-8 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Badge variant="secondary" className="w-fit rounded-full border border-primary/40 bg-primary/10 text-xs uppercase tracking-widest text-primary">
              Import Pipeline
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">批量导入控制中心</h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                支持原始教材 JSON 或标准化格式，通过 Dry Run 校验保障数据安全，再一键同步至词库。你可以粘贴文本或直接上传 JSON 文件，实时指标帮助你掌握每次导入的健康状况。
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[28rem] lg:grid-cols-2">
            {[
              {
                label: "建议批量上限",
                value: "500 条/次"
              },
              {
                label: "Dry Run 校验",
                value: "结构 + 字段双重检查"
              },
              {
                label: "错误定位",
                value: "逐条输出修复建议"
              },
              {
                label: "导入日志",
                value: "自动生成批次 ID"
              }
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-xs text-muted-foreground shadow-sm">
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 uppercase tracking-widest">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          提醒：Dry Run 不会写入数据库；正式导入会生成批次 ID 并刷新词条列表与导入日志。
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-4">
            <CardTitle className="text-xl font-semibold">准备导入数据</CardTitle>
            <CardDescription>
              粘贴或上传 JSON 数组，选择 Dry Run 先行校验或直接执行正式导入。我们会自动识别数据结构并在必要时进行格式转换。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">上传 JSON 文件</p>
                  <p className="text-xs">
                    支持单个 <code>.json</code> 文件，系统会自动填充文本并在需要时补全数据来源。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {fileMeta ? (
                    <Button type="button" variant="outline" size="sm" onClick={clearFileSelection} disabled={disableSubmission}>
                      <Trash2 className="mr-2 h-4 w-4" />清除文件
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={triggerFilePicker}
                    disabled={disableSubmission}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />{readingFile ? '读取中…' : '选择文件'}
                  </Button>
                </div>
              </div>
              {fileMeta ? (
                <div className="mt-4 flex flex-col gap-1 rounded-lg border border-border/60 bg-background/80 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">{fileMeta.name}</p>
                    <p>大小：{formatFileSize(fileMeta.size)}</p>
                  </div>
                  <p className="text-muted-foreground">
                    内容已填充至文本框，可在提交前进一步检查或编辑。
                  </p>
                </div>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">数据来源（可选）</div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  例如教材或批次编号，将用于标记导入日志，便于后续追踪与回溯。
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

            {/* 数据清洗开关 */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">数据清洗</div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  开启后需要先执行清洗，清洗成功后才能进行 Dry Run 或正式导入。清洗会处理法语字母、HTML标签、实体编码等。
                </p>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="needs-cleaning"
                    checked={needsCleaning}
                    onCheckedChange={(checked) => {
                      setNeedsCleaning(checked);
                      if (!checked) {
                        // 关闭清洗时清除清洗状态
                        setCleanedData(null);
                        setCleanError(null);
                        setCleanLogs([]);
                      }
                    }}
                    disabled={disableSubmission}
                  />
                  <Label htmlFor="needs-cleaning" className="cursor-pointer">
                    {needsCleaning ? (
                      <span className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span>已启用数据清洗</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        数据已是合法 JSON（默认）
                      </span>
                    )}
                  </Label>
                </div>
                {needsCleaning ? (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={executeClean}
                      disabled={disableSubmission || !hasPayload}
                      className="w-full sm:w-auto"
                    >
                      {cleaning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          清洗中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          执行清洗
                        </>
                      )}
                    </Button>
                    {!cleaning && !cleanedData && !cleanError ? (
                      <p className="text-xs text-amber-600">
                        ⚠️ 清洗过程可能需要几分钟，请耐心等待。清洗成功后才能进行后续操作。
                      </p>
                    ) : null}
                    {cleanedData ? (
                      <p className="text-xs text-emerald-600">
                        ✓ 清洗完成，数据大小：{formatFileSize(cleanedData.length)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1 space-y-2">
                <div className="text-sm font-medium text-muted-foreground">JSON 数据</div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  粘贴一个由单词条目组成的数组。建议保持字段命名一致，以便自动映射到标准化结构。
                </p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <Textarea
                  value={payload}
                  onChange={handlePayloadChange}
                  placeholder={`[ { "headword": "ruler", "definitions": [...] }, ... ]`}
                  rows={16}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  单次导入建议不超过 500 条。更大量的数据可分批处理，以获得更快的反馈体验。
                </p>
              </div>
            </div>

            {/* 清洗进度和日志 */}
            {cleaning ? (
              <Alert className="border-blue-500/40 bg-blue-50/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="space-y-1">
                  <AlertTitle>数据清洗中...</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">正在执行清洗脚本，请稍候</p>
                    {cleanLogs.length > 0 ? (
                      <div className="mt-2 max-h-40 overflow-y-auto rounded border border-border/50 bg-background p-2 font-mono text-xs">
                        {cleanLogs.map((log, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            {log}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            {/* 清洗成功日志 */}
            {!cleaning && cleanLogs.length > 0 && !cleanError ? (
              <Alert className="border-emerald-500/40 bg-emerald-50/50">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div className="space-y-1">
                  <AlertTitle>数据清洗完成</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">数据已成功清洗并验证，可以继续导入</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        查看清洗日志
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto rounded border border-border/50 bg-background p-2 font-mono text-xs">
                        {cleanLogs.map((log, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            {log}
                          </div>
                        ))}
                      </div>
                    </details>
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            {/* 清洗错误 */}
            {cleanError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div className="space-y-1">
                  <AlertTitle>数据清洗失败</AlertTitle>
                  <AlertDescription>
                    <p className="whitespace-pre-wrap">{cleanError}</p>
                    {cleanLogs.length > 0 ? (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs hover:underline">
                          查看执行日志
                        </summary>
                        <div className="mt-2 max-h-40 overflow-y-auto rounded border border-border/50 bg-background p-2 font-mono text-xs">
                          {cleanLogs.map((log, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              {log}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            {showClientError ? (
              <Alert variant="warning">
                <FileWarning className="h-4 w-4" />
                <div className="space-y-1">
                  <AlertTitle>校验未通过</AlertTitle>
                  <AlertDescription>{clientError}</AlertDescription>
                </div>
              </Alert>
            ) : null}

            {validationErrors && Object.keys(validationErrors).length > 0 ? (
              <Alert variant="warning" className="border-dashed">
                <FileWarning className="h-4 w-4" />
                <div className="space-y-1">
                  <AlertTitle>请求参数不完整</AlertTitle>
                  <AlertDescription className="space-y-1">
                    {Object.entries(validationErrors).map(([field, messages]) => (
                      <p key={field}>
                        <span className="font-medium">{field}：</span>
                        {(messages as string[]).join('；')}
                      </p>
                    ))}
                  </AlertDescription>
                </div>
              </Alert>
            ) : null}

            {serverError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div className="space-y-1">
                  <AlertTitle>导入失败</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </div>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Dry Run 输出校验报告但不写入数据库；正式导入会生成批次 ID、刷新词条列表并记录导入日志。
              </p>
              {needsCleaning && !cleanedData ? (
                <p className="text-xs text-amber-600">
                  ⚠️ 请先执行清洗后才能进行 Dry Run 或正式导入
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={disableImportButtons}
              >
                {isLoading && pendingMode === 'dry-run' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    校验中…
                  </>
                ) : (
                  'Dry Run 校验'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={disableImportButtons}
              >
                {isLoading && pendingMode === 'import' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导入中…
                  </>
                ) : (
                  '正式导入'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        {lastSummary ? (
          <Card className="border-primary/40 shadow-md">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
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
                    {lastSummary.errors.length > 20 && (
                      <span className="ml-1 font-medium">
                        （显示前 20 条，共 {lastSummary.errors.length} 条）
                      </span>
                    )}
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
                        {lastSummary.errors.slice(0, 20).map((error) => (
                          <TableRow key={`${error.status}-${error.index}`} className="text-sm">
                            <TableCell>{error.index + 1}</TableCell>
                            <TableCell className="font-medium">{error.headword}</TableCell>
                            <TableCell className="capitalize text-muted-foreground">{error.status}</TableCell>
                            <TableCell>{error.reason}</TableCell>
                          </TableRow>
                        ))}
                        {lastSummary.errors.length > 20 && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={4} className="text-center text-sm text-muted-foreground italic">
                              ... 还有 {lastSummary.errors.length - 20} 条未显示
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
