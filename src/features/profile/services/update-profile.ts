import "server-only";

import type { UpdateProfileInput } from "../schemas";
import { prisma } from "@/lib/db/prisma";

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<boolean> {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) return false;

    if (input.primaryTechnologies.length > 0) {
      await transaction.technology.createMany({
        data: input.primaryTechnologies.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    const technologies = await transaction.technology.findMany({
      where: { name: { in: input.primaryTechnologies } },
      select: { id: true, name: true },
    });
    const technologyByName = new Map(
      technologies.map((technology) => [technology.name, technology.id]),
    );
    const orderedTechnologyIds = input.primaryTechnologies.map((name) => {
      const id = technologyByName.get(name);
      if (!id) throw new Error("주 사용 기술을 확인할 수 없습니다.");
      return id;
    });

    await transaction.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        bio: input.bio ?? null,
        githubUrl: input.githubUrl ?? null,
        timezone: input.timezone,
        primaryTechnologies: {
          deleteMany: {},
          create: orderedTechnologyIds.map((technologyId, position) => ({
            technologyId,
            position,
          })),
        },
      },
      select: { id: true },
    });

    return true;
  });
}
