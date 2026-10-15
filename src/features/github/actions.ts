"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { projectIdSchema } from "@/features/projects/schemas";
import {
  connectProjectRepository,
  disconnectProjectRepository,
} from "./repository-cache";
import {
  externalRepositoryIdSchema,
  type RepositoryConnectionActionState,
} from "./schemas";

export async function connectProjectRepositoryAction(
  projectId: string,
  _previousState: RepositoryConnectionActionState,
  formData: FormData,
): Promise<RepositoryConnectionActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedRepositoryId = externalRepositoryIdSchema.safeParse(
    formData.get("repositoryId"),
  );
  if (!parsedProjectId.success || !parsedRepositoryId.success) {
    return { message: "올바른 Repository를 선택해 주세요." };
  }

  let result;
  try {
    result = await connectProjectRepository(
      session.user.id,
      parsedProjectId.data,
      parsedRepositoryId.data,
    );
  } catch {
    return { message: "Repository를 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (result === "PROJECT_NOT_FOUND") {
    return { message: "프로젝트를 찾을 수 없거나 연결 권한이 없습니다." };
  }
  if (result === "REPOSITORY_NOT_FOUND") {
    return { message: "접근할 수 없는 Repository입니다." };
  }
  if (result === "GITHUB_NOT_CONNECTED") {
    return { message: "GitHub 계정을 먼저 연결해 주세요." };
  }
  if (result === "GITHUB_UNAVAILABLE") {
    return { message: "GitHub 정보를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  return { success: true, message: "Repository를 연결했습니다." };
}

export async function disconnectProjectRepositoryAction(
  projectId: string,
  _previousState: RepositoryConnectionActionState,
  _formData: FormData,
): Promise<RepositoryConnectionActionState> {
  void _formData;
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  if (!parsedProjectId.success) {
    return { message: "프로젝트를 찾을 수 없거나 연결 해제 권한이 없습니다." };
  }

  let disconnected = false;
  try {
    disconnected = await disconnectProjectRepository(
      session.user.id,
      parsedProjectId.data,
    );
  } catch {
    return { message: "Repository 연결을 해제하지 못했습니다." };
  }

  if (!disconnected) {
    return { message: "프로젝트를 찾을 수 없거나 연결 해제 권한이 없습니다." };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  return { success: true, message: "Repository 연결을 해제했습니다." };
}
