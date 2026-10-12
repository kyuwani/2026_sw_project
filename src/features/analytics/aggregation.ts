import { getDateInTimeZone } from "@/lib/date/time-zone";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
}

export interface StudyLogInput {
  studiedAt: Date;
  studyMinutes: number;
}

export interface DailyStudyItem {
  date: Date;
  minutes: number;
}

export interface StudyPeriodSummary extends AnalyticsPeriod {
  totalMinutes: number;
  dailyStudy: DailyStudyItem[];
}

export interface TaskCompletionSummary {
  totalCount: number;
  completedCount: number;
  completionRate: number;
}

export interface TechnologyStudyInput {
  studyMinutes: number;
  technologies: Array<{
    technology: { id: string; name: string };
  }>;
}

export interface TechnologyStudyItem {
  id: string;
  name: string;
  minutes: number;
  percentage: number;
}

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function getAnalyticsPeriods(
  now: Date,
  timeZone: string,
): {
  today: Date;
  week: AnalyticsPeriod;
  month: AnalyticsPeriod;
} {
  const today = getDateInTimeZone(now, timeZone);
  const day = today.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const weekStart = addUtcDays(today, -daysSinceMonday);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
  );

  return {
    today,
    week: { startDate: weekStart, endDate: addUtcDays(weekStart, 6) },
    month: { startDate: monthStart, endDate: monthEnd },
  };
}

export function aggregateStudyPeriod(
  learningLogs: StudyLogInput[],
  period: AnalyticsPeriod,
): StudyPeriodSummary {
  const minutesByDate = new Map<string, number>();

  for (const learningLog of learningLogs) {
    if (
      learningLog.studiedAt < period.startDate ||
      learningLog.studiedAt > period.endDate
    ) {
      continue;
    }

    const dateKey = toDateKey(learningLog.studiedAt);
    minutesByDate.set(
      dateKey,
      (minutesByDate.get(dateKey) ?? 0) + learningLog.studyMinutes,
    );
  }

  const dayCount =
    Math.round(
      (period.endDate.getTime() - period.startDate.getTime()) /
        DAY_IN_MILLISECONDS,
    ) + 1;
  const dailyStudy = Array.from({ length: dayCount }, (_, index) => {
    const date = addUtcDays(period.startDate, index);
    return {
      date,
      minutes: minutesByDate.get(toDateKey(date)) ?? 0,
    };
  });

  return {
    ...period,
    totalMinutes: dailyStudy.reduce((total, item) => total + item.minutes, 0),
    dailyStudy,
  };
}

export function calculateTaskCompletion(
  taskStatuses: readonly string[],
): TaskCompletionSummary {
  const completedCount = taskStatuses.filter(
    (status) => status === "DONE",
  ).length;
  const totalCount = taskStatuses.length;

  return {
    totalCount,
    completedCount,
    completionRate:
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  };
}

export function calculateTechnologyStudyBreakdown(
  learningLogs: TechnologyStudyInput[],
): TechnologyStudyItem[] {
  const minutesByTechnology = new Map<
    string,
    { name: string; minutes: number }
  >();

  for (const learningLog of learningLogs) {
    if (learningLog.technologies.length === 0) continue;

    const allocatedMinutes =
      learningLog.studyMinutes / learningLog.technologies.length;

    for (const { technology } of learningLog.technologies) {
      const current = minutesByTechnology.get(technology.id);
      minutesByTechnology.set(technology.id, {
        name: technology.name,
        minutes: (current?.minutes ?? 0) + allocatedMinutes,
      });
    }
  }

  const totalMinutes = Array.from(minutesByTechnology.values()).reduce(
    (total, item) => total + item.minutes,
    0,
  );

  if (totalMinutes === 0) return [];

  return Array.from(minutesByTechnology, ([id, item]) => ({
    id,
    name: item.name,
    minutes: roundToOneDecimal(item.minutes),
    percentage: roundToOneDecimal((item.minutes / totalMinutes) * 100),
  })).sort(
    (left, right) =>
      right.minutes - left.minutes || left.name.localeCompare(right.name, "ko"),
  );
}
