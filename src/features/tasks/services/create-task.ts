import "server-only";

import type { TaskInput } from "@/features/tasks/schemas";
import { prisma } from "@/lib/db/prisma";

export async function createTask(
  userId: string,
  projectId: string,
  input: TaskInput,
): Promise<{ id: string } | null> {
  return prisma.$transaction(async (transaction) => {
    const project = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });

    if (!project) {
      return null;
    }

    return transaction.task.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate,
        completedAt: input.status === "DONE" ? new Date() : null,
        projectId: project.id,
      },
      select: { id: true },
    });
  });
}
