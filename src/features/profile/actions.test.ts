import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { updateSession } from "@/auth";
import { updateProfileAction } from "./actions";
import { updateProfile } from "./services/update-profile";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({
  auth: authMock,
  updateSession: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./services/update-profile", () => ({ updateProfile: vi.fn() }));

function validFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "개발자");
  formData.set("bio", "소개");
  formData.set("githubUrl", "https://github.com/octocat");
  formData.set("timezone", "Asia/Seoul");
  formData.append("primaryTechnologies", "TypeScript");
  formData.append("primaryTechnologies", "Next.js");
  return formData;
}

describe("updateProfileAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
  });

  it("uses the authenticated user and refreshes profile-dependent routes", async () => {
    vi.mocked(updateProfile).mockResolvedValue(true);

    await expect(updateProfileAction({}, validFormData())).resolves.toEqual({
      success: true,
      message: "프로필을 저장했습니다.",
    });
    expect(updateProfile).toHaveBeenCalledWith(
      "user-id",
      expect.objectContaining({
        name: "개발자",
        timezone: "Asia/Seoul",
        primaryTechnologies: ["TypeScript", "Next.js"],
      }),
    );
    expect(updateSession).toHaveBeenCalledWith({});
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/analytics");
  });

  it("rejects invalid time zones before writing", async () => {
    const formData = validFormData();
    formData.set("timezone", "Invalid/Timezone");

    const result = await updateProfileAction({}, formData);

    expect(result.fieldErrors?.timezone).toBeDefined();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated request", async () => {
    authMock.mockResolvedValue(null);

    await expect(updateProfileAction({}, validFormData())).resolves.toEqual({
      message: "로그인이 필요합니다. 다시 로그인해 주세요.",
    });
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
