import { beforeEach, describe, expect, it, vi } from "vitest";

import { listGitHubRecentCommits } from "@/lib/github/client";
import { getProjectGitHubActivity } from "./activity";

const prismaMocks = vi.hoisted(() => ({
  projectFindFirst: vi.fn(),
  accountFindFirst: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    project: { findFirst: prismaMocks.projectFindFirst },
    account: { findFirst: prismaMocks.accountFindFirst },
  },
}));
vi.mock("@/lib/github/client", () => ({
  listGitHubRecentCommits: vi.fn(),
}));

const cachedRepository = {
  externalId: "123",
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
  remoteUpdatedAt: new Date("2026-10-12T00:00:00Z"),
  remotePushedAt: new Date("2026-10-11T00:00:00Z"),
  cachedAt: new Date("2026-10-12T01:00:00Z"),
  userId: "user-id",
};

describe("getProjectGitHubActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.projectFindFirst.mockResolvedValue({
      repository: cachedRepository,
    });
    prismaMocks.accountFindFirst.mockResolvedValue({
      access_token: "server-token",
    });
  });

  it("returns cached repository data with recent commits", async () => {
    vi.mocked(listGitHubRecentCommits).mockResolvedValue({
      ok: true,
      commits: [],
      rateLimit: { remaining: 10, resetAt: null },
    });

    const result = await getProjectGitHubActivity("user-id", "project-id");

    expect(prismaMocks.projectFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "project-id", userId: "user-id" },
      }),
    );
    expect(listGitHubRecentCommits).toHaveBeenCalledWith(
      "server-token",
      "octocat",
      "devlog",
    );
    expect(result).toEqual({
      status: "CONNECTED",
      repository: expect.objectContaining({ fullName: "octocat/devlog" }),
      commits: { status: "AVAILABLE", commits: [] },
    });
    const serializedResult = JSON.stringify(result);
    expect(serializedResult).not.toContain("server-token");
    expect(serializedResult).not.toContain("access_token");
    expect(serializedResult).not.toContain("refresh_token");
  });

  it("keeps cached repository data when GitHub is unavailable", async () => {
    vi.mocked(listGitHubRecentCommits).mockResolvedValue({
      ok: false,
      reason: "NETWORK_ERROR",
      retryAt: null,
    });

    await expect(
      getProjectGitHubActivity("user-id", "project-id"),
    ).resolves.toEqual({
      status: "CONNECTED",
      repository: expect.objectContaining({ fullName: "octocat/devlog" }),
      commits: { status: "UNAVAILABLE" },
    });
  });

  it("rejects a cached repository owned by another user", async () => {
    prismaMocks.projectFindFirst.mockResolvedValue({
      repository: { ...cachedRepository, userId: "other-user" },
    });

    await expect(
      getProjectGitHubActivity("user-id", "project-id"),
    ).resolves.toEqual({ status: "NOT_CONNECTED" });
    expect(listGitHubRecentCommits).not.toHaveBeenCalled();
  });
});
