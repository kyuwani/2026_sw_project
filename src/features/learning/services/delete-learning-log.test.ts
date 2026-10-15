import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { deleteLearningLog } from "./delete-learning-log";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { learningLog: { deleteMany: vi.fn() } },
}));

describe("deleteLearningLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only a learning log owned by the user", async () => {
    vi.mocked(prisma.learningLog.deleteMany).mockResolvedValue({ count: 1 });

    await expect(
      deleteLearningLog("user-id", "learning-log-id"),
    ).resolves.toBe(true);
    expect(prisma.learningLog.deleteMany).toHaveBeenCalledWith({
      where: { id: "learning-log-id", userId: "user-id" },
    });
  });

  it("reports failure when no owned record was deleted", async () => {
    vi.mocked(prisma.learningLog.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      deleteLearningLog("other-user", "learning-log-id"),
    ).resolves.toBe(false);
  });
});
