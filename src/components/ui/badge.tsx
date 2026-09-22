import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "outline";

const variantStyles: Record<BadgeVariant, string> = {
  neutral: "border-border bg-surface-subtle text-muted",
  primary: "border-primary/15 bg-primary-soft text-primary",
  success: "border-success/15 bg-success-soft text-success",
  warning: "border-warning/15 bg-warning-soft text-warning",
  destructive: "border-destructive/15 bg-destructive-soft text-destructive",
  info: "border-info/15 bg-info-soft text-info",
  outline: "border-input bg-card text-muted",
};

interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
