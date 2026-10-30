"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  FileText,
  History,
  Settings,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface DashboardSidebarProps {
  userEmail?: string;
  userName?: string;
  onNavigate?: () => void;
}

export function DashboardSidebar({
  userEmail = "candidate@resumesprint.io",
  userName = "Candidate",
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const primaryNavItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Analyze Resume",
      href: "/dashboard/new",
      icon: FileSearch,
      exact: true,
    },
    {
      title: "My Resumes",
      href: "/dashboard/resumes",
      icon: FileText,
      exact: false,
    },
    {
      title: "Analysis History",
      href: "/dashboard/history",
      icon: History,
      exact: true,
    },
  ];

  const secondaryNavItems = [
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      exact: true,
    },
  ];

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  return (
    <aside className="w-[260px] border-r border-zinc-800/80 bg-[#0C0D10] flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none text-zinc-300">
      {/* Brand Header */}
      <div className="h-16 border-b border-zinc-800/80 px-4.5 flex items-center justify-between">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 shadow-xs text-zinc-950 font-mono text-xs font-black tracking-tight">
            RS
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-white text-sm tracking-tight group-hover:text-sky-300 transition-colors">
              Resume<span className="font-medium text-zinc-400">Sprint</span>
            </span>
            <span className="rounded-full bg-zinc-800/90 px-1.5 py-0.2 text-[9px] font-semibold text-sky-400 tracking-wider uppercase border border-zinc-700/60">
              PRO
            </span>
          </div>
        </Link>
        <Link
          href="/"
          title="Visit homepage"
          className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Workspace Section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Workspace
          </div>
          {primaryNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-sky-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Preferences & System Section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            System
          </div>
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-sky-400"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Canonical Rubric Badge Card */}
        <div className="pt-2">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px] mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Canonical Rubric v1</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              100% content preservation. Multi-format PDF, DOCX & TXT extraction.
            </p>
          </div>
        </div>
      </nav>

      {/* Account Info Footer */}
      <div className="border-t border-zinc-800/80 p-3 bg-[#0C0D10]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 text-sky-400 border border-zinc-700/60 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-zinc-200 truncate">
                {userName}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono truncate" title={userEmail}>
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
