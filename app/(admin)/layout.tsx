import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
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
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden sm:flex"
        >
          <Link
            href="https://github.com/cellgit/en-dict-manager/blob/dev/word-admin-technical.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GraduationCap className="mr-2 h-4 w-4" /> 使用文档
          </Link>
        </Button>
      }
    >
      {children}
    </AdminShell>
  );
}
