"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  EllipsisVerticalIcon,
  CircleUserRoundIcon,
  Settings2Icon,
  ShieldCheckIcon,
  LogOutIcon,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

export function NavUser({
  user,
}: {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
    image?: string;
  };
}) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const name = user.name || "Urvil Patel";
  const email = user.email || "urvilpatel700@gmail.com";
  const avatarUrl =
    user.image ||
    user.avatar ||
    (email.toLowerCase().includes("urvil") || name.toLowerCase().includes("urvil")
      ? "https://github.com/uvpatel.png"
      : undefined);

  // Compute initials - ensure Urvil Patel displays "UP" rather than "PU"
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      const first = parts[0].toUpperCase();
      const last = parts[parts.length - 1].toUpperCase();
      if ((first === "PATEL" && last === "URVIL") || (first === "URVIL" && last === "PATEL")) {
        return "UP";
      }
      return `${first[0]}${last[0]}`;
    }
    return parts[0]?.substring(0, 2).toUpperCase() || "UP";
  };
  const initials = getInitials(name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="aria-expanded:bg-slate-100 dark:aria-expanded:bg-zinc-800 hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 rounded-xl px-2.5 py-2 h-auto transition-colors"
              />
            }
          >
            <Avatar className="size-8.5 rounded-full ring-2 ring-indigo-500/20 text-white font-bold shrink-0 overflow-hidden">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover size-full rounded-full" />}
              <AvatarFallback className="rounded-full bg-[#4F46E5] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-xs leading-tight ml-1">
              <span className="truncate font-semibold text-slate-800 dark:text-white">{name}</span>
              <span className="truncate text-[11px] text-slate-400 dark:text-zinc-400">
                {email}
              </span>
            </div>
            <ChevronDown className="ml-auto size-4 text-slate-400 dark:text-zinc-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 shadow-xl rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-2.5 py-2 text-left text-xs">
                  <Avatar className="size-8 rounded-full ring-1 ring-indigo-500/20 text-white font-semibold shrink-0 overflow-hidden">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover size-full rounded-full" />}
                    <AvatarFallback className="rounded-full bg-[#4F46E5] text-white text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold text-slate-900 dark:text-white">{name}</span>
                    <span className="truncate text-[11px] text-slate-400 dark:text-zinc-400">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link href="/dashboard" />}
                className="hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs cursor-pointer py-2 px-2.5"
              >
                <LayoutDashboard className="mr-2 size-3.5 text-slate-500" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                render={<Link href="/dashboard/settings" />}
                className="hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs cursor-pointer py-2 px-2.5"
              >
                <Settings2Icon className="mr-2 size-3.5 text-slate-500" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs cursor-pointer py-2 px-2.5"
            >
              <LogOutIcon className="mr-2 size-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
