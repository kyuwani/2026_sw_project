import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { updateProfile } from "./update-profile";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

describe("updateProfile", () => {
  const userFindUnique = vi.fn();
  const userUpdate = vi.fn();
  const technologyCreateMany = vi.fn();
  const technologyFindMany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        user: { findUnique: userFindUnique, update: userUpdate },
        technology: {
          createMany: technologyCreateMany,
          findMany: technologyFindMany,
        },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("updates only the owned user and preserves technology order", async () => {
    userFindUnique.mockResolvedValue({ id: "user-id" });
    technologyCreateMany.mockResolvedValue({ count: 0 });
    technologyFindMany.mockResolvedValue([
      { id: "next-id", name: "Next.js" },
      { id: "typescript-id", name: "TypeScript" },
    ]);
    userUpdate.mockResolvedValue({ id: "user-id" });

    await expect(
      updateProfile("user-id", {
        name: "개발자",
        bio: "소개",
        githubUrl: "https://github.com/octocat",
        timezone: "Asia/Seoul",
        primaryTechnologies: ["TypeScript", "Next.js"],
      }),
    ).resolves.toBe(true);

    expect(userFindUnique).toHaveBeenCalledWith({
      where: { id: "user-id" },
      select: { id: true },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: expect.objectContaining({
        timezone: "Asia/Seoul",
        primaryTechnologies: {
          deleteMany: {},
          create: [
            { technologyId: "typescript-id", position: 0 },
            { technologyId: "next-id", position: 1 },
          ],
        },
      }),
      select: { id: true },
    });
  });

  it("does not write when the session user no longer exists", async () => {
    userFindUnique.mockResolvedValue(null);

    await expect(
      updateProfile("missing-user", {
        name: "개발자",
        timezone: "Asia/Seoul",
        primaryTechnologies: [],
      }),
    ).resolves.toBe(false);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
