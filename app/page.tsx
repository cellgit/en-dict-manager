import Link from "next/link";
import { ArrowRight, BookOpenCheck, UploadCloud, FileText } from "lucide-react";
import type { ComponentType } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminNavItems } from "@/lib/admin-nav";

export default function HomePage() {
  const headerActions = (
    <>
      <ThemeToggle />
      <Button asChild variant="outline" size="sm" className="gap-1">
        <Link href="/docs/usage">
          使用文档
          <FileText className="h-4 w-4" />
        </Link>
      </Button>
    </>
  );

  return (
    <AdminShell navItems={adminNavItems} headerActions={headerActions}>
      <section className="space-y-12">
        <div className="grid gap-8 rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/10 via-background to-background p-8 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-12">
          <div className="space-y-6">
            <Badge variant="outline" className="w-fit rounded-full border-primary/40 bg-primary/10 text-[11px] tracking-widest text-primary">
              English Dictionary Studio
            </Badge>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                专注词汇数据的中后台，一站式完成日常维护与批量导入
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground">
                通过精心设计的工作台快速进入关键流程：管理海量单词资源、执行批量导入校验，并在统一界面中完成所有协作动作。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/words">
                  进入单词管理
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="gap-2">
                <Link href="/import">
                  前往批量导入
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative flex h-full w-full max-w-sm items-center justify-center">
            <div className="absolute -inset-6 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid gap-4">
              <div className="rounded-2xl border border-white/40 bg-white/80 p-6 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  实时同步词库
                </div>
                <p className="mt-4 text-2xl font-semibold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">数据写入成功率</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-background/80 p-6 backdrop-blur">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">最近导入批次</p>
                <p className="mt-3 text-lg font-semibold text-foreground">PEP 小学三年级（Dry Run）</p>
                <p className="mt-2 text-sm text-muted-foreground">45 条词汇通过校验，3 条需修复</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            href="/words"
            title="单词管理"
            description="浏览词条详情、执行精细化编辑、追踪导入历史，保持词库高质量。"
            icon={BookOpenCheck}
            highlights={["多维度字段展示", "一键查看导入日志", "可视化结构编辑"]}
          />
          <FeatureCard
            href="/import"
            title="批量导入"
            description="粘贴原始 JSON，自动校验结构并支持 Dry Run 校验，确保批量数据安全落地。"
            icon={UploadCloud}
            highlights={["Dry Run 校验", "批次指标总览", "详细错误定位"]}
          />
        </div>
      </section>
    </AdminShell>
  );
}

type FeatureCardProps = {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  highlights: string[];
};

function FeatureCard({ href, title, description, icon: Icon, highlights }: FeatureCardProps) {
  return (
    <Card className="group relative overflow-hidden border border-border/70 transition hover:border-primary/50 hover:shadow-lg">
      <div className="absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl opacity-0 transition group-hover:opacity-60" />
      <CardHeader className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {highlights.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter className="pt-4">
        <Button asChild variant="ghost" className="ml-auto gap-1 text-primary">
          <Link href={href} className="flex items-center">
            查看详情
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
