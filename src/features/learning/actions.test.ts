import { beforeEach, describe, expect, it, vi } from "vitest";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLearningLogAction,
  deleteLearningLogAction,
  updateLearningLogAction,
} from "./actions";
import { getUserTimeZone } from "./queries";
import { createLearningLog } from "./services/create-learning-log";
import { deleteLearningLog } from "./services/delete-learning-log";
import { updateLearningLog } from "./services/update-learning-log";

const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("./queries", () => ({ getUserTimeZone: vi.fn() }));
vi.mock("./services/create-learning-log", () => ({
  createLearningLog: vi.fn(),
}));
vi.mock("./services/delete-learning-log", () => ({
  deleteLearningLog: vi.fn(),
}));
vi.mock("./services/update-learning-log", () => ({
  updateLearningLog: vi.fn(),
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

const learningLogId = "550e8400-e29b-41d4-a716-446655440000";

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

    const formData = createValidFormData();
    formData.set("userId", "forged-user-id");

    await createLearningLogAction({}, formData);

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

  it("updates only with the authenticated user's ID", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(getUserTimeZone).mockResolvedValue("Asia/Seoul");
    vi.mocked(updateLearningLog).mockResolvedValue(true);

    await updateLearningLogAction(
      learningLogId,
      {},
      createValidFormData(),
    );

    expect(updateLearningLog).toHaveBeenCalledWith(
      "user-id",
      learningLogId,
      expect.objectContaining({ title: "Next.js 폼 학습" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/learning");
    expect(revalidatePath).toHaveBeenCalledWith(
      `/learning/${learningLogId}`,
    );
    expect(redirect).toHaveBeenCalledWith(
      `/learning/${learningLogId}?updated=1`,
    );
  });

  it("returns a safe error when update ownership fails", async () => {
    authMock.mockResolvedValue({
      user: { id: "other-user" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(getUserTimeZone).mockResolvedValue("Asia/Seoul");
    vi.mocked(updateLearningLog).mockResolvedValue(false);

    await expect(
      updateLearningLogAction(
        learningLogId,
        {},
        createValidFormData(),
      ),
    ).resolves.toEqual({
      message: "학습 기록을 찾을 수 없거나 수정 권한이 없습니다.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rejects malformed learning log IDs before querying or writing", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    await expect(
      updateLearningLogAction("not-a-uuid", {}, createValidFormData()),
    ).resolves.toEqual({
      message: "학습 기록을 찾을 수 없거나 수정 권한이 없습니다.",
    });
    await expect(
      deleteLearningLogAction("not-a-uuid", {}, new FormData()),
    ).resolves.toEqual({
      message: "학습 기록을 찾을 수 없거나 삭제 권한이 없습니다.",
    });

    expect(getUserTimeZone).not.toHaveBeenCalled();
    expect(updateLearningLog).not.toHaveBeenCalled();
    expect(deleteLearningLog).not.toHaveBeenCalled();
  });

  it("deletes only with the authenticated user's ID", async () => {
    authMock.mockResolvedValue({
      user: { id: "user-id" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(deleteLearningLog).mockResolvedValue(true);

    await deleteLearningLogAction(learningLogId, {}, new FormData());

    expect(deleteLearningLog).toHaveBeenCalledWith("user-id", learningLogId);
    expect(revalidatePath).toHaveBeenCalledWith("/learning");
    expect(redirect).toHaveBeenCalledWith("/learning?deleted=1");
  });

  it("does not delete another user's learning log", async () => {
    authMock.mockResolvedValue({
      user: { id: "other-user" },
      expires: "2099-01-01T00:00:00.000Z",
    });
    vi.mocked(deleteLearningLog).mockResolvedValue(false);

    await expect(
      deleteLearningLogAction(learningLogId, {}, new FormData()),
    ).resolves.toEqual({
      message: "학습 기록을 찾을 수 없거나 삭제 권한이 없습니다.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
