"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  createProjectSchema,
  projectIdSchema,
  type CreateProjectActionState,
  type DeleteProjectActionState,
  type UpdateProjectActionState,
} from "./schemas";
import { createProject } from "./services/create-project";
import { deleteProject } from "./services/delete-project";
import { updateProject } from "./services/update-project";

function getProjectFormValues(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    repositoryUrl: formData.get("repositoryUrl"),
    technologyNames: formData.getAll("technologyNames"),
  };
}

export async function createProjectAction(
  _previousState: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsed = createProjectSchema.safeParse(getProjectFormValues(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let project: Awaited<ReturnType<typeof createProject>>;

  try {
    project = await createProject(session.user.id, parsed.data);
  } catch {
    return {
      message: "프로젝트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}?created=1`);
}

export async function updateProjectAction(
  projectId: string,
  _previousState: UpdateProjectActionState,
  formData: FormData,
): Promise<UpdateProjectActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedInput = createProjectSchema.safeParse(
    getProjectFormValues(formData),
  );

  if (!parsedProjectId.success) {
    return { message: "프로젝트를 찾을 수 없거나 수정 권한이 없습니다." };
  }

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  let updated = false;

  try {
    updated = await updateProject(
      session.user.id,
      parsedProjectId.data,
      parsedInput.data,
    );
  } catch {
    return {
      message: "프로젝트를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!updated) {
    return { message: "프로젝트를 찾을 수 없거나 수정 권한이 없습니다." };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsedProjectId.data}`);
  redirect(`/projects/${parsedProjectId.data}?updated=1`);
}

export async function deleteProjectAction(
  projectId: string,
  _previousState: DeleteProjectActionState,
  _formData: FormData,
): Promise<DeleteProjectActionState> {
  void _formData;
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);

  if (!parsedProjectId.success) {
    return { message: "프로젝트를 찾을 수 없거나 삭제 권한이 없습니다." };
  }

  let deleted = false;

  try {
    deleted = await deleteProject(session.user.id, parsedProjectId.data);
  } catch {
    return {
      message: "프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!deleted) {
    return { message: "프로젝트를 찾을 수 없거나 삭제 권한이 없습니다." };
  }

  revalidatePath("/projects");
  redirect("/projects?deleted=1");
}
