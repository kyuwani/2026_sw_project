import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { getProjectDetail } from "@/features/projects/queries";
import { prisma } from "@/lib/db/prisma";
import { createTask } from "./create-task";
import { deleteTask } from "./delete-task";
import { setTaskCompletion } from "./set-task-completion";
import { updateTask } from "./update-task";

vi.mock("server-only", () => ({}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("Task CRUD database integration", () => {
  const suffix = randomUUID();
  let ownerId = "";
  let otherUserId = "";
  let projectId = "";

  beforeAll(async () => {
    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `task-owner-${suffix}@example.invalid`,
          projects: { create: { title: "Task 통합 테스트" } },
        },
        select: { id: true, projects: { select: { id: true } } },
      }),
      prisma.user.create({
        data: { email: `task-other-${suffix}@example.invalid` },
        select: { id: true },
      }),
    ]);

    ownerId = owner.id;
    otherUserId = otherUser.id;
    projectId = owner.projects[0].id;
  });

  afterAll(async () => {
    if (ownerId || otherUserId) {
      await prisma.user.deleteMany({
        where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
      });
    }
  });

  it("enforces ownership and keeps status and completedAt consistent", async () => {
    const input = {
      title: "통합 테스트 Task",
      description: undefined,
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      dueDate: undefined,
    };

    await expect(
      createTask(otherUserId, projectId, input),
    ).resolves.toBeNull();

    const created = await createTask(ownerId, projectId, input);
    expect(created).not.toBeNull();
    const taskId = created?.id ?? "";

    await expect(
      setTaskCompletion(otherUserId, projectId, taskId, "DONE"),
    ).resolves.toBe(false);
    await expect(
      setTaskCompletion(ownerId, projectId, taskId, "DONE"),
    ).resolves.toBe(true);
    await expect(getProjectDetail(ownerId, projectId)).resolves.toEqual(
      expect.objectContaining({
        taskCount: 1,
        completedTaskCount: 1,
        progress: 100,
      }),
    );

    await expect(
      setTaskCompletion(ownerId, projectId, taskId, "TODO"),
    ).resolves.toBe(true);
    await expect(getProjectDetail(ownerId, projectId)).resolves.toEqual(
      expect.objectContaining({
        taskCount: 1,
        completedTaskCount: 0,
        progress: 0,
      }),
    );

    await expect(
      updateTask(otherUserId, projectId, taskId, {
        ...input,
        status: "DONE",
      }),
    ).resolves.toBe(false);

    await expect(
      updateTask(ownerId, projectId, taskId, {
        ...input,
        status: "DONE",
      }),
    ).resolves.toBe(true);
    const completed = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { completedAt: true },
    });
    expect(completed.completedAt).toBeInstanceOf(Date);

    await updateTask(ownerId, projectId, taskId, {
      ...input,
      title: "완료 상태 유지",
      status: "DONE",
    });
    const stillCompleted = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { completedAt: true },
    });
    expect(stillCompleted.completedAt?.getTime()).toBe(
      completed.completedAt?.getTime(),
    );

    await updateTask(ownerId, projectId, taskId, {
      ...input,
      status: "IN_PROGRESS",
    });
    const reopened = await prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      select: { status: true, completedAt: true },
    });
    expect(reopened).toEqual({ status: "IN_PROGRESS", completedAt: null });

    await expect(
      deleteTask(otherUserId, projectId, taskId),
    ).resolves.toBe(false);
    await expect(deleteTask(ownerId, projectId, taskId)).resolves.toBe(true);
    await expect(
      prisma.task.findUnique({ where: { id: taskId } }),
    ).resolves.toBeNull();
  });
});
