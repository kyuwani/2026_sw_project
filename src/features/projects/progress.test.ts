import { describe, expect, it } from "vitest";

import { calculateTaskProgress } from "./progress";

describe("calculateTaskProgress", () => {
  it("returns 0 when a project has no Tasks", () => {
    expect(calculateTaskProgress(0, 0)).toBe(0);
  });

  it("returns 100 when every Task is complete", () => {
    expect(calculateTaskProgress(3, 3)).toBe(100);
  });

  it("rounds partial progress to the nearest integer", () => {
    expect(calculateTaskProgress(3, 2)).toBe(67);
  });
});
