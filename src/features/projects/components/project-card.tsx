import { ArrowRight, CalendarDays, GitFork } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProjectSummary } from "@/features/projects/queries";
import { ProjectStatusBadge } from "./project-status-badge";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatPeriod(startDate: Date | null, endDate: Date | null): string {
  if (!startDate && !endDate) {
    return "기간 미정";
  }

  return `${startDate ? dateFormatter.format(startDate) : "시작일 미정"} – ${
    endDate ? dateFormatter.format(endDate) : "종료일 미정"
  }`;
}

interface ProjectCardProps {
  project: ProjectSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0">
          <div className="mb-2">
            <ProjectStatusBadge status={project.status} />
          </div>
          <CardTitle className="text-lg">
            <Link
              className="rounded-sm hover:text-primary"
              href={`/projects/${project.id}`}
            >
              {project.title}
            </Link>
          </CardTitle>
        </div>
        {project.repositoryUrl ? (
          <GitFork
            aria-label="GitHub Repository 연결됨"
            className="mt-1 size-4 shrink-0 text-muted"
          />
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted">
          {project.description ?? "프로젝트 설명이 없습니다."}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <CalendarDays aria-hidden="true" className="size-4" />
          <span>{formatPeriod(project.startDate, project.endDate)}</span>
        </div>
        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
          {project.technologyNames.length > 0 ? (
            project.technologyNames.map((technology) => (
              <Badge key={technology} variant="outline">
                {technology}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted">등록된 기술 없음</span>
          )}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">
              Task {project.completedTaskCount}/{project.taskCount}
            </span>
            <span className="font-bold text-foreground">{project.progress}%</span>
          </div>
          <Progress value={project.progress} label={`${project.title} 진행률`} />
        </div>
        <Link
          className="mt-5 inline-flex items-center justify-end gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          href={`/projects/${project.id}`}
        >
          상세 보기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
