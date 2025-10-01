import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { adminNavItems } from "@/lib/admin-nav";

import "@/app/globals.css";

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell
      navItems={adminNavItems}
      headerActions={
        <>
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/docs">
              <GraduationCap className="mr-2 h-4 w-4" />
              使用文档
            </Link>
          </Button>
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
