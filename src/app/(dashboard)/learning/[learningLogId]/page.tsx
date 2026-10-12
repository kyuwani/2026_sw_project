import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pencil,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteLearningLogDialog } from "@/features/learning/components/delete-learning-log-dialog";
import {
  formatLearningDate,
  formatStudyDuration,
  LEARNING_CATEGORY_LABELS,
} from "@/features/learning/presentation";
import { getLearningLogDetail } from "@/features/learning/queries";
import { learningLogIdSchema } from "@/features/learning/schemas";

export const metadata: Metadata = { title: "학습 기록 상세" };

interface LearningLogDetailPageProps {
  params: Promise<{ learningLogId: string }>;
  searchParams: Promise<{ updated?: string | string[] }>;
}

const successSearchParamSchema = z.literal("1");

export default async function LearningLogDetailPage({
  params,
  searchParams,
}: LearningLogDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedId = learningLogIdSchema.safeParse((await params).learningLogId);

  if (!parsedId.success) {
    notFound();
  }

  const learningLog = await getLearningLogDetail(
    session.user.id,
    parsedId.data,
  );

  if (!learningLog) {
    notFound();
  }

  const updated = successSearchParamSchema.safeParse(
    (await searchParams).updated,
  ).success;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <ButtonLink href="/learning" size="sm" variant="ghost">
        <ArrowLeft aria-hidden="true" className="size-4" />
        학습 기록 목록
      </ButtonLink>
      <PageHeader
        eyebrow="Learning Log"
        title={learningLog.title}
        description="학습한 내용과 관련 기술을 자세히 확인합니다."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary">
              {LEARNING_CATEGORY_LABELS[learningLog.category]}
            </Badge>
            <ButtonLink
              href={`/learning/${learningLog.id}/edit`}
              variant="outline"
            >
              <Pencil aria-hidden="true" className="size-4" />
              수정
            </ButtonLink>
          </div>
        }
      />

      {updated ? (
        <Card className="border-success/30 bg-success-soft shadow-none">
          <CardContent className="flex items-start gap-3 py-5 sm:py-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <div>
              <p className="font-semibold text-foreground">
                학습 기록을 수정했습니다.
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                변경한 내용과 기술 스택이 반영되었습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <section aria-label="학습 요약" className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 sm:pt-6">
            <CalendarDays aria-hidden="true" className="size-5 text-primary" />
            <div>
              <p className="text-sm text-muted">학습 날짜</p>
              <p className="mt-1 font-bold text-foreground">
                {formatLearningDate(learningLog.studiedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 sm:pt-6">
            <Clock3 aria-hidden="true" className="size-5 text-primary" />
            <div>
              <p className="text-sm text-muted">학습 시간</p>
              <p className="mt-1 font-bold text-foreground">
                {formatStudyDuration(learningLog.studyMinutes)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>학습 내용</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
            {learningLog.content}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>관련 기술</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {learningLog.technologyNames.length > 0 ? (
            learningLog.technologyNames.map((technology) => (
              <Badge key={technology} variant="outline">
                {technology}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted">등록된 기술이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30 shadow-none">
        <CardHeader>
          <CardTitle>위험 영역</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteLearningLogDialog
            learningLogId={learningLog.id}
            learningLogTitle={learningLog.title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
