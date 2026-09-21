import { BarChart3 } from "lucide-react";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PlaceholderPage
      icon={BarChart3}
      title="Analytics"
      description="학습 시간과 프로젝트 진행 흐름을 데이터로 확인합니다."
    />
  );
}
