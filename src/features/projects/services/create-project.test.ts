import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CreateProjectInput } from "../schemas";
import { createProject } from "./create-project";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: CreateProjectInput = {
  title: "DevLog",
  description: "개발 기록 서비스",
  status: "IN_PROGRESS",
  startDate: new Date("2026-10-01T00:00:00.000Z"),
  endDate: new Date("2026-10-31T00:00:00.000Z"),
  repositoryUrl: "https://github.com/example/devlog",
  technologyNames: ["Next.js"],
};

describe("createProject", () => {
  const technologyCreateMany = vi.fn();
  const technologyFindMany = vi.fn();
  const projectCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        technology: {
          createMany: technologyCreateMany,
          findMany: technologyFindMany,
        },
        project: { create: projectCreate },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("stores the project owner and technology links in one transaction", async () => {
    technologyCreateMany.mockResolvedValue({ count: 1 });
    technologyFindMany.mockResolvedValue([{ id: "technology-id" }]);
    projectCreate.mockResolvedValue({ id: "project-id" });

    await expect(createProject("user-id", input)).resolves.toEqual({
      id: "project-id",
    });

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(technologyCreateMany).toHaveBeenCalledWith({
      data: [{ name: "Next.js" }],
      skipDuplicates: true,
    });
    expect(technologyFindMany).toHaveBeenCalledWith({
      where: { name: { in: ["Next.js"] } },
      select: { id: true },
    });
    expect(projectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-id",
        title: "DevLog",
        technologies: { create: [{ technologyId: "technology-id" }] },
      }),
      select: { id: true },
    });
  });

  it("creates a project without technology links when none are selected", async () => {
    projectCreate.mockResolvedValue({ id: "project-id" });

    await createProject("user-id", { ...input, technologyNames: [] });

    expect(technologyCreateMany).not.toHaveBeenCalled();
    expect(technologyFindMany).not.toHaveBeenCalled();
    expect(projectCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ technologies: undefined }),
      select: { id: true },
    });
  });
});
