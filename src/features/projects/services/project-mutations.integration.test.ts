import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { deleteProject } from "./delete-project";
import { updateProject } from "./update-project";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("project mutation database integration", () => {
  const suffix = randomUUID();
  const email = `project-mutation-${suffix}@example.invalid`;
  const technologyName = `CascadeTest-${suffix}`;
  let userId = "";
  let projectId = "";
  let taskId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email,
        projects: {
          create: {
            title: "삭제 정책 테스트",
            tasks: { create: { title: "하위 Task" } },
            technologies: {
              create: {
                technology: { create: { name: technologyName } },
              },
            },
          },
        },
      },
      select: {
        id: true,
        projects: {
          select: { id: true, tasks: { select: { id: true } } },
        },
      },
    });

    userId = user.id;
    projectId = user.projects[0].id;
    taskId = user.projects[0].tasks[0].id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.technology.deleteMany({ where: { name: technologyName } });
  });

  it("updates owned fields and replaces technology links", async () => {
    await expect(
      updateProject(userId, projectId, {
        title: "수정된 삭제 정책 테스트",
        description: undefined,
        status: "IN_PROGRESS",
        startDate: undefined,
        endDate: undefined,
        repositoryUrl: undefined,
        technologyNames: ["TypeScript"],
      }),
    ).resolves.toBe(true);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        title: true,
        technologies: {
          select: { technology: { select: { name: true } } },
        },
      },
    });

    expect(project).toEqual({
      title: "수정된 삭제 정책 테스트",
      technologies: [{ technology: { name: "TypeScript" } }],
    });
  });

  it("cascades project deletion to tasks and technology links", async () => {
    await expect(deleteProject(userId, projectId)).resolves.toBe(true);

    const [project, task, technologyLink] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.projectTechnology.findFirst({ where: { projectId } }),
    ]);

    expect(project).toBeNull();
    expect(task).toBeNull();
    expect(technologyLink).toBeNull();
  });
});
