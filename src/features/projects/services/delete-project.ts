import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const result = await prisma.project.deleteMany({
    where: { id: projectId, userId },
  });

  return result.count === 1;
}
