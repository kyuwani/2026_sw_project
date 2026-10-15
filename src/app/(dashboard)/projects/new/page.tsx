import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/features/projects/components/project-form";

export const metadata: Metadata = { title: "프로젝트 만들기" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="새 프로젝트 만들기"
        description="목표와 기간을 정하고 개발 작업을 체계적으로 관리해 보세요."
      />
      <ProjectForm />
    </div>
  );
}
