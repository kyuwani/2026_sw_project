import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getTask, listProjectTasks } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    task: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

describe("task queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the Task list through the owned Project", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);

    await listProjectTasks("user-id", "project-id");

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { projectId: "project-id", project: { userId: "user-id" } },
      }),
    );
  });

  it("scopes a Task lookup to its Project and owner", async () => {
    vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

    await getTask("user-id", "project-id", "task-id");

    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "task-id",
          projectId: "project-id",
          project: { userId: "user-id" },
        },
      }),
    );
  });
});
