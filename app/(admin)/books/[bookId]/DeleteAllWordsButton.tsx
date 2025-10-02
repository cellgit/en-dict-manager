"use client";

import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteAllWordsInBookAction } from "@/app/books/actions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DeleteAllWordsButtonProps = {
  bookId: string;
  bookName: string;
  wordCount: number;
};

export default function DeleteAllWordsButton({
  bookId,
  bookName,
  wordCount
}: DeleteAllWordsButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    let hasShownError = false;
    try {
      const result = await deleteAllWordsInBookAction({ bookId });

      // next-safe-action v6 返回结构: { data, serverError, validationErrors }
      if (result?.data) {
        toast.success(`成功删除 ${result.data.deletedCount} 个单词`);
        router.refresh();
      } else if (result?.serverError) {
        hasShownError = true;
        toast.error(result.serverError || "删除失败");
        throw new Error(result.serverError ?? "删除失败");
      } else {
        hasShownError = true;
        toast.error("删除失败");
        throw new Error("删除失败");
      }
    } catch (error) {
      if (!hasShownError) {
        toast.error("操作失败，请稍后重试");
      }
      throw error;
    }
  };

  if (wordCount === 0) {
    return null;
  }

  return (
    <ConfirmDialog
      title="确认删除所有单词？"
      description={(
        <div className="space-y-2 text-sm">
          <p>
            您即将删除单词书 <strong className="text-foreground">「{bookName}」</strong> 中的{" "}
            <strong className="text-destructive">{wordCount} 个单词</strong>。
          </p>
          <p className="text-destructive font-medium">
            此操作不可撤销，将同时删除这些单词的所有关联数据（释义、例句、短语等）。
          </p>
        </div>
      )}
      confirmLabel="确认删除"
      loadingText="删除中..."
      onConfirm={handleDelete}
      renderTrigger={({ disabled }) => (
        <Button variant="destructive" size="sm" disabled={disabled}>
          {disabled ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          删除所有单词
        </Button>
      )}
    />
  );
}
