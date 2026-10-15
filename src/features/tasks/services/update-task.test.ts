import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { TaskInput } from "../schemas";
import { updateTask } from "./update-task";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: TaskInput = {
  title: "수정된 Task",
  description: undefined,
  status: "DONE",
  priority: "MEDIUM",
  dueDate: undefined,
};

describe("updateTask", () => {
  const taskFindFirst = vi.fn();
  const taskUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        task: { findFirst: taskFindFirst, update: taskUpdate },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("scopes ownership through Project and sets completedAt on completion", async () => {
    taskFindFirst.mockResolvedValue({ id: "task-id", completedAt: null });
    taskUpdate.mockResolvedValue({ id: "task-id" });

    await expect(
      updateTask("user-id", "project-id", "task-id", input),
    ).resolves.toBe(true);
    expect(taskFindFirst).toHaveBeenCalledWith({
      where: {
        id: "task-id",
        projectId: "project-id",
        project: { userId: "user-id" },
      },
      select: { id: true, completedAt: true },
    });
    expect(taskUpdate).toHaveBeenCalledWith({
      where: { id: "task-id" },
      data: expect.objectContaining({
        status: "DONE",
        completedAt: expect.any(Date),
      }),
    });
  });

  it("preserves the original completion time while a Task stays DONE", async () => {
    const completedAt = new Date("2026-10-08T00:00:00.000Z");
    taskFindFirst.mockResolvedValue({ id: "task-id", completedAt });
    taskUpdate.mockResolvedValue({ id: "task-id" });

    await updateTask("user-id", "project-id", "task-id", input);

    expect(taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt }),
      }),
    );
  });

  it("clears completedAt when a Task is reopened", async () => {
    taskFindFirst.mockResolvedValue({
      id: "task-id",
      completedAt: new Date("2026-10-08T00:00:00.000Z"),
    });
    taskUpdate.mockResolvedValue({ id: "task-id" });

    await updateTask("user-id", "project-id", "task-id", {
      ...input,
      status: "IN_PROGRESS",
    });

    expect(taskUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          completedAt: null,
        }),
      }),
    );
  });

  it("does not update a Task outside the owned project", async () => {
    taskFindFirst.mockResolvedValue(null);

    await expect(
      updateTask("other-user", "project-id", "task-id", input),
    ).resolves.toBe(false);
    expect(taskUpdate).not.toHaveBeenCalled();
  });
});
