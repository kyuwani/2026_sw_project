import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
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
      <EmptyState
        icon={Icon}
        title="준비 중인 화면입니다"
        description="기본 내비게이션 구조를 확인할 수 있도록 만든 임시 화면이며, 이후 개발 일정에 맞춰 실제 기능으로 교체됩니다."
      />
    </div>
  );
}
