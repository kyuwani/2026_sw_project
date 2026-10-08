import "server-only";

import { prisma } from "@/lib/db/prisma";
import type {
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
