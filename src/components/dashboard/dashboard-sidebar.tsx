"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
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
}

export function DashboardSidebar({ userEmail = "candidate@resumesprint.io", userName = "Candidate" }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      title: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "New Scan",
      href: "/dashboard/new",
      icon: PlusCircle,
      exact: true,
    },
    {
      title: "My Resumes",
      href: "/dashboard/resumes",
      icon: FileText,
      exact: false,
    },
    {
      title: "Scan History",
      href: "/dashboard/history",
      icon: History,
      exact: true,
    },
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
    <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-zinc-200 px-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-xs font-bold shadow-sm">
            RS
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-900 text-sm tracking-tight leading-none group-hover:text-blue-600 transition-colors">
              ResumeSprint
            </span>
            <span className="text-[10px] font-mono tracking-wider text-zinc-400 mt-0.5">
              WORKSPACE
            </span>
          </div>
        </Link>
        <Link
          href="/"
          title="View landing page"
          className="text-zinc-400 hover:text-zinc-600 p-1 rounded transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
          Dashboard
        </div>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  isActive ? "text-blue-600" : "text-zinc-400"
                }`}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
          Evidence Engine
        </div>
        <div className="mx-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-zinc-600">
          <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Rubric v1 Active</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            100% preservation verified. No fabricated skills, dates, or metrics.
          </p>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-zinc-200 p-3.5 bg-zinc-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-medium text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-zinc-900 truncate">
                {userName}
              </span>
              <span className="text-[11px] text-zinc-500 truncate">
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
