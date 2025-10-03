"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Link2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type DocSectionMeta = {
  id: string;
  label: string;
  description?: string;
};

interface DocLayoutProps {
  title: string;
  introduction?: string;
  sections: DocSectionMeta[];
  children: ReactNode;
}

export function DocLayout({ title, introduction, sections, children }: DocLayoutProps) {
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id ?? "");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (!sections.length) {
      return;
    }

    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!targets.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);

        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id);
          return;
        }

        const nearest = entries.slice().sort((a, b) => Math.abs(a.intersectionRatio - b.intersectionRatio))[0];
        if (nearest) {
          setActiveSectionId(nearest.target.id);
        }
      },
      {
        rootMargin: "-40% 0px -45% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75]
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 2200);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  const sectionCountLabel = useMemo(() => {
    if (!sections.length) {
      return "暂无章节";
    }
    return `${sections.length} 个章节`;
  }, [sections]);

  const handleCopyLink = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch (error) {
      setCopyState("error");
      window.prompt("复制以下链接", url);
    }
  }, []);

  const handleScrollToTop = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-10">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/15 via-background to-background p-6 shadow-sm transition dark:from-primary/25 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="bg-background/70 backdrop-blur">
                  文档指南
                </Badge>
                <Separator orientation="vertical" className="hidden h-4 lg:inline-flex" />
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>{sectionCountLabel}</span>
                </span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
                {introduction ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {introduction}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground/80">
                页面支持实时章节高亮、快速跳转与一键复制链接，方便在研发、运营之间共享。
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" onClick={handleCopyLink} className="w-full sm:w-auto">
                    <Link2 className="mr-2 h-4 w-4" />
                    复制页面链接
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {copyState === "copied"
                    ? "已复制到剪贴板"
                    : copyState === "error"
                      ? "浏览器不支持自动复制，已弹出手动复制"
                      : "复制当前页面链接"}
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" onClick={handleScrollToTop} className="w-full sm:w-auto">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                返回顶部
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-20 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
          <div className="pointer-events-none absolute -bottom-24 right-14 h-44 w-44 rounded-full bg-primary/5 blur-3xl dark:bg-primary/15" />
        </section>

        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:mb-0">
            <div className="lg:sticky lg:top-32">
              <ScrollArea className="max-h-[60vh] rounded-2xl border bg-background/60 p-4 shadow-sm lg:h-[calc(100vh-12rem)] lg:p-5">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-sm font-medium text-foreground">本页结构</h2>
                    <p className="mt-1 text-xs text-muted-foreground">点击章节快速跳转，当前章节会自动高亮。</p>
                  </div>
                  <nav aria-label={`${title} 导航`} className="space-y-2 text-sm">
                    {sections.map((section) => {
                      const isActive = section.id === activeSectionId;
                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          aria-current={isActive ? "true" : undefined}
                          className={cn(
                            "group relative block rounded-2xl border px-4 py-3 transition",
                            isActive
                              ? "border-primary/50 bg-primary/5 text-primary shadow-sm"
                              : "border-transparent hover:border-border/60 hover:bg-muted/60"
                          )}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <span className={cn(
                              "flex h-2.5 w-2.5 items-center justify-center transition",
                              isActive ? "scale-125" : "opacity-60"
                            )}>
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full bg-muted-foreground/60 transition",
                                  isActive && "bg-primary"
                                )}
                              />
                            </span>
                            {section.label}
                          </span>
                          {section.description ? (
                            <span className={cn(
                              "mt-2 block text-xs text-muted-foreground transition",
                              isActive && "text-primary/80"
                            )}>
                              {section.description}
                            </span>
                          ) : null}
                          {isActive ? (
                            <span className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-xs font-medium text-primary lg:inline-flex">
                              正在阅读
                            </span>
                          ) : null}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              </ScrollArea>
            </div>
          </aside>
          <main className="mt-8 space-y-12 lg:mt-0 lg:max-w-3xl xl:max-w-4xl">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface DocSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function DocSection({ id, title, description, children }: DocSectionProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setCopyState("idle"), 2200);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopyAnchor = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch (error) {
      setCopyState("error");
      window.prompt("复制以下章节链接", url);
    }
  }, [id]);

  return (
    <section id={id} className="scroll-mt-28 space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="group flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCopyAnchor}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground opacity-0 transition hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 group-hover:opacity-100"
                  aria-label={`复制 ${title} 链接`}
                >
                  {copyState === "copied" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {copyState === "copied"
                  ? "章节链接已复制"
                  : copyState === "error"
                    ? "已弹出手动复制"
                    : "复制该章节链接"}
              </TooltipContent>
            </Tooltip>
          </div>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </header>
      <div className="rounded-3xl border bg-card/40 p-6 shadow-sm">
        <div className="space-y-4 text-sm leading-relaxed text-foreground">{children}</div>
      </div>
    </section>
  );
}
