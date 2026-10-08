import { describe, expect, it } from "vitest";

import {
  createLearningLogInputSchema,
  learningLogIdSchema,
  learningLogListSearchParamsSchema,
} from "./schemas";

const now = new Date("2026-10-08T15:30:00.000Z");
const schema = createLearningLogInputSchema({
  timeZone: "Asia/Seoul",
  now,
});

const validInput = {
  title: "  Server Action 학습  ",
  content: "  폼 검증과 오류 처리를 학습했다.  ",
  studiedAt: "2026-10-09",
  studyHours: "1",
  studyMinutesPart: "30",
  category: "FRAMEWORK",
  technologyNames: ["Next.js", "TypeScript"],
};

describe("createLearningLogInputSchema", () => {
  it("uses the user's time zone and normalizes valid input", () => {
    const result = schema.safeParse(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Server Action 학습");
      expect(result.data.studyMinutes).toBe(90);
      expect(result.data.studiedAt.toISOString()).toBe(
        "2026-10-09T00:00:00.000Z",
      );
    }
  });

  it("rejects a future date in the user's time zone", () => {
    const result = schema.safeParse({
      ...validInput,
      studiedAt: "2026-10-10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.studiedAt).toContain(
        "미래 날짜에는 학습 기록을 작성할 수 없습니다.",
      );
    }
  });

  it("requires at least one minute and allows at most 24 hours", () => {
    const zero = schema.safeParse({
      ...validInput,
      studyHours: "0",
      studyMinutesPart: "0",
    });
    const tooLong = schema.safeParse({
      ...validInput,
      studyHours: "24",
      studyMinutesPart: "1",
    });

    expect(zero.success).toBe(false);
    expect(tooLong.success).toBe(false);
  });

  it("rejects unsupported categories and duplicate technologies", () => {
    const category = schema.safeParse({
      ...validInput,
      category: "READING",
    });
    const duplicateTechnology = schema.safeParse({
      ...validInput,
      technologyNames: ["Next.js", "Next.js"],
    });

    expect(category.success).toBe(false);
    expect(duplicateTechnology.success).toBe(false);
  });
});

describe("learning log route schemas", () => {
  it("normalizes a valid list page and falls back for invalid input", () => {
    expect(
      learningLogListSearchParamsSchema.parse({ page: "3" }),
    ).toEqual({ page: 3 });
    expect(
      learningLogListSearchParamsSchema.parse({ page: ["-1", "2"] }),
    ).toEqual({ page: 1 });
    expect(learningLogListSearchParamsSchema.parse({})).toEqual({ page: 1 });
  });

  it("accepts only UUID learning log IDs", () => {
    expect(
      learningLogIdSchema.safeParse("550e8400-e29b-41d4-a716-446655440000")
        .success,
    ).toBe(true);
    expect(learningLogIdSchema.safeParse("not-a-learning-log").success).toBe(
      false,
    );
  });
});
