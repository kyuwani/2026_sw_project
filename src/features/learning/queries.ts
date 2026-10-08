import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isValidTimeZone } from "@/lib/date/time-zone";

export async function getUserTimeZone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user || !isValidTimeZone(user.timezone)) {
    return null;
  }

  return user.timezone;
}
