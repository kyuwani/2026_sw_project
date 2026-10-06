import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProjectAction } from "./actions";
import { createProject } from "./services/create-project";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./services/create-project", () => ({
  createProject: vi.fn(),
}));
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
