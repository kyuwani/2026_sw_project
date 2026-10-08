-- CreateEnum
CREATE TYPE "LearningCategory" AS ENUM ('LANGUAGE', 'FRAMEWORK', 'ALGORITHM', 'DATABASE', 'DEVOPS', 'OTHER');

-- AlterTable
ALTER TABLE "LearningLog" ADD COLUMN     "category" "LearningCategory" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul';
