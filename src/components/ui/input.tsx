import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "id" | "size"> {
  id: string;
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  className,
  containerClassName,
  description,
  error,
  id,
  label,
  required,
  ...props
}: InputProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label ? (
        <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-10 w-full rounded-control border bg-card px-3.5 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-2 focus:outline-offset-0 focus:outline-ring disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted-foreground",
          error ? "border-destructive" : "border-input",
          className,
        )}
      />
      {description ? (
        <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-muted">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
