import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProjectDetail } from "@/features/projects/queries";
import { projectIdSchema } from "@/features/projects/schemas";

export const metadata: Metadata = { title: "프로젝트 수정" };

interface EditProjectPageProps {
  params: Promise<{ projectId: string }>;
}

function toDateInputValue(date: Date | null): string {
  return date?.toISOString().slice(0, 10) ?? "";
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedProjectId = projectIdSchema.safeParse((await params).projectId);

  if (!parsedProjectId.success) {
    notFound();
  }

  const project = await getProjectDetail(
    session.user.id,
    parsedProjectId.data,
  );

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="프로젝트 수정"
        description="프로젝트 정보와 기술 스택을 변경합니다."
      />
      <ProjectForm
        project={{
          id: project.id,
          title: project.title,
          description: project.description ?? "",
          status: project.status,
          startDate: toDateInputValue(project.startDate),
          endDate: toDateInputValue(project.endDate),
          repositoryUrl: project.repositoryUrl ?? "",
          technologyNames: project.technologyNames,
        }}
      />
    </div>
  );
}
