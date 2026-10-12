import {
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Flame,
  FolderKanban,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

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
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { AnalyticsFilterForm } from "@/features/analytics/components/analytics-filter-form";
import { StudyTimeChart } from "@/features/analytics/components/study-time-chart";
import { TechnologyStudyChart } from "@/features/analytics/components/technology-study-chart";
import {
  buildStudyChartData,
  getAverageDailyStudyMinutes,
} from "@/features/analytics/presentation";
import { getAnalyticsData } from "@/features/analytics/queries";
import { parseAnalyticsSearchParams } from "@/features/analytics/schemas";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { formatStudyDuration } from "@/features/learning/presentation";
import { ProjectStatusBadge } from "@/features/projects/components/project-status-badge";

export const metadata: Metadata = { title: "Analytics" };

const periodDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatPeriod(startDate: Date, endDate: Date): string {
  return `${periodDateFormatter.format(startDate)} – ${periodDateFormatter.format(endDate)}`;
}

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/analytics">) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const selection = parseAnalyticsSearchParams(await searchParams);
  const analytics = await getAnalyticsData(session.user.id, new Date(), selection);
  if (!analytics) {
    throw new Error("Analytics 사용자 설정을 확인할 수 없습니다.");
  }

  const chartData = buildStudyChartData(analytics.selectedStudy.dailyStudy);
  const elapsedDayCount = analytics.selectedStudy.dailyStudy.filter(
    ({ date }) => date <= analytics.today,
  ).length;
  const averageMinutes = getAverageDailyStudyMinutes(
    analytics.selectedStudy.totalMinutes,
    elapsedDayCount,
  );
  const peakStudy = chartData.reduce<(typeof chartData)[number] | null>(
    (peak, item) => (!peak || item.minutes > peak.minutes ? item : peak),
    null,
  );
  const periodLabel = formatPeriod(
    analytics.selectedStudy.startDate,
    analytics.selectedStudy.endDate,
  );
  const chartUnitLabel =
    analytics.selectedStudy.dailyStudy.length > 62 ? "주별" : "일별";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="개발 데이터"
        title="Analytics"
        description="학습 시간과 프로젝트 진행 흐름을 기간별로 확인하세요."
        action={
          <ButtonLink href="/learning/new">
            <Plus aria-hidden="true" className="size-4" />
            학습 기록
          </ButtonLink>
        }
      />

      <AnalyticsFilterForm
        defaultEndDate={analytics.monthlyStudy.endDate}
        defaultStartDate={analytics.monthlyStudy.startDate}
        selection={selection}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="primary">
          {selection.period === "WEEK"
            ? "이번 주"
            : selection.period === "MONTH"
              ? "이번 달"
              : "사용자 지정"}
        </Badge>
        <p className="text-sm font-medium text-muted">{periodLabel}</p>
      </div>

      <section
        aria-label="Analytics 요약"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="총 학습 시간"
          value={formatStudyDuration(analytics.selectedStudy.totalMinutes)}
          helper={`${chartUnitLabel} 학습 기록 합계`}
          icon={Clock3}
          tone="primary"
        />
        <StatCard
          title="일평균 학습"
          value={formatStudyDuration(averageMinutes)}
          helper={`${elapsedDayCount}일 기준`}
          icon={BarChart3}
          tone="neutral"
        />
        <StatCard
          title="연속 학습"
          value={`${analytics.learningStreak}일`}
          helper="오늘 또는 어제부터 이어진 기록"
          icon={Flame}
          tone="warning"
        />
        <StatCard
          title="Task 완료율"
          value={`${analytics.taskCompletion.completionRate}%`}
          helper={`${analytics.taskCompletion.completedCount}/${analytics.taskCompletion.totalCount}개 완료`}
          icon={CheckCircle2}
          tone="success"
        />
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>학습 시간 추이</CardTitle>
            <CardDescription>
              {periodLabel}의 {chartUnitLabel} 학습 시간
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {analytics.selectedStudy.totalMinutes > 0 ? (
              <>
                <StudyTimeChart data={chartData} />
                <p className="mt-4 text-sm leading-6 text-muted">
                  총 {formatStudyDuration(analytics.selectedStudy.totalMinutes)}을
                  학습했습니다.
                  {peakStudy && peakStudy.minutes > 0
                    ? ` 가장 많이 학습한 구간은 ${peakStudy.label}로 ${formatStudyDuration(peakStudy.minutes)}입니다.`
                    : ""}
                </p>
                <details className="mt-4 rounded-control border border-border px-4 py-3">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    {chartUnitLabel} 학습 시간 표 보기
                  </summary>
                  <div className="mt-3 max-h-64 overflow-auto">
                    <table className="w-full min-w-64 text-left text-sm">
                      <thead className="text-xs text-muted">
                        <tr>
                          <th className="pb-2 font-semibold" scope="col">
                            기간
                          </th>
                          <th className="pb-2 text-right font-semibold" scope="col">
                            학습 시간
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {chartData.map((item) => (
                          <tr key={item.date}>
                            <th className="py-2 font-medium" scope="row">
                              {item.label}
                            </th>
                            <td className="py-2 text-right text-muted">
                              {formatStudyDuration(item.minutes)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <EmptyState
                className="min-h-72 border-0"
                icon={BookOpenCheck}
                title="이 기간에는 학습 기록이 없습니다"
                description="학습한 내용을 기록하면 시간 흐름을 차트로 확인할 수 있습니다."
                action={<ButtonLink href="/learning/new">학습 기록하기</ButtonLink>}
              />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>기술별 학습 비율</CardTitle>
            <CardDescription>기술이 연결된 기록의 학습 시간 기준</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            {analytics.technologyStudy.length > 0 ? (
              <TechnologyStudyChart data={analytics.technologyStudy} />
            ) : (
              <EmptyState
                className="min-h-72 border-0"
                icon={BarChart3}
                title="기술별 데이터가 없습니다"
                description="학습 기록에 기술 스택을 연결하면 기술별 비율을 확인할 수 있습니다."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>프로젝트별 진행률</CardTitle>
            <CardDescription>전체 프로젝트의 현재 Task 완료 기준</CardDescription>
          </div>
          <Badge variant="outline">{analytics.projectProgress.length}개</Badge>
        </CardHeader>
        {analytics.projectProgress.length > 0 ? (
          <ul className="divide-y divide-border">
            {analytics.projectProgress.map((project) => (
              <li className="px-5 py-4 sm:px-6" key={project.id}>
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        className="truncate text-sm font-semibold text-foreground hover:text-primary"
                        href={`/projects/${project.id}`}
                      >
                        {project.title}
                      </Link>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Task {project.completedTaskCount}/{project.taskCount}개 완료
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 items-center gap-3 sm:w-64">
                    <Progress
                      className="flex-1"
                      label={`${project.title} 진행률`}
                      size="sm"
                      value={project.progress}
                    />
                    <span className="w-10 text-right text-sm font-bold text-foreground">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="min-h-64 rounded-none border-0"
            icon={FolderKanban}
            title="프로젝트가 없습니다"
            description="프로젝트와 Task를 만들면 진행률을 확인할 수 있습니다."
            action={<ButtonLink href="/projects/new">프로젝트 만들기</ButtonLink>}
          />
        )}
      </Card>
    </div>
  );
}
