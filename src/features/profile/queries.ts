import "server-only";

import { prisma } from "@/lib/db/prisma";
import { isValidTimeZone } from "@/lib/date/time-zone";

export interface AppShellUserDto {
  name: string | null;
  email: string | null;
  timeZone: string;
}

export interface ProfileDto {
  id: string;
  name: string;
  email: string | null;
  bio: string;
  githubUrl: string;
  timezone: string;
  imageUrl: string | null;
  primaryTechnologies: string[];
  githubConnected: boolean;
}

function getAllowedProfileImageUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "avatars.githubusercontent.com"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function getAppShellUser(
  userId: string,
): Promise<AppShellUserDto | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, timezone: true },
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    timeZone: isValidTimeZone(user.timezone) ? user.timezone : "UTC",
  };
}

export async function getProfile(userId: string): Promise<ProfileDto | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      githubUrl: true,
      timezone: true,
      image: true,
      accounts: {
        where: { provider: "github" },
        select: { id: true },
        take: 1,
      },
      primaryTechnologies: {
        orderBy: { position: "asc" },
        select: { technology: { select: { name: true } } },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email,
    bio: user.bio ?? "",
    githubUrl: user.githubUrl ?? "",
    timezone: user.timezone,
    imageUrl: getAllowedProfileImageUrl(user.image),
    primaryTechnologies: user.primaryTechnologies.map(
      ({ technology }) => technology.name,
    ),
    githubConnected: user.accounts.length > 0,
  };
}
