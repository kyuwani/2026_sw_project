import { BookOpen } from "lucide-react";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata = { title: "Learning" };

export default function LearningPage() {
  return (
    <PlaceholderPage
      icon={BookOpen}
      title="Learning"
      description="오늘 학습한 내용과 시간을 기록하고 기술별 로그를 찾아봅니다."
    />
  );
}
