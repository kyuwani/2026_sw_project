import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getDateInTimeZone, isValidTimeZone } from "@/lib/date/time-zone";
import { calculateTaskProgress } from "@/features/projects/progress";
import type { LearningCategoryValue } from "@/features/learning/schemas";
import type { TaskPriorityValue } from "@/features/tasks/schemas";
import { calculateLearningStreak } from "./streak";

const DASHBOARD_PROJECT_LIMIT = 5;
const DASHBOARD_ITEM_LIMIT = 3;

function addUtcDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getWeekStart(today: Date): Date {
  const day = today.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addUtcDays(today, -daysSinceMonday);
}

export interface DashboardSummary {
  inProgressProjects: number;
  completedProjects: number;
  completedTasks: number;
  weeklyStudyMinutes: number;
  learningStreak: number;
}

export interface DashboardProject {
  id: string;
  title: string;
  description: string | null;
  endDate: Date | null;
  technologyNames: string[];
  taskCount: number;
  completedTaskCount: number;
  progress: number;
  nextDueDate: Date | null;
}

export interface DashboardTask {
  id: string;
  projectId: string;
  projectTitle: string;
  title: string;
  priority: TaskPriorityValue;
  dueDate: Date;
}

export interface DashboardLearningLog {
  id: string;
  title: string;
  category: LearningCategoryValue;
  studyMinutes: number;
  studiedAt: Date;
}

export interface WeeklyStudyItem {
  date: Date;
  minutes: number;
}

export interface DashboardData {
  timeZone: string;
  today: Date;
  summary: DashboardSummary;
  projects: DashboardProject[];
  upcomingTasks: DashboardTask[];
  recentLearningLogs: DashboardLearningLog[];
  weeklyStudy: WeeklyStudyItem[];
}

export async function getDashboardData(
  userId: string,
  now = new Date(),
): Promise<DashboardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user || !isValidTimeZone(user.timezone)) {
    return null;
  }

  const today = getDateInTimeZone(now, user.timezone);
  const weekStart = getWeekStart(today);
  const weekEnd = addUtcDays(weekStart, 6);

  const [
    inProgressProjects,
    completedProjects,
    completedTasks,
    weeklyLearningLogs,
    studiedDates,
    projectRecords,
    taskRecords,
    recentLearningLogs,
  ] = await Promise.all([
    prisma.project.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { userId, status: "COMPLETED" } }),
    prisma.task.count({
      where: { status: "DONE", project: { userId } },
    }),
    prisma.learningLog.findMany({
      where: { userId, studiedAt: { gte: weekStart, lte: weekEnd } },
      select: { studiedAt: true, studyMinutes: true },
    }),
    prisma.learningLog.findMany({
      where: { userId, studiedAt: { lte: today } },
      distinct: ["studiedAt"],
      orderBy: { studiedAt: "desc" },
      select: { studiedAt: true },
    }),
    prisma.project.findMany({
      where: { userId, status: "IN_PROGRESS" },
      orderBy: { updatedAt: "desc" },
      take: DASHBOARD_PROJECT_LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        endDate: true,
        technologies: {
          orderBy: { technology: { name: "asc" } },
          select: { technology: { select: { name: true } } },
        },
        tasks: {
          select: { status: true, dueDate: true },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        project: { userId },
        status: { not: "DONE" },
        dueDate: { not: null },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: DASHBOARD_ITEM_LIMIT,
      select: {
        id: true,
        projectId: true,
        title: true,
        priority: true,
        dueDate: true,
        project: { select: { title: true } },
      },
    }),
    prisma.learningLog.findMany({
      where: { userId },
      orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
      take: DASHBOARD_ITEM_LIMIT,
      select: {
        id: true,
        title: true,
        category: true,
        studyMinutes: true,
        studiedAt: true,
      },
    }),
  ]);

  const weeklyMinutesByDate = new Map<string, number>();
  for (const learningLog of weeklyLearningLogs) {
    const dateKey = learningLog.studiedAt.toISOString().slice(0, 10);
    weeklyMinutesByDate.set(
      dateKey,
      (weeklyMinutesByDate.get(dateKey) ?? 0) + learningLog.studyMinutes,
    );
  }

  const weeklyStudy = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(weekStart, index);
    return {
      date,
      minutes: weeklyMinutesByDate.get(date.toISOString().slice(0, 10)) ?? 0,
    };
  });

  return {
    timeZone: user.timezone,
    today,
    summary: {
      inProgressProjects,
      completedProjects,
      completedTasks,
      weeklyStudyMinutes: weeklyStudy.reduce(
        (total, item) => total + item.minutes,
        0,
      ),
      learningStreak: calculateLearningStreak(
        studiedDates.map(({ studiedAt }) => studiedAt),
        today,
      ),
    },
    projects: projectRecords.map((project) => {
      const taskCount = project.tasks.length;
      const completedTaskCount = project.tasks.filter(
        ({ status }) => status === "DONE",
      ).length;
      const nextDueDate =
        project.tasks
          .flatMap((task) =>
            task.status !== "DONE" && task.dueDate ? [task.dueDate] : [],
          )
          .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        endDate: project.endDate,
        technologyNames: project.technologies.map(
          ({ technology }) => technology.name,
        ),
        taskCount,
        completedTaskCount,
        progress: calculateTaskProgress(taskCount, completedTaskCount),
        nextDueDate,
      };
    }),
    upcomingTasks: taskRecords.flatMap((task) =>
      task.dueDate
        ? [
            {
              id: task.id,
              projectId: task.projectId,
              projectTitle: task.project.title,
              title: task.title,
              priority: task.priority,
              dueDate: task.dueDate,
            },
          ]
        : [],
    ),
    recentLearningLogs,
    weeklyStudy,
  };
}
