import { UserRound } from "lucide-react";

import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <PlaceholderPage
      icon={UserRound}
      title="Profile"
      description="프로필 정보와 주 사용 기술, 연결된 계정을 관리합니다."
    />
  );
}
