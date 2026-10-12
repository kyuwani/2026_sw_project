import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { listGitHubRepositories } from "@/lib/github/client";
import { getGitHubRepositories } from "./repositories";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { account: { findFirst: vi.fn() } },
}));
vi.mock("@/lib/github/client", () => ({
  listGitHubRepositories: vi.fn(),
}));

const accountRecord = {
  id: "account-id",
  userId: "user-id",
  type: "oauth",
  provider: "github",
  providerAccountId: "github-user-id",
  refresh_token: null,
  access_token: "server-token",
  expires_at: null,
  token_type: "bearer",
  scope: "read:user user:email",
  id_token: null,
  session_state: null,
};

describe("getGitHubRepositories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not connected without calling GitHub when no token exists", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null);

    await expect(getGitHubRepositories("user-id")).resolves.toEqual({
      status: "NOT_CONNECTED",
    });
    expect(listGitHubRepositories).not.toHaveBeenCalled();
    expect(prisma.account.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-id", provider: "github" },
      select: { access_token: true },
    });
  });

  it("uses the stored token but returns only safe repository DTOs", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(accountRecord);
    vi.mocked(listGitHubRepositories).mockResolvedValue({
      ok: true,
      repositories: [],
      rateLimit: { remaining: 10, resetAt: null },
      truncated: false,
    });

    const result = await getGitHubRepositories("user-id");

    expect(listGitHubRepositories).toHaveBeenCalledWith("server-token");
    expect(result).toEqual({
      status: "CONNECTED",
      repositories: [],
      rateLimit: { remaining: 10, resetAt: null },
      truncated: false,
    });
    expect(JSON.stringify(result)).not.toContain("server-token");
  });

  it("maps rate limits and upstream errors to safe states", async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(accountRecord);
    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      ok: false,
      reason: "RATE_LIMITED",
      retryAt: new Date("2026-10-12T01:00:00.000Z"),
    });

    await expect(getGitHubRepositories("user-id")).resolves.toEqual({
      status: "RATE_LIMITED",
      retryAt: new Date("2026-10-12T01:00:00.000Z"),
    });

    vi.mocked(listGitHubRepositories).mockResolvedValueOnce({
      ok: false,
      reason: "INVALID_RESPONSE",
      retryAt: null,
    });
    await expect(getGitHubRepositories("user-id")).resolves.toEqual({
      status: "UNAVAILABLE",
    });
  });
});
