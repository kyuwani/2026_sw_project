import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateTaskProgress } from "./progress";
import type {
  ProjectListFilters,
  ProjectStatusValue,
} from "./schemas";

const projectSummarySelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  repositoryUrl: true,
  updatedAt: true,
  technologies: {
    orderBy: { technology: { name: "asc" } },
    select: { technology: { select: { name: true } } },
  },
  tasks: {
    where: { status: "DONE" },
    select: { id: true },
  },
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectSelect;

type ProjectSummaryRecord = Prisma.ProjectGetPayload<{
  select: typeof projectSummarySelect;
}>;

export interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatusValue;
  startDate: Date | null;
  endDate: Date | null;
  repositoryUrl: string | null;
  updatedAt: Date;
  technologyNames: string[];
  taskCount: number;
  completedTaskCount: number;
  progress: number;
}

export interface ProjectDetail extends ProjectSummary {
  createdAt: Date;
}

function toProjectSummary(project: ProjectSummaryRecord): ProjectSummary {
  const taskCount = project._count.tasks;
  const completedTaskCount = project.tasks.length;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    repositoryUrl: project.repositoryUrl,
    updatedAt: project.updatedAt,
    technologyNames: project.technologies.map(
      ({ technology }) => technology.name,
    ),
    taskCount,
    completedTaskCount,
    progress: calculateTaskProgress(taskCount, completedTaskCount),
  };
}

export async function listProjects(
  userId: string,
  filters: ProjectListFilters,
): Promise<ProjectSummary[]> {
  const projects = await prisma.project.findMany({
    where: {
      userId,
      status: filters.status,
      OR: filters.query
        ? [
            { title: { contains: filters.query, mode: "insensitive" } },
            {
              description: {
                contains: filters.query,
                mode: "insensitive",
              },
            },
          ]
        : undefined,
    },
    orderBy: { updatedAt: "desc" },
    select: projectSummarySelect,
  });

  return projects.map(toProjectSummary);
}

export async function getProjectDetail(
  userId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: {
      ...projectSummarySelect,
      createdAt: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...toProjectSummary(project),
    createdAt: project.createdAt,
  };
}
