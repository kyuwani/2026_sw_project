import { BookX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export default function LearningLogNotFound() {
  return (
    <EmptyState
      icon={BookX}
      title="학습 기록을 찾을 수 없습니다"
      description="삭제되었거나 접근 권한이 없는 학습 기록입니다. 목록에서 다시 확인해 주세요."
      action={<ButtonLink href="/learning">학습 기록 목록으로</ButtonLink>}
    />
  );
}
