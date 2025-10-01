import { type NavItem } from "@/components/layout/admin-shell";

export const adminNavItems: NavItem[] = [
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
  },
  {
    href: "/docs",
    label: "使用文档",
    description: "了解工作流、导入规范与常见问题",
    icon: "file-text"
  }
];
