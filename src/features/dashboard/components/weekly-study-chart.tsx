import { getStudyBarHeight } from "../presentation";

interface StudyDay {
  day: string;
  minutes: number;
}

interface WeeklyStudyChartProps {
  data: StudyDay[];
  totalMinutes: number;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}분`;
  if (remainingMinutes === 0) return `${hours}시간`;
  return `${hours}시간 ${remainingMinutes}분`;
}

export function WeeklyStudyChart({
  data,
  totalMinutes,
}: WeeklyStudyChartProps) {
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 1);

  return (
    <div>
      <div
        className="flex h-44 items-end justify-between gap-2 sm:gap-3"
        role="img"
        aria-label="요일별 학습 시간 막대그래프"
      >
        {data.map((item) => {
          const height = getStudyBarHeight(item.minutes, maxMinutes);

          return (
            <div key={item.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="group flex flex-1 items-end justify-center">
                <div
                  className="w-full max-w-9 rounded-t-lg bg-primary-soft transition-colors group-hover:bg-indigo-200"
                  style={{ height: `${height}%` }}
                  title={`${item.day}요일 ${item.minutes}분`}
                >
                  <span className="sr-only">
                    {item.day}요일 {item.minutes}분
                  </span>
                </div>
              </div>
              <span className="mt-3 text-center text-xs font-medium text-muted">
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        이번 주에는 총 {formatMinutes(totalMinutes)}을 학습했습니다.
      </p>
    </div>
  );
}
