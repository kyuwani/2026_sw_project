import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  FolderKanban,
  Plus,
} from "lucide-react";
import Link from "next/link";

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
import { StatCard } from "@/features/dashboard/components/stat-card";
import { WeeklyStudyChart } from "@/features/dashboard/components/weekly-study-chart";
import {
  learningLogs,
  projects,
  upcomingTasks,
  weeklyStudy,
} from "@/features/dashboard/mock-data";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="2026년 9월 21일 월요일"
        title="좋은 오후예요, 김개발님"
        description="오늘의 개발 흐름을 확인하고, 가장 중요한 작업부터 이어가세요."
        action={
          <ButtonLink href="/projects">
            <Plus aria-hidden="true" className="size-4" />
            새 프로젝트
          </ButtonLink>
        }
      />

      <section aria-label="개발 현황 요약" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="진행 중 프로젝트"
          value="3개"
          helper="이번 달 새 프로젝트 1개"
          icon={FolderKanban}
          tone="primary"
        />
        <StatCard
          title="완료한 Task"
          value="18개"
          helper="지난주보다 4개 더 완료"
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          title="이번 주 학습"
          value="10h 50m"
          helper="주간 목표의 72% 달성"
          icon={Clock3}
          tone="neutral"
        />
        <StatCard
          title="연속 학습"
          value="12일"
          helper="최장 기록까지 3일 남음"
          icon={Flame}
          tone="warning"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
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
            {projects.map((project) => (
              <article key={project.id} className="rounded-xl border border-border p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      <Badge variant="primary">진행 중</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">{project.description}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted">
                    목표 {project.dueDate}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress
                    value={project.progress}
                    label={`${project.name} 진행률`}
                    className="flex-1"
                  />
                  <span className="w-9 text-right text-xs font-bold text-foreground">
                    {project.progress}%
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.technologies.map((technology) => (
                    <Badge key={technology} variant="outline">
                      {technology}
                    </Badge>
                  ))}
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>이번 주 학습</CardTitle>
              <CardDescription>일별 학습 시간</CardDescription>
            </div>
            <Badge variant="primary">목표 15시간</Badge>
          </CardHeader>
          <CardContent>
            <WeeklyStudyChart data={weeklyStudy} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border py-4">
            <div>
              <CardTitle>마감 임박 Task</CardTitle>
              <CardDescription>우선 확인할 작업 3개</CardDescription>
            </div>
            <Link
              href="/tasks"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              전체 보기
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border">
            {upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-5 py-4 sm:px-6">
                <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-muted">{task.project}</p>
                </div>
                <div className="text-right">
                  <Badge variant={task.priority === "높음" ? "warning" : "neutral"}>
                    {task.priority}
                  </Badge>
                  <p className="mt-1.5 text-xs font-medium text-muted">{task.dueLabel}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border py-4">
            <div>
              <CardTitle>최근 학습 기록</CardTitle>
              <CardDescription>꾸준히 쌓이고 있는 학습 로그</CardDescription>
            </div>
            <Link
              href="/learning"
              className="text-sm font-semibold text-primary hover:text-primary-hover"
            >
              전체 보기
            </Link>
          </CardHeader>
          <ul className="divide-y divide-border">
            {learningLogs.map((log) => (
              <li key={log.id} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <BookOpenCheck aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{log.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {log.category} · {log.duration}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted">{log.date}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
