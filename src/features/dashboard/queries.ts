import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getDateInTimeZone, isValidTimeZone } from "@/lib/date/time-zone";
import { calculateTaskProgress } from "@/features/projects/progress";
import type { LearningCategoryValue } from "@/features/learning/schemas";
import type { TaskPriorityValue } from "@/features/tasks/schemas";
import { calculateLearningStreak } from "./streak";

const DASHBOARD_PROJECT_LIMIT = 5;
const DASHBOARD_ITEM_LIMIT = 3;
const DASHBOARD_ACTIVITY_LIMIT = 5;

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
  totalProjects: number;
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
  createdAt: Date;
}

export type DashboardActivity =
  | {
      type: "PROJECT_UPDATED";
      id: string;
      title: string;
      occurredAt: Date;
      href: string;
    }
  | {
      type: "TASK_COMPLETED";
      id: string;
      title: string;
      projectTitle: string;
      occurredAt: Date;
      href: string;
    }
  | {
      type: "LEARNING_LOGGED";
      id: string;
      title: string;
      occurredAt: Date;
      href: string;
    };

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
  recentActivity: DashboardActivity[];
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
    totalProjects,
    inProgressProjects,
    completedProjects,
    completedTasks,
    weeklyLearningLogs,
    studiedDates,
    projectRecords,
    taskRecords,
    recentLearningLogs,
    recentProjectActivities,
    recentCompletedTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { userId } }),
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
        createdAt: true,
      },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: DASHBOARD_ITEM_LIMIT,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.task.findMany({
      where: { project: { userId }, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: DASHBOARD_ITEM_LIMIT,
      select: {
        id: true,
        projectId: true,
        title: true,
        completedAt: true,
        project: { select: { title: true } },
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
      totalProjects,
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
    recentActivity: [
      ...recentProjectActivities.map(
        (project): DashboardActivity => ({
          type: "PROJECT_UPDATED",
          id: project.id,
          title: project.title,
          occurredAt: project.updatedAt,
          href: `/projects/${project.id}`,
        }),
      ),
      ...recentCompletedTasks.flatMap((task): DashboardActivity[] =>
        task.completedAt
          ? [
              {
                type: "TASK_COMPLETED",
                id: task.id,
                title: task.title,
                projectTitle: task.project.title,
                occurredAt: task.completedAt,
                href: `/projects/${task.projectId}`,
              },
            ]
          : [],
      ),
      ...recentLearningLogs.map(
        (learningLog): DashboardActivity => ({
          type: "LEARNING_LOGGED",
          id: learningLog.id,
          title: learningLog.title,
          occurredAt: learningLog.createdAt,
          href: `/learning/${learningLog.id}`,
        }),
      ),
    ]
      .sort(
        (left, right) =>
          right.occurredAt.getTime() - left.occurredAt.getTime(),
      )
      .slice(0, DASHBOARD_ACTIVITY_LIMIT),
    weeklyStudy,
  };
}
