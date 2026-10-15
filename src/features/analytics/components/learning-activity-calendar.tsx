import Link from "next/link";

import {
  getStudyIntensityLevel,
  type DailyStudyItem,
  type StudyIntensityLevel,
} from "../aggregation";

interface LearningActivityCalendarProps {
  dailyStudy: DailyStudyItem[];
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

const intensityClasses: Record<StudyIntensityLevel, string> = {
  0: "border-border bg-surface-subtle",
  1: "border-primary/10 bg-primary/20",
  2: "border-primary/20 bg-primary/40",
  3: "border-primary/30 bg-primary/65",
  4: "border-primary bg-primary",
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getMondayBasedDayIndex(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function getCellLabel(item: DailyStudyItem): string {
  const hours = Math.floor(item.minutes / 60);
  const minutes = item.minutes % 60;
  const duration =
    item.minutes === 0
      ? "학습 기록 없음"
      : hours === 0
        ? `${minutes}분 학습`
        : minutes === 0
          ? `${hours}시간 학습`
          : `${hours}시간 ${minutes}분 학습`;
  return `${dateFormatter.format(item.date)}, ${duration}`;
}

export function LearningActivityCalendar({
  dailyStudy,
}: LearningActivityCalendarProps) {
  if (dailyStudy.length === 0) return null;

  const leadingCellCount = getMondayBasedDayIndex(dailyStudy[0].date);
  const cells: Array<DailyStudyItem | null> = [
    ...Array.from({ length: leadingCellCount }, () => null),
    ...dailyStudy,
  ];
  const trailingCellCount = (7 - (cells.length % 7)) % 7;
  cells.push(...Array.from({ length: trailingCellCount }, () => null));

  const studiedDayCount = dailyStudy.filter(({ minutes }) => minutes > 0).length;
  const totalMinutes = dailyStudy.reduce(
    (total, { minutes }) => total + minutes,
    0,
  );

  return (
    <div>
      <p className="sr-only">
        최근 365일 중 {studiedDayCount}일, 총 {totalMinutes}분을 학습했습니다.
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          <div
            aria-hidden="true"
            className="grid grid-rows-7 gap-1 pt-0.5 text-[0.625rem] leading-3 text-muted"
          >
            {["월", "", "수", "", "금", "", ""].map((label, index) => (
              <span className="h-3 w-4" key={`${label}-${index}`}>
                {label}
              </span>
            ))}
          </div>
          <div
            aria-label="최근 365일 학습 활동"
            className="grid grid-flow-col grid-rows-7 gap-1"
            role="group"
          >
            {cells.map((item, index) => {
              if (!item) {
                return (
                  <span
                    aria-hidden="true"
                    className="size-3"
                    key={`empty-${index}`}
                  />
                );
              }

              const dateKey = toDateKey(item.date);
              const label = getCellLabel(item);
              const className = `size-3 rounded-[3px] border ${intensityClasses[getStudyIntensityLevel(item.minutes)]}`;

              return item.minutes > 0 ? (
                <Link
                  aria-label={`${label}. 해당 날짜의 학습 기록 보기`}
                  className={`${className} transition-transform hover:scale-125 focus-visible:scale-125`}
                  href={`/learning?from=${dateKey}&to=${dateKey}`}
                  key={dateKey}
                  title={label}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={className}
                  key={dateKey}
                  title={label}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          색이 진할수록 학습 시간이 길며, 기록한 날짜를 누르면 상세 목록으로
          이동합니다.
        </p>
        <div
          aria-label="학습 시간 강도 범례"
          className="flex items-center gap-1.5"
        >
          <span>적음</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              aria-hidden="true"
              className={`size-3 rounded-[3px] border ${intensityClasses[level]}`}
              key={level}
            />
          ))}
          <span>많음</span>
        </div>
      </div>
    </div>
  );
}
