import UsageDoc, { metadata as webMetadata } from "../web/page.mdx";

export const metadata = {
  ...webMetadata,
  title: "使用文档",
  description: "平台使用说明、导入规范与常见问题"
};

export default function UsagePage() {
  return <UsageDoc />;
}
