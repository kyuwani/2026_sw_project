import "server-only";

import type { CreateProjectInput } from "@/features/projects/schemas";
import { resolveTechnologies } from "@/features/technologies/services/resolve-technologies";
import { prisma } from "@/lib/db/prisma";

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<{ id: string }> {
  return prisma.$transaction(async (transaction) => {
    const technologies = await resolveTechnologies(
      transaction,
      input.technologyNames,
    );

    return transaction.project.create({
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        repositoryUrl: input.repositoryUrl,
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
