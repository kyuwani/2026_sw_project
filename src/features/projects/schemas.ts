import { z } from "zod";

export const PROJECT_STATUS_VALUES = [
  "PLANNING",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const PROJECT_TECHNOLOGY_OPTIONS = [
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "PostgreSQL",
  "Prisma",
  "Tailwind CSS",
] as const;

const optionalTextSchema = (maxLength: number, message: string) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength, message).optional(),
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

function isParsedDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식을 확인해 주세요.")
    .refine(isValidDateInput, "올바른 날짜를 입력해 주세요.")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .optional(),
);

const optionalRepositoryUrlSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .max(500, "Repository URL은 500자 이하로 입력해 주세요.")
    .regex(
      /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]+\/?$/,
      "GitHub Repository URL 형식으로 입력해 주세요.",
    )
    .optional(),
);

export const createProjectSchema = z
  .object({
    title: z
      .string({ error: "프로젝트 이름을 입력해 주세요." })
      .trim()
      .min(1, "프로젝트 이름을 입력해 주세요.")
      .max(100, "프로젝트 이름은 100자 이하로 입력해 주세요."),
    description: optionalTextSchema(
      2_000,
      "프로젝트 설명은 2,000자 이하로 입력해 주세요.",
    ),
    status: z.enum(PROJECT_STATUS_VALUES, {
      error: "프로젝트 상태를 선택해 주세요.",
    }),
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    repositoryUrl: optionalRepositoryUrlSchema,
    technologyNames: z
      .array(
        z.enum(PROJECT_TECHNOLOGY_OPTIONS, {
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
    ({ startDate, endDate }) =>
      !isParsedDate(startDate) ||
      !isParsedDate(endDate) ||
      endDate.getTime() >= startDate.getTime(),
    {
      message: "종료일은 시작일과 같거나 이후여야 합니다.",
      path: ["endDate"],
    },
  );

const firstSearchParamValue = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

const projectSearchQuerySchema = z
  .preprocess(
    firstSearchParamValue,
    z.string().trim().max(100).optional(),
  )
  .catch(undefined);

const projectStatusFilterSchema = z
  .preprocess(
    (value) => {
      const firstValue = firstSearchParamValue(value);
      return firstValue === "ALL" ? undefined : firstValue;
    },
    z.enum(PROJECT_STATUS_VALUES).optional(),
  )
  .catch(undefined);

export const projectListSearchParamsSchema = z
  .object({
    q: projectSearchQuerySchema,
    status: projectStatusFilterSchema,
  })
  .transform(({ q, status }) => ({
    query: q ?? "",
    status,
  }));

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectListFilters = z.infer<
  typeof projectListSearchParamsSchema
>;
export type ProjectStatusValue = (typeof PROJECT_STATUS_VALUES)[number];
export type ProjectField =
  | "title"
  | "description"
  | "status"
  | "startDate"
  | "endDate"
  | "repositoryUrl"
  | "technologyNames";

export interface CreateProjectActionState {
  message?: string;
  fieldErrors?: Partial<Record<ProjectField, string[]>>;
}
