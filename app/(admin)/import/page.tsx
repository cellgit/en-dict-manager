import type { Metadata } from "next";
import ImportManager from "@/app/(admin)/import/ImportManager";

export const metadata: Metadata = {
  title: "批量导入 | 词汇管理后台"
};

export default function ImportPage() {
  return <ImportManager />;
}
