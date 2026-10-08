import { CalendarDays, CheckSquare2, Pencil, Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TaskItem } from "@/features/tasks/queries";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

interface TaskListProps {
  projectId: string;
  tasks: TaskItem[];
}

export function TaskList({ projectId, tasks }: TaskListProps) {
  return (
    <section aria-labelledby="project-tasks-title">
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-border">
          <div>
            <CardTitle id="project-tasks-title">Tasks</CardTitle>
            <CardDescription>
              프로젝트를 실행 가능한 작업으로 나누어 관리합니다.
            </CardDescription>
          </div>
          <ButtonLink href={`/projects/${projectId}/tasks/new`} size="sm">
            <Plus aria-hidden="true" className="size-4" />
            Task 추가
          </ButtonLink>
        </CardHeader>
        {tasks.length > 0 ? (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="px-5 py-5 sm:px-6">
                <article className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <TaskStatusBadge status={task.status} />
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <h3 className="mt-3 font-semibold text-foreground">
                      {task.title}
                    </h3>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">
                        {task.description}
                      </p>
                    ) : null}
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                      <CalendarDays aria-hidden="true" className="size-4" />
                      마감일 {task.dueDate ? dateFormatter.format(task.dueDate) : "미정"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ButtonLink
                      href={`/projects/${projectId}/tasks/${task.id}/edit`}
                      size="sm"
                      variant="ghost"
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      수정
                    </ButtonLink>
                    <DeleteTaskDialog
                      projectId={projectId}
                      taskId={task.id}
                      taskTitle={task.title}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <CardContent className="pt-5 sm:pt-6">
            <EmptyState
              className="min-h-56 shadow-none"
              icon={CheckSquare2}
              title="첫 Task를 추가해 보세요"
              description="작업의 상태와 우선순위, 마감일을 관리할 수 있습니다."
              action={
                <ButtonLink href={`/projects/${projectId}/tasks/new`}>
                  <Plus aria-hidden="true" className="size-4" />
                  Task 추가
                </ButtonLink>
              }
            />
          </CardContent>
        )}
      </Card>
    </section>
  );
}
