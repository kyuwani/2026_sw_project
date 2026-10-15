import { describe, expect, it } from "vitest";

import { formatLearningDate, formatStudyDuration } from "./presentation";

describe("learning presentation", () => {
  it.each([
    [30, "30분"],
    [60, "1시간"],
    [90, "1시간 30분"],
  ])("formats %i study minutes", (minutes, expected) => {
    expect(formatStudyDuration(minutes)).toBe(expected);
  });

  it("formats database dates without a local time-zone shift", () => {
    expect(formatLearningDate(new Date("2026-10-08T00:00:00.000Z"))).toBe(
      "2026년 10월 8일",
    );
  });
});
