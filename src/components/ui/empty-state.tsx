import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-72 flex-col items-center justify-center rounded-card border border-dashed border-input bg-card px-5 py-10 text-center sm:px-8",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-card bg-primary-soft text-primary sm:size-14">
        <Icon aria-hidden="true" className="size-5 sm:size-6" />
      </span>
      <h2 className="mt-5 text-lg font-bold text-card-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6 w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}
