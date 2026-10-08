import { FolderX } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={FolderX}
      title="프로젝트를 찾을 수 없습니다"
      description="삭제되었거나 접근 권한이 없는 프로젝트입니다. 프로젝트 목록에서 다시 확인해 주세요."
      action={<ButtonLink href="/projects">프로젝트 목록으로</ButtonLink>}
    />
  );
}
