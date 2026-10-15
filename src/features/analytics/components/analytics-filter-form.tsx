import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AnalyticsPeriodSelection } from "../schemas";

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface AnalyticsFilterFormProps {
  selection: AnalyticsPeriodSelection;
  defaultStartDate: Date;
  defaultEndDate: Date;
}

export function AnalyticsFilterForm({
  selection,
  defaultStartDate,
  defaultEndDate,
}: AnalyticsFilterFormProps) {
  const startDate =
    selection.period === "CUSTOM" ? selection.startDate : defaultStartDate;
  const endDate =
    selection.period === "CUSTOM" ? selection.endDate : defaultEndDate;

  return (
    <form
      action="/analytics"
      className="grid gap-4 rounded-card border border-border bg-card p-4 shadow-card sm:grid-cols-2 xl:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end sm:p-5"
      method="get"
    >
      <Select
        defaultValue={selection.period}
        id="analytics-period"
        label="기간"
        name="period"
      >
        <option value="WEEK">이번 주</option>
        <option value="MONTH">이번 달</option>
        <option value="CUSTOM">사용자 지정</option>
      </Select>
      <Input
        defaultValue={formatDateInput(startDate)}
        description="사용자 지정 기간에 적용됩니다."
        id="analytics-start"
        label="시작일"
        name="start"
        type="date"
      />
      <Input
        defaultValue={formatDateInput(endDate)}
        description="최대 366일까지 조회할 수 있습니다."
        id="analytics-end"
        label="종료일"
        name="end"
        type="date"
      />
      <Button className="sm:col-span-2 xl:col-span-1" type="submit">
        <BarChart3 aria-hidden="true" className="size-4" />
        조회
      </Button>
    </form>
  );
}
