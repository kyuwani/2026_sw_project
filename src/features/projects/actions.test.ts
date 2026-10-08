import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProjectAction } from "./actions";
import { createProject } from "./services/create-project";
import { deleteProject } from "./services/delete-project";
import { updateProject } from "./services/update-project";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./services/create-project", () => ({
  createProject: vi.fn(),
}));
vi.mock("./services/delete-project", () => ({ deleteProject: vi.fn() }));
vi.mock("./services/update-project", () => ({ updateProject: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "DevLog");
  formData.set("description", "개발 기록 서비스");
  formData.set("status", "IN_PROGRESS");
  formData.set("startDate", "2026-10-01");
  formData.set("endDate", "2026-10-31");
  formData.set("repositoryUrl", "https://github.com/example/devlog");
  formData.append("technologyNames", "Next.js");

  return formData;
}

describe("createProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an unauthenticated request before parsing or writing", async () => {
    authMock.mockResolvedValue(null);

    const result = await createProjectAction({}, createValidFormData());

    expect(result).toEqual({
      message: "로그인이 필요합니다. 다시 로그인해 주세요.",
    });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("uses the authenticated session ID and redirects after creation", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(createProject).mockResolvedValue({ id: "project-id" });

    await createProjectAction({}, createValidFormData());

    expect(createProject).toHaveBeenCalledWith(
      "user-id",
      expect.objectContaining({
        title: "DevLog",
        status: "IN_PROGRESS",
        technologyNames: ["Next.js"],
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(redirect).toHaveBeenCalledWith("/projects/new?created=1");
  });

  it("rejects invalid form values before writing", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    const formData = createValidFormData();
    formData.set("endDate", "2026-09-30");

    const result = await createProjectAction({}, formData);

    expect(result.fieldErrors?.endDate).toBeDefined();
    expect(createProject).not.toHaveBeenCalled();
  });
});

const projectId = "550e8400-e29b-41d4-a716-446655440000";

describe("updateProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates only with the authenticated user's ID", async () => {
    const { updateProjectAction } = await import("./actions");
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(updateProject).mockResolvedValue(true);

    await updateProjectAction(projectId, {}, createValidFormData());

    expect(updateProject).toHaveBeenCalledWith(
      "user-id",
      projectId,
      expect.objectContaining({ title: "DevLog" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(revalidatePath).toHaveBeenCalledWith(`/projects/${projectId}`);
    expect(redirect).toHaveBeenCalledWith(`/projects/${projectId}?updated=1`);
  });

  it("returns a safe error when the project is not owned", async () => {
    const { updateProjectAction } = await import("./actions");
    authMock.mockResolvedValue({
      user: { id: "other-user" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(updateProject).mockResolvedValue(false);

    await expect(
      updateProjectAction(projectId, {}, createValidFormData()),
    ).resolves.toEqual({
      message: "프로젝트를 찾을 수 없거나 수정 권한이 없습니다.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("deleteProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes only with the authenticated user's ID", async () => {
    const { deleteProjectAction } = await import("./actions");
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(deleteProject).mockResolvedValue(true);

    await deleteProjectAction(projectId, {}, new FormData());

    expect(deleteProject).toHaveBeenCalledWith("user-id", projectId);
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
    expect(redirect).toHaveBeenCalledWith("/projects?deleted=1");
  });

  it("does not delete another user's project", async () => {
    const { deleteProjectAction } = await import("./actions");
    authMock.mockResolvedValue({
      user: { id: "other-user" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(deleteProject).mockResolvedValue(false);

    await expect(
      deleteProjectAction(projectId, {}, new FormData()),
    ).resolves.toEqual({
      message: "프로젝트를 찾을 수 없거나 삭제 권한이 없습니다.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
