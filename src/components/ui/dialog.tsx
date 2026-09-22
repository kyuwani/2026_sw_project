"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles: Record<NonNullable<DialogProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outside) {
      onOpenChange(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "devlog-dialog m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-hidden rounded-card border border-border bg-card p-0 text-card-foreground shadow-dialog",
        sizeStyles[size],
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open) {
          onOpenChange(false);
        }
      }}
      onClick={handleBackdropClick}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 id={titleId} className="text-lg font-bold text-card-foreground">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-1 text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-control text-muted hover:bg-surface-subtle hover:text-foreground"
          onClick={() => onOpenChange(false)}
          aria-label="대화상자 닫기"
          autoFocus
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto px-5 py-5 sm:px-6">
        {children}
      </div>
      {footer ? (
        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
