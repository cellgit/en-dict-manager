import { type NavItem } from "@/components/layout/admin-shell";

export const adminNavItems: NavItem[] = [
  {
    href: "/books",
    label: "单词书管理",
    description: "管理不同教材的单词书",
    icon: "library"
  },
  {
    href: "/words",
    label: "全局单词",
    description: "查看和管理所有单词（跨单词书）",
    icon: "book-open-check"
  },
  {
    href: "/import",
    label: "批量导入",
    description: "粘贴教材 JSON，执行 Dry Run 或正式导入",
    icon: "upload-cloud"
  }
];
