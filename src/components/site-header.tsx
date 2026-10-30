"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Bell } from "lucide-react";

interface SiteHeaderProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function SiteHeader({ user }: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 transition-colors sticky top-0 z-30 shadow-xs">
      {/* Left: Trigger & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg h-8 w-8" />

        {/* Compact search input */}
        <div className="relative flex-1 max-w-xs hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search resumes, analyses..."
            className="w-full bg-muted/40 border border-border/80 rounded-lg pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Right: Theme Toggle, Notifications, User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications with badge */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-background" />
        </button>

        {/* User Profile Dropdown */}
        {user && (
          <div className="pl-1 sm:pl-2 border-l border-border">
            <UserMenu user={user} showName={true} />
          </div>
        )}
      </div>
    </header>
  );
}
