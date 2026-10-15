import { describe, expect, it } from "vitest";

import {
  aggregateStudyPeriod,
  calculateTaskCompletion,
  calculateTechnologyStudyBreakdown,
  getAnalyticsPeriods,
  getLearningActivityPeriod,
  getStudyIntensityLevel,
} from "./aggregation";

describe("analytics aggregation", () => {
  it("calculates week and month boundaries in the user's time zone", () => {
    const periods = getAnalyticsPeriods(
      new Date("2026-10-31T16:00:00.000Z"),
      "Asia/Seoul",
    );

    expect(periods.today).toEqual(new Date("2026-11-01T00:00:00.000Z"));
    expect(periods.week).toEqual({
      startDate: new Date("2026-10-26T00:00:00.000Z"),
      endDate: new Date("2026-11-01T00:00:00.000Z"),
    });
    expect(periods.month).toEqual({
      startDate: new Date("2026-11-01T00:00:00.000Z"),
      endDate: new Date("2026-11-30T00:00:00.000Z"),
    });
  });

  it("creates a 365-day learning activity period ending today", () => {
    expect(
      getLearningActivityPeriod(new Date("2026-10-15T00:00:00.000Z")),
    ).toEqual({
      startDate: new Date("2025-10-16T00:00:00.000Z"),
      endDate: new Date("2026-10-15T00:00:00.000Z"),
    });
  });

  it("maps study minutes to fixed heatmap intensity levels", () => {
    expect([0, 1, 29, 30, 59, 60, 119, 120].map(getStudyIntensityLevel)).toEqual(
      [0, 1, 1, 2, 2, 3, 3, 4],
    );
  });

  it("fills missing days with zero and excludes records outside the period", () => {
    const summary = aggregateStudyPeriod(
      [
        { studiedAt: new Date("2026-10-05T00:00:00.000Z"), studyMinutes: 30 },
        { studiedAt: new Date("2026-10-05T00:00:00.000Z"), studyMinutes: 45 },
        { studiedAt: new Date("2026-10-12T00:00:00.000Z"), studyMinutes: 90 },
      ],
      {
        startDate: new Date("2026-10-05T00:00:00.000Z"),
        endDate: new Date("2026-10-11T00:00:00.000Z"),
      },
    );

    expect(summary.totalMinutes).toBe(75);
    expect(summary.dailyStudy).toHaveLength(7);
    expect(summary.dailyStudy.map(({ minutes }) => minutes)).toEqual([
      75, 0, 0, 0, 0, 0, 0,
    ]);
  });

  it("returns consistent zero values when there are no records", () => {
    const period = {
      startDate: new Date("2026-02-01T00:00:00.000Z"),
      endDate: new Date("2026-02-28T00:00:00.000Z"),
    };

    expect(aggregateStudyPeriod([], period)).toEqual({
      ...period,
      totalMinutes: 0,
      dailyStudy: expect.arrayContaining([
        { date: period.startDate, minutes: 0 },
      ]),
    });
    expect(aggregateStudyPeriod([], period).dailyStudy).toHaveLength(28);
    expect(calculateTaskCompletion([])).toEqual({
      totalCount: 0,
      completedCount: 0,
      completionRate: 0,
    });
    expect(calculateTechnologyStudyBreakdown([])).toEqual([]);
  });

  it("calculates Task completion rate from current statuses", () => {
    expect(calculateTaskCompletion(["DONE", "TODO", "DONE"])).toEqual({
      totalCount: 3,
      completedCount: 2,
      completionRate: 67,
    });
  });

  it("allocates a multi-technology record evenly without inflating time", () => {
    const result = calculateTechnologyStudyBreakdown([
      {
        studyMinutes: 60,
        technologies: [
          { technology: { id: "react", name: "React" } },
          { technology: { id: "typescript", name: "TypeScript" } },
        ],
      },
      {
        studyMinutes: 30,
        technologies: [
          { technology: { id: "typescript", name: "TypeScript" } },
        ],
      },
      { studyMinutes: 120, technologies: [] },
    ]);

    expect(result).toEqual([
      { id: "typescript", name: "TypeScript", minutes: 60, percentage: 66.7 },
      { id: "react", name: "React", minutes: 30, percentage: 33.3 },
    ]);
  });
});
