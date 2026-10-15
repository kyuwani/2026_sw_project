import { z } from "zod";

export const ANALYTICS_PERIOD_VALUES = ["WEEK", "MONTH", "CUSTOM"] as const;

export type AnalyticsPeriodSelection =
  | { period: "WEEK" }
  | { period: "MONTH" }
  | { period: "CUSTOM"; startDate: Date; endDate: Date };

function firstSearchParamValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function isValidDateInput(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateSearchParamSchema = z.preprocess(
  firstSearchParamValue,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isValidDateInput)
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .optional(),
);

const rawAnalyticsSearchParamsSchema = z.object({
  period: z.preprocess(
    firstSearchParamValue,
    z.enum(ANALYTICS_PERIOD_VALUES).catch("MONTH"),
  ),
  start: dateSearchParamSchema.catch(undefined),
  end: dateSearchParamSchema.catch(undefined),
});

export function parseAnalyticsSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): AnalyticsPeriodSelection {
  const parsed = rawAnalyticsSearchParamsSchema.parse(searchParams);

  if (parsed.period !== "CUSTOM") {
    return { period: parsed.period };
  }

  if (!parsed.start || !parsed.end || parsed.end < parsed.start) {
    return { period: "MONTH" };
  }

  const dayCount =
    (parsed.end.getTime() - parsed.start.getTime()) / (24 * 60 * 60 * 1_000) +
    1;
  if (dayCount > 366) {
    return { period: "MONTH" };
  }

  return {
    period: "CUSTOM",
    startDate: parsed.start,
    endDate: parsed.end,
  };
}
