import "server-only";

import type { TaskInput } from "@/features/tasks/schemas";
import { prisma } from "@/lib/db/prisma";

export async function updateTask(
  userId: string,
  projectId: string,
  taskId: string,
  input: TaskInput,
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
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        completedAt:
          input.status === "DONE" ? (task.completedAt ?? new Date()) : null,
      },
    });

    return true;
  });
}
