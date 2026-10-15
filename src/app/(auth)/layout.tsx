import type { ReactNode } from "react";
import Link from "next/link";

import { Braces } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          className="mb-8 inline-flex items-center gap-3 rounded-lg"
          href="/login"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <Braces aria-hidden="true" className="size-5" />
          </span>
          <span className="text-lg font-bold text-foreground">DevLog</span>
        </Link>
        <section className="rounded-card border border-border bg-card p-6 shadow-card sm:p-8">
          {children}
        </section>
      </div>
    </main>
  );
}
