import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export async function resolveTechnologies(
  transaction: Prisma.TransactionClient,
  technologyNames: string[],
): Promise<Array<{ id: string }>> {
  if (technologyNames.length === 0) {
    return [];
  }

  await transaction.technology.createMany({
    data: technologyNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  return transaction.technology.findMany({
    where: { name: { in: technologyNames } },
    select: { id: true },
  });
}
