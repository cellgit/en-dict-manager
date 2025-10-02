import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WordForm } from "@/app/(admin)/words/components/WordForm";
import type { WordEditorSheetProps } from "@/app/(admin)/words/types";
import { Edit3, Loader2, Plus } from "lucide-react";

export function WordEditorSheet({
  mode,
  formData,
  onClose,
  onSubmit,
  submitting,
  submitDisabled,
  setFormData,
  error
}: WordEditorSheetProps) {
  const title = mode === "create" ? "新建词条" : "编辑词条";

  return (
    <SheetContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-4xl flex-col gap-0 p-0">
      <SheetHeader className="border-b border-border/60 px-6 py-4 text-left">
        <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
        <SheetDescription>完善词条内容，保存后将立即生效。</SheetDescription>
      </SheetHeader>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 px-6 py-6">
            <WordForm formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <SheetFooter className="gap-4 border-t border-border/60 px-6 py-4">
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertTitle>提交失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={submitDisabled || submitting}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "create" ? (
                <Plus className="mr-2 h-4 w-4" />
              ) : (
                <Edit3 className="mr-2 h-4 w-4" />
              )}
              {mode === "create" ? "创建词条" : "保存修改"}
            </Button>
          </div>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
