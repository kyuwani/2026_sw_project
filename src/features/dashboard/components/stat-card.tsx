import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "primary" | "success" | "warning" | "neutral";
}

const toneStyles: Record<StatCardProps["tone"], string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-subtle text-muted",
};

export function StatCard({
  title,
  value,
  helper,
  icon: Icon,
  tone,
}: StatCardProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
        </div>
        <span className={`flex size-11 items-center justify-center rounded-xl ${toneStyles[tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-muted">{helper}</p>
    </Card>
  );
}
