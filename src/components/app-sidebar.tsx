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
} from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
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
      title: "My Resumes",
      url: "/dashboard/resumes",
      icon: <FileText className="size-4" />,
    },
    {
      title: "Analysis History",
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
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border px-3.5 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              className="hover:bg-muted/60 transition-colors h-auto p-1.5"
            >
              {/* Origami paper-plane brand mark */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-4.5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 13.5L21 3L13.5 21L10.5 13.5L3 13.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10.5 13.5L21 3L13.5 21"
                    stroke="white"
                    strokeWidth="0.75"
                    strokeLinejoin="round"
                    className="opacity-40"
                  />
                </svg>
              </div>

              <div className="flex flex-col text-left leading-tight ml-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground text-sm tracking-tight font-sans">
                    ResumeSprint
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    v1.0
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-normal">
                  Evidence Engine
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <NavMain items={navMainItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser
          user={{
            name: user?.name || "Candidate",
            email: user?.email || "candidate@resumesprint.io",
            avatar: user?.avatar || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
