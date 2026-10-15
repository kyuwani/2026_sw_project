import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CreateProjectInput } from "../schemas";
import { updateProject } from "./update-project";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { $transaction: vi.fn() },
}));

const input: CreateProjectInput = {
  title: "수정된 프로젝트",
  description: "수정된 설명",
  status: "IN_PROGRESS",
  startDate: new Date("2026-10-01T00:00:00.000Z"),
  endDate: new Date("2026-11-30T00:00:00.000Z"),
  repositoryUrl: "https://github.com/example/updated",
  technologyNames: ["React", "TypeScript"],
};

describe("updateProject", () => {
  const projectFindFirst = vi.fn();
  const projectUpdate = vi.fn();
  const technologyCreateMany = vi.fn();
  const technologyFindMany = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        project: {
          findFirst: projectFindFirst,
          update: projectUpdate,
        },
        technology: {
          createMany: technologyCreateMany,
          findMany: technologyFindMany,
        },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("checks ownership before updating and replaces technology links", async () => {
    projectFindFirst.mockResolvedValue({
      id: "project-id",
      repositoryId: null,
      repository: null,
    });
    technologyCreateMany.mockResolvedValue({ count: 2 });
    technologyFindMany.mockResolvedValue([
      { id: "react-id" },
      { id: "typescript-id" },
    ]);
    projectUpdate.mockResolvedValue({ id: "project-id" });

    await expect(
      updateProject("user-id", "project-id", input),
    ).resolves.toBe(true);

    expect(projectFindFirst).toHaveBeenCalledWith({
      where: { id: "project-id", userId: "user-id" },
      select: {
        id: true,
        repositoryId: true,
        repository: { select: { htmlUrl: true } },
      },
    });
    expect(projectUpdate).toHaveBeenCalledWith({
      where: { id: "project-id" },
      data: expect.objectContaining({
        title: "수정된 프로젝트",
        repositoryId: null,
        technologies: {
          deleteMany: {},
          create: [
            { technologyId: "react-id" },
            { technologyId: "typescript-id" },
          ],
        },
      }),
    });
  });

  it("does not write when the project is not owned by the user", async () => {
    projectFindFirst.mockResolvedValue(null);

    await expect(
      updateProject("other-user", "project-id", input),
    ).resolves.toBe(false);

    expect(technologyCreateMany).not.toHaveBeenCalled();
    expect(technologyFindMany).not.toHaveBeenCalled();
    expect(projectUpdate).not.toHaveBeenCalled();
  });

  it("keeps a connected repository when its URL is unchanged", async () => {
    projectFindFirst.mockResolvedValue({
      id: "project-id",
      repositoryId: "repository-id",
      repository: { htmlUrl: input.repositoryUrl },
    });
    technologyCreateMany.mockResolvedValue({ count: 2 });
    technologyFindMany.mockResolvedValue([
      { id: "react-id" },
      { id: "typescript-id" },
    ]);
    projectUpdate.mockResolvedValue({ id: "project-id" });

    await updateProject("user-id", "project-id", input);

    expect(projectUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ repositoryId: "repository-id" }),
      }),
    );
  });
});
