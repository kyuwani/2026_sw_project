import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getAnalyticsData } from "./queries";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("analytics queries database integration", () => {
  const suffix = randomUUID();
  const technologyName = `Analytics-${suffix}`;
  let ownerId = "";
  let otherUserId = "";
  let technologyId = "";

  beforeAll(async () => {
    const [owner, otherUser, technology] = await Promise.all([
      prisma.user.create({
        data: {
          email: `analytics-owner-${suffix}@example.invalid`,
          timezone: "Asia/Seoul",
        },
        select: { id: true },
      }),
      prisma.user.create({
        data: {
          email: `analytics-other-${suffix}@example.invalid`,
          timezone: "Asia/Seoul",
        },
        select: { id: true },
      }),
      prisma.technology.create({
        data: { name: technologyName },
        select: { id: true },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;
    technologyId = technology.id;

    await Promise.all([
      prisma.project.create({
        data: {
          title: "Analytics 프로젝트",
          status: "IN_PROGRESS",
          userId: ownerId,
          tasks: {
            create: [
              { title: "완료 Task", status: "DONE" },
              { title: "진행 Task", status: "IN_PROGRESS" },
            ],
          },
        },
        select: { id: true },
      }),
      prisma.project.create({
        data: {
          title: "다른 사용자 프로젝트",
          status: "COMPLETED",
          userId: otherUserId,
          tasks: { create: { title: "다른 사용자 Task", status: "DONE" } },
        },
        select: { id: true },
      }),
    ]);

    await Promise.all([
      prisma.learningLog.create({
        data: {
          title: "10월 학습",
          content: "주간에만 포함되는 기록",
          studyMinutes: 30,
          studiedAt: new Date("2026-10-31T00:00:00.000Z"),
          userId: ownerId,
          technologies: { create: { technologyId } },
        },
      }),
      prisma.learningLog.create({
        data: {
          title: "11월 학습",
          content: "주간과 월간에 포함되는 기록",
          studyMinutes: 60,
          studiedAt: new Date("2026-11-01T00:00:00.000Z"),
          userId: ownerId,
          technologies: { create: { technologyId } },
        },
      }),
      prisma.learningLog.create({
        data: {
          title: "다른 사용자 학습",
          content: "집계에서 제외되어야 한다.",
          studyMinutes: 999,
          studiedAt: new Date("2026-11-01T00:00:00.000Z"),
          userId: otherUserId,
        },
      }),
    ]);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
    });
    if (technologyId) {
      await prisma.technology.delete({ where: { id: technologyId } });
    }
  });

  it("aggregates only the signed-in user's records", async () => {
    const analytics = await getAnalyticsData(
      ownerId,
      new Date("2026-10-31T16:00:00.000Z"),
    );

    expect(analytics?.weeklyStudy.totalMinutes).toBe(90);
    expect(analytics?.monthlyStudy.totalMinutes).toBe(60);
    expect(analytics?.taskCompletion).toEqual({
      totalCount: 2,
      completedCount: 1,
      completionRate: 50,
    });
    expect(analytics?.projectProgress).toEqual([
      expect.objectContaining({
        title: "Analytics 프로젝트",
        taskCount: 2,
        completedTaskCount: 1,
        progress: 50,
      }),
    ]);
    expect(analytics?.technologyStudy).toEqual([
      expect.objectContaining({
        name: technologyName,
        minutes: 60,
        percentage: 100,
      }),
    ]);
  });
});
