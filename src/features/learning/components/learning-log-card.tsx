import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LearningLogSummary } from "@/features/learning/queries";
import {
  formatLearningDate,
  formatStudyDuration,
  LEARNING_CATEGORY_LABELS,
} from "@/features/learning/presentation";

interface LearningLogCardProps {
  learningLog: LearningLogSummary;
}

export function LearningLogCard({ learningLog }: LearningLogCardProps) {
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">
            {LEARNING_CATEGORY_LABELS[learningLog.category]}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {formatLearningDate(learningLog.studiedAt)}
          </span>
        </div>
        <CardTitle className="min-w-0 text-lg">
          <Link
            className="block break-words rounded-sm hover:text-primary"
            href={`/learning/${learningLog.id}`}
          >
            {learningLog.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-1 flex-col">
        <p className="line-clamp-3 break-words text-sm leading-6 text-muted">
          {learningLog.content}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Clock3 aria-hidden="true" className="size-4 text-primary" />
          {formatStudyDuration(learningLog.studyMinutes)}
        </div>
        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
          {learningLog.technologyNames.length > 0 ? (
            learningLog.technologyNames.map((technology) => (
              <Badge key={technology} variant="outline">
                {technology}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted">등록된 기술 없음</span>
          )}
        </div>
        <Link
          className="mt-5 inline-flex items-center justify-end gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          href={`/learning/${learningLog.id}`}
        >
          상세 보기
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
