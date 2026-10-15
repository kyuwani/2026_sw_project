import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { projectIdSchema } from "@/features/projects/schemas";
import { TaskForm } from "@/features/tasks/components/task-form";
import { getTask } from "@/features/tasks/queries";
import { taskIdSchema } from "@/features/tasks/schemas";

export const metadata: Metadata = { title: "Task 수정" };

interface EditTaskPageProps {
  params: Promise<{ projectId: string; taskId: string }>;
}

function toDateInputValue(date: Date | null): string {
  return date?.toISOString().slice(0, 10) ?? "";
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawParams = await params;
  const parsedProjectId = projectIdSchema.safeParse(rawParams.projectId);
  const parsedTaskId = taskIdSchema.safeParse(rawParams.taskId);

  if (!parsedProjectId.success || !parsedTaskId.success) {
    notFound();
  }

  const task = await getTask(
    session.user.id,
    parsedProjectId.data,
    parsedTaskId.data,
  );

  if (!task) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Tasks"
        title="Task 수정"
        description="Task 정보와 현재 상태를 변경합니다."
      />
      <TaskForm
        projectId={task.projectId}
        task={{
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          status: task.status,
          priority: task.priority,
          dueDate: toDateInputValue(task.dueDate),
        }}
      />
    </div>
  );
}
