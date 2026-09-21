import { CheckSquare2 } from "lucide-react";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <PlaceholderPage
      icon={CheckSquare2}
      title="Tasks"
      description="모든 프로젝트의 Task를 우선순위와 마감일에 따라 확인합니다."
    />
  );
}
