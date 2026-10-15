import { describe, expect, it } from "vitest";

import {
  getDateInTimeZone,
  getDateStringInTimeZone,
  isValidTimeZone,
} from "./time-zone";

describe("time-zone utilities", () => {
  it("uses the requested time zone at a UTC date boundary", () => {
    const date = new Date("2026-10-08T15:30:00.000Z");

    expect(getDateStringInTimeZone(date, "UTC")).toBe("2026-10-08");
    expect(getDateStringInTimeZone(date, "Asia/Seoul")).toBe("2026-10-09");
    expect(getDateInTimeZone(date, "Asia/Seoul").toISOString()).toBe(
      "2026-10-09T00:00:00.000Z",
    );
  });

  it("rejects unsupported time zone names", () => {
    expect(isValidTimeZone("Invalid/Timezone")).toBe(false);
    expect(() =>
      getDateStringInTimeZone(new Date(), "Invalid/Timezone"),
    ).toThrow("올바르지 않은 시간대입니다.");
  });
});
