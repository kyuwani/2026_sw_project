import "server-only";

import type { ProjectStatusValue } from "@/features/projects/schemas";
import { calculateTaskProgress } from "@/features/projects/progress";
import { isValidTimeZone } from "@/lib/date/time-zone";
import { prisma } from "@/lib/db/prisma";
import {
  aggregateStudyPeriod,
  calculateTaskCompletion,
  calculateTechnologyStudyBreakdown,
  getAnalyticsPeriods,
  type StudyPeriodSummary,
  type TaskCompletionSummary,
  type TechnologyStudyItem,
} from "./aggregation";

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
  taskCompletion: TaskCompletionSummary;
  projectProgress: AnalyticsProjectProgress[];
  technologyStudy: TechnologyStudyItem[];
}

export async function getAnalyticsData(
  userId: string,
  now = new Date(),
): Promise<AnalyticsData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user || !isValidTimeZone(user.timezone)) {
    return null;
  }

  const periods = getAnalyticsPeriods(now, user.timezone);
  const queryStart =
    periods.week.startDate < periods.month.startDate
      ? periods.week.startDate
      : periods.month.startDate;
  const queryEnd =
    periods.week.endDate > periods.month.endDate
      ? periods.week.endDate
      : periods.month.endDate;

  const [learningLogs, projects] = await Promise.all([
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

  const monthlyLearningLogs = learningLogs.filter(
    ({ studiedAt }) =>
      studiedAt >= periods.month.startDate &&
      studiedAt <= periods.month.endDate,
  );
  const taskStatuses = projects.flatMap((project) =>
    project.tasks.map(({ status }) => status),
  );

  return {
    timeZone: user.timezone,
    today: periods.today,
    weeklyStudy: aggregateStudyPeriod(learningLogs, periods.week),
    monthlyStudy: aggregateStudyPeriod(learningLogs, periods.month),
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
    technologyStudy: calculateTechnologyStudyBreakdown(monthlyLearningLogs),
  };
}
