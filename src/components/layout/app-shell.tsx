"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopNavigation } from "@/components/layout/top-navigation";

interface AppShellProps {
  children: ReactNode;
  user: {
    name: string | null;
    email: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = mobileNavigationRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );

        if (!focusableElements?.length) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-20 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg focus:translate-y-0"
      >
        본문으로 건너뛰기
      </a>

      <Sidebar user={user} />

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={closeMobileMenu}
            aria-label="메뉴 닫기"
          />
          <div
            ref={mobileNavigationRef}
            id="mobile-navigation"
            className="relative h-full w-64"
            role="dialog"
            aria-modal="true"
            aria-label="모바일 주요 메뉴"
          >
            <Sidebar
              mobile
              onNavigate={closeMobileMenu}
              closeButtonRef={closeButtonRef}
              user={user}
            />
          </div>
        </div>
      ) : null}

      <div className="min-h-screen lg:pl-64">
        <TopNavigation
          onOpenMenu={() => setMobileMenuOpen(true)}
          menuButtonRef={menuButtonRef}
          menuOpen={mobileMenuOpen}
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
