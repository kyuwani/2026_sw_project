import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GitCommitHorizontal,
  GitFork,
  ListChecks,
  Pencil,
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
import { getProjectGitHubActivity } from "@/features/github/activity";
import { RepositoryConnectionForm } from "@/features/github/components/repository-connection-form";
import { getGitHubRepositories } from "@/features/github/repositories";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";
import { DeleteProjectDialog } from "@/features/projects/components/delete-project-dialog";
import { getProjectDetail } from "@/features/projects/queries";
import { TaskList } from "@/features/tasks/components/task-list";
import { listProjectTasks } from "@/features/tasks/queries";

export const metadata: Metadata = { title: "프로젝트 상세" };

const projectIdSchema = z.uuid();
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeZone: "UTC",
});
const commitDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    created?: string | string[];
    updated?: string | string[];
    taskCreated?: string | string[];
    taskUpdated?: string | string[];
    taskDeleted?: string | string[];
  }>;
}

const successSearchParamSchema = z.literal("1");

interface ProjectFeedback {
  title: string;
  description: string;
}

function getProjectFeedback(searchParams: {
  created?: string | string[];
  updated?: string | string[];
  taskCreated?: string | string[];
  taskUpdated?: string | string[];
  taskDeleted?: string | string[];
}): ProjectFeedback | null {
  if (successSearchParamSchema.safeParse(searchParams.created).success) {
    return {
      title: "프로젝트를 만들었습니다.",
      description: "이어서 첫 Task를 추가하거나 프로젝트 정보를 확인해 보세요.",
    };
  }

  if (successSearchParamSchema.safeParse(searchParams.updated).success) {
    return {
      title: "프로젝트를 수정했습니다.",
      description: "변경한 정보와 기술 스택이 반영되었습니다.",
    };
  }

  if (successSearchParamSchema.safeParse(searchParams.taskCreated).success) {
    return {
      title: "Task를 추가했습니다.",
      description: "프로젝트 진행 현황에 새 Task가 반영되었습니다.",
    };
  }

  if (successSearchParamSchema.safeParse(searchParams.taskUpdated).success) {
    return {
      title: "Task를 수정했습니다.",
      description: "변경한 상태와 우선순위가 반영되었습니다.",
    };
  }

  if (successSearchParamSchema.safeParse(searchParams.taskDeleted).success) {
    return {
      title: "Task를 삭제했습니다.",
      description: "프로젝트 진행 현황이 다시 계산되었습니다.",
    };
  }

  return null;
}

function formatDate(date: Date | null): string {
  return date ? dateFormatter.format(date) : "미정";
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: ProjectDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedProjectId = projectIdSchema.safeParse((await params).projectId);

  if (!parsedProjectId.success) {
    notFound();
  }

  const [project, tasks] = await Promise.all([
    getProjectDetail(session.user.id, parsedProjectId.data),
    listProjectTasks(session.user.id, parsedProjectId.data),
  ]);

  if (!project) {
    notFound();
  }

  const [repositoryList, githubActivity] = await Promise.all([
    getGitHubRepositories(session.user.id),
    getProjectGitHubActivity(session.user.id, parsedProjectId.data),
  ]);

  const feedback = getProjectFeedback(await searchParams);

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
        action={
          <div className="flex flex-wrap items-center gap-3">
            <ProjectStatusBadge status={project.status} />
            <ButtonLink href={`/projects/${project.id}/edit`} variant="outline">
              <Pencil aria-hidden="true" className="size-4" />
              수정
            </ButtonLink>
          </div>
        }
      />

      {feedback ? (
        <Card className="border-success/30 bg-success-soft shadow-none">
          <CardContent className="flex items-start gap-3 py-5 sm:py-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <div>
              <p className="font-semibold text-foreground">{feedback.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {feedback.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

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

      <TaskList projectId={project.id} tasks={tasks} />

      <Card>
        <CardHeader>
          <CardTitle>GitHub Repository</CardTitle>
          <CardDescription>
            접근 가능한 Repository를 연결하고 최근 Commit을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RepositoryConnectionForm
            currentExternalId={
              githubActivity.status === "CONNECTED"
                ? githubActivity.repository.externalId
                : null
            }
            listTruncated={
              repositoryList.status === "CONNECTED" && repositoryList.truncated
            }
            listStatus={repositoryList.status}
            projectId={project.id}
            repositories={
              repositoryList.status === "CONNECTED"
                ? repositoryList.repositories.map((repository) => ({
                    externalId: repository.externalId,
                    fullName: repository.fullName,
                    visibility: repository.visibility,
                    isArchived: repository.isArchived,
                  }))
                : []
            }
          />

          {githubActivity.status === "CONNECTED" ? (
            <div className="space-y-5 border-t border-border pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <Link
                    className="inline-flex items-center gap-2 break-all font-semibold text-primary hover:text-primary-hover"
                    href={githubActivity.repository.htmlUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <GitFork aria-hidden="true" className="size-4 shrink-0" />
                    {githubActivity.repository.fullName}
                    <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                  </Link>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {githubActivity.repository.description ??
                      "등록된 Repository 설명이 없습니다."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Badge variant="outline">
                    {githubActivity.repository.visibility === "PRIVATE"
                      ? "Private"
                      : "Public"}
                  </Badge>
                  {githubActivity.repository.isArchived ? (
                    <Badge variant="warning">보관됨</Badge>
                  ) : null}
                </div>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted">기본 브랜치</dt>
                  <dd className="mt-1 font-medium">
                    {githubActivity.repository.defaultBranch}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">주 언어</dt>
                  <dd className="mt-1 font-medium">
                    {githubActivity.repository.language ?? "확인되지 않음"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">권한</dt>
                  <dd className="mt-1 font-medium">
                    {githubActivity.repository.permission}
                  </dd>
                </div>
              </dl>

              <div>
                <h3 className="flex items-center gap-2 font-semibold">
                  <GitCommitHorizontal aria-hidden="true" className="size-4" />
                  최근 Commit
                </h3>
                {githubActivity.commits.status === "AVAILABLE" ? (
                  githubActivity.commits.commits.length > 0 ? (
                    <ul className="mt-3 divide-y divide-border rounded-card border border-border">
                      {githubActivity.commits.commits.map((commit) => (
                        <li className="p-3.5" key={commit.sha}>
                          <Link
                            className="font-medium text-foreground hover:text-primary"
                            href={commit.htmlUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            {commit.message}
                          </Link>
                          <p className="mt-1.5 text-xs text-muted">
                            <span className="font-mono">{commit.shortSha}</span>
                            {" · "}
                            {commit.authorLogin ?? commit.authorName}
                            {" · "}
                            {commit.committedAt
                              ? commitDateFormatter.format(commit.committedAt)
                              : "날짜 정보 없음"}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      표시할 Commit이 없습니다.
                    </p>
                  )
                ) : (
                  <p className="mt-3 rounded-control bg-surface-subtle px-3.5 py-3 text-sm text-muted">
                    {githubActivity.commits.status === "REAUTH_REQUIRED"
                      ? "최근 Commit을 보려면 GitHub 권한을 다시 확인해 주세요."
                      : githubActivity.commits.status === "RATE_LIMITED"
                        ? "GitHub 요청 한도에 도달해 최근 Commit을 불러오지 못했습니다."
                        : "GitHub 장애로 최근 Commit을 불러오지 못했습니다. 프로젝트 정보는 정상적으로 사용할 수 있습니다."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="border-t border-border pt-5 text-sm text-muted">
              연결된 Repository가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

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

      <Card className="border-destructive/30 shadow-none">
        <CardHeader>
          <CardTitle>위험 영역</CardTitle>
          <CardDescription>
            프로젝트를 삭제하면 연결된 Task와 기술 정보도 함께 삭제됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteProjectDialog
            projectId={project.id}
            projectTitle={project.title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
