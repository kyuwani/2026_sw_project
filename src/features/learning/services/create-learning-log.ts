import "server-only";

import type { LearningLogInput } from "@/features/learning/schemas";
import { resolveTechnologies } from "@/features/technologies/services/resolve-technologies";
import { prisma } from "@/lib/db/prisma";

export async function createLearningLog(
  userId: string,
  input: LearningLogInput,
): Promise<{ id: string }> {
  return prisma.$transaction(async (transaction) => {
    const technologies = await resolveTechnologies(
      transaction,
      input.technologyNames,
    );

    return transaction.learningLog.create({
      data: {
        title: input.title,
        content: input.content,
        studiedAt: input.studiedAt,
        studyMinutes: input.studyMinutes,
        category: input.category,
        userId,
        technologies:
          technologies.length > 0
            ? {
                create: technologies.map(({ id }) => ({
                  technologyId: id,
                })),
              }
            : undefined,
      },
      select: { id: true },
    });
  });
}
