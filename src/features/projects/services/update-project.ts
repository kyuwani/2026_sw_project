import "server-only";

import type { CreateProjectInput } from "@/features/projects/schemas";
import { prisma } from "@/lib/db/prisma";
import { resolveTechnologies } from "./resolve-technologies";

export async function updateProject(
  userId: string,
  projectId: string,
  input: CreateProjectInput,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const ownedProject = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
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
        technologies: {
          deleteMany: {},
          create: technologies.map(({ id }) => ({ technologyId: id })),
        },
      },
    });

    return true;
  });
}
