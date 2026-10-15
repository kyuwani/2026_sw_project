"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { TechnologyStudyItem } from "../aggregation";

const CHART_COLORS = [
  "#5b5bd6",
  "#0369a1",
  "#15803d",
  "#b54708",
  "#7c3aed",
  "#be185d",
];

interface TechnologyStudyChartProps {
  data: TechnologyStudyItem[];
}

export function TechnologyStudyChart({ data }: TechnologyStudyChartProps) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-center">
      <div className="h-56 min-w-0" aria-label="기술별 학습 시간 비율 차트">
        <ResponsiveContainer
          height="100%"
          initialDimension={{ width: 280, height: 224 }}
          minWidth={0}
          width="100%"
        >
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="minutes"
              innerRadius="52%"
              nameKey="name"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((item, index) => (
                <Cell
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  key={item.id}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value)}분`, "학습 시간"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid min-w-0 gap-3" aria-label="기술별 학습 시간 범례">
        {data.map((item, index) => (
          <li className="flex min-w-0 items-center gap-3" key={item.id}>
            <span
              aria-hidden="true"
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            <span className="shrink-0 text-xs font-semibold text-muted">
              {item.minutes}분 · {item.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
