import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  FolderKanban,
  History,
  Plus,
  Rocket,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { WeeklyStudyChart } from "@/features/dashboard/components/weekly-study-chart";
import { isFirstDashboardVisit } from "@/features/dashboard/presentation";
import {
  getDashboardData,
  type DashboardActivity,
  type DashboardTask,
} from "@/features/dashboard/queries";
import {
  formatStudyDuration,
  LEARNING_CATEGORY_LABELS,
} from "@/features/learning/presentation";

export const metadata: Metadata = { title: "Dashboard" };

const dayFormatter = new Intl.DateTimeFormat("ko-KR", {
  weekday: "short",
  timeZone: "UTC",
});
const calendarDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatDashboardDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
    timeZone,
  }).format(date);
}

function formatDueDate(dueDate: Date | null): string {
  return dueDate ? calendarDateFormatter.format(dueDate) : "기한 미정";
}

function formatActivityDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date);
}

function getActivityDescription(activity: DashboardActivity): string {
  if (activity.type === "PROJECT_UPDATED") {
    return "프로젝트를 업데이트했습니다.";
  }
  if (activity.type === "TASK_COMPLETED") {
    return `${activity.projectTitle}의 Task를 완료했습니다.`;
  }
  return "학습 기록을 작성했습니다.";
}

function formatTaskDueLabel(task: DashboardTask, today: Date): string {
  const days = Math.round(
    (task.dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (days < 0) return `${Math.abs(days)}일 지남`;
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return formatDueDate(task.dueDate);
}

function getPriorityPresentation(priority: DashboardTask["priority"]): {
  label: string;
  variant: BadgeVariant;
} {
  if (priority === "HIGH") return { label: "높음", variant: "warning" };
  if (priority === "LOW") return { label: "낮음", variant: "neutral" };
  return { label: "보통", variant: "info" };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const now = new Date();
  const dashboard = await getDashboardData(session.user.id, now);

  if (!dashboard) {
    throw new Error("Dashboard 사용자 설정을 확인할 수 없습니다.");
  }

  const displayName = session.user.name?.trim() || "개발자";
  const pageHeader = (
    <PageHeader
      eyebrow={formatDashboardDate(now, dashboard.timeZone)}
      title={`안녕하세요, ${displayName}님`}
      description="오늘의 개발 흐름을 확인하고, 가장 중요한 작업부터 이어가세요."
      action={
        <ButtonLink href="/projects/new">
          <Plus aria-hidden="true" className="size-4" />
          새 프로젝트
        </ButtonLink>
      }
    />
  );

  if (isFirstDashboardVisit(dashboard)) {
    return (
      <div className="space-y-8">
        {pageHeader}
        <EmptyState
          icon={Rocket}
          title="잔디노트를 시작해 보세요"
          description="첫 프로젝트를 만들거나 오늘 배운 내용을 기록하면 진행 상황과 학습 흐름이 Dashboard에 쌓입니다."
          action={
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <ButtonLink className="w-full sm:w-auto" href="/projects/new">
                <Plus aria-hidden="true" className="size-4" />
                첫 프로젝트 만들기
              </ButtonLink>
              <ButtonLink
                className="w-full sm:w-auto"
                href="/learning/new"
                variant="outline"
              >
                <BookOpenCheck aria-hidden="true" className="size-4" />
                오늘 학습 기록하기
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  const weeklyStudy = dashboard.weeklyStudy.map((item) => ({
    day: dayFormatter.format(item.date).replace("요일", ""),
    minutes: item.minutes,
  }));

  return (
    <div className="space-y-8">
      {pageHeader}

      <section
        aria-label="개발 현황 요약"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="진행 중 프로젝트"
          value={`${dashboard.summary.inProgressProjects}개`}
          helper={`완료 프로젝트 ${dashboard.summary.completedProjects}개`}
          icon={FolderKanban}
          tone="primary"
        />
        <StatCard
          title="완료한 Task"
          value={`${dashboard.summary.completedTasks}개`}
          helper="전체 프로젝트 누적 기준"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="이번 주 학습"
          value={formatStudyDuration(dashboard.summary.weeklyStudyMinutes)}
          helper="월요일부터 일요일까지"
          icon={Clock3}
          tone="neutral"
        />
        <StatCard
          title="연속 학습"
          value={`${dashboard.summary.learningStreak}일`}
          helper="오늘 또는 어제부터 이어진 기록"
          icon={Flame}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>프로젝트 진행률</CardTitle>
              <CardDescription>현재 진행 중인 프로젝트를 확인하세요.</CardDescription>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              전체 보기
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </CardHeader>

          <CardContent className="space-y-5">
            {dashboard.projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-border p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 font-semibold text-foreground">
                        <Link
                          className="block truncate hover:text-primary"
                          href={`/projects/${project.id}`}
                        >
                          {project.title}
                        </Link>
                      </h3>
                      <Badge variant="primary">진행 중</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {project.description ?? "등록된 프로젝트 설명이 없습니다."}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted">
                    다음 마감 {formatDueDate(project.nextDueDate ?? project.endDate)}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress
                    value={project.progress}
                    label={`${project.title} 진행률`}
                    className="flex-1"
                  />
                  <span className="w-9 text-right text-xs font-bold text-foreground">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologyNames.map((technology) => (
                    <Badge key={technology} variant="outline">
                      {technology}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
            {dashboard.projects.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                진행 중인 프로젝트가 없습니다.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>이번 주 학습</CardTitle>
              <CardDescription>일별 학습 시간</CardDescription>
            </div>
            <Badge variant="primary">
              {formatStudyDuration(dashboard.summary.weeklyStudyMinutes)}
            </Badge>
          </CardHeader>
          <CardContent>
            <WeeklyStudyChart
              data={weeklyStudy}
              totalMinutes={dashboard.summary.weeklyStudyMinutes}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>마감 임박 Task</CardTitle>
              <CardDescription>마감일이 가까운 미완료 작업</CardDescription>
            </div>
            <Link
              href="/tasks?sort=DUE_ASC"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              전체 보기
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border">
            {dashboard.upcomingTasks.map((task) => {
              const priority = getPriorityPresentation(task.priority);
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 px-5 py-4 sm:px-6"
                >
                  <span
                    className="size-2 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                      href={`/projects/${task.projectId}`}
                    >
                      {task.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-muted">
                      {task.projectTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant={priority.variant}>{priority.label}</Badge>
                    <p className="mt-1.5 text-xs font-medium text-muted">
                      {formatTaskDueLabel(task, dashboard.today)}
                    </p>
                  </div>
                </li>
              );
            })}
            {dashboard.upcomingTasks.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-muted sm:px-6">
                마감일이 지정된 미완료 Task가 없습니다.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>최근 학습 기록</CardTitle>
              <CardDescription>최근 학습일 기준 기록</CardDescription>
            </div>
            <Link
              href="/learning"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              전체 보기
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border">
            {dashboard.recentLearningLogs.map((learningLog) => (
              <li
                key={learningLog.id}
                className="flex items-center gap-4 px-5 py-4 sm:px-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                    href={`/learning/${learningLog.id}`}
                  >
                    {learningLog.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {LEARNING_CATEGORY_LABELS[learningLog.category]} ·{" "}
                    {formatStudyDuration(learningLog.studyMinutes)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted">
                  {formatDueDate(learningLog.studiedAt)}
                </span>
              </li>
            ))}
            {dashboard.recentLearningLogs.length === 0 ? (
              <li className="px-5 py-10 text-center text-sm text-muted sm:px-6">
                아직 학습 기록이 없습니다.
              </li>
            ) : null}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border py-4">
          <div className="flex items-center gap-2">
            <History aria-hidden="true" className="size-4 text-primary" />
            <CardTitle>최근 활동</CardTitle>
          </div>
          <CardDescription>프로젝트와 학습에서 최근 변경된 내용</CardDescription>
        </CardHeader>
        <ul className="divide-y divide-border">
          {dashboard.recentActivity.map((activity) => {
            const ActivityIcon =
              activity.type === "PROJECT_UPDATED"
                ? FolderKanban
                : activity.type === "TASK_COMPLETED"
                  ? CheckCircle2
                  : BookOpenCheck;

            return (
              <li
                key={`${activity.type}-${activity.id}`}
                className="flex min-w-0 items-start gap-3 px-5 py-4 sm:items-center sm:px-6"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <ActivityIcon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                    href={activity.href}
                  >
                    {activity.title}
                  </Link>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {getActivityDescription(activity)}
                  </p>
                </div>
                <time
                  className="shrink-0 text-xs font-medium text-muted"
                  dateTime={activity.occurredAt.toISOString()}
                >
                  {formatActivityDate(activity.occurredAt, dashboard.timeZone)}
                </time>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
