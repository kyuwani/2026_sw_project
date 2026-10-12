-- CreateEnum
CREATE TYPE "GitHubRepositoryVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "GitHubRepositoryPermission" AS ENUM ('ADMIN', 'WRITE', 'READ');

-- CreateTable
CREATE TABLE "GitHubRepository" (
    "id" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "ownerLogin" TEXT NOT NULL,
    "ownerAvatarUrl" TEXT,
    "htmlUrl" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "GitHubRepositoryVisibility" NOT NULL,
    "permission" "GitHubRepositoryPermission" NOT NULL,
    "language" TEXT,
    "defaultBranch" TEXT NOT NULL,
    "isFork" BOOLEAN NOT NULL,
    "isArchived" BOOLEAN NOT NULL,
    "remoteUpdatedAt" TIMESTAMP(3) NOT NULL,
    "remotePushedAt" TIMESTAMP(3),
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,

    CONSTRAINT "GitHubRepository_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "repositoryId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "GitHubRepository_userId_externalId_key" ON "GitHubRepository"("userId", "externalId");

-- CreateIndex
CREATE INDEX "GitHubRepository_userId_remoteUpdatedAt_idx" ON "GitHubRepository"("userId", "remoteUpdatedAt");

-- CreateIndex
CREATE INDEX "Project_repositoryId_idx" ON "Project"("repositoryId");

-- AddForeignKey
ALTER TABLE "GitHubRepository" ADD CONSTRAINT "GitHubRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "GitHubRepository"("id") ON DELETE SET NULL ON UPDATE CASCADE;
