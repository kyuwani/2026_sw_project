import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { listGitHubRepositories } from "@/lib/github/client";
import {
  connectProjectRepository,
  disconnectProjectRepository,
} from "./repository-cache";
import { getGitHubRepositories } from "./repositories";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/github/client", () => ({
  listGitHubRepositories: vi.fn(),
}));

const describeWithDatabase =
  process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

describeWithDatabase("GitHub repository database integration", () => {
  const suffix = randomUUID();
  const ownerToken = `owner-token-${suffix}`;
  const otherToken = `other-token-${suffix}`;
  let ownerId = "";
  let otherUserId = "";
  let ownerProjectId = "";
  let otherProjectId = "";

  beforeAll(async () => {
    const [owner, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: `github-owner-${suffix}@example.invalid`,
          accounts: {
            create: {
              type: "oauth",
              provider: "github",
              providerAccountId: `owner-${suffix}`,
              access_token: ownerToken,
            },
          },
          projects: { create: { title: "GitHub 연결 프로젝트" } },
        },
        select: { id: true, projects: { select: { id: true } } },
      }),
      prisma.user.create({
        data: {
          email: `github-other-${suffix}@example.invalid`,
          accounts: {
            create: {
              type: "oauth",
              provider: "github",
              providerAccountId: `other-${suffix}`,
              access_token: otherToken,
            },
          },
          projects: { create: { title: "다른 사용자 프로젝트" } },
        },
        select: { id: true, projects: { select: { id: true } } },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;
    ownerProjectId = owner.projects[0].id;
    otherProjectId = otherUser.projects[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [ownerId, otherUserId].filter(Boolean) } },
    });
  });

  it("uses only the requested user's GitHub account token", async () => {
    vi.mocked(listGitHubRepositories).mockResolvedValue({
      ok: true,
      repositories: [],
      rateLimit: { remaining: 100, resetAt: null },
      truncated: false,
    });

    await getGitHubRepositories(ownerId);

    expect(listGitHubRepositories).toHaveBeenCalledOnce();
    expect(listGitHubRepositories).toHaveBeenCalledWith(ownerToken);
    expect(listGitHubRepositories).not.toHaveBeenCalledWith(otherToken);
  });

  it("connects only an accessible repository to an owned project", async () => {
    vi.mocked(listGitHubRepositories).mockResolvedValue({
      ok: true,
      repositories: [
        {
          externalId: 123,
          name: "devlog",
          fullName: "octocat/devlog",
          ownerLogin: "octocat",
          ownerAvatarUrl: null,
          htmlUrl: "https://github.com/octocat/devlog",
          description: "개발 기록",
          visibility: "PUBLIC",
          permission: "WRITE",
          language: "TypeScript",
          defaultBranch: "main",
          isFork: false,
          isArchived: false,
          updatedAt: new Date("2026-10-12T00:00:00Z"),
          pushedAt: new Date("2026-10-11T00:00:00Z"),
        },
      ],
      rateLimit: { remaining: 99, resetAt: null },
      truncated: false,
    });

    await expect(
      connectProjectRepository(ownerId, ownerProjectId, 123),
    ).resolves.toBe("CONNECTED");
    await expect(
      connectProjectRepository(ownerId, otherProjectId, 123),
    ).resolves.toBe("PROJECT_NOT_FOUND");

    const project = await prisma.project.findUnique({
      where: { id: ownerProjectId },
      select: { repository: { select: { userId: true, externalId: true } } },
    });
    expect(project?.repository).toEqual({ userId: ownerId, externalId: "123" });

    await expect(
      disconnectProjectRepository(ownerId, ownerProjectId),
    ).resolves.toBe(true);
    const [disconnectedProject, cachedRepository] = await Promise.all([
      prisma.project.findUnique({
        where: { id: ownerProjectId },
        select: { repositoryId: true, title: true },
      }),
      prisma.gitHubRepository.findUnique({
        where: {
          userId_externalId: { userId: ownerId, externalId: "123" },
        },
        select: { id: true },
      }),
    ]);
    expect(disconnectedProject).toEqual({
      repositoryId: null,
      title: "GitHub 연결 프로젝트",
    });
    expect(cachedRepository).not.toBeNull();
  });
});
