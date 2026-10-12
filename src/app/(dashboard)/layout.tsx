import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { getAppShellUser } from "@/features/profile/queries";
import { getDateStringInTimeZone } from "@/lib/date/time-zone";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardContent>{children}</DashboardContent>;
}

async function DashboardContent({ children }: DashboardLayoutProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getAppShellUser(session.user.id);

  if (!user) {
    redirect("/login");
  }

  const now = new Date();
  const currentDate = {
    dateTime: getDateStringInTimeZone(now, user.timeZone),
    label: new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "long",
      timeZone: user.timeZone,
    }).format(now),
  };

  return (
    <AppShell
      currentDate={currentDate}
      user={{
        name: user.name,
        email: user.email,
      }}
    >
      {children}
    </AppShell>
  );
}
