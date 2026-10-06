import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { createProject } from "./create-project";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("createProject database integration", () => {
  const suffix = randomUUID();
  const email = `project-test-${suffix}@example.invalid`;
  const technologyNames = ["Next.js", "TypeScript"] as const;
  let userId = "";
  let createdTechnologyNames: string[] = [];

  beforeAll(async () => {
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
      data: { email },
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
        name: { in: createdTechnologyNames },
        projects: { none: {} },
        learningLogs: { none: {} },
      },
    });
  });

  it("creates an owned project and its technology links", async () => {
    const created = await createProject(userId, {
      title: "통합 테스트 프로젝트",
      description: undefined,
      status: "PLANNING",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-10-31T00:00:00.000Z"),
      repositoryUrl: undefined,
      technologyNames: [...technologyNames],
    });

    const project = await prisma.project.findUnique({
      where: { id: created.id },
      select: {
        userId: true,
        technologies: {
          orderBy: { technology: { name: "asc" } },
          select: { technology: { select: { name: true } } },
        },
      },
    });

    expect(project?.userId).toBe(userId);
    expect(
      project?.technologies.map(({ technology }) => technology.name),
    ).toEqual(["Next.js", "TypeScript"]);
  });
});
