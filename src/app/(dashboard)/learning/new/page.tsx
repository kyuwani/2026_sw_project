import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LearningLogForm } from "@/features/learning/components/learning-log-form";
import { getUserTimeZone } from "@/features/learning/queries";
import { getDateStringInTimeZone } from "@/lib/date/time-zone";

export const metadata: Metadata = { title: "학습 기록 작성" };

export default async function NewLearningLogPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const timeZone = await getUserTimeZone(session.user.id);

  if (!timeZone) {
    throw new Error("사용자 시간대 설정을 확인할 수 없습니다.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Learning"
        title="오늘의 학습 기록"
        description="배운 내용과 시간을 기록해 성장 과정을 쌓아 보세요."
      />
      <LearningLogForm
        defaultStudiedAt={getDateStringInTimeZone(new Date(), timeZone)}
      />
    </div>
  );
}
