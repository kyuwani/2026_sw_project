import { FolderKanban, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="진행 중인 프로젝트와 완료한 프로젝트를 한곳에서 관리합니다."
        action={
          <ButtonLink href="/projects/new">
            <Plus aria-hidden="true" className="size-4" />
            프로젝트 만들기
          </ButtonLink>
        }
      />
      <EmptyState
        icon={FolderKanban}
        title="프로젝트 관리 시작하기"
        description="프로젝트 생성 기능을 사용할 수 있습니다. 저장된 프로젝트 목록과 상세 관리는 다음 개발 단계에서 추가됩니다."
        action={
          <ButtonLink href="/projects/new">
            <Plus aria-hidden="true" className="size-4" />
            프로젝트 만들기
          </ButtonLink>
        }
      />
    </div>
  );
}
