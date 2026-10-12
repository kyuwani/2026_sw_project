"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { StudyChartItem } from "../presentation";

interface StudyTimeChartProps {
  data: StudyChartItem[];
}

export function StudyTimeChart({ data }: StudyTimeChartProps) {
  return (
    <div className="h-72 min-w-0" aria-label="기간별 학습 시간 막대 차트">
      <ResponsiveContainer
        height="100%"
        initialDimension={{ width: 640, height: 288 }}
        minWidth={0}
        width="100%"
      >
        <BarChart accessibilityLayer data={data} margin={{ left: -16, right: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={24}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickFormatter={(value) => `${value}분`}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-subtle)" }}
            formatter={(value) => [`${Number(value)}분`, "학습 시간"]}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="minutes" fill="var(--primary)" maxBarSize={36} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
