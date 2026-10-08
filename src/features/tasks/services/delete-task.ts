import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteTask(
  userId: string,
  projectId: string,
  taskId: string,
): Promise<boolean> {
  const result = await prisma.task.deleteMany({
    where: {
      id: taskId,
      projectId,
      project: { userId },
    },
  });

  return result.count === 1;
}
