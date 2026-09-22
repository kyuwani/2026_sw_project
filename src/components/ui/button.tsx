import { LoaderCircle } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover",
  secondary:
    "bg-surface-subtle text-foreground hover:bg-border disabled:bg-surface-subtle",
  outline:
    "border border-input bg-card text-foreground shadow-sm hover:bg-surface-subtle",
  ghost: "text-muted hover:bg-surface-subtle hover:text-foreground",
  destructive:
    "bg-destructive text-white shadow-sm hover:bg-destructive-hover",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function getButtonClassName({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  loadingLabel = "처리 중",
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={getButtonClassName({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
