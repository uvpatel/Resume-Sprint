"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { Bell } from "lucide-react";

interface SiteHeaderProps {
  user?: {
    name?: string;
    email?: string;
    image?: string | null;
  };
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 sm:px-6 transition-colors sticky top-0 z-30">
      {/* Left: Trigger & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl h-8.5 w-8.5" />

        {/* Functional Global Search */}
        <GlobalSearch />
      </div>

      {/* Right: Theme Toggle, Notifications, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications with badge matching mockup */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 right-1 h-3.5 w-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            1
          </span>
        </button>

        {/* User Profile Dropdown */}
        {user && (
          <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-zinc-800">
            <UserMenu user={user} showName={true} />
          </div>
        )}
      </div>
    </header>
  );
}
