import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type {
  TaskPriorityValue,
  TaskStatusValue,
} from "@/features/tasks/schemas";

const statusPresentation: Record<
  TaskStatusValue,
  { label: string; variant: BadgeVariant }
> = {
  TODO: { label: "할 일", variant: "neutral" },
  IN_PROGRESS: { label: "진행 중", variant: "primary" },
  DONE: { label: "완료", variant: "success" },
};

const priorityPresentation: Record<
  TaskPriorityValue,
  { label: string; variant: BadgeVariant }
> = {
  LOW: { label: "낮음", variant: "outline" },
  MEDIUM: { label: "보통", variant: "info" },
  HIGH: { label: "높음", variant: "warning" },
};

export function TaskStatusBadge({ status }: { status: TaskStatusValue }) {
  const presentation = statusPresentation[status];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}

export function TaskPriorityBadge({
  priority,
}: {
  priority: TaskPriorityValue;
}) {
  const presentation = priorityPresentation[priority];
  return <Badge variant={presentation.variant}>{presentation.label}</Badge>;
}
