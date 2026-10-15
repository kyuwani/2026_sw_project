import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { TaskInput } from "../schemas";
import { createTask } from "./create-task";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: TaskInput = {
  title: "Task",
  description: undefined,
  status: "DONE",
  priority: "HIGH",
  dueDate: undefined,
};

describe("createTask", () => {
  const projectFindFirst = vi.fn();
  const taskCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        project: { findFirst: projectFindFirst },
        task: { create: taskCreate },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("checks project ownership and records completion for a DONE Task", async () => {
    projectFindFirst.mockResolvedValue({ id: "project-id" });
    taskCreate.mockResolvedValue({ id: "task-id" });

    await expect(
      createTask("user-id", "project-id", input),
    ).resolves.toEqual({ id: "task-id" });
    expect(projectFindFirst).toHaveBeenCalledWith({
      where: { id: "project-id", userId: "user-id" },
      select: { id: true },
    });
    expect(taskCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "project-id",
        status: "DONE",
        completedAt: expect.any(Date),
      }),
      select: { id: true },
    });
  });

  it("does not create a Task in another user's project", async () => {
    projectFindFirst.mockResolvedValue(null);

    await expect(
      createTask("other-user", "project-id", input),
    ).resolves.toBeNull();
    expect(taskCreate).not.toHaveBeenCalled();
  });
});
