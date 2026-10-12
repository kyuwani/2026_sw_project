import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getDashboardData } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    project: { count: vi.fn(), findMany: vi.fn() },
    task: { count: vi.fn(), findMany: vi.fn() },
    learningLog: { findMany: vi.fn() },
  },
}));

const userRecord = {
  id: "user-id",
  name: "사용자",
  email: "user@example.invalid",
  emailVerified: null,
  image: null,
  passwordHash: null,
  timezone: "Asia/Seoul",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
};

const learningLogBase = {
  id: "learning-log-id",
  title: "Dashboard 집계 학습",
  content: "Dashboard 쿼리를 학습했다.",
  studyMinutes: 60,
  studiedAt: new Date("2026-10-12T00:00:00.000Z"),
  category: "FRAMEWORK" as const,
  userId: "user-id",
  createdAt: new Date("2026-10-12T01:00:00.000Z"),
  updatedAt: new Date("2026-10-12T01:00:00.000Z"),
};

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user-scoped dashboard aggregates and DTOs", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(userRecord);
    vi.mocked(prisma.project.count)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    vi.mocked(prisma.task.count).mockResolvedValue(5);
    vi.mocked(prisma.learningLog.findMany)
      .mockResolvedValueOnce([
        learningLogBase,
        {
          ...learningLogBase,
          id: "second-learning-log",
          studyMinutes: 30,
        },
      ])
      .mockResolvedValueOnce([
        learningLogBase,
        {
          ...learningLogBase,
          id: "yesterday-log",
          studiedAt: new Date("2026-10-11T00:00:00.000Z"),
        },
      ])
      .mockResolvedValueOnce([learningLogBase]);

    const projectRecord = {
        id: "project-id",
        title: "DevLog",
        description: "개발 기록 서비스",
        status: "IN_PROGRESS" as const,
        startDate: null,
        endDate: new Date("2026-10-31T00:00:00.000Z"),
        repositoryUrl: null,
        userId: "user-id",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-12T00:00:00.000Z"),
        technologies: [{ technology: { name: "Next.js" } }],
        tasks: [
          { status: "DONE" as const, dueDate: null },
          {
            status: "TODO" as const,
            dueDate: new Date("2026-10-15T00:00:00.000Z"),
          },
        ],
      };
    const taskRecord = {
        id: "task-id",
        title: "Dashboard 구현",
        description: null,
        status: "TODO" as const,
        priority: "HIGH" as const,
        dueDate: new Date("2026-10-13T00:00:00.000Z"),
        completedAt: null,
        projectId: "project-id",
        createdAt: new Date("2026-10-01T00:00:00.000Z"),
        updatedAt: new Date("2026-10-12T00:00:00.000Z"),
        project: { title: "DevLog" },
      };
    vi.mocked(prisma.project.findMany).mockResolvedValue([projectRecord]);
    vi.mocked(prisma.task.findMany).mockResolvedValue([taskRecord]);

    const result = await getDashboardData(
      "user-id",
      new Date("2026-10-12T03:00:00.000Z"),
    );

    expect(result?.summary).toEqual({
      inProgressProjects: 2,
      completedProjects: 1,
      completedTasks: 5,
      weeklyStudyMinutes: 90,
      learningStreak: 2,
    });
    expect(result?.projects[0]).toEqual(
      expect.objectContaining({
        id: "project-id",
        progress: 50,
        nextDueDate: new Date("2026-10-15T00:00:00.000Z"),
        technologyNames: ["Next.js"],
      }),
    );
    expect(result?.upcomingTasks[0]).toEqual(
      expect.objectContaining({
        projectTitle: "DevLog",
        dueDate: new Date("2026-10-13T00:00:00.000Z"),
      }),
    );
    expect(result?.recentLearningLogs).toHaveLength(1);
    expect(result?.weeklyStudy).toHaveLength(7);

    expect(prisma.project.count).toHaveBeenNthCalledWith(1, {
      where: { userId: "user-id", status: "IN_PROGRESS" },
    });
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ project: { userId: "user-id" } }),
        take: 3,
      }),
    );
    expect(prisma.learningLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-id" },
        take: 3,
      }),
    );
  });

  it("returns null and skips aggregate queries for an invalid time zone", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...userRecord,
      timezone: "invalid/time-zone",
    });

    await expect(getDashboardData("user-id")).resolves.toBeNull();
    expect(prisma.project.count).not.toHaveBeenCalled();
    expect(prisma.task.count).not.toHaveBeenCalled();
    expect(prisma.learningLog.findMany).not.toHaveBeenCalled();
  });
});
