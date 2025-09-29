import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { AdminShell, type NavItem } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";

import "@/app/globals.css";

const navItems: NavItem[] = [
  {
    href: "/words",
    label: "单词管理",
    description: "检索、编辑和维护词条数据",
    icon: "book-open-check"
  },
  {
    href: "/import",
    label: "批量导入",
    description: "粘贴教材 JSON，执行 Dry Run 或正式导入",
    icon: "upload-cloud"
  }
];

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell
      navItems={navItems}
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
