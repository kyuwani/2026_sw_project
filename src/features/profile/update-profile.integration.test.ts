import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { updateProfile } from "./services/update-profile";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("profile database integration", () => {
  const suffix = randomUUID();
  let userId = "";
  let otherUserId = "";

  beforeAll(async () => {
    const [user, otherUser] = await Promise.all([
      prisma.user.create({
        data: { email: `profile-${suffix}@example.invalid` },
        select: { id: true },
      }),
      prisma.user.create({
        data: { email: `profile-other-${suffix}@example.invalid` },
        select: { id: true },
      }),
    ]);
    userId = user.id;
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId].filter(Boolean) } },
    });
  });

  it("updates profile fields and ordered technologies for one user", async () => {
    await expect(
      updateProfile(userId, {
        name: "프로필 사용자",
        bio: "소개",
        githubUrl: "https://github.com/octocat",
        timezone: "America/New_York",
        primaryTechnologies: ["TypeScript", "React"],
      }),
    ).resolves.toBe(true);

    const [user, otherUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          timezone: true,
          primaryTechnologies: {
            orderBy: { position: "asc" },
            select: { technology: { select: { name: true } } },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: otherUserId },
        select: { name: true, timezone: true },
      }),
    ]);

    expect(user).toEqual({
      name: "프로필 사용자",
      timezone: "America/New_York",
      primaryTechnologies: [
        { technology: { name: "TypeScript" } },
        { technology: { name: "React" } },
      ],
    });
    expect(otherUser).toEqual({ name: null, timezone: "Asia/Seoul" });
  });
});
