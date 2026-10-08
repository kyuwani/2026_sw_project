import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getTask, listProjectTasks, listTasks } from "./queries";

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

  it("combines status, priority, due date, and sorting filters", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);
    const today = new Date("2026-10-08T00:00:00.000Z");

    await listTasks(
      "user-id",
      {
        status: "IN_PROGRESS",
        priority: "HIGH",
        due: "OVERDUE",
        sort: "DUE_ASC",
      },
      today,
    );

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          project: { userId: "user-id" },
          status: "IN_PROGRESS",
          priority: "HIGH",
          dueDate: { lt: today },
        },
        orderBy: [
          { dueDate: { sort: "asc", nulls: "last" } },
          { priority: "desc" },
        ],
      }),
    );
  });

  it("excludes completed Tasks from due-state filters by default", async () => {
    vi.mocked(prisma.task.findMany).mockResolvedValue([]);

    await listTasks("user-id", {
      status: undefined,
      priority: undefined,
      due: "TODAY",
      sort: "UPDATED_DESC",
    });

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: "DONE" } }),
      }),
    );
  });
});
