"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type RenderTriggerProps = {
  readonly disabled: boolean;
};

type ConfirmDialogProps = {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly renderTrigger: (props: RenderTriggerProps) => ReactNode;
  readonly onConfirm: () => void | Promise<void>;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly loadingText?: string;
  readonly confirmActionClassName?: string;
  readonly onError?: (error: unknown) => void;
  readonly disabled?: boolean;
  readonly confirmDisabled?: boolean;
};

export function ConfirmDialog({
  title,
  description,
  renderTrigger,
  onConfirm,
  confirmLabel = "确认",
  cancelLabel = "取消",
  loadingText = "处理中...",
  confirmActionClassName,
  onError,
  disabled = false,
  confirmDisabled = false
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (loading) {
        return;
      }
      if (disabled && nextOpen) {
        return;
      }
      setOpen(nextOpen);
    },
    [disabled, loading]
  );

  const handleConfirm = useCallback(async () => {
    if (confirmDisabled) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch (error) {
      onError?.(error);
    } finally {
      setLoading(false);
    }
    }, [onConfirm, onError, confirmDisabled]);

  const renderDescription = () => {
    if (!description) {
      return null;
    }

    return typeof description === "string" ? (
      <AlertDialogDescription>{description}</AlertDialogDescription>
    ) : (
      <AlertDialogDescription asChild>{description}</AlertDialogDescription>
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {renderTrigger({ disabled: disabled || loading })}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {renderDescription()}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              void handleConfirm();
            }}
            disabled={loading || confirmDisabled}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              confirmActionClassName
            )}
          >
            {loading ? loadingText : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
