import { describe, expect, it } from "vitest";

import {
  buildStudyChartData,
  buildRetrospectiveSummary,
  getAverageDailyStudyMinutes,
} from "./presentation";

describe("analytics presentation", () => {
  it("keeps short periods as daily data", () => {
    expect(
      buildStudyChartData([
        { date: new Date("2026-10-01T00:00:00.000Z"), minutes: 30 },
        { date: new Date("2026-10-02T00:00:00.000Z"), minutes: 45 },
      ]),
    ).toEqual([
      { date: "2026-10-01T00:00:00.000Z", label: "10. 1.", minutes: 30 },
      { date: "2026-10-02T00:00:00.000Z", label: "10. 2.", minutes: 45 },
    ]);
  });

  it("groups long periods into seven-day data points", () => {
    const dailyStudy = Array.from({ length: 63 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 0, index + 1)),
      minutes: 10,
    }));

    const result = buildStudyChartData(dailyStudy);

    expect(result).toHaveLength(9);
    expect(result[0]).toEqual(
      expect.objectContaining({ label: "1. 1.", minutes: 70 }),
    );
  });

  it("calculates rounded daily averages and handles an empty period", () => {
    expect(getAverageDailyStudyMinutes(100, 3)).toBe(33);
    expect(getAverageDailyStudyMinutes(0, 0)).toBe(0);
  });

  it("builds a retrospective summary from exact period data", () => {
    const currentPeriod = {
      startDate: new Date("2026-10-05T00:00:00.000Z"),
      endDate: new Date("2026-10-11T00:00:00.000Z"),
      totalMinutes: 100,
      dailyStudy: [
        { date: new Date("2026-10-05T00:00:00.000Z"), minutes: 40 },
        { date: new Date("2026-10-06T00:00:00.000Z"), minutes: 60 },
      ],
    };
    const previousPeriod = {
      ...currentPeriod,
      totalMinutes: 70,
      dailyStudy: [],
    };

    expect(
      buildRetrospectiveSummary(currentPeriod, previousPeriod, [
        { id: "typescript", name: "TypeScript", minutes: 70, percentage: 70 },
      ]),
    ).toEqual({
      activeDayCount: 2,
      changeMinutes: 30,
      peakStudy: currentPeriod.dailyStudy[1],
      topTechnology: {
        id: "typescript",
        name: "TypeScript",
        minutes: 70,
        percentage: 70,
      },
      trend: "UP",
    });
  });

  it("distinguishes a new study period from equal empty periods", () => {
    const emptyPeriod = {
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2026-10-02T00:00:00.000Z"),
      totalMinutes: 0,
      dailyStudy: [],
    };

    expect(
      buildRetrospectiveSummary(
        { ...emptyPeriod, totalMinutes: 30 },
        emptyPeriod,
        [],
      ).trend,
    ).toBe("NEW");
    expect(buildRetrospectiveSummary(emptyPeriod, emptyPeriod, []).trend).toBe(
      "SAME",
    );
  });
});
