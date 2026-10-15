import {
  CalendarDays,
  Flame,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatStudyDuration } from "@/features/learning/presentation";
import type {
  StudyPeriodSummary,
  TechnologyStudyItem,
} from "../aggregation";
import { buildRetrospectiveSummary } from "../presentation";

interface RetrospectiveReportProps {
  currentStudy: StudyPeriodSummary;
  learningStreak: number;
  periodName: string;
  previousStudy: StudyPeriodSummary;
  technologyStudy: TechnologyStudyItem[];
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

export function RetrospectiveReport({
  currentStudy,
  learningStreak,
  periodName,
  previousStudy,
  technologyStudy,
}: RetrospectiveReportProps) {
  const summary = buildRetrospectiveSummary(
    currentStudy,
    previousStudy,
    technologyStudy,
  );
  const comparison =
    summary.trend === "NEW"
      ? `직전 같은 기간에는 기록이 없었고, 이번에는 ${formatStudyDuration(currentStudy.totalMinutes)}을 학습했습니다.`
      : summary.trend === "UP"
        ? `직전 같은 기간보다 ${formatStudyDuration(summary.changeMinutes)} 더 학습했습니다.`
        : summary.trend === "DOWN"
          ? `직전 같은 기간보다 ${formatStudyDuration(Math.abs(summary.changeMinutes))} 적게 학습했습니다.`
          : "직전 같은 기간과 학습 시간이 같습니다.";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col items-start gap-3 space-y-0 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{periodName} 자동 회고</CardTitle>
          <CardDescription>
            기록한 데이터를 바탕으로 현재 흐름을 자동으로 정리했습니다.
          </CardDescription>
        </div>
        <Badge variant="primary">자동 생성</Badge>
      </CardHeader>
      <CardContent className="pt-5 sm:pt-6">
        {currentStudy.totalMinutes > 0 ? (
          <div className="space-y-5">
            <p className="rounded-control bg-primary-soft px-4 py-3 text-sm font-semibold leading-6 text-foreground">
              {periodName}에는 {summary.activeDayCount}일 동안 총{" "}
              {formatStudyDuration(currentStudy.totalMinutes)}을 학습했습니다.
            </p>
            <ul className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <li className="flex gap-3 rounded-control border border-border p-3">
                {summary.trend === "DOWN" ? (
                  <TrendingDown
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-warning"
                  />
                ) : summary.trend === "UP" ? (
                  <TrendingUp
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-success"
                  />
                ) : summary.trend === "NEW" ? (
                  <Sparkles
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-primary"
                  />
                ) : (
                  <Minus
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-muted"
                  />
                )}
                <span>{comparison}</span>
              </li>
              <li className="flex gap-3 rounded-control border border-border p-3">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-primary"
                />
                <span>
                  {summary.peakStudy
                    ? `${dateFormatter.format(summary.peakStudy.date)}에 ${formatStudyDuration(summary.peakStudy.minutes)}으로 가장 집중했습니다.`
                    : "집중 학습일을 계산할 기록이 없습니다."}
                </span>
              </li>
              <li className="flex gap-3 rounded-control border border-border p-3">
                <Target
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-info"
                />
                <span>
                  {summary.topTechnology
                    ? `${summary.topTechnology.name}에 가장 많은 시간을 사용했습니다.`
                    : "기술을 연결하면 집중 분야를 확인할 수 있습니다."}
                </span>
              </li>
              <li className="flex gap-3 rounded-control border border-border p-3">
                <Flame
                  aria-hidden="true"
                  className="mt-0.5 size-4 text-warning"
                />
                <span>현재 연속 학습은 {learningStreak}일입니다.</span>
              </li>
            </ul>
          </div>
        ) : (
          <p className="rounded-control bg-surface-subtle px-4 py-5 text-sm leading-6 text-muted">
            {periodName}에는 아직 학습 기록이 없습니다. 첫 기록을 작성하면 활동 일수,
            이전 기간 대비 변화와 집중 기술을 자동으로 정리합니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
