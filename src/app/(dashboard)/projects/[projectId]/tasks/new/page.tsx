import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { getProjectDetail } from "@/features/projects/queries";
import { projectIdSchema } from "@/features/projects/schemas";
import { TaskForm } from "@/features/tasks/components/task-form";

export const metadata: Metadata = { title: "Task 추가" };

interface NewTaskPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function NewTaskPage({ params }: NewTaskPageProps) {
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
        eyebrow={project.title}
        title="새 Task 추가"
        description="상태와 우선순위, 마감일을 정해 다음 작업을 구체화합니다."
      />
      <TaskForm projectId={project.id} />
    </div>
  );
}
