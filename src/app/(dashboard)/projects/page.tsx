import { FolderKanban } from "lucide-react";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      icon={FolderKanban}
      title="Projects"
      description="진행 중인 프로젝트와 완료한 프로젝트를 한곳에서 관리합니다."
    />
  );
}
