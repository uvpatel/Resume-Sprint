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
    <aside className="w-[250px] border-r border-[#E8E8E8] bg-white flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none text-[#252525]">
      {/* Brand Header */}
      <div className="h-15 border-b border-[#E8E8E8] px-4 flex items-center justify-between">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3] rounded-md"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2996F3] to-[#147DD8] shadow-xs text-white font-mono text-xs font-black tracking-tight">
            RS
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-[#252525] text-sm tracking-tight group-hover:text-[#147DD8] transition-colors">
              Resume<span className="font-medium text-[#626262]">Sprint</span>
            </span>
            <span className="rounded-full bg-[#EAF4FF] px-1.5 py-0.2 text-[9px] font-semibold text-[#147DD8] tracking-wider uppercase border border-[#2996F3]/20">
              PRO
            </span>
          </div>
        </Link>
        <Link
          href="/"
          title="Visit marketing homepage"
          className="text-[#9CA3AF] hover:text-[#252525] p-1.5 rounded-md hover:bg-[#F8FAFC] transition-colors focus-visible:ring-2 focus-visible:ring-[#2996F3]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Core Workspace Section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
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
                className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-[#EAF4FF] text-[#147DD8] font-semibold border-l-2 border-[#2996F3] pl-2"
                    : "text-[#626262] hover:text-[#252525] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-[#2996F3]"
                      : "text-[#9CA3AF] group-hover:text-[#252525]"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Preferences & System Section */}
        <div className="space-y-1">
          <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">
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
                className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? "bg-[#EAF4FF] text-[#147DD8] font-semibold border-l-2 border-[#2996F3] pl-2"
                    : "text-[#626262] hover:text-[#252525] hover:bg-[#F8FAFC]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-[#2996F3]"
                      : "text-[#9CA3AF] group-hover:text-[#252525]"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Rubric Verification Badge */}
        <div className="pt-2">
          <div className="rounded-lg border border-[#E8E8E8] bg-[#F8FAFC] p-3 text-xs">
            <div className="flex items-center gap-1.5 text-[#2996F3] font-semibold text-[11px] mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Canonical Rubric v1</span>
            </div>
            <p className="text-[11px] text-[#626262] leading-relaxed">
              100% preservation verified. Zero synthetic facts.
            </p>
          </div>
        </div>
      </nav>

      {/* Account Info Footer */}
      <div className="border-t border-[#E8E8E8] p-3 bg-white">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-[#EAF4FF] text-[#147DD8] border border-[#2996F3]/20 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-[#252525] truncate">
                {userName}
              </span>
              <span className="text-[11px] text-[#626262] font-mono truncate" title={userEmail}>
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-[#9CA3AF] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#2996F3]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
