import { CheckCircle2, FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectFilterForm } from "@/features/projects/components/project-filter-form";
import { listProjects } from "@/features/projects/queries";
import { projectListSearchParamsSchema } from "@/features/projects/schemas";
import { z } from "zod";

export const metadata: Metadata = { title: "Projects" };

interface ProjectsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    deleted?: string | string[];
  }>;
}

const successSearchParamSchema = z.literal("1");

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawSearchParams = await searchParams;
  const filters = projectListSearchParamsSchema.parse(rawSearchParams);
  const projects = await listProjects(session.user.id, filters);
  const hasFilters = Boolean(filters.query || filters.status);
  const projectDeleted = successSearchParamSchema.safeParse(
    rawSearchParams.deleted,
  ).success;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="진행 중인 프로젝트와 완료한 프로젝트를 한곳에서 관리합니다."
        action={
          <ButtonLink href="/projects/new">
            <Plus aria-hidden="true" className="size-4" />
            프로젝트 만들기
          </ButtonLink>
        }
      />
      {projectDeleted ? (
        <Card className="border-success/30 bg-success-soft shadow-none">
          <CardContent className="flex items-start gap-3 py-5 sm:py-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <div>
              <p className="font-semibold text-foreground">
                프로젝트를 삭제했습니다.
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                연결된 Task와 기술 정보도 함께 정리되었습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ProjectFilterForm filters={filters} />
      {projects.length > 0 ? (
        <section aria-label="프로젝트 목록" className="grid gap-5 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={hasFilters ? "검색 결과가 없습니다" : "첫 프로젝트를 만들어 보세요"}
          description={
            hasFilters
              ? "검색어나 상태 조건을 바꾸거나 필터를 초기화해 보세요."
              : "프로젝트의 목표와 기간, 기술 스택을 기록하고 개발 과정을 관리할 수 있습니다."
          }
          action={
            hasFilters ? (
              <ButtonLink href="/projects" variant="outline">
                필터 초기화
              </ButtonLink>
            ) : (
              <ButtonLink href="/projects/new">
                <Plus aria-hidden="true" className="size-4" />
                프로젝트 만들기
              </ButtonLink>
            )
          }
        />
      )}
    </div>
  );
}
