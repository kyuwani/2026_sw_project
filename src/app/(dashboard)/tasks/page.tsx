import { CheckSquare2, FolderKanban } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TaskFilterForm } from "@/features/tasks/components/task-filter-form";
import { TaskOverviewList } from "@/features/tasks/components/task-overview-list";
import { listTasks } from "@/features/tasks/queries";
import { taskListSearchParamsSchema } from "@/features/tasks/schemas";

export const metadata: Metadata = { title: "Tasks" };

interface TasksPageProps {
  searchParams: Promise<{
    status?: string | string[];
    priority?: string | string[];
    due?: string | string[];
    sort?: string | string[];
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const filters = taskListSearchParamsSchema.parse(await searchParams);
  const tasks = await listTasks(session.user.id, filters);
  const hasFilters = Boolean(
    filters.status ||
      filters.priority ||
      filters.due ||
      filters.sort !== "UPDATED_DESC",
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tasks"
        description="모든 프로젝트의 Task를 우선순위와 마감일에 따라 확인합니다."
      />
      <TaskFilterForm filters={filters} />
      {tasks.length > 0 ? (
        <TaskOverviewList tasks={tasks} />
      ) : (
        <EmptyState
          icon={hasFilters ? CheckSquare2 : FolderKanban}
          title={hasFilters ? "조건에 맞는 Task가 없습니다" : "등록된 Task가 없습니다"}
          description={
            hasFilters
              ? "필터 조건을 변경하거나 초기화해 보세요."
              : "프로젝트 상세에서 첫 Task를 추가할 수 있습니다."
          }
          action={
            hasFilters ? (
              <ButtonLink href="/tasks" variant="outline">
                필터 초기화
              </ButtonLink>
            ) : (
              <ButtonLink href="/projects">프로젝트 선택하기</ButtonLink>
            )
          }
        />
      )}
    </div>
  );
}
