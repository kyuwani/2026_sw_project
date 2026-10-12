import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getAnalyticsData } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    learningLog: { findMany: vi.fn() },
    project: { findMany: vi.fn() },
  },
}));

const userRecord = {
  id: "user-id",
  name: "사용자",
  email: "analytics@example.invalid",
  emailVerified: null,
  image: null,
  passwordHash: null,
  timezone: "Asia/Seoul",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

describe("getAnalyticsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns weekly, monthly, Task, project, and technology aggregates", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRecord);
    const learningLogs = [
      {
        id: "october-log",
        title: "10월 학습",
        content: "월 경계 검증",
        studyMinutes: 30,
        studiedAt: new Date("2026-10-31T00:00:00.000Z"),
        category: "OTHER" as const,
        userId: "user-id",
        createdAt: new Date("2026-10-31T00:00:00.000Z"),
        updatedAt: new Date("2026-10-31T00:00:00.000Z"),
        technologies: [],
      },
      {
        id: "november-log",
        title: "11월 학습",
        content: "월 집계 검증",
        studyMinutes: 60,
        studiedAt: new Date("2026-11-01T00:00:00.000Z"),
        category: "FRAMEWORK" as const,
        userId: "user-id",
        createdAt: new Date("2026-11-01T00:00:00.000Z"),
        updatedAt: new Date("2026-11-01T00:00:00.000Z"),
        technologies: [
          { technology: { id: "react", name: "React" } },
          { technology: { id: "typescript", name: "TypeScript" } },
        ],
      },
    ];
    const projects = [
      {
        id: "active-project",
        title: "진행 프로젝트",
        description: null,
        status: "IN_PROGRESS" as const,
        startDate: null,
        endDate: null,
        repositoryUrl: null,
        userId: "user-id",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-11-01T00:00:00.000Z"),
        tasks: [{ status: "DONE" }, { status: "TODO" }],
      },
      {
        id: "completed-project",
        title: "완료 프로젝트",
        description: null,
        status: "COMPLETED" as const,
        startDate: null,
        endDate: null,
        repositoryUrl: null,
        userId: "user-id",
        createdAt: new Date("2026-09-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-30T00:00:00.000Z"),
        tasks: [{ status: "DONE" }],
      },
    ];
    vi.mocked(prisma.learningLog.findMany).mockResolvedValue(learningLogs);
    vi.mocked(prisma.project.findMany).mockResolvedValue(projects);

    const result = await getAnalyticsData(
      "user-id",
      new Date("2026-10-31T16:00:00.000Z"),
    );

    expect(result?.weeklyStudy.totalMinutes).toBe(90);
    expect(result?.monthlyStudy.totalMinutes).toBe(60);
    expect(result?.selectedPeriod).toBe("MONTH");
    expect(result?.selectedStudy.totalMinutes).toBe(60);
    expect(result?.learningStreak).toBe(2);
    expect(result?.taskCompletion).toEqual({
      totalCount: 3,
      completedCount: 2,
      completionRate: 67,
    });
    expect(result?.projectProgress.map(({ progress }) => progress)).toEqual([
      50, 100,
    ]);
    expect(result?.technologyStudy).toEqual([
      { id: "react", name: "React", minutes: 30, percentage: 50 },
      { id: "typescript", name: "TypeScript", minutes: 30, percentage: 50 },
    ]);
    expect(prisma.learningLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-id",
          studiedAt: {
            gte: new Date("2026-10-26T00:00:00.000Z"),
            lte: new Date("2026-11-30T00:00:00.000Z"),
          },
        },
      }),
    );
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-id" } }),
    );
  });

  it("uses a validated custom period for selected aggregates", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRecord);
    const customLearningLogs = [
      {
        id: "custom-log",
        title: "사용자 지정 학습",
        content: "사용자 지정 기간",
        studyMinutes: 40,
        studiedAt: new Date("2026-09-15T00:00:00.000Z"),
        category: "OTHER" as const,
        userId: "user-id",
        createdAt: new Date("2026-09-15T00:00:00.000Z"),
        updatedAt: new Date("2026-09-15T00:00:00.000Z"),
        technologies: [],
      },
    ];
    vi.mocked(prisma.learningLog.findMany)
      .mockResolvedValueOnce(customLearningLogs)
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const result = await getAnalyticsData(
      "user-id",
      new Date("2026-10-12T03:00:00.000Z"),
      {
        period: "CUSTOM",
        startDate: new Date("2026-09-01T00:00:00.000Z"),
        endDate: new Date("2026-09-30T00:00:00.000Z"),
      },
    );

    expect(result?.selectedPeriod).toBe("CUSTOM");
    expect(result?.selectedStudy.totalMinutes).toBe(40);
    expect(prisma.learningLog.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          studiedAt: {
            gte: new Date("2026-09-01T00:00:00.000Z"),
            lte: new Date("2026-10-31T00:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("returns null without aggregate queries for an invalid time zone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...userRecord,
      timezone: "invalid/time-zone",
    });

    await expect(getAnalyticsData("user-id")).resolves.toBeNull();
    expect(prisma.learningLog.findMany).not.toHaveBeenCalled();
    expect(prisma.project.findMany).not.toHaveBeenCalled();
  });
});
