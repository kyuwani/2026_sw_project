import { describe, expect, it } from "vitest";

import { getStudyBarHeight, isFirstDashboardVisit } from "./presentation";

describe("dashboard presentation", () => {
  it("treats users without projects and learning logs as first visitors", () => {
    expect(
      isFirstDashboardVisit({
        summary: { totalProjects: 0 },
        recentLearningLogs: [],
      }),
    ).toBe(true);

    expect(
      isFirstDashboardVisit({
        summary: { totalProjects: 1 },
        recentLearningLogs: [],
      }),
    ).toBe(false);
  });

  it("does not draw a bar for zero minutes", () => {
    expect(getStudyBarHeight(0, 60)).toBe(0);
    expect(getStudyBarHeight(3, 60)).toBe(10);
    expect(getStudyBarHeight(60, 60)).toBe(100);
  });
});
