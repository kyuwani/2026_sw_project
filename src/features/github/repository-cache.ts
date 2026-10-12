import "server-only";

import type { GitHubRepositoryDto } from "@/lib/github/client";
import { prisma } from "@/lib/db/prisma";
import { getGitHubRepositories } from "./repositories";

export type ConnectProjectRepositoryResult =
  | "CONNECTED"
  | "PROJECT_NOT_FOUND"
  | "REPOSITORY_NOT_FOUND"
  | "GITHUB_NOT_CONNECTED"
  | "GITHUB_UNAVAILABLE";

function repositoryData(repository: GitHubRepositoryDto) {
  return {
    name: repository.name,
    fullName: repository.fullName,
    ownerLogin: repository.ownerLogin,
    ownerAvatarUrl: repository.ownerAvatarUrl,
    htmlUrl: repository.htmlUrl,
    description: repository.description,
    visibility: repository.visibility,
    permission: repository.permission,
    language: repository.language,
    defaultBranch: repository.defaultBranch,
    isFork: repository.isFork,
    isArchived: repository.isArchived,
    remoteUpdatedAt: repository.updatedAt,
    remotePushedAt: repository.pushedAt,
    cachedAt: new Date(),
  };
}

export async function connectProjectRepository(
  userId: string,
  projectId: string,
  externalId: number,
): Promise<ConnectProjectRepositoryResult> {
  const ownedProject = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!ownedProject) return "PROJECT_NOT_FOUND";

  const repositoryList = await getGitHubRepositories(userId);
  if (repositoryList.status === "NOT_CONNECTED") {
    return "GITHUB_NOT_CONNECTED";
  }
  if (repositoryList.status !== "CONNECTED") {
    return "GITHUB_UNAVAILABLE";
  }

  const repository = repositoryList.repositories.find(
    (candidate) => candidate.externalId === externalId,
  );
  if (!repository) return "REPOSITORY_NOT_FOUND";

  return prisma.$transaction(async (transaction) => {
    const currentProject = await transaction.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!currentProject) return "PROJECT_NOT_FOUND";

    const cachedRepository = await transaction.gitHubRepository.upsert({
      where: {
        userId_externalId: { userId, externalId: String(externalId) },
      },
      create: {
        externalId: String(externalId),
        userId,
        ...repositoryData(repository),
      },
      update: repositoryData(repository),
      select: { id: true },
    });

    await transaction.project.update({
      where: { id: currentProject.id },
      data: {
        repositoryId: cachedRepository.id,
        repositoryUrl: repository.htmlUrl,
      },
      select: { id: true },
    });

    return "CONNECTED";
  });
}

export async function disconnectProjectRepository(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const result = await prisma.project.updateMany({
    where: { id: projectId, userId },
    data: { repositoryId: null, repositoryUrl: null },
  });

  return result.count > 0;
}
