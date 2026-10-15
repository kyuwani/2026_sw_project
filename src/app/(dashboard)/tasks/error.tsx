"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface TasksErrorProps {
  retry: () => void;
}

export default function TasksError({ retry }: TasksErrorProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Task를 불러오지 못했습니다"
      description="일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
      action={<Button onClick={retry}>다시 시도</Button>}
    />
  );
}
