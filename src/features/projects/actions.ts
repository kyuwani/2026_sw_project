"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  createProjectSchema,
  type CreateProjectActionState,
} from "./schemas";
import { createProject } from "./services/create-project";

export async function createProjectAction(
  _previousState: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    repositoryUrl: formData.get("repositoryUrl"),
    technologyNames: formData.getAll("technologyNames"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createProject(session.user.id, parsed.data);
  } catch {
    return {
      message: "프로젝트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/projects");
  redirect("/projects/new?created=1");
}
