import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { isValidTimeZone } from "@/lib/date/time-zone";
import type { LearningCategoryValue } from "./schemas";

export const LEARNING_LOG_PAGE_SIZE = 6;

const learningLogSummarySelect = {
  id: true,
  title: true,
  content: true,
  studyMinutes: true,
  studiedAt: true,
  category: true,
  createdAt: true,
  technologies: {
    orderBy: { technology: { name: "asc" } },
    select: { technology: { select: { name: true } } },
  },
} satisfies Prisma.LearningLogSelect;

type LearningLogSummaryRecord = Prisma.LearningLogGetPayload<{
  select: typeof learningLogSummarySelect;
}>;

export interface LearningLogSummary {
  id: string;
  title: string;
  content: string;
  studyMinutes: number;
  studiedAt: Date;
  category: LearningCategoryValue;
  createdAt: Date;
  technologyNames: string[];
}

export interface LearningLogDetail extends LearningLogSummary {
  updatedAt: Date;
}

export interface LearningLogPage {
  items: LearningLogSummary[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

function toLearningLogSummary(
  learningLog: LearningLogSummaryRecord,
): LearningLogSummary {
  const { technologies, ...summary } = learningLog;

  return {
    ...summary,
    technologyNames: technologies.map(({ technology }) => technology.name),
  };
}

export async function getUserTimeZone(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });

  if (!user || !isValidTimeZone(user.timezone)) {
    return null;
  }

  return user.timezone;
}

export async function listLearningLogs(
  userId: string,
  page: number,
): Promise<LearningLogPage> {
  const [totalItems, learningLogs] = await Promise.all([
    prisma.learningLog.count({ where: { userId } }),
    prisma.learningLog.findMany({
      where: { userId },
      orderBy: [{ studiedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * LEARNING_LOG_PAGE_SIZE,
      take: LEARNING_LOG_PAGE_SIZE,
      select: learningLogSummarySelect,
    }),
  ]);

  return {
    items: learningLogs.map(toLearningLogSummary),
    page,
    pageSize: LEARNING_LOG_PAGE_SIZE,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / LEARNING_LOG_PAGE_SIZE)),
  };
}

export async function getLearningLogDetail(
  userId: string,
  learningLogId: string,
): Promise<LearningLogDetail | null> {
  const learningLog = await prisma.learningLog.findFirst({
    where: { id: learningLogId, userId },
    select: {
      ...learningLogSummarySelect,
      updatedAt: true,
    },
  });

  if (!learningLog) {
    return null;
  }

  return {
    ...toLearningLogSummary(learningLog),
    updatedAt: learningLog.updatedAt,
  };
}
