import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  getLearningLogDetail,
  getUserTimeZone,
  LEARNING_LOG_PAGE_SIZE,
  listLearningLogs,
} from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    learningLog: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
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
  const learningLogRecord = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "Next.js 학습",
    content: "App Router 목록과 상세 화면을 학습했다.",
    studyMinutes: 90,
    studiedAt: new Date("2026-10-08T00:00:00.000Z"),
    category: "FRAMEWORK" as const,
    userId: "user-id",
    createdAt: new Date("2026-10-08T12:00:00.000Z"),
    updatedAt: new Date("2026-10-08T12:00:00.000Z"),
    technologies: [
      { technology: { name: "Next.js" } },
      { technology: { name: "TypeScript" } },
    ],
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

  it("lists only the user's learning logs in latest study order", async () => {
    vi.mocked(prisma.learningLog.count).mockResolvedValue(7);
    vi.mocked(prisma.learningLog.findMany).mockResolvedValue([
      learningLogRecord,
    ]);

    const result = await listLearningLogs("user-id", {
      query: "Next",
      fromDate: "2026-10-01",
      toDate: "2026-10-31",
      category: "FRAMEWORK",
      technology: "Next.js",
      page: 2,
    });

    expect(prisma.learningLog.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user-id",
        category: "FRAMEWORK",
        studiedAt: {
          gte: new Date("2026-10-01T00:00:00.000Z"),
          lte: new Date("2026-10-31T00:00:00.000Z"),
        },
        technologies: {
          some: { technology: { name: "Next.js" } },
        },
        OR: [
          { title: { contains: "Next", mode: "insensitive" } },
          { content: { contains: "Next", mode: "insensitive" } },
        ],
      }),
    });
    expect(prisma.learningLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-id" }),
        orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
        skip: LEARNING_LOG_PAGE_SIZE,
        take: LEARNING_LOG_PAGE_SIZE,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        page: 2,
        totalItems: 7,
        totalPages: 2,
        items: [
          expect.objectContaining({
            id: learningLogRecord.id,
            technologyNames: ["Next.js", "TypeScript"],
          }),
        ],
      }),
    );
  });

  it("scopes learning log detail to both the record and user IDs", async () => {
    vi.mocked(prisma.learningLog.findFirst).mockResolvedValue(
      learningLogRecord,
    );

    await expect(
      getLearningLogDetail("user-id", learningLogRecord.id),
    ).resolves.toEqual(
      expect.objectContaining({
        id: learningLogRecord.id,
        technologyNames: ["Next.js", "TypeScript"],
      }),
    );
    expect(prisma.learningLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: learningLogRecord.id, userId: "user-id" },
      }),
    );
  });

  it("returns null when an owned learning log cannot be found", async () => {
    vi.mocked(prisma.learningLog.findFirst).mockResolvedValue(null);

    await expect(
      getLearningLogDetail("user-id", learningLogRecord.id),
    ).resolves.toBeNull();
  });
});
