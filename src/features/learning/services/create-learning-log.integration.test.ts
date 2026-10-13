import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createLearningLog } from "./create-learning-log";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("createLearningLog database integration", () => {
  const suffix = randomUUID();
  const email = `learning-log-test-${suffix}@example.invalid`;
  const technologyNames = ["Next.js", "TypeScript"] as const;
  const rollbackTechnologyName = "Node.js" as const;
  let userId = "";
  let createdTechnologyNames: string[] = [];

  beforeAll(async () => {
    await prisma.technology.deleteMany({
      where: {
        name: rollbackTechnologyName,
        projects: { none: {} },
        learningLogs: { none: {} },
      },
    });

    const existingTechnologies = await prisma.technology.findMany({
      where: { name: { in: [...technologyNames] } },
      select: { name: true },
    });
    const existingNames = new Set(
      existingTechnologies.map((technology) => technology.name),
    );
    createdTechnologyNames = technologyNames.filter(
      (name) => !existingNames.has(name),
    );

    const user = await prisma.user.create({
      data: { email, timezone: "Asia/Seoul" },
      select: { id: true },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }

    await prisma.technology.deleteMany({
      where: {
        name: { in: [...createdTechnologyNames, rollbackTechnologyName] },
        projects: { none: {} },
        learningLogs: { none: {} },
      },
    });
  });

  it("creates an owned learning log and its technology links", async () => {
    const created = await createLearningLog(userId, {
      title: "통합 테스트 학습 기록",
      content: "학습 기록 생성 서비스와 관계 저장을 검증한다.",
      studiedAt: new Date("2026-10-08T00:00:00.000Z"),
      studyMinutes: 90,
      category: "FRAMEWORK",
      technologyNames: [...technologyNames],
    });

    const learningLog = await prisma.learningLog.findUnique({
      where: { id: created.id },
      select: {
        userId: true,
        category: true,
        studyMinutes: true,
        technologies: {
          orderBy: { technology: { name: "asc" } },
          select: { technology: { select: { name: true } } },
        },
      },
    });

    expect(learningLog).toEqual(
      expect.objectContaining({
        userId,
        category: "FRAMEWORK",
        studyMinutes: 90,
      }),
    );
    expect(
      learningLog?.technologies.map(({ technology }) => technology.name),
    ).toEqual(["Next.js", "TypeScript"]);
  });

  it("rolls back technology creation when the learning log write fails", async () => {
    const missingUserId = randomUUID();
    const title = `rollback-learning-${suffix}`;

    await expect(
      createLearningLog(missingUserId, {
        title,
        content: "transaction rollback 검증",
        studiedAt: new Date("2026-10-08T00:00:00.000Z"),
        studyMinutes: 30,
        category: "OTHER",
        technologyNames: [rollbackTechnologyName],
      }),
    ).rejects.toBeDefined();

    const [learningLogCount, technology] = await Promise.all([
      prisma.learningLog.count({ where: { title } }),
      prisma.technology.findUnique({
        where: { name: rollbackTechnologyName },
      }),
    ]);

    expect(learningLogCount).toBe(0);
    expect(technology).toBeNull();
  });
});
