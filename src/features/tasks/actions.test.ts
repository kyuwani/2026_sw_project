import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createTaskAction,
  deleteTaskAction,
  setTaskCompletionAction,
  updateTaskAction,
} from "./actions";
import { createTask } from "./services/create-task";
import { deleteTask } from "./services/delete-task";
import { setTaskCompletion } from "./services/set-task-completion";
import { updateTask } from "./services/update-task";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./services/create-task", () => ({ createTask: vi.fn() }));
vi.mock("./services/delete-task", () => ({ deleteTask: vi.fn() }));
vi.mock("./services/set-task-completion", () => ({
  setTaskCompletion: vi.fn(),
}));
vi.mock("./services/update-task", () => ({ updateTask: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const projectId = "550e8400-e29b-41d4-a716-446655440000";
const taskId = "8f14e45f-ea9a-4c3f-9c72-0f3c57a638a4";

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "Task CRUD 구현");
  formData.set("description", "Task 기능을 구현한다.");
  formData.set("status", "IN_PROGRESS");
  formData.set("priority", "HIGH");
  formData.set("dueDate", "2026-10-20");
  return formData;
}

describe("task actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects Task creation when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      createTaskAction(projectId, {}, createValidFormData()),
    ).resolves.toEqual({
      message: "로그인이 필요합니다. 다시 로그인해 주세요.",
    });
    expect(createTask).not.toHaveBeenCalled();
  });

  it("creates a Task with the authenticated user's ID", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(createTask).mockResolvedValue({ id: taskId });

    await createTaskAction(projectId, {}, createValidFormData());

    expect(createTask).toHaveBeenCalledWith(
      "user-id",
      projectId,
      expect.objectContaining({ title: "Task CRUD 구현" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(redirect).toHaveBeenCalledWith(
      `/projects/${projectId}?taskCreated=1`,
    );
  });

  it("returns a safe error when Task update ownership fails", async () => {
    authMock.mockResolvedValue({
      user: { id: "other-user" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(updateTask).mockResolvedValue(false);

    await expect(
      updateTaskAction(projectId, taskId, {}, createValidFormData()),
    ).resolves.toEqual({
      message: "프로젝트를 찾을 수 없거나 Task 수정 권한이 없습니다.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("deletes a Task with authenticated ownership", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(deleteTask).mockResolvedValue(true);

    await deleteTaskAction(projectId, taskId, {}, new FormData());

    expect(deleteTask).toHaveBeenCalledWith("user-id", projectId, taskId);
    expect(revalidatePath).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(redirect).toHaveBeenCalledWith(
      `/projects/${projectId}?taskDeleted=1`,
    );
  });

  it("quickly completes a Task and revalidates progress views", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(setTaskCompletion).mockResolvedValue(true);

    await expect(
      setTaskCompletionAction(
        projectId,
        taskId,
        "DONE",
        {},
        new FormData(),
      ),
    ).resolves.toEqual({});

    expect(setTaskCompletion).toHaveBeenCalledWith(
      "user-id",
      projectId,
      taskId,
      "DONE",
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(revalidatePath).toHaveBeenCalledWith("/tasks");
  });

  it("rejects an unsupported quick status before writing", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await expect(
      setTaskCompletionAction(
        projectId,
        taskId,
        "IN_PROGRESS",
        {},
        new FormData(),
      ),
    ).resolves.toEqual({ message: "Task 상태를 변경할 수 없습니다." });
    expect(setTaskCompletion).not.toHaveBeenCalled();
  });
});
