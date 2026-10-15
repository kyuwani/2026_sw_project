import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { ProjectStatusValue } from "@/features/projects/schemas";

const statusPresentation: Record<
  ProjectStatusValue,
  { label: string; variant: BadgeVariant }
> = {
  PLANNING: { label: "계획", variant: "neutral" },
  IN_PROGRESS: { label: "진행 중", variant: "primary" },
  COMPLETED: { label: "완료", variant: "success" },
  ARCHIVED: { label: "보관", variant: "outline" },
};

interface ProjectStatusBadgeProps {
  status: ProjectStatusValue;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const presentation = statusPresentation[status];

  return (
    <Badge variant={presentation.variant}>{presentation.label}</Badge>
  );
}
