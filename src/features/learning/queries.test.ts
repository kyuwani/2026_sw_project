import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getUserTimeZone } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe("learning queries", () => {
  const userRecord = {
    id: "user-id",
    name: null,
    email: "user@example.invalid",
    emailVerified: null,
    image: null,
    passwordHash: null,
    timezone: "Asia/Seoul",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads only the requested user's time zone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRecord);

    await expect(getUserTimeZone("user-id")).resolves.toBe("Asia/Seoul");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-id" },
      select: { timezone: true },
    });
  });

  it("rejects a missing or invalid stored time zone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...userRecord,
      timezone: "invalid/time-zone",
    });

    await expect(getUserTimeZone("user-id")).resolves.toBeNull();
  });
});
