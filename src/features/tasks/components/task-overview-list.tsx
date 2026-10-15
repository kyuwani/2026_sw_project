import { CalendarDays, Pencil } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskOverviewItem } from "@/features/tasks/queries";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { QuickTaskStatus } from "./quick-task-status";
import { TaskPriorityBadge, TaskStatusBadge } from "./task-badges";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

interface TaskOverviewListProps {
  tasks: TaskOverviewItem[];
}

export function TaskOverviewList({ tasks }: TaskOverviewListProps) {
  return (
    <section aria-label="Task 목록" className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="pt-5 sm:pt-6">
            <article className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                  <Link
                    className="text-xs font-semibold text-primary hover:text-primary-hover"
                    href={`/projects/${task.project.id}`}
                  >
                    {task.project.title}
                  </Link>
                </div>
                <h2 className="mt-3 text-base font-bold text-foreground">
                  {task.title}
                </h2>
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
              <div className="flex shrink-0 flex-wrap items-center gap-1">
                <QuickTaskStatus
                  projectId={task.projectId}
                  status={task.status}
                  taskId={task.id}
                />
                <ButtonLink
                  href={`/projects/${task.projectId}/tasks/${task.id}/edit`}
                  size="sm"
                  variant="ghost"
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  수정
                </ButtonLink>
                <DeleteTaskDialog
                  projectId={task.projectId}
                  taskId={task.id}
                  taskTitle={task.title}
                />
              </div>
            </article>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
