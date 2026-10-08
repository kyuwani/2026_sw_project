import { z } from "zod";

export const TASK_STATUS_VALUES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const TASK_PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH"] as const;
export const TASK_DUE_FILTER_VALUES = [
  "OVERDUE",
  "TODAY",
  "UPCOMING",
  "NONE",
] as const;
export const TASK_SORT_VALUES = [
  "UPDATED_DESC",
  "DUE_ASC",
  "PRIORITY_DESC",
] as const;

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

const firstSearchParamValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

function optionalFilterSchema<T extends readonly [string, ...string[]]>(
  values: T,
) {
  return z
    .preprocess(
      (value) => {
        const firstValue = firstSearchParamValue(value);
        return firstValue === "ALL" ? undefined : firstValue;
      },
      z.enum(values).optional(),
    )
    .catch(undefined);
}

export const taskListSearchParamsSchema = z
  .object({
    status: optionalFilterSchema(TASK_STATUS_VALUES),
    priority: optionalFilterSchema(TASK_PRIORITY_VALUES),
    due: optionalFilterSchema(TASK_DUE_FILTER_VALUES),
    sort: z
      .preprocess(firstSearchParamValue, z.enum(TASK_SORT_VALUES).optional())
      .catch(undefined),
  })
  .transform(({ status, priority, due, sort }) => ({
    status,
    priority,
    due,
    sort: sort ?? "UPDATED_DESC",
  }));

export const quickTaskStatusSchema = z.enum(["DONE", "TODO"]);

export type TaskInput = z.infer<typeof taskInputSchema>;
export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];
export type TaskPriorityValue = (typeof TASK_PRIORITY_VALUES)[number];
export type TaskDueFilterValue = (typeof TASK_DUE_FILTER_VALUES)[number];
export type TaskSortValue = (typeof TASK_SORT_VALUES)[number];
export type TaskListFilters = z.infer<typeof taskListSearchParamsSchema>;
export type TaskField = keyof TaskInput;

export interface TaskFormActionState {
  message?: string;
  fieldErrors?: Partial<Record<TaskField, string[]>>;
}

export interface DeleteTaskActionState {
  message?: string;
}

export interface QuickTaskActionState {
  message?: string;
}
