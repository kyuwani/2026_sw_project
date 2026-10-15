import "server-only";

import type { TaskStatusValue } from "@/features/tasks/schemas";
import { prisma } from "@/lib/db/prisma";

export async function setTaskCompletion(
  userId: string,
  projectId: string,
  taskId: string,
  status: Extract<TaskStatusValue, "DONE" | "TODO">,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const task = await transaction.task.findFirst({
      where: {
        id: taskId,
        projectId,
        project: { userId },
      },
      select: { id: true, completedAt: true },
    });

    if (!task) {
      return false;
    }

    await transaction.task.update({
      where: { id: task.id },
      data: {
        status,
        completedAt:
          status === "DONE" ? (task.completedAt ?? new Date()) : null,
      },
    });

    return true;
  });
}
