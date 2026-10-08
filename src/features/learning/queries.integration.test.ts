import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getLearningLogDetail, listLearningLogs } from "./queries";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("learning queries database integration", () => {
  const suffix = randomUUID();
  let ownerId = "";
  let otherUserId = "";
  let newestOwnerLogId = "";
  let otherUserLogId = "";

  beforeAll(async () => {
    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: { email: `learning-owner-${suffix}@example.invalid` },
        select: { id: true },
      }),
      prisma.user.create({
        data: { email: `learning-other-${suffix}@example.invalid` },
        select: { id: true },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;

    const [olderOwnerLog, newestOwnerLog, otherUserLog] =
      await prisma.$transaction([
        prisma.learningLog.create({
          data: {
            title: "이전 학습 기록",
            content: "정렬 검증용 이전 기록",
            studyMinutes: 30,
            studiedAt: new Date("2026-10-07T00:00:00.000Z"),
            category: "OTHER",
            userId: ownerId,
          },
          select: { id: true },
        }),
        prisma.learningLog.create({
          data: {
            title: "최신 학습 기록",
            content: "정렬 검증용 최신 기록",
            studyMinutes: 60,
            studiedAt: new Date("2026-10-08T00:00:00.000Z"),
            category: "FRAMEWORK",
            userId: ownerId,
          },
          select: { id: true },
        }),
        prisma.learningLog.create({
          data: {
            title: "다른 사용자 기록",
            content: "소유권 검증용 기록",
            studyMinutes: 45,
            studiedAt: new Date("2026-10-09T00:00:00.000Z"),
            category: "LANGUAGE",
            userId: otherUserId,
          },
          select: { id: true },
        }),
      ]);

    newestOwnerLogId = newestOwnerLog.id;
    otherUserLogId = otherUserLog.id;
    expect(olderOwnerLog.id).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
    });
  });

  it("returns only owned records in latest study order", async () => {
    const result = await listLearningLogs(ownerId, 1);

    expect(result.totalItems).toBe(2);
    expect(result.items.map(({ title }) => title)).toEqual([
      "최신 학습 기록",
      "이전 학습 기록",
    ]);
    expect(result.items.some(({ id }) => id === otherUserLogId)).toBe(false);
  });

  it("allows owned detail and hides another user's record", async () => {
    await expect(
      getLearningLogDetail(ownerId, newestOwnerLogId),
    ).resolves.toEqual(expect.objectContaining({ title: "최신 학습 기록" }));
    await expect(
      getLearningLogDetail(ownerId, otherUserLogId),
    ).resolves.toBeNull();
  });
});
