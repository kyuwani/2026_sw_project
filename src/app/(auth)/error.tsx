"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface AuthErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function AuthError({ retry }: AuthErrorProps) {
  return (
    <EmptyState
      className="min-h-0 border-0 px-0 py-4 sm:px-0"
      icon={AlertTriangle}
      title="요청을 처리하지 못했습니다"
      description="요청이 많거나 일시적인 문제가 있을 수 있습니다. 잠시 후 다시 시도해 주세요."
      action={<Button onClick={retry}>다시 시도</Button>}
    />
  );
}
