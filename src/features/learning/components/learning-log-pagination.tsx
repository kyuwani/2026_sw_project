import { ChevronLeft, ChevronRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/button-link";

interface LearningLogPaginationProps {
  page: number;
  queryString: string;
  totalPages: number;
}

function getLearningPageHref(page: number, queryString: string): string {
  const searchParams = new URLSearchParams(queryString);

  if (page === 1) {
    searchParams.delete("page");
  } else {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/learning?${query}` : "/learning";
}

export function LearningLogPagination({
  page,
  queryString,
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
        <ButtonLink
          href={getLearningPageHref(page - 1, queryString)}
          variant="outline"
        >
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
        <ButtonLink
          href={getLearningPageHref(page + 1, queryString)}
          variant="outline"
        >
          다음
          <ChevronRight aria-hidden="true" className="size-4" />
        </ButtonLink>
      ) : (
        <span />
      )}
    </nav>
  );
}
