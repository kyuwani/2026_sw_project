import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import type { LearningLogInput } from "../schemas";
import { deleteLearningLog } from "./delete-learning-log";
import { updateLearningLog } from "./update-learning-log";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("learning log mutations database integration", () => {
  const suffix = randomUUID();
  let ownerId = "";
  let otherUserId = "";
  let learningLogId = "";
  let createdTechnologyNames: string[] = [];

  beforeAll(async () => {
    const technologyNames = ["React", "TypeScript"];
    const existingTechnologies = await prisma.technology.findMany({
      where: { name: { in: technologyNames } },
      select: { name: true },
    });
    const existingNames = new Set(
      existingTechnologies.map(({ name }) => name),
    );
    createdTechnologyNames = technologyNames.filter(
      (name) => !existingNames.has(name),
    );

    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: { email: `mutation-owner-${suffix}@example.invalid` },
        select: { id: true },
      }),
      prisma.user.create({
        data: { email: `mutation-other-${suffix}@example.invalid` },
        select: { id: true },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;

    const learningLog = await prisma.learningLog.create({
      data: {
        title: "수정 전 기록",
        content: "수정 전 내용",
        studyMinutes: 30,
        studiedAt: new Date("2026-10-01T00:00:00.000Z"),
        category: "OTHER",
        userId: ownerId,
      },
      select: { id: true },
    });
    learningLogId = learningLog.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
    });
    await prisma.technology.deleteMany({
      where: {
        name: { in: createdTechnologyNames },
        projects: { none: {} },
        learningLogs: { none: {} },
      },
    });
  });

  it("prevents another user from updating or deleting the record", async () => {
    const input: LearningLogInput = {
      title: "변조된 기록",
      content: "변조된 내용",
      studiedAt: new Date("2026-10-02T00:00:00.000Z"),
      studyMinutes: 60,
      category: "FRAMEWORK",
      technologyNames: ["React"],
    };

    await expect(
      updateLearningLog(otherUserId, learningLogId, input),
    ).resolves.toBe(false);
    await expect(
      deleteLearningLog(otherUserId, learningLogId),
    ).resolves.toBe(false);

    const unchanged = await prisma.learningLog.findUnique({
      where: { id: learningLogId },
      select: { title: true },
    });
    expect(unchanged?.title).toBe("수정 전 기록");
  });

  it("updates owned fields and technology links, then deletes the record", async () => {
    await expect(
      updateLearningLog(ownerId, learningLogId, {
        title: "수정된 기록",
        content: "수정된 내용",
        studiedAt: new Date("2026-10-08T00:00:00.000Z"),
        studyMinutes: 90,
        category: "FRAMEWORK",
        technologyNames: ["React", "TypeScript"],
      }),
    ).resolves.toBe(true);

    const updated = await prisma.learningLog.findUnique({
      where: { id: learningLogId },
      select: {
        title: true,
        studyMinutes: true,
        technologies: {
          orderBy: { technology: { name: "asc" } },
          select: { technology: { select: { name: true } } },
        },
      },
    });
    expect(updated?.title).toBe("수정된 기록");
    expect(updated?.studyMinutes).toBe(90);
    expect(
      updated?.technologies.map(({ technology }) => technology.name),
    ).toEqual(["React", "TypeScript"]);

    await expect(
      deleteLearningLog(ownerId, learningLogId),
    ).resolves.toBe(true);
    await expect(
      prisma.learningLog.findUnique({ where: { id: learningLogId } }),
    ).resolves.toBeNull();
  });
});
