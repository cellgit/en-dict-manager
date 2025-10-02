"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAllWordsInBookAction } from "@/app/books/actions";
import { toast } from "sonner";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAllWordsInBookAction({ bookId });

      // next-safe-action v6 返回结构: { data, serverError, validationErrors }
      if (result?.data) {
        toast.success(`成功删除 ${result.data.deletedCount} 个单词`);
        setIsOpen(false);
        router.refresh();
      } else if (result?.serverError) {
        toast.error(result.serverError || "删除失败");
      } else {
        toast.error("删除失败");
      }
    } catch (error) {
      toast.error("操作失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  if (wordCount === 0) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          删除所有单词
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除所有单词？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                您即将删除单词书 <strong className="text-foreground">"{bookName}"</strong> 中的{" "}
                <strong className="text-destructive">{wordCount} 个单词</strong>。
              </p>
              <p className="text-destructive font-medium">
                此操作不可撤销，将同时删除这些单词的所有关联数据（释义、例句、短语等）。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
