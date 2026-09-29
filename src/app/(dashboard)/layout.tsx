import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";

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

  return (
    <AppShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
