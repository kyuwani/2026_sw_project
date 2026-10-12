import { describe, expect, it, vi } from "vitest";

import { listGitHubRepositories } from "./client";

vi.mock("server-only", () => ({}));

function repositoryResponse(overrides: Record<string, unknown> = {}) {
  return {
    id: 123,
    name: "devlog",
    full_name: "octocat/devlog",
    private: false,
    html_url: "https://github.com/octocat/devlog",
    description: "개발 기록 서비스",
    fork: false,
    archived: false,
    language: "TypeScript",
    default_branch: "main",
    updated_at: "2026-10-12T00:00:00Z",
    pushed_at: "2026-10-11T00:00:00Z",
    owner: { login: "octocat", avatar_url: null },
    permissions: { admin: false, push: true, pull: true },
    ...overrides,
  };
}

describe("listGitHubRepositories", () => {
  it("sends server authentication headers and returns validated DTOs", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([repositoryResponse()]), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-reset": "1791766800",
        },
      }),
    );

    const result = await listGitHubRepositories("secret-token", { fetcher });

    expect(result).toEqual({
      ok: true,
      repositories: [
        {
          externalId: 123,
          name: "devlog",
          fullName: "octocat/devlog",
          ownerLogin: "octocat",
          ownerAvatarUrl: null,
          htmlUrl: "https://github.com/octocat/devlog",
          description: "개발 기록 서비스",
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
      rateLimit: {
        remaining: 4999,
        resetAt: new Date(1791766800 * 1_000),
      },
      truncated: false,
    });
    const [requestUrl, request] = fetcher.mock.calls[0];
    expect(String(requestUrl)).toContain("/user/repos?");
    expect(String(requestUrl)).toContain("per_page=100");
    expect(new Headers(request?.headers).get("Authorization")).toBe(
      "Bearer secret-token",
    );
    expect(new Headers(request?.headers).get("X-GitHub-Api-Version")).toBe(
      "2026-03-10",
    );
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });

  it("returns a rate limit state with a validated retry time", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 429,
        headers: { "retry-after": "60", "x-ratelimit-remaining": "0" },
      }),
    );

    await expect(
      listGitHubRepositories("secret-token", {
        fetcher,
        now: () => new Date("2026-10-12T00:00:00.000Z"),
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "RATE_LIMITED",
      retryAt: new Date("2026-10-12T00:01:00.000Z"),
    });
  });

  it("rejects malformed repository responses", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([repositoryResponse({ html_url: "invalid" })]), {
        status: 200,
      }),
    );

    await expect(
      listGitHubRepositories("secret-token", { fetcher }),
    ).resolves.toEqual({
      ok: false,
      reason: "INVALID_RESPONSE",
      retryAt: null,
    });
  });

  it("limits pagination and reports a truncated result", async () => {
    const repositories = Array.from({ length: 100 }, (_, index) =>
      repositoryResponse({ id: index + 1, name: `repo-${index}`, full_name: `octocat/repo-${index}` }),
    );
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(repositories), { status: 200 }));

    const result = await listGitHubRepositories("secret-token", {
      fetcher,
      maxPages: 1,
    });

    expect(result.ok && result.repositories).toHaveLength(100);
    expect(result.ok && result.truncated).toBe(true);
  });

  it("converts fetch failures into a safe network error", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("token"));

    await expect(
      listGitHubRepositories("secret-token", { fetcher }),
    ).resolves.toEqual({
      ok: false,
      reason: "NETWORK_ERROR",
      retryAt: null,
    });
  });
});
