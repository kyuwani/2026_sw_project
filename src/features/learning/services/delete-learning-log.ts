import "server-only";

import { prisma } from "@/lib/db/prisma";

export async function deleteLearningLog(
  userId: string,
  learningLogId: string,
): Promise<boolean> {
  const result = await prisma.learningLog.deleteMany({
    where: { id: learningLogId, userId },
  });

  return result.count === 1;
}
