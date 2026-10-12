import "server-only";

import {
  listGitHubRepositories,
  type GitHubRateLimit,
  type GitHubRepositoryDto,
} from "@/lib/github/client";
import { prisma } from "@/lib/db/prisma";

export type GitHubRepositoryListState =
  | {
      status: "CONNECTED";
      repositories: GitHubRepositoryDto[];
      rateLimit: GitHubRateLimit;
      truncated: boolean;
    }
  | { status: "NOT_CONNECTED" }
  | { status: "REAUTH_REQUIRED" }
  | { status: "RATE_LIMITED"; retryAt: Date | null }
  | { status: "UNAVAILABLE" };

export async function getGitHubRepositories(
  userId: string,
): Promise<GitHubRepositoryListState> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return { status: "NOT_CONNECTED" };
  }

  const result = await listGitHubRepositories(account.access_token);
  if (result.ok) {
    return {
      status: "CONNECTED",
      repositories: result.repositories,
      rateLimit: result.rateLimit,
      truncated: result.truncated,
    };
  }

  if (result.reason === "REAUTH_REQUIRED" || result.reason === "FORBIDDEN") {
    return { status: "REAUTH_REQUIRED" };
  }
  if (result.reason === "RATE_LIMITED") {
    return { status: "RATE_LIMITED", retryAt: result.retryAt };
  }
  return { status: "UNAVAILABLE" };
}
