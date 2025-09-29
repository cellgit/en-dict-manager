'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { importWordsAction } from '@/app/import/actions';
import type { ImportSummary } from '@/lib/data-import';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

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
    if (!lastSummary) return null;
    return [
      { label: '总数', value: lastSummary.total },
      { label: '成功', value: lastSummary.success },
      { label: '跳过', value: lastSummary.skipped },
      { label: '失败', value: lastSummary.failed }
    ];
  }, [lastSummary]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-800">批量导入</h1>
        <p className="text-sm text-slate-600">
          将清洗后的单词 JSON 数组粘贴到下方文本框，可先执行 Dry Run 校验再进行正式导入。
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">数据来源（可选）</label>
            <Input
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="例如：PEPXiaoXue3_1"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">JSON 数据</label>
            <Textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              placeholder={`粘贴单词数组，例如：[ { "headword": "ruler", ... } ]`}
              rows={16}
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={isLoading}
          >
            {isLoading ? '校验中...' : 'Dry Run 校验'}
          </Button>
          <Button type="button" onClick={() => handleSubmit(false)} disabled={isLoading}>
            {isLoading ? '导入中...' : '正式导入'}
          </Button>
        </div>
        {validationErrors && Object.keys(validationErrors).length > 0 && (
          <div className="mt-4 rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            {Object.entries(validationErrors).map(([field, messages]) => (
              <div key={field}>
                <span className="font-medium">{field}：</span>
                <span>{(messages as string[]).join('；')}</span>
              </div>
            ))}
          </div>
        )}
        {serverError && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}
      </section>

      {lastSummary && summaryMetrics && (
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">导入结果</h2>
                <p className="text-sm text-slate-500">
                  模式：{lastModeDryRun ? 'Dry Run' : '正式导入'}
                  {lastSummary.batchId ? ` · 批次 ID：${lastSummary.batchId}` : ''}
                </p>
              </div>
              <div className="flex gap-4">
                {summaryMetrics.map((metric) => (
                  <div key={metric.label} className="text-center">
                    <div className="text-xs text-slate-500">{metric.label}</div>
                    <div className="text-base font-semibold text-slate-800">{metric.value}</div>
                  </div>
                ))}
              </div>
            </header>
            {lastSummary.errors.length === 0 ? (
              <p className="text-sm text-emerald-600">全部单词处理成功。</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  以下条目在导入过程中出现问题，请根据原因调整数据后重试：
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2">序号</th>
                        <th className="px-3 py-2">词头</th>
                        <th className="px-3 py-2">状态</th>
                        <th className="px-3 py-2">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lastSummary.errors.map((error) => (
                        <tr key={`${error.status}-${error.index}`} className="bg-white">
                          <td className="px-3 py-2 text-slate-600">{error.index + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{error.headword}</td>
                          <td className="px-3 py-2 capitalize text-slate-600">{error.status}</td>
                          <td className="px-3 py-2 text-slate-600">{error.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
