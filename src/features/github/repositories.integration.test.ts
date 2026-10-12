import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { listGitHubRepositories } from "@/lib/github/client";
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
        },
        select: { id: true },
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
        },
        select: { id: true },
      }),
    ]);
    ownerId = owner.id;
    otherUserId = otherUser.id;
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
});
