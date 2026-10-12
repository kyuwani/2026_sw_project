import { describe, expect, it } from "vitest";

import { calculateLearningStreak } from "./streak";

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe("calculateLearningStreak", () => {
  const today = date("2026-10-12");

  it("counts consecutive study days through today", () => {
    expect(
      calculateLearningStreak(
        [date("2026-10-12"), date("2026-10-11"), date("2026-10-10")],
        today,
      ),
    ).toBe(3);
  });

  it("keeps the streak when the most recent study day is yesterday", () => {
    expect(
      calculateLearningStreak(
        [date("2026-10-11"), date("2026-10-10")],
        today,
      ),
    ).toBe(2);
  });

  it("returns zero when both today and yesterday are missing", () => {
    expect(calculateLearningStreak([date("2026-10-10")], today)).toBe(0);
  });

  it("does not double-count duplicate records from the same day", () => {
    expect(
      calculateLearningStreak(
        [date("2026-10-12"), date("2026-10-12"), date("2026-10-11")],
        today,
      ),
    ).toBe(2);
  });

  it("stops at the first missing calendar day", () => {
    expect(
      calculateLearningStreak(
        [date("2026-10-12"), date("2026-10-10"), date("2026-10-09")],
        today,
      ),
    ).toBe(1);
  });
});
