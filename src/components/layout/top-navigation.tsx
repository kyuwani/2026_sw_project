"use client";

import { CalendarDays, Menu, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";

import { pageTitles } from "@/components/layout/navigation";

interface TopNavigationProps {
  onOpenMenu: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuOpen: boolean;
}

function getPageTitle(pathname: string): string {
  const matchedPath = Object.keys(pageTitles).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  return matchedPath ? pageTitles[matchedPath] : "DevLog";
}

export function TopNavigation({
  onOpenMenu,
  menuButtonRef,
  menuOpen,
}: TopNavigationProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:h-20 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        className="mr-3 flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-subtle hover:text-foreground lg:hidden"
        onClick={onOpenMenu}
        aria-label="메뉴 열기"
        aria-controls="mobile-navigation"
        aria-expanded={menuOpen}
      >
        <Menu aria-hidden="true" className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">Workspace</p>
        <p className="truncate text-base font-bold text-foreground">{title}</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 text-sm text-muted md:flex">
          <CalendarDays aria-hidden="true" className="size-4" />
          <time dateTime="2026-09-21">2026년 9월 21일</time>
        </div>
        <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover sm:px-4"
        >
          <Plus aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">새 기록</span>
          <span className="sr-only sm:hidden">새 기록</span>
        </button>
      </div>
    </header>
  );
}
