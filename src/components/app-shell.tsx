"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Shield,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { HelpChat } from "@/components/help-chat";
import { InstallHint } from "@/components/install-hint";
import { IdleTimeout, MfaEnrollGuard } from "@/components/session-guards";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import { can, isStaff, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/constants";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const LINKS: {
  href: string;
  label: string;
  icon: typeof Home;
  permission?: Permission;
  parentOnly?: boolean;
  staffOnly?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, staffOnly: true },
  { href: "/today", label: "Today", icon: CalendarClock, staffOnly: true },
  { href: "/parent", label: "Family home", icon: Home, parentOnly: true },
  { href: "/students", label: "Students", icon: Users, permission: "student.list" },
  { href: "/minutes", label: "Minutes", icon: Timer, staffOnly: true },
  { href: "/reports", label: "Reports", icon: FileText, permission: "report.create" },
  { href: "/messages", label: "Messages", icon: MessageSquare, permission: "message.send" },
  { href: "/schools", label: "Schools", icon: Building2, permission: "team.manage" },
  { href: "/team", label: "Team", icon: ClipboardList, permission: "team.manage" },
  { href: "/privacy", label: "Privacy", icon: Shield },
  { href: "/guide", label: "Setup guide", icon: BookOpen },
];

export function AppShell({
  user,
  unreadMessages = 0,
  children,
}: {
  user: { name: string; email: string; role: Role; mfaEnrollRequired?: boolean };
  unreadMessages?: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const meetingRoom = pathname.includes("/meeting/room");
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const items = LINKS.filter((link) => {
    if (link.parentOnly && user.role !== "PARENT") return false;
    if (link.staffOnly && !isStaff(user.role)) return false;
    if (link.permission && !can(user.role, link.permission)) return false;
    if (link.href === "/students" && user.role === "PARENT") return false;
    return true;
  });

  if (meetingRoom) {
    return (
      <div className="min-h-screen bg-[#10241c] text-[#f4f0e6]">
        <MfaEnrollGuard required={Boolean(user.mfaEnrollRequired)} />
        <IdleTimeout />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <MfaEnrollGuard required={Boolean(user.mfaEnrollRequired)} />
      <IdleTimeout />
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      {process.env.NEXT_PUBLIC_DEMO_MODE !== "false" ? (
        <div className="no-print border-b border-[#c9b45c] bg-[#f7efd6] px-4 py-2 text-center text-sm text-gold">
          Demonstration data only. All students and families on this site are fictional. Do not enter
          real student records.
        </div>
      ) : null}
      <div className="flex min-h-[calc(100vh-40px)]">
        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex w-64 max-w-[85vw] flex-col border-r border-border bg-forest-deep text-white transition-transform lg:static lg:max-w-none lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-5">
            <Link href={isStaff(user.role) ? "/dashboard" : "/parent"} className="flex min-w-0 cursor-pointer items-center gap-2">
              <Logo className="h-9 w-9 shrink-0" />
              <span className="truncate font-serif text-xl">{APP_NAME}</span>
            </Link>
            <button className="min-h-11 min-w-11 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </button>
          </div>
          <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
            {items.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "mb-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm",
                    active ? "bg-white/15 font-semibold" : "hover:bg-white/10",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                  {link.href === "/messages" && unreadMessages > 0 ? (
                    <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-xs text-forest-deep">
                      {unreadMessages}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/15 p-4 text-sm">
            <p className="font-semibold">{user.name}</p>
            <p className="text-white/80">{ROLE_LABELS[user.role]}</p>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                className="mt-3 w-full cursor-pointer justify-start text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-20 border-b border-border bg-surface/95 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                className="min-h-11 min-w-11 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu />
              </button>
              {isStaff(user.role) ? (
                <form action="/search" className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
                  <label htmlFor="q" className="sr-only">
                    Search students and goals
                  </label>
                  <input
                    id="q"
                    name="q"
                    placeholder="Search students or goals"
                    className="min-h-11 w-full rounded-md border border-border bg-white pl-10 pr-3"
                  />
                </form>
              ) : (
                <p className="min-w-0 text-sm text-muted">Family portal — linked students only</p>
              )}
              {isStaff(user.role) ? (
                <Link
                  href="/search"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border sm:hidden"
                  aria-label="Search students and goals"
                >
                  <Search className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </header>
          <main id="main" className="flex-1 px-4 py-6 sm:px-8">
            <div className="no-print">
              <InstallHint className="mb-4" />
            </div>
            {children}
          </main>
          <HelpChat role={user.role} />
        </div>
      </div>
    </div>
  );
}
