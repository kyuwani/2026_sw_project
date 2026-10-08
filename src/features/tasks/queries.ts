import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getDateInTimeZone } from "@/lib/date/time-zone";
import type {
  TaskListFilters,
  TaskPriorityValue,
  TaskStatusValue,
} from "./schemas";

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskOverviewItem extends TaskItem {
  project: {
    id: string;
    title: string;
  };
}

const taskSelect = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listProjectTasks(
  userId: string,
  projectId: string,
): Promise<TaskItem[]> {
  return prisma.task.findMany({
    where: { projectId, project: { userId } },
    orderBy: { createdAt: "asc" },
    select: taskSelect,
  });
}

export async function getTask(
  userId: string,
  projectId: string,
  taskId: string,
): Promise<TaskItem | null> {
  return prisma.task.findFirst({
    where: { id: taskId, projectId, project: { userId } },
    select: taskSelect,
  });
}

function getTodayInSeoul(): Date {
  return getDateInTimeZone(new Date(), "Asia/Seoul");
}

function getTaskOrderBy(
  sort: TaskListFilters["sort"],
): Prisma.TaskOrderByWithRelationInput[] {
  if (sort === "DUE_ASC") {
    return [
      { dueDate: { sort: "asc", nulls: "last" } },
      { priority: "desc" },
    ];
  }

  if (sort === "PRIORITY_DESC") {
    return [
      { priority: "desc" },
      { dueDate: { sort: "asc", nulls: "last" } },
    ];
  }

  return [{ updatedAt: "desc" }];
}

export async function listTasks(
  userId: string,
  filters: TaskListFilters,
  today = getTodayInSeoul(),
): Promise<TaskOverviewItem[]> {
  const dueDate =
    filters.due === "OVERDUE"
      ? { lt: today }
      : filters.due === "TODAY"
        ? { equals: today }
        : filters.due === "UPCOMING"
          ? { gt: today }
          : filters.due === "NONE"
            ? null
            : undefined;

  return prisma.task.findMany({
    where: {
      project: { userId },
      status:
        filters.status ??
        (filters.due && filters.due !== "NONE" ? { not: "DONE" } : undefined),
      priority: filters.priority,
      dueDate,
    },
    orderBy: getTaskOrderBy(filters.sort),
    select: {
      ...taskSelect,
      project: { select: { id: true, title: true } },
    },
  });
}
