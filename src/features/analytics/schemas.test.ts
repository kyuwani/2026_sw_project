import { describe, expect, it } from "vitest";

import { parseAnalyticsSearchParams } from "./schemas";

describe("parseAnalyticsSearchParams", () => {
  it("defaults invalid period input to the current month", () => {
    expect(parseAnalyticsSearchParams({ period: "INVALID" })).toEqual({
      period: "MONTH",
    });
  });

  it("parses a valid custom period", () => {
    expect(
      parseAnalyticsSearchParams({
        period: "CUSTOM",
        start: "2026-10-01",
        end: "2026-10-31",
      }),
    ).toEqual({
      period: "CUSTOM",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-10-31T00:00:00.000Z"),
    });
  });

  it("falls back when a custom period is reversed or longer than a year", () => {
    expect(
      parseAnalyticsSearchParams({
        period: "CUSTOM",
        start: "2026-10-31",
        end: "2026-10-01",
      }),
    ).toEqual({ period: "MONTH" });
    expect(
      parseAnalyticsSearchParams({
        period: "CUSTOM",
        start: "2025-01-01",
        end: "2026-01-02",
      }),
    ).toEqual({ period: "MONTH" });
  });
});
