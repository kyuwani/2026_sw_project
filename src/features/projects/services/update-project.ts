import "server-only";

import type { CreateProjectInput } from "@/features/projects/schemas";
import { resolveTechnologies } from "@/features/technologies/services/resolve-technologies";
import { prisma } from "@/lib/db/prisma";

export async function updateProject(
  userId: string,
  projectId: string,
  input: CreateProjectInput,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const ownedProject = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: {
        id: true,
        repositoryId: true,
        repository: { select: { htmlUrl: true } },
      },
    });

    if (!ownedProject) {
      return false;
    }

    const technologies = await resolveTechnologies(
      transaction,
      input.technologyNames,
    );

    await transaction.project.update({
      where: { id: ownedProject.id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        repositoryUrl: input.repositoryUrl,
        repositoryId:
          ownedProject.repository?.htmlUrl === input.repositoryUrl
            ? ownedProject.repositoryId
            : null,
        technologies: {
          deleteMany: {},
          create: technologies.map(({ id }) => ({ technologyId: id })),
        },
      },
    });

    return true;
  });
}
