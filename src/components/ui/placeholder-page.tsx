import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <Card className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <h2 className="mt-5 text-lg font-bold text-foreground">준비 중인 화면입니다</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          기본 내비게이션 구조를 확인할 수 있도록 만든 임시 화면이며, 이후 개발
          일정에 맞춰 실제 기능으로 교체됩니다.
        </p>
      </Card>
    </div>
  );
}
