import { ChevronDown } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export interface SelectProps extends Omit<ComponentPropsWithoutRef<"select">, "id"> {
  id: string;
  label?: string;
  description?: string;
  error?: string;
  containerClassName?: string;
}

export function Select({
  children,
  className,
  containerClassName,
  description,
  error,
  id,
  label,
  required,
  ...props
}: SelectProps) {
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
      <div className="relative">
        <select
          {...props}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "min-h-10 w-full appearance-none rounded-control border bg-card py-2.5 pl-3.5 pr-10 text-sm text-foreground shadow-sm focus:border-ring focus:outline-2 focus:outline-offset-0 focus:outline-ring disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:text-muted-foreground",
            error ? "border-destructive" : "border-input",
            className,
          )}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
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
