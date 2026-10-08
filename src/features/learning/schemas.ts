import { z } from "zod";

import { TECHNOLOGY_OPTIONS } from "@/features/technologies/constants";
import { getDateInTimeZone, isValidTimeZone } from "@/lib/date/time-zone";

export const LEARNING_CATEGORY_VALUES = [
  "LANGUAGE",
  "FRAMEWORK",
  "ALGORITHM",
  "DATABASE",
  "DEVOPS",
  "OTHER",
] as const;

const durationPartSchema = (max: number, message: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : value,
    z.number({ error: message }).int(message).min(0, message).max(max, message),
  );

function isValidDateInput(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

interface LearningLogSchemaOptions {
  timeZone: string;
  now?: Date;
}

export function createLearningLogInputSchema({
  timeZone,
  now = new Date(),
}: LearningLogSchemaOptions) {
  if (!isValidTimeZone(timeZone)) {
    throw new Error("올바르지 않은 사용자 시간대입니다.");
  }

  const today = getDateInTimeZone(now, timeZone);

  return z
    .object({
      title: z
        .string({ error: "학습 제목을 입력해 주세요." })
        .trim()
        .min(1, "학습 제목을 입력해 주세요.")
        .max(150, "학습 제목은 150자 이하로 입력해 주세요."),
      content: z
        .string({ error: "학습 내용을 입력해 주세요." })
        .trim()
        .min(1, "학습 내용을 입력해 주세요.")
        .max(10_000, "학습 내용은 10,000자 이하로 입력해 주세요."),
      studiedAt: z
        .string({ error: "학습 날짜를 입력해 주세요." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식을 확인해 주세요.")
        .refine(isValidDateInput, "올바른 학습 날짜를 입력해 주세요.")
        .transform((value) => new Date(`${value}T00:00:00.000Z`))
        .refine(
          (value) => value.getTime() <= today.getTime(),
          "미래 날짜에는 학습 기록을 작성할 수 없습니다.",
        ),
      studyHours: durationPartSchema(
        24,
        "학습 시간은 0시간에서 24시간 사이로 입력해 주세요.",
      ),
      studyMinutesPart: durationPartSchema(
        59,
        "학습 분은 0분에서 59분 사이로 입력해 주세요.",
      ),
      category: z.enum(LEARNING_CATEGORY_VALUES, {
        error: "학습 카테고리를 선택해 주세요.",
      }),
      technologyNames: z
        .array(
          z.enum(TECHNOLOGY_OPTIONS, {
            error: "올바르지 않은 기술이 선택되었습니다.",
          }),
        )
        .max(20, "기술 스택은 최대 20개까지 선택할 수 있습니다.")
        .refine(
          (technologyNames) =>
            new Set(technologyNames).size === technologyNames.length,
          "동일한 기술을 중복해서 선택할 수 없습니다.",
        ),
    })
    .refine(
      ({ studyHours, studyMinutesPart }) =>
        studyHours * 60 + studyMinutesPart >= 1,
      {
        message: "학습 시간은 1분 이상 입력해 주세요.",
        path: ["studyMinutesPart"],
      },
    )
    .refine(
      ({ studyHours, studyMinutesPart }) =>
        studyHours * 60 + studyMinutesPart <= 24 * 60,
      {
        message: "학습 시간은 최대 24시간까지 입력할 수 있습니다.",
        path: ["studyMinutesPart"],
      },
    )
    .transform(({ studyHours, studyMinutesPart, ...input }) => ({
      ...input,
      studyMinutes: studyHours * 60 + studyMinutesPart,
    }));
}

export type LearningLogInput = z.output<
  ReturnType<typeof createLearningLogInputSchema>
>;
export type LearningLogField =
  | "title"
  | "content"
  | "studiedAt"
  | "studyHours"
  | "studyMinutesPart"
  | "category"
  | "technologyNames";

export interface LearningLogFormActionState {
  message?: string;
  fieldErrors?: Partial<Record<LearningLogField, string[]>>;
}
