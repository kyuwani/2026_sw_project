import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLearningLogAction } from "./actions";
import { getUserTimeZone } from "./queries";
import { createLearningLog } from "./services/create-learning-log";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./queries", () => ({ getUserTimeZone: vi.fn() }));
vi.mock("./services/create-learning-log", () => ({
  createLearningLog: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

function createValidFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "Next.js 폼 학습");
  formData.set("content", "Server Action과 폼 검증을 학습했다.");
  formData.set("studiedAt", "2026-10-08");
  formData.set("studyHours", "1");
  formData.set("studyMinutesPart", "30");
  formData.set("category", "FRAMEWORK");
  formData.append("technologyNames", "Next.js");
  formData.append("technologyNames", "TypeScript");
  return formData;
}

describe("learning log actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T12:00:00.000Z"));
  });

  it("rejects creation when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      createLearningLogAction({}, createValidFormData()),
    ).resolves.toEqual({
      message: "로그인이 필요합니다. 다시 로그인해 주세요.",
    });
    expect(createLearningLog).not.toHaveBeenCalled();
  });

  it("creates a learning log using the authenticated user's time zone", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(getUserTimeZone).mockResolvedValue("Asia/Seoul");
    vi.mocked(createLearningLog).mockResolvedValue({ id: "learning-log-id" });

    await createLearningLogAction({}, createValidFormData());

    expect(getUserTimeZone).toHaveBeenCalledWith("user-id");
    expect(createLearningLog).toHaveBeenCalledWith(
      "user-id",
      expect.objectContaining({
        category: "FRAMEWORK",
        studyMinutes: 90,
        technologyNames: ["Next.js", "TypeScript"],
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/learning");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(redirect).toHaveBeenCalledWith("/learning?created=1");
  });

  it("rejects a future date before writing", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(getUserTimeZone).mockResolvedValue("Asia/Seoul");
    const formData = createValidFormData();
    formData.set("studiedAt", "2026-10-10");

    const result = await createLearningLogAction({}, formData);

    expect(result.fieldErrors?.studiedAt).toContain(
      "미래 날짜에는 학습 기록을 작성할 수 없습니다.",
    );
    expect(createLearningLog).not.toHaveBeenCalled();
  });
});
