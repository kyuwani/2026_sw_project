import { BookOpen, CheckCircle2, Plus } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LearningLogCard } from "@/features/learning/components/learning-log-card";
import { LearningLogPagination } from "@/features/learning/components/learning-log-pagination";
import { listLearningLogs } from "@/features/learning/queries";
import { learningLogListSearchParamsSchema } from "@/features/learning/schemas";

export const metadata: Metadata = { title: "Learning" };

interface LearningPageProps {
  searchParams: Promise<{
    created?: string | string[];
    page?: string | string[];
  }>;
}

const successSearchParamSchema = z.literal("1");

export default async function LearningPage({ searchParams }: LearningPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawSearchParams = await searchParams;
  const { page } = learningLogListSearchParamsSchema.parse(rawSearchParams);
  const learningLogs = await listLearningLogs(session.user.id, page);

  if (page > learningLogs.totalPages) {
    redirect(
      learningLogs.totalPages === 1
        ? "/learning"
        : `/learning?page=${learningLogs.totalPages}`,
    );
  }

  const created = successSearchParamSchema.safeParse(rawSearchParams.created)
    .success;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Learning"
        description="오늘 학습한 내용과 시간을 기록하고 성장 과정을 돌아봅니다."
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
                새 기록이 최신 학습일 순서로 목록에 반영되었습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {learningLogs.items.length > 0 ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-foreground">학습 기록</h2>
            <p className="text-sm text-muted">총 {learningLogs.totalItems}개</p>
          </div>
          <section
            aria-label="학습 기록 목록"
            className="grid min-w-0 gap-5 lg:grid-cols-2"
          >
            {learningLogs.items.map((learningLog) => (
              <LearningLogCard key={learningLog.id} learningLog={learningLog} />
            ))}
          </section>
          <LearningLogPagination
            page={learningLogs.page}
            totalPages={learningLogs.totalPages}
          />
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="첫 학습 기록을 남겨 보세요"
          description="오늘 배운 내용과 학습 시간을 기록하면 성장 과정을 날짜별로 확인할 수 있습니다."
          action={
            <ButtonLink href="/learning/new">
              <Plus aria-hidden="true" className="size-4" />
              학습 기록 작성
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
