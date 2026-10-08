import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { getProjectDetail, listProjects } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

const projectRecord = {
  id: "project-id",
  title: "DevLog",
  description: "개발 기록 서비스",
  status: "IN_PROGRESS" as const,
  startDate: new Date("2026-10-01T00:00:00.000Z"),
  endDate: new Date("2026-10-31T00:00:00.000Z"),
  repositoryUrl: "https://github.com/example/devlog",
  userId: "user-id",
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-08T00:00:00.000Z"),
  technologies: [
    { technology: { name: "Next.js" } },
    { technology: { name: "TypeScript" } },
  ],
  tasks: [{ id: "done-task" }],
  _count: { tasks: 4 },
};

describe("project queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the project list to the authenticated user", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([projectRecord]);

    const result = await listProjects("user-id", {
      query: "",
      status: undefined,
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-id" }),
        orderBy: { updatedAt: "desc" },
      }),
    );
    expect(result[0]).toEqual(
      expect.objectContaining({
        technologyNames: ["Next.js", "TypeScript"],
        taskCount: 4,
        completedTaskCount: 1,
        progress: 25,
      }),
    );
  });

  it("applies search and status filters together", async () => {
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    await listProjects("user-id", {
      query: "devlog",
      status: "IN_PROGRESS",
    });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-id",
          status: "IN_PROGRESS",
          OR: [
            { title: { contains: "devlog", mode: "insensitive" } },
            {
              description: {
                contains: "devlog",
                mode: "insensitive",
              },
            },
          ],
        },
      }),
    );
  });

  it("scopes project detail lookup to both project and user IDs", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(projectRecord);

    await expect(
      getProjectDetail("user-id", "project-id"),
    ).resolves.toEqual(expect.objectContaining({ id: "project-id" }));
    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-id", userId: "user-id" },
      }),
    );
  });

  it("returns null when an owned project cannot be found", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(null);

    await expect(
      getProjectDetail("user-id", "missing-project"),
    ).resolves.toBeNull();
  });
});
