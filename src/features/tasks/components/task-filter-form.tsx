import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Select } from "@/components/ui/select";
import type { TaskListFilters } from "@/features/tasks/schemas";

interface TaskFilterFormProps {
  filters: TaskListFilters;
}

export function TaskFilterForm({ filters }: TaskFilterFormProps) {
  const hasFilters = Boolean(
    filters.status ||
      filters.priority ||
      filters.due ||
      filters.sort !== "UPDATED_DESC",
  );

  return (
    <form
      action="/tasks"
      className="grid gap-4 rounded-card border border-border bg-card p-4 shadow-card sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end sm:p-5"
      method="get"
    >
      <Select
        defaultValue={filters.status ?? "ALL"}
        id="task-filter-status"
        label="상태"
        name="status"
      >
        <option value="ALL">전체 상태</option>
        <option value="TODO">할 일</option>
        <option value="IN_PROGRESS">진행 중</option>
        <option value="DONE">완료</option>
      </Select>
      <Select
        defaultValue={filters.priority ?? "ALL"}
        id="task-filter-priority"
        label="우선순위"
        name="priority"
      >
        <option value="ALL">전체 우선순위</option>
        <option value="LOW">낮음</option>
        <option value="MEDIUM">보통</option>
        <option value="HIGH">높음</option>
      </Select>
      <Select
        defaultValue={filters.due ?? "ALL"}
        id="task-filter-due"
        label="마감 여부"
        name="due"
      >
        <option value="ALL">전체 마감일</option>
        <option value="OVERDUE">기한 지남</option>
        <option value="TODAY">오늘 마감</option>
        <option value="UPCOMING">마감 예정</option>
        <option value="NONE">마감일 없음</option>
      </Select>
      <Select
        defaultValue={filters.sort}
        id="task-filter-sort"
        label="정렬"
        name="sort"
      >
        <option value="UPDATED_DESC">최근 수정순</option>
        <option value="DUE_ASC">마감일순</option>
        <option value="PRIORITY_DESC">우선순위순</option>
      </Select>
      <div className="flex gap-2 sm:col-span-2 xl:col-span-1 xl:pb-px">
        {hasFilters ? (
          <ButtonLink href="/tasks" variant="ghost">
            초기화
          </ButtonLink>
        ) : null}
        <Button type="submit">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          적용
        </Button>
      </div>
    </form>
  );
}
