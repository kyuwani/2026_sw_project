interface StudyDay {
  day: string;
  minutes: number;
}

interface WeeklyStudyChartProps {
  data: StudyDay[];
}

export function WeeklyStudyChart({ data }: WeeklyStudyChartProps) {
  const maxMinutes = Math.max(...data.map((item) => item.minutes), 1);

  return (
    <div>
      <div
        className="flex h-44 items-end justify-between gap-2 sm:gap-3"
        role="img"
        aria-label="요일별 학습 시간 막대그래프"
      >
        {data.map((item) => {
          const height = Math.max(10, (item.minutes / maxMinutes) * 100);

          return (
            <div key={item.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
              <div className="group flex flex-1 items-end justify-center">
                <div
                  className="w-full max-w-9 rounded-t-lg bg-primary-soft group-hover:bg-indigo-200"
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
        이번 주에는 총 10시간 50분을 학습했고, 목요일에 가장 오래 집중했어요.
      </p>
    </div>
  );
}
