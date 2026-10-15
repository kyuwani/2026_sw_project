import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LearningLogForm } from "@/features/learning/components/learning-log-form";
import {
  getLearningLogDetail,
  getUserTimeZone,
} from "@/features/learning/queries";
import { learningLogIdSchema } from "@/features/learning/schemas";
import { getDateStringInTimeZone } from "@/lib/date/time-zone";

export const metadata: Metadata = { title: "학습 기록 수정" };

interface EditLearningLogPageProps {
  params: Promise<{ learningLogId: string }>;
}

export default async function EditLearningLogPage({
  params,
}: EditLearningLogPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedId = learningLogIdSchema.safeParse((await params).learningLogId);

  if (!parsedId.success) {
    notFound();
  }

  const [learningLog, timeZone] = await Promise.all([
    getLearningLogDetail(session.user.id, parsedId.data),
    getUserTimeZone(session.user.id),
  ]);

  if (!learningLog) {
    notFound();
  }

  if (!timeZone) {
    throw new Error("사용자 시간대 설정을 확인할 수 없습니다.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Learning"
        title="학습 기록 수정"
        description="학습 내용과 시간, 카테고리와 기술 스택을 변경합니다."
      />
      <LearningLogForm
        defaultStudiedAt={getDateStringInTimeZone(new Date(), timeZone)}
        learningLog={{
          id: learningLog.id,
          title: learningLog.title,
          content: learningLog.content,
          studiedAt: learningLog.studiedAt.toISOString().slice(0, 10),
          studyMinutes: learningLog.studyMinutes,
          category: learningLog.category,
          technologyNames: learningLog.technologyNames,
        }}
      />
    </div>
  );
}
