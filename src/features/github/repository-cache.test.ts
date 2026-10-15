import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getGitHubRepositories } from "./repositories";
import {
  connectProjectRepository,
  disconnectProjectRepository,
} from "./repository-cache";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    project: { findFirst: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("./repositories", () => ({ getGitHubRepositories: vi.fn() }));

const repository = {
  externalId: 123,
  name: "devlog",
  fullName: "octocat/devlog",
  ownerLogin: "octocat",
  ownerAvatarUrl: null,
  htmlUrl: "https://github.com/octocat/devlog",
  description: "개발 기록",
  visibility: "PUBLIC" as const,
  permission: "WRITE" as const,
  language: "TypeScript",
  defaultBranch: "main",
  isFork: false,
  isArchived: false,
  updatedAt: new Date("2026-10-12T00:00:00Z"),
  pushedAt: new Date("2026-10-11T00:00:00Z"),
};
const projectRecord = {
  id: "project-id",
  title: "DevLog",
  description: null,
  status: "PLANNING" as const,
  startDate: null,
  endDate: null,
  repositoryUrl: null,
  repositoryId: null,
  userId: "user-id",
  createdAt: new Date("2026-10-12T00:00:00Z"),
  updatedAt: new Date("2026-10-12T00:00:00Z"),
};

describe("project repository cache", () => {
  const transactionProjectFindFirst = vi.fn();
  const transactionProjectUpdate = vi.fn();
  const repositoryUpsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (operation) =>
      operation({
        project: {
          findFirst: transactionProjectFindFirst,
          update: transactionProjectUpdate,
        },
        gitHubRepository: { upsert: repositoryUpsert },
      } as unknown as Prisma.TransactionClient),
    );
  });

  it("verifies project ownership and GitHub access before connecting", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(projectRecord);
    vi.mocked(getGitHubRepositories).mockResolvedValue({
      status: "CONNECTED",
      repositories: [repository],
      rateLimit: { remaining: 100, resetAt: null },
      truncated: false,
    });
    transactionProjectFindFirst.mockResolvedValue({ id: "project-id" });
    repositoryUpsert.mockResolvedValue({ id: "cache-id" });
    transactionProjectUpdate.mockResolvedValue({ id: "project-id" });

    await expect(
      connectProjectRepository("user-id", "project-id", 123),
    ).resolves.toBe("CONNECTED");

    expect(prisma.project.findFirst).toHaveBeenCalledWith({
      where: { id: "project-id", userId: "user-id" },
      select: { id: true },
    });
    expect(repositoryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_externalId: { userId: "user-id", externalId: "123" },
        },
        create: expect.objectContaining({ userId: "user-id", fullName: "octocat/devlog" }),
      }),
    );
    expect(transactionProjectUpdate).toHaveBeenCalledWith({
      where: { id: "project-id" },
      data: {
        repositoryId: "cache-id",
        repositoryUrl: "https://github.com/octocat/devlog",
      },
      select: { id: true },
    });
  });

  it("rejects a repository that is not in the user's accessible list", async () => {
    vi.mocked(prisma.project.findFirst).mockResolvedValue(projectRecord);
    vi.mocked(getGitHubRepositories).mockResolvedValue({
      status: "CONNECTED",
      repositories: [repository],
      rateLimit: { remaining: 100, resetAt: null },
      truncated: false,
    });

    await expect(
      connectProjectRepository("user-id", "project-id", 999),
    ).resolves.toBe("REPOSITORY_NOT_FOUND");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("disconnects only an owned project and keeps the cached repository", async () => {
    vi.mocked(prisma.project.updateMany).mockResolvedValue({ count: 1 });

    await expect(
      disconnectProjectRepository("user-id", "project-id"),
    ).resolves.toBe(true);
    expect(prisma.project.updateMany).toHaveBeenCalledWith({
      where: { id: "project-id", userId: "user-id" },
      data: { repositoryId: null, repositoryUrl: null },
    });
  });
});
