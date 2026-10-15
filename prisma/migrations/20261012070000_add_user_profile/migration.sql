-- AlterTable
ALTER TABLE "User" ADD COLUMN "bio" TEXT,
ADD COLUMN "githubUrl" TEXT;

-- CreateTable
CREATE TABLE "UserTechnology" (
    "userId" UUID NOT NULL,
    "technologyId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserTechnology_pkey" PRIMARY KEY ("userId", "technologyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTechnology_userId_position_key" ON "UserTechnology"("userId", "position");

-- CreateIndex
CREATE INDEX "UserTechnology_technologyId_idx" ON "UserTechnology"("technologyId");

-- AddForeignKey
ALTER TABLE "UserTechnology" ADD CONSTRAINT "UserTechnology_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTechnology" ADD CONSTRAINT "UserTechnology_technologyId_fkey" FOREIGN KEY ("technologyId") REFERENCES "Technology"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
