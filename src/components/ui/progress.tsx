import { cn } from "@/lib/utils/cn";

interface ProgressProps {
  value: number;
  label: string;
  className?: string;
  indicatorClassName?: string;
  size?: "sm" | "md";
}

export function Progress({
  value,
  label,
  className,
  indicatorClassName,
  size = "md",
}: ProgressProps) {
  const normalizedValue = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-surface-subtle",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      aria-valuetext={`${normalizedValue}%`}
    >
      <div
        className={cn("h-full rounded-full bg-primary", indicatorClassName)}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}
