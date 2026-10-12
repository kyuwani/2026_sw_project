import type { DailyStudyItem } from "./aggregation";

export interface StudyChartItem {
  date: string;
  label: string;
  minutes: number;
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
