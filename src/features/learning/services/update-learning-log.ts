import "server-only";

import type { LearningLogInput } from "@/features/learning/schemas";
import { resolveTechnologies } from "@/features/technologies/services/resolve-technologies";
import { prisma } from "@/lib/db/prisma";

export async function updateLearningLog(
  userId: string,
  learningLogId: string,
  input: LearningLogInput,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const ownedLearningLog = await transaction.learningLog.findFirst({
      where: { id: learningLogId, userId },
      select: { id: true },
    });

    if (!ownedLearningLog) {
      return false;
    }

    const technologies = await resolveTechnologies(
      transaction,
      input.technologyNames,
    );

    await transaction.learningLog.update({
      where: { id: ownedLearningLog.id },
      data: {
        title: input.title,
        content: input.content,
        studiedAt: input.studiedAt,
        studyMinutes: input.studyMinutes,
        category: input.category,
        technologies: {
          deleteMany: {},
          create: technologies.map(({ id }) => ({ technologyId: id })),
        },
      },
    });

    return true;
  });
}
