import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "id"> {
  id: string;
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  className,
  containerClassName,
  description,
  error,
  id,
  label,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
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
      <textarea
        {...props}
        id={id}
        required={required}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-y rounded-control border bg-card px-3.5 py-3 text-sm leading-6 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-2 focus:outline-offset-0 focus:outline-ring disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted-foreground",
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
