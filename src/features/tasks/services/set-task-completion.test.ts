import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { setTaskCompletion } from "./set-task-completion";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

describe("setTaskCompletion", () => {
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

  it("marks an owned Task complete with a completion time", async () => {
    taskFindFirst.mockResolvedValue({ id: "task-id", completedAt: null });
    taskUpdate.mockResolvedValue({ id: "task-id" });

    await expect(
      setTaskCompletion("user-id", "project-id", "task-id", "DONE"),
    ).resolves.toBe(true);
    expect(taskUpdate).toHaveBeenCalledWith({
      where: { id: "task-id" },
      data: { status: "DONE", completedAt: expect.any(Date) },
    });
  });

  it("reopens an owned Task and clears the completion time", async () => {
    taskFindFirst.mockResolvedValue({
      id: "task-id",
      completedAt: new Date("2026-10-08T00:00:00.000Z"),
    });
    taskUpdate.mockResolvedValue({ id: "task-id" });

    await setTaskCompletion("user-id", "project-id", "task-id", "TODO");

    expect(taskUpdate).toHaveBeenCalledWith({
      where: { id: "task-id" },
      data: { status: "TODO", completedAt: null },
    });
  });

  it("does not change a Task outside the owned Project", async () => {
    taskFindFirst.mockResolvedValue(null);

    await expect(
      setTaskCompletion("other-user", "project-id", "task-id", "DONE"),
    ).resolves.toBe(false);
    expect(taskUpdate).not.toHaveBeenCalled();
  });
});
