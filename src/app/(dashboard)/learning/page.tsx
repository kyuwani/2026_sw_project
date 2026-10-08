import { BookOpen, CheckCircle2, Plus } from "lucide-react";
import type { Metadata } from "next";
import { z } from "zod";

import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Learning" };

interface LearningPageProps {
  searchParams: Promise<{ created?: string | string[] }>;
}

const successSearchParamSchema = z.literal("1");

export default async function LearningPage({
  searchParams,
}: LearningPageProps) {
  const created = successSearchParamSchema.safeParse(
    (await searchParams).created,
  ).success;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning"
        description="오늘 학습한 내용과 시간을 기록하고 기술별 로그를 찾아봅니다."
        action={
          <ButtonLink href="/learning/new">
            <Plus aria-hidden="true" className="size-4" />
            학습 기록 작성
          </ButtonLink>
        }
      />
      {created ? (
        <Card className="border-success/30 bg-success-soft shadow-none">
          <CardContent className="flex items-start gap-3 py-5 sm:py-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <div>
              <p className="font-semibold text-foreground">
                학습 기록을 저장했습니다.
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                저장된 기록 목록은 다음 개발 단계에서 확인할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <EmptyState
        icon={BookOpen}
        title="학습 기록을 남겨 보세요"
        description="학습 기록 작성 기능을 사용할 수 있습니다. 날짜별 목록과 상세 보기는 다음 개발 단계에서 추가됩니다."
        action={
          <ButtonLink href="/learning/new">
            <Plus aria-hidden="true" className="size-4" />
            학습 기록 작성
          </ButtonLink>
        }
      />
    </div>
  );
}
