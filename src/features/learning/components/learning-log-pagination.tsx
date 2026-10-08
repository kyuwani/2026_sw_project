import { ChevronLeft, ChevronRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

interface LearningLogPaginationProps {
  page: number;
  totalPages: number;
}

function getLearningPageHref(page: number): string {
  return page === 1 ? "/learning" : `/learning?page=${page}`;
}

export function LearningLogPagination({
  page,
  totalPages,
}: LearningLogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="학습 기록 페이지"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      {page > 1 ? (
        <ButtonLink href={getLearningPageHref(page - 1)} variant="outline">
          <ChevronLeft aria-hidden="true" className="size-4" />
          이전
        </ButtonLink>
      ) : (
        <span />
      )}
      <span className="text-sm font-medium text-muted" aria-current="page">
        {page} / {totalPages} 페이지
      </span>
      {page < totalPages ? (
        <ButtonLink href={getLearningPageHref(page + 1)} variant="outline">
          다음
          <ChevronRight aria-hidden="true" className="size-4" />
        </ButtonLink>
      ) : (
        <span />
      )}
    </nav>
  );
}
