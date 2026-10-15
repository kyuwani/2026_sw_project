import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { deleteTask } from "./delete-task";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { task: { deleteMany: vi.fn() } },
}));

describe("deleteTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only through an owned Project", async () => {
    vi.mocked(prisma.task.deleteMany).mockResolvedValue({ count: 1 });

    await expect(
      deleteTask("user-id", "project-id", "task-id"),
    ).resolves.toBe(true);
    expect(prisma.task.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "task-id",
        projectId: "project-id",
        project: { userId: "user-id" },
      },
    });
  });

  it("returns false when no owned Task was deleted", async () => {
    vi.mocked(prisma.task.deleteMany).mockResolvedValue({ count: 0 });

    await expect(
      deleteTask("other-user", "project-id", "task-id"),
    ).resolves.toBe(false);
  });
});
