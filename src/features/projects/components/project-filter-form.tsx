import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ProjectListFilters } from "@/features/projects/schemas";

interface ProjectFilterFormProps {
  filters: ProjectListFilters;
}

export function ProjectFilterForm({ filters }: ProjectFilterFormProps) {
  const hasFilters = Boolean(filters.query || filters.status);

  return (
    <form
      action="/projects"
      className="grid gap-4 rounded-card border border-border bg-card p-4 shadow-card sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end sm:p-5"
      method="get"
    >
      <Input
        defaultValue={filters.query}
        id="project-search"
        label="프로젝트 검색"
        maxLength={100}
        name="q"
        placeholder="프로젝트 이름 또는 설명"
        type="search"
      />
      <Select
        defaultValue={filters.status ?? "ALL"}
        id="project-status"
        label="상태"
        name="status"
      >
        <option value="ALL">전체 상태</option>
        <option value="PLANNING">계획</option>
        <option value="IN_PROGRESS">진행 중</option>
        <option value="COMPLETED">완료</option>
        <option value="ARCHIVED">보관</option>
      </Select>
      <div className="flex gap-2 sm:pb-px">
        {hasFilters ? (
          <ButtonLink href="/projects" variant="ghost">
            초기화
          </ButtonLink>
        ) : null}
        <Button type="submit">
          <Search aria-hidden="true" className="size-4" />
          적용
        </Button>
      </div>
    </form>
  );
}
