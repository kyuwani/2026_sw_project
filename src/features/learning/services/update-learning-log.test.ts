import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { LearningLogInput } from "../schemas";
import { updateLearningLog } from "./update-learning-log";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: LearningLogInput = {
  title: "수정된 학습 기록",
  content: "수정된 학습 내용",
  studiedAt: new Date("2026-10-08T00:00:00.000Z"),
  studyMinutes: 120,
  category: "FRAMEWORK",
  technologyNames: ["Next.js", "TypeScript"],
};

describe("updateLearningLog", () => {
  const learningLogFindFirst = vi.fn();
  const learningLogUpdate = vi.fn();
  const technologyCreateMany = vi.fn();
  const technologyFindMany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        learningLog: {
          findFirst: learningLogFindFirst,
          update: learningLogUpdate,
        },
        technology: {
          createMany: technologyCreateMany,
          findMany: technologyFindMany,
        },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("checks ownership and replaces technology links in one transaction", async () => {
    learningLogFindFirst.mockResolvedValue({ id: "learning-log-id" });
    technologyCreateMany.mockResolvedValue({ count: 2 });
    technologyFindMany.mockResolvedValue([
      { id: "next-id" },
      { id: "typescript-id" },
    ]);
    learningLogUpdate.mockResolvedValue({ id: "learning-log-id" });

    await expect(
      updateLearningLog("user-id", "learning-log-id", input),
    ).resolves.toBe(true);

    expect(learningLogFindFirst).toHaveBeenCalledWith({
      where: { id: "learning-log-id", userId: "user-id" },
      select: { id: true },
    });
    expect(learningLogUpdate).toHaveBeenCalledWith({
      where: { id: "learning-log-id" },
      data: expect.objectContaining({
        title: "수정된 학습 기록",
        studyMinutes: 120,
        technologies: {
          deleteMany: {},
          create: [
            { technologyId: "next-id" },
            { technologyId: "typescript-id" },
          ],
        },
      }),
    });
  });

  it("does not write when the record is not owned by the user", async () => {
    learningLogFindFirst.mockResolvedValue(null);

    await expect(
      updateLearningLog("other-user", "learning-log-id", input),
    ).resolves.toBe(false);

    expect(technologyCreateMany).not.toHaveBeenCalled();
    expect(learningLogUpdate).not.toHaveBeenCalled();
  });
});
