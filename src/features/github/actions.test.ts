import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import {
  connectProjectRepositoryAction,
  disconnectProjectRepositoryAction,
} from "./actions";
import {
  connectProjectRepository,
  disconnectProjectRepository,
} from "./repository-cache";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./repository-cache", () => ({
  connectProjectRepository: vi.fn(),
  disconnectProjectRepository: vi.fn(),
}));

const projectId = "550e8400-e29b-41d4-a716-446655440000";

describe("GitHub repository connection actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
  });

  it("validates input and uses the authenticated user ID", async () => {
    vi.mocked(connectProjectRepository).mockResolvedValue("CONNECTED");
    const formData = new FormData();
    formData.set("repositoryId", "123");

    await expect(
      connectProjectRepositoryAction(projectId, {}, formData),
    ).resolves.toEqual({
      success: true,
      message: "Repository를 연결했습니다.",
    });
    expect(connectProjectRepository).toHaveBeenCalledWith(
      "user-id",
      projectId,
      123,
    );
    expect(revalidatePath).toHaveBeenCalledWith(`/projects/${projectId}`);
  });

  it("rejects a forged repository ID before calling the service", async () => {
    const formData = new FormData();
    formData.set("repositoryId", "123abc");

    await expect(
      connectProjectRepositoryAction(projectId, {}, formData),
    ).resolves.toEqual({ message: "올바른 Repository를 선택해 주세요." });
    expect(connectProjectRepository).not.toHaveBeenCalled();
  });

  it("disconnects through an ownership-scoped service", async () => {
    vi.mocked(disconnectProjectRepository).mockResolvedValue(true);

    await expect(
      disconnectProjectRepositoryAction(projectId, {}, new FormData()),
    ).resolves.toEqual({
      success: true,
      message: "Repository 연결을 해제했습니다.",
    });
    expect(disconnectProjectRepository).toHaveBeenCalledWith(
      "user-id",
      projectId,
    );
    expect(revalidatePath).toHaveBeenCalledWith("/projects");
  });
});
