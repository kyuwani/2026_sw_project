"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function DashboardError({ retry }: DashboardErrorProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Dashboard를 불러오지 못했습니다"
      description="일시적인 문제일 수 있습니다. 잠시 후 다시 시도해 주세요."
      action={<Button onClick={retry}>다시 시도</Button>}
    />
  );
}
