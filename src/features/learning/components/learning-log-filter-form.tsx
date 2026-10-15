import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LEARNING_CATEGORY_LABELS } from "@/features/learning/presentation";
import {
  LEARNING_CATEGORY_VALUES,
  type LearningLogListFilters,
} from "@/features/learning/schemas";
import { TECHNOLOGY_OPTIONS } from "@/features/technologies/constants";

interface LearningLogFilterFormProps {
  filters: LearningLogListFilters;
}

export function LearningLogFilterForm({
  filters,
}: LearningLogFilterFormProps) {
  return (
    <Card>
      <CardContent className="pt-5 sm:pt-6">
        <form action="/learning" className="grid gap-4" method="get">
          <Input
            defaultValue={filters.query}
            id="learning-query"
            label="검색"
            maxLength={100}
            name="q"
            placeholder="제목 또는 학습 내용 검색"
            type="search"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              defaultValue={filters.fromDate}
              id="learning-from"
              label="시작일"
              name="from"
              type="date"
            />
            <Input
              defaultValue={filters.toDate}
              id="learning-to"
              label="종료일"
              name="to"
              type="date"
            />
            <Select
              defaultValue={filters.category ?? "ALL"}
              id="learning-category-filter"
              label="카테고리"
              name="category"
            >
              <option value="ALL">전체 카테고리</option>
              {LEARNING_CATEGORY_VALUES.map((category) => (
                <option key={category} value={category}>
                  {LEARNING_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
            <Select
              defaultValue={filters.technology ?? "ALL"}
              id="learning-technology-filter"
              label="기술"
              name="technology"
            >
              <option value="ALL">전체 기술</option>
              {TECHNOLOGY_OPTIONS.map((technology) => (
                <option key={technology} value={technology}>
                  {technology}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <ButtonLink href="/learning" variant="outline">
              필터 초기화
            </ButtonLink>
            <Button type="submit">
              <Search aria-hidden="true" className="size-4" />
              검색
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
