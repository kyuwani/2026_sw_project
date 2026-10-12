import "server-only";

import type { ProjectStatusValue } from "@/features/projects/schemas";
import { calculateTaskProgress } from "@/features/projects/progress";
import { calculateLearningStreak } from "@/features/dashboard/streak";
import { isValidTimeZone } from "@/lib/date/time-zone";
import { prisma } from "@/lib/db/prisma";
import {
  aggregateStudyPeriod,
  calculateTaskCompletion,
  calculateTechnologyStudyBreakdown,
  getAnalyticsPeriods,
  type AnalyticsPeriod,
  type StudyPeriodSummary,
  type TaskCompletionSummary,
  type TechnologyStudyItem,
} from "./aggregation";
import type { AnalyticsPeriodSelection } from "./schemas";

export interface AnalyticsProjectProgress {
  id: string;
  title: string;
  status: ProjectStatusValue;
  taskCount: number;
  completedTaskCount: number;
  progress: number;
}

export interface AnalyticsData {
  timeZone: string;
  today: Date;
  weeklyStudy: StudyPeriodSummary;
  monthlyStudy: StudyPeriodSummary;
  selectedPeriod: AnalyticsPeriodSelection["period"];
  selectedStudy: StudyPeriodSummary;
  learningStreak: number;
  taskCompletion: TaskCompletionSummary;
  projectProgress: AnalyticsProjectProgress[];
  technologyStudy: TechnologyStudyItem[];
}

export async function getAnalyticsData(
  userId: string,
  now = new Date(),
  selection: AnalyticsPeriodSelection = { period: "MONTH" },
): Promise<AnalyticsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user || !isValidTimeZone(user.timezone)) {
    return null;
  }

  const periods = getAnalyticsPeriods(now, user.timezone);
  const selectedRange: AnalyticsPeriod =
    selection.period === "WEEK"
      ? periods.week
      : selection.period === "MONTH"
        ? periods.month
        : { startDate: selection.startDate, endDate: selection.endDate };
  const ranges = [periods.week, periods.month, selectedRange];
  const queryStart = new Date(
    Math.min(...ranges.map(({ startDate }) => startDate.getTime())),
  );
  const queryEnd = new Date(
    Math.max(...ranges.map(({ endDate }) => endDate.getTime())),
  );

  const [learningLogs, studiedDates, projects] = await Promise.all([
    prisma.learningLog.findMany({
      where: {
        userId,
        studiedAt: { gte: queryStart, lte: queryEnd },
      },
      select: {
        studiedAt: true,
        studyMinutes: true,
        technologies: {
          select: {
            technology: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.learningLog.findMany({
      where: { userId, studiedAt: { lte: periods.today } },
      distinct: ["studiedAt"],
      orderBy: { studiedAt: "desc" },
      select: { studiedAt: true },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        tasks: { select: { status: true } },
      },
    }),
  ]);

  const selectedLearningLogs = learningLogs.filter(
    ({ studiedAt }) =>
      studiedAt >= selectedRange.startDate && studiedAt <= selectedRange.endDate,
  );
  const taskStatuses = projects.flatMap((project) =>
    project.tasks.map(({ status }) => status),
  );

  return {
    timeZone: user.timezone,
    today: periods.today,
    weeklyStudy: aggregateStudyPeriod(learningLogs, periods.week),
    monthlyStudy: aggregateStudyPeriod(learningLogs, periods.month),
    selectedPeriod: selection.period,
    selectedStudy: aggregateStudyPeriod(learningLogs, selectedRange),
    learningStreak: calculateLearningStreak(
      studiedDates.map(({ studiedAt }) => studiedAt),
      periods.today,
    ),
    taskCompletion: calculateTaskCompletion(taskStatuses),
    projectProgress: projects.map((project) => {
      const taskCount = project.tasks.length;
      const completedTaskCount = project.tasks.filter(
        ({ status }) => status === "DONE",
      ).length;

      return {
        id: project.id,
        title: project.title,
        status: project.status,
        taskCount,
        completedTaskCount,
        progress: calculateTaskProgress(taskCount, completedTaskCount),
      };
    }),
    technologyStudy: calculateTechnologyStudyBreakdown(selectedLearningLogs),
  };
}
