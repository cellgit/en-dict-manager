'use client';

import { BookOpenCheck, Menu, UploadCloud, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
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

  const enhancedMobileHeaderActions = headerActions
    ? Children.map(headerActions, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement, {
              className: cn(child.props.className, 'w-full justify-center')
            })
          : child
      )
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/50">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center blur-3xl">
        <div className="h-64 w-[34rem] rounded-full bg-primary/20 opacity-70" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
                EN
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">词汇管理后台</span>
                <span className="text-xs text-muted-foreground">English Dictionary Studio</span>
              </div>
            </Link>

            {navItems.length > 0 ? (
              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const Icon = iconRegistry[item.icon] ?? defaultNavIcon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link key={item.href} href={item.href} className="group">
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          'gap-2 rounded-full px-4 py-2 text-sm transition',
                          !isActive && 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            ) : (
              <div className="flex-1" />
            )}

            <div className="flex items-center gap-2">
              {headerActions ? <div className="hidden md:flex items-center gap-2">{headerActions}</div> : null}
              {navItems.length > 0 || headerActions ? (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">打开菜单</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-full max-w-xs flex-col gap-6 bg-background/95 px-6 py-8">
                    <SheetHeader className="text-left">
                      <SheetTitle>快速导航</SheetTitle>
                      <SheetDescription>切换模块或访问帮助文档。</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-2">
                      {navItems.map((item) => {
                        const Icon = iconRegistry[item.icon] ?? defaultNavIcon;
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <SheetClose asChild key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition',
                                isActive
                                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                  : 'border-border/60 bg-background hover:border-primary/60 hover:bg-primary/10'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <div className="flex-1">
                                <span>{item.label}</span>
                                {item.description ? (
                                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                                ) : null}
                              </div>
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </div>
                    {headerActions ? (
                      <>
                        <Separator />
                        <div className="flex flex-col gap-3 md:hidden">
                          {enhancedMobileHeaderActions}
                        </div>
                      </>
                    ) : null}
                  </SheetContent>
                </Sheet>
              ) : null}
            </div>
          </div>
        </header>

        <main className="relative flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-12 md:px-6 md:py-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
