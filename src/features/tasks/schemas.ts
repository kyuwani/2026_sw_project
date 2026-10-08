import { z } from "zod";

export const TASK_STATUS_VALUES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;

const optionalDescriptionSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(2_000, "Task 설명은 2,000자 이하로 입력해 주세요.")
    .optional(),
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

const optionalDueDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식을 확인해 주세요.")
    .refine(isValidDateInput, "올바른 마감일을 입력해 주세요.")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .optional(),
);

export const taskInputSchema = z.object({
  title: z
    .string({ error: "Task 제목을 입력해 주세요." })
    .trim()
    .min(1, "Task 제목을 입력해 주세요.")
    .max(150, "Task 제목은 150자 이하로 입력해 주세요."),
  description: optionalDescriptionSchema,
  status: z.enum(TASK_STATUS_VALUES, {
    error: "Task 상태를 선택해 주세요.",
  }),
  priority: z.enum(TASK_PRIORITY_VALUES, {
    error: "Task 우선순위를 선택해 주세요.",
  }),
  dueDate: optionalDueDateSchema,
});

export const taskIdSchema = z.uuid("올바르지 않은 Task입니다.");

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITY_VALUES)[number];
export type TaskField = keyof TaskInput;

export interface TaskFormActionState {
  message?: string;
  fieldErrors?: Partial<Record<TaskField, string[]>>;
}

export interface DeleteTaskActionState {
  message?: string;
}
