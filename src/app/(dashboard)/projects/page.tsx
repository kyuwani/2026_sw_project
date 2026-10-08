import { FolderKanban, Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectCard } from "@/features/projects/components/project-card";
import { ProjectFilterForm } from "@/features/projects/components/project-filter-form";
import { listProjects } from "@/features/projects/queries";
import { projectListSearchParamsSchema } from "@/features/projects/schemas";

export const metadata: Metadata = { title: "Projects" };

interface ProjectsPageProps {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const filters = projectListSearchParamsSchema.parse(await searchParams);
  const projects = await listProjects(session.user.id, filters);
  const hasFilters = Boolean(filters.query || filters.status);

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
