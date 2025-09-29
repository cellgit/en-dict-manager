import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "词汇管理后台",
  description: "基于 Next.js 的单词录入中后台管理系统"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
