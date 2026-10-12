import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getDashboardData } from "./queries";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("dashboard queries database integration", () => {
  const suffix = randomUUID();
  let ownerId = "";
  let otherUserId = "";
  let activeProjectId = "";

  beforeAll(async () => {
    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `dashboard-owner-${suffix}@example.invalid`,
          timezone: "Asia/Seoul",
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: `dashboard-other-${suffix}@example.invalid`,
          timezone: "Asia/Seoul",
        },
        select: { id: true },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;

    const [activeProject, completedProject, otherProject] = await Promise.all([
      prisma.project.create({
        data: {
          title: "진행 프로젝트",
          status: "IN_PROGRESS",
          userId: ownerId,
        },
        select: { id: true },
      }),
      prisma.project.create({
        data: {
          title: "완료 프로젝트",
          status: "COMPLETED",
          userId: ownerId,
        },
        select: { id: true },
      }),
      prisma.project.create({
        data: {
          title: "다른 사용자 프로젝트",
          status: "IN_PROGRESS",
          userId: otherUserId,
        },
        select: { id: true },
      }),
    ]);
    activeProjectId = activeProject.id;

    await prisma.task.createMany({
      data: [
        {
          title: "완료 Task",
          status: "DONE",
          completedAt: new Date("2026-10-11T12:00:00.000Z"),
          projectId: activeProject.id,
        },
        {
          title: "내일 마감 Task",
          status: "TODO",
          priority: "HIGH",
          dueDate: new Date("2026-10-13T00:00:00.000Z"),
          projectId: activeProject.id,
        },
        {
          title: "완료 프로젝트 Task",
          status: "DONE",
          completedAt: new Date("2026-10-10T12:00:00.000Z"),
          projectId: completedProject.id,
        },
        {
          title: "다른 사용자 Task",
          status: "TODO",
          priority: "HIGH",
          dueDate: new Date("2026-10-12T00:00:00.000Z"),
          projectId: otherProject.id,
        },
      ],
    });

    await prisma.learningLog.createMany({
      data: [
        {
          title: "오늘 학습 1",
          content: "오늘 첫 번째 기록",
          studyMinutes: 60,
          studiedAt: new Date("2026-10-12T00:00:00.000Z"),
          category: "FRAMEWORK",
          userId: ownerId,
        },
        {
          title: "오늘 학습 2",
          content: "오늘 두 번째 기록",
          studyMinutes: 30,
          studiedAt: new Date("2026-10-12T00:00:00.000Z"),
          category: "DATABASE",
          userId: ownerId,
        },
        {
          title: "어제 학습",
          content: "연속 학습 검증",
          studyMinutes: 45,
          studiedAt: new Date("2026-10-11T00:00:00.000Z"),
          category: "OTHER",
          userId: ownerId,
        },
        {
          title: "그제 학습",
          content: "연속 학습 검증",
          studyMinutes: 20,
          studiedAt: new Date("2026-10-10T00:00:00.000Z"),
          category: "OTHER",
          userId: ownerId,
        },
        {
          title: "다른 사용자 학습",
          content: "집계에서 제외되어야 한다.",
          studyMinutes: 999,
          studiedAt: new Date("2026-10-12T00:00:00.000Z"),
          category: "OTHER",
          userId: otherUserId,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
    });
  });

  it("matches source data while excluding another user's records", async () => {
    const dashboard = await getDashboardData(
      ownerId,
      new Date("2026-10-12T03:00:00.000Z"),
    );

    expect(dashboard?.summary).toEqual({
      totalProjects: 2,
      inProgressProjects: 1,
      completedProjects: 1,
      completedTasks: 2,
      weeklyStudyMinutes: 90,
      learningStreak: 3,
    });
    expect(dashboard?.projects).toHaveLength(1);
    expect(dashboard?.projects[0]).toEqual(
      expect.objectContaining({
        id: activeProjectId,
        taskCount: 2,
        completedTaskCount: 1,
        progress: 50,
        nextDueDate: new Date("2026-10-13T00:00:00.000Z"),
      }),
    );
    expect(dashboard?.upcomingTasks.map(({ title }) => title)).toEqual([
      "내일 마감 Task",
    ]);
    expect(dashboard?.recentLearningLogs).toHaveLength(3);
    expect(dashboard?.recentActivity).toHaveLength(5);
    expect(
      dashboard?.recentActivity.some(
        (activity) => activity.title === "다른 사용자 프로젝트",
      ),
    ).toBe(false);
    expect(
      dashboard?.recentLearningLogs.some(
        ({ title }) => title === "다른 사용자 학습",
      ),
    ).toBe(false);
    expect(dashboard?.weeklyStudy.map(({ minutes }) => minutes)).toEqual([
      90, 0, 0, 0, 0, 0, 0,
    ]);
  });
});
