import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { LearningLogInput } from "../schemas";
import { createLearningLog } from "./create-learning-log";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: LearningLogInput = {
  title: "Server Action 학습",
  content: "폼 검증과 오류 처리를 학습했다.",
  studiedAt: new Date("2026-10-08T00:00:00.000Z"),
  studyMinutes: 90,
  category: "FRAMEWORK",
  technologyNames: ["Next.js"],
};

describe("createLearningLog", () => {
  const technologyCreateMany = vi.fn();
  const technologyFindMany = vi.fn();
  const learningLogCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        technology: {
          createMany: technologyCreateMany,
          findMany: technologyFindMany,
        },
        learningLog: { create: learningLogCreate },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("stores the owner, category, duration, and technology links together", async () => {
    technologyCreateMany.mockResolvedValue({ count: 1 });
    technologyFindMany.mockResolvedValue([{ id: "technology-id" }]);
    learningLogCreate.mockResolvedValue({ id: "learning-log-id" });

    await expect(createLearningLog("user-id", input)).resolves.toEqual({
      id: "learning-log-id",
    });
    expect(learningLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-id",
        category: "FRAMEWORK",
        studyMinutes: 90,
        technologies: {
          create: [{ technologyId: "technology-id" }],
        },
      }),
      select: { id: true },
    });
  });
});
