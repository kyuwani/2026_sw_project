import "server-only";

import {
  listGitHubRecentCommits,
  type GitHubCommitDto,
} from "@/lib/github/client";
import { prisma } from "@/lib/db/prisma";

export interface CachedGitHubRepositoryDto {
  externalId: string;
  name: string;
  fullName: string;
  ownerLogin: string;
  ownerAvatarUrl: string | null;
  htmlUrl: string;
  description: string | null;
  visibility: "PRIVATE" | "PUBLIC";
  permission: "ADMIN" | "WRITE" | "READ";
  language: string | null;
  defaultBranch: string;
  isFork: boolean;
  isArchived: boolean;
  remoteUpdatedAt: Date;
  remotePushedAt: Date | null;
  cachedAt: Date;
}

export type GitHubCommitState =
  | { status: "AVAILABLE"; commits: GitHubCommitDto[] }
  | { status: "REAUTH_REQUIRED" }
  | { status: "RATE_LIMITED"; retryAt: Date | null }
  | { status: "UNAVAILABLE" };

export type ProjectGitHubActivity =
  | { status: "NOT_CONNECTED" }
  | {
      status: "CONNECTED";
      repository: CachedGitHubRepositoryDto;
      commits: GitHubCommitState;
    };

export async function getProjectGitHubActivity(
  userId: string,
  projectId: string,
): Promise<ProjectGitHubActivity> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      repository: {
        select: {
          externalId: true,
          name: true,
          fullName: true,
          ownerLogin: true,
          ownerAvatarUrl: true,
          htmlUrl: true,
          description: true,
          visibility: true,
          permission: true,
          language: true,
          defaultBranch: true,
          isFork: true,
          isArchived: true,
          remoteUpdatedAt: true,
          remotePushedAt: true,
          cachedAt: true,
          userId: true,
        },
      },
    },
  });

  if (!project?.repository || project.repository.userId !== userId) {
    return { status: "NOT_CONNECTED" };
  }

  const { userId: _repositoryUserId, ...repository } = project.repository;
  void _repositoryUserId;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return {
      status: "CONNECTED",
      repository,
      commits: { status: "REAUTH_REQUIRED" },
    };
  }

  const result = await listGitHubRecentCommits(
    account.access_token,
    repository.ownerLogin,
    repository.name,
  );
  if (result.ok) {
    return {
      status: "CONNECTED",
      repository,
      commits: { status: "AVAILABLE", commits: result.commits },
    };
  }

  const commits: GitHubCommitState =
    result.reason === "REAUTH_REQUIRED" || result.reason === "FORBIDDEN"
      ? { status: "REAUTH_REQUIRED" }
      : result.reason === "RATE_LIMITED"
        ? { status: "RATE_LIMITED", retryAt: result.retryAt }
        : { status: "UNAVAILABLE" };

  return {
    status: "CONNECTED",
    repository,
    commits,
  };
}
