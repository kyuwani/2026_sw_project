import type {
  DailyStudyItem,
  StudyPeriodSummary,
  TechnologyStudyItem,
} from "./aggregation";

export interface StudyChartItem {
  date: string;
  label: string;
  minutes: number;
}

export interface RetrospectiveSummary {
  activeDayCount: number;
  changeMinutes: number;
  peakStudy: DailyStudyItem | null;
  topTechnology: TechnologyStudyItem | null;
  trend: "NEW" | "UP" | "DOWN" | "SAME";
}

const shortDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

function toChartItem(items: DailyStudyItem[]): StudyChartItem {
  const firstItem = items[0];
  return {
    date: firstItem.date.toISOString(),
    label: shortDateFormatter.format(firstItem.date),
    minutes: items.reduce((total, item) => total + item.minutes, 0),
  };
}

export function buildStudyChartData(
  dailyStudy: DailyStudyItem[],
): StudyChartItem[] {
  if (dailyStudy.length <= 62) {
    return dailyStudy.map((item) => toChartItem([item]));
  }

  const weeklyStudy: StudyChartItem[] = [];
  for (let index = 0; index < dailyStudy.length; index += 7) {
    weeklyStudy.push(toChartItem(dailyStudy.slice(index, index + 7)));
  }
  return weeklyStudy;
}

export function getAverageDailyStudyMinutes(
  totalMinutes: number,
  dayCount: number,
): number {
  return dayCount === 0 ? 0 : Math.round(totalMinutes / dayCount);
}

export function buildRetrospectiveSummary(
  currentStudy: StudyPeriodSummary,
  previousStudy: StudyPeriodSummary,
  technologyStudy: TechnologyStudyItem[],
): RetrospectiveSummary {
  const changeMinutes =
    currentStudy.totalMinutes - previousStudy.totalMinutes;
  const peakStudy = currentStudy.dailyStudy.reduce<DailyStudyItem | null>(
    (peak, item) =>
      item.minutes > 0 && (!peak || item.minutes > peak.minutes) ? item : peak,
    null,
  );

  return {
    activeDayCount: currentStudy.dailyStudy.filter(({ minutes }) => minutes > 0)
      .length,
    changeMinutes,
    peakStudy,
    topTechnology: technologyStudy[0] ?? null,
    trend:
      previousStudy.totalMinutes === 0 && currentStudy.totalMinutes > 0
        ? "NEW"
        : changeMinutes > 0
          ? "UP"
          : changeMinutes < 0
            ? "DOWN"
            : "SAME",
  };
}
