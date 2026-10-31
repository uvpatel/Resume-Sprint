"use client";

import * as React from "react";
import Link from "next/link";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Upload,
  FileText,
  History,
  Settings,
  Sparkles,
} from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
    image?: string;
  };
  resumes?: {
    id: string;
    originalFileName: string;
    fileType: string;
  }[];
}

export function AppSidebar({ user, resumes = [], ...props }: AppSidebarProps) {
  const navMainItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      title: "Upload Resume",
      url: "/dashboard/new",
      icon: <Upload className="size-4" />,
    },
    {
      title: "My Analyses",
      url: "/dashboard/resumes",
      icon: <FileText className="size-4" />,
    },
    {
      title: "History",
      url: "/dashboard/history",
      icon: <History className="size-4" />,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: <Settings className="size-4" />,
    },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
      {...props}
    >
      <SidebarHeader className="border-b border-slate-200/80 dark:border-zinc-800 px-3.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="hover:bg-slate-100/70 dark:hover:bg-zinc-800/60 transition-colors h-auto p-1.5"
            >
              {/* Blue/indigo sparkle brand mark */}
              <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-sm shadow-indigo-500/20">
                <Sparkles className="size-4.5" />
              </div>

              <div className="flex flex-col text-left leading-tight ml-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight font-sans">
                  ResumeSprint
                </span>
                <span className="text-[10.5px] text-slate-400 dark:text-zinc-400 font-normal mt-0.5">
                  Smarter Resumes. Better Opportunities.
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 flex flex-col justify-between">
        <NavMain items={navMainItems} />

        {/* Promo card matching mockup */}
        <div className="mt-auto mx-1 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-[#F5F7FF] to-[#EFF2FE] dark:from-zinc-800/60 dark:to-zinc-900/80 border border-indigo-100/80 dark:border-zinc-800 text-left">
          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
            Get better results with AI-powered insights
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Upload your resume and let our AI analyze your strengths, weaknesses and opportunities.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-3 block w-full py-1.5 px-3 text-center text-xs font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-xl shadow-xs transition-colors"
          >
            Upload Resume
          </Link>
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200/80 dark:border-zinc-800 p-2">
        <NavUser
          user={{
            name: user?.name || "Urvil Patel",
            email: user?.email || "urvilpatel700@gmail.com",
            avatar: user?.avatar,
            image: user?.image || "https://github.com/uvpatel.png",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
