import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card text-card-foreground shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("space-y-1.5 p-5 sm:p-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("text-base font-bold leading-6 text-card-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm leading-6 text-muted", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return <div className={cn("px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
