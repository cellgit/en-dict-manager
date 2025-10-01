'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function WorkflowTabs() {
  return (
    <Tabs defaultValue="words" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:w-[32rem]">
        <TabsTrigger value="words">单词维护</TabsTrigger>
        <TabsTrigger value="import">批量导入</TabsTrigger>
      </TabsList>
      <TabsContent value="words" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>词条维护流程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              列表默认按照 <Badge variant="outline">最近更新</Badge> 排序。搜索支持词头模糊匹配，并在移动端通过抽屉模式浏览。
            </p>
            <p>
              详情侧栏遵循 <strong>NormalizedWord</strong> 结构：释义、例句、短语、近义词与相关词均可多条维护，缺失字段会显示空态提示。
            </p>
            <p>
              编辑器采用“增删子项”的布局：每类表单支持追加行、批量删除与自动空值清理，提交时会通过 Zod 校验保证字段完整。
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="import" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>批量导入流程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              支持粘贴文本或上传 <code>.json</code> 文件。系统会在客户端执行 JSON 解析与结构校验，失败时立即提示并阻止提交。
            </p>
            <p>
              <Badge variant="secondary">Dry Run</Badge> 用于验证字段完整性与潜在冲突；正式导入会创建 <code>ImportBatch</code> 与 <code>ImportLog</code>，并刷新单词列表。
            </p>
            <p>
              每批导入建议控制在 <strong>500</strong> 条以内，大规模数据可以通过分批提交获得更快反馈。
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
