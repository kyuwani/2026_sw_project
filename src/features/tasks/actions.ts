"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { projectIdSchema } from "@/features/projects/schemas";
import {
  taskIdSchema,
  taskInputSchema,
  quickTaskStatusSchema,
  type DeleteTaskActionState,
  type QuickTaskActionState,
  type TaskFormActionState,
} from "./schemas";
import { createTask } from "./services/create-task";
import { deleteTask } from "./services/delete-task";
import { setTaskCompletion } from "./services/set-task-completion";
import { updateTask } from "./services/update-task";

function getTaskFormValues(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  };
}

function invalidProjectMessage(action: "추가" | "수정" | "삭제"): string {
  return `프로젝트를 찾을 수 없거나 Task ${action} 권한이 없습니다.`;
}

export async function createTaskAction(
  projectId: string,
  _previousState: TaskFormActionState,
  formData: FormData,
): Promise<TaskFormActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedInput = taskInputSchema.safeParse(getTaskFormValues(formData));

  if (!parsedProjectId.success) {
    return { message: invalidProjectMessage("추가") };
  }

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  try {
    const task = await createTask(
      session.user.id,
      parsedProjectId.data,
      parsedInput.data,
    );

    if (!task) {
      return { message: invalidProjectMessage("추가") };
    }
  } catch {
    return {
      message: "Task를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  revalidatePath("/tasks");
  redirect(`/projects/${parsedProjectId.data}?taskCreated=1`);
}

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  _previousState: TaskFormActionState,
  formData: FormData,
): Promise<TaskFormActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedTaskId = taskIdSchema.safeParse(taskId);
  const parsedInput = taskInputSchema.safeParse(getTaskFormValues(formData));

  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { message: invalidProjectMessage("수정") };
  }

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  try {
    const updated = await updateTask(
      session.user.id,
      parsedProjectId.data,
      parsedTaskId.data,
      parsedInput.data,
    );

    if (!updated) {
      return { message: invalidProjectMessage("수정") };
    }
  } catch {
    return {
      message: "Task를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  revalidatePath("/tasks");
  redirect(`/projects/${parsedProjectId.data}?taskUpdated=1`);
}

export async function deleteTaskAction(
  projectId: string,
  taskId: string,
  _previousState: DeleteTaskActionState,
  formData: FormData,
): Promise<DeleteTaskActionState> {
  void formData;
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedTaskId = taskIdSchema.safeParse(taskId);

  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { message: invalidProjectMessage("삭제") };
  }

  try {
    const deleted = await deleteTask(
      session.user.id,
      parsedProjectId.data,
      parsedTaskId.data,
    );

    if (!deleted) {
      return { message: invalidProjectMessage("삭제") };
    }
  } catch {
    return {
      message: "Task를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  revalidatePath("/tasks");
  redirect(`/projects/${parsedProjectId.data}?taskDeleted=1`);
}

export async function setTaskCompletionAction(
  projectId: string,
  taskId: string,
  nextStatus: string,
  _previousState: QuickTaskActionState,
  formData: FormData,
): Promise<QuickTaskActionState> {
  void formData;
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedProjectId = projectIdSchema.safeParse(projectId);
  const parsedTaskId = taskIdSchema.safeParse(taskId);
  const parsedStatus = quickTaskStatusSchema.safeParse(nextStatus);

  if (
    !parsedProjectId.success ||
    !parsedTaskId.success ||
    !parsedStatus.success
  ) {
    return { message: "Task 상태를 변경할 수 없습니다." };
  }

  try {
    const updated = await setTaskCompletion(
      session.user.id,
      parsedProjectId.data,
      parsedTaskId.data,
      parsedStatus.data,
    );

    if (!updated) {
      return { message: "Task를 찾을 수 없거나 변경 권한이 없습니다." };
    }
  } catch {
    return {
      message: "Task 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath(`/projects/${parsedProjectId.data}`);
  revalidatePath("/projects");
  revalidatePath("/tasks");
  return {};
}
