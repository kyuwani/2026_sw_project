"use client";

import { Braces, ChevronRight, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";

import { navigationItems } from "@/components/layout/navigation";
import { signOutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
  user: {
    name: string | null;
    email: string | null;
  };
}

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  mobile = false,
  onNavigate,
  closeButtonRef,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const displayName = user.name ?? user.email ?? "사용자";

  return (
    <aside
      aria-label="주요 메뉴"
      className={cn(
        "flex h-full w-64 flex-col bg-sidebar text-white",
        mobile ? "shadow-2xl" : "fixed inset-y-0 left-0 z-30 hidden lg:flex",
      )}
    >
      <div className="flex h-20 items-center justify-between px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg"
          onClick={onNavigate}
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Braces aria-hidden="true" className="size-5" strokeWidth={2.25} />
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">잔디노트</span>
            <span className="block text-[11px] font-medium text-sidebar-muted">
              Developer workspace
            </span>
          </span>
        </Link>

        {mobile ? (
          <button
            ref={closeButtonRef}
            type="button"
            className="flex size-9 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/10 hover:text-white"
            onClick={onNavigate}
            aria-label="메뉴 닫기"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-muted">
          Workspace
        </p>
        <ul className="space-y-1.5">
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                    active
                      ? "bg-white/10 text-white"
                      : "text-sidebar-muted hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-[18px] shrink-0",
                      active ? "text-indigo-300" : "text-sidebar-muted group-hover:text-white",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active ? (
                    <ChevronRight aria-hidden="true" className="size-4 text-indigo-300" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-sm font-bold text-indigo-800">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            <p className="truncate text-xs text-sidebar-muted">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-muted hover:bg-white/10 hover:text-white"
              aria-label="로그아웃"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
