import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GitFork,
  ListChecks,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { getProjectDetail } from "@/features/projects/queries";

export const metadata: Metadata = { title: "프로젝트 상세" };

const projectIdSchema = z.uuid();
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "UTC",
});

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

function formatDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "미정";
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
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
    <div className="space-y-8">
      <ButtonLink href="/projects" size="sm" variant="ghost">
        <ArrowLeft aria-hidden="true" className="size-4" />
        프로젝트 목록
      </ButtonLink>
      <PageHeader
        eyebrow="Project"
        title={project.title}
        description="프로젝트 정보와 현재 진행 상황을 확인합니다."
        action={<ProjectStatusBadge status={project.status} />}
      />

      <section aria-label="프로젝트 진행 현황" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <ListChecks aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-3 text-sm text-muted">전체 Task</p>
            <p className="mt-1 text-2xl font-bold">{project.taskCount}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <CheckCircle2 aria-hidden="true" className="size-5 text-success" />
            <p className="mt-3 text-sm text-muted">완료 Task</p>
            <p className="mt-1 text-2xl font-bold">
              {project.completedTaskCount}개
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 sm:pt-6">
            <p className="text-sm text-muted">진행률</p>
            <p className="mt-1 text-2xl font-bold">{project.progress}%</p>
            <Progress
              className="mt-3"
              label={`${project.title} 진행률`}
              value={project.progress}
            />
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <Card>
          <CardHeader>
            <CardTitle>프로젝트 설명</CardTitle>
            <CardDescription>목표와 주요 내용을 확인합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
              {project.description ?? "등록된 설명이 없습니다."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>프로젝트 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-muted">상태</dt>
                <dd className="mt-1.5">
                  <ProjectStatusBadge status={project.status} />
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-medium text-muted">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  기간
                </dt>
                <dd className="mt-1.5 text-foreground">
                  {formatDate(project.startDate)} – {formatDate(project.endDate)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted">기술 스택</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {project.technologyNames.length > 0 ? (
                    project.technologyNames.map((technology) => (
                      <Badge key={technology} variant="outline">
                        {technology}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted">등록된 기술 없음</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-muted">GitHub Repository</dt>
                <dd className="mt-1.5">
                  {project.repositoryUrl ? (
                    <Link
                      className="inline-flex items-center gap-1.5 break-all font-semibold text-primary hover:text-primary-hover"
                      href={project.repositoryUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <GitFork aria-hidden="true" className="size-4 shrink-0" />
                      Repository 열기
                    </Link>
                  ) : (
                    <span className="text-muted">연결되지 않음</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
