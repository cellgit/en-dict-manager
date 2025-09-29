'use client';

import { BookOpenCheck, Menu, UploadCloud, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type NavIconKey = 'book-open-check' | 'upload-cloud';

const iconRegistry: Record<NavIconKey, LucideIcon> = {
  'book-open-check': BookOpenCheck,
  'upload-cloud': UploadCloud
};

const defaultNavIcon = BookOpenCheck;

export type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: NavIconKey;
};

export function AdminShell({
  navItems,
  children,
  headerActions
}: {
  navItems: NavItem[];
  children: ReactNode;
  headerActions?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 border-r bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              EN
            </div>
            <div>
              <div className="text-sm font-semibold">词汇管理后台</div>
              <div className="text-xs text-muted-foreground">English Dictionary Studio</div>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = iconRegistry[item.icon] ?? defaultNavIcon;
              return (
                <Link key={item.href} href={item.href} className="block">
                  <Card
                    className={cn(
                      'flex items-center gap-3 border-transparent px-4 py-3 transition hover:border-accent hover:bg-accent',
                      isActive && 'border-primary/60 bg-primary/5 shadow-sm'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground',
                        isActive && 'border-primary/50 text-primary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold leading-none tracking-tight text-foreground">
                        {item.label}
                      </div>
                      {item.description ? (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
        <div className="border-t px-6 py-4 text-xs text-muted-foreground">
          Powered by Next.js · Prisma
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-background/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">打开导航</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-xs p-0">
              <SheetHeader className="px-6 pt-6">
                <SheetTitle>导航</SheetTitle>
                <SheetDescription>快速跳转到管理模块</SheetDescription>
              </SheetHeader>
              <Separator className="my-4" />
              <ScrollArea className="h-full pb-8">
                <nav className="space-y-1 px-4">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = iconRegistry[item.icon] ?? defaultNavIcon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-4 py-3 text-sm transition hover:bg-accent hover:text-accent-foreground',
                          isActive && 'bg-primary text-primary-foreground hover:bg-primary'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium leading-none">{item.label}</div>
                          {item.description ? (
                            <div className="mt-1 text-xs text-muted-foreground/80">{item.description}</div>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </nav>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <div className="hidden text-sm font-semibold text-muted-foreground lg:flex">
            <span className="text-foreground">词汇管理后台</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span>单词数据协作平台</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">{headerActions}</div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-10">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
