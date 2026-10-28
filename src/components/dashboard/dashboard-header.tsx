"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { UserMenu } from "@/components/auth/user-menu";

interface DashboardHeaderProps {
  userEmail?: string;
  userName?: string;
}

export function DashboardHeader({ userEmail, userName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate breadcrumb items from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    dashboard: "Dashboard",
    new: "New Scan",
    resumes: "Resumes",
    scan: "Scan Report",
    optimize: "AI Optimize",
    history: "Scan History",
    settings: "Settings",
  };

  return (
    <>
      <header className="h-16 border-b border-[#E8E8E8] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#626262] hover:text-[#252525] hover:bg-[#F8FAFC]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[13px] text-[#626262]">
            <Link href="/dashboard" className="hover:text-[#252525] transition-colors font-medium">
              Workspace
            </Link>
            {segments.slice(1).map((seg, idx) => {
              const label = breadcrumbMap[seg] || (seg.startsWith("res_") ? "Resume" : seg);
              const href = `/${segments.slice(0, idx + 2).join("/")}`;
              const isLast = idx === segments.slice(1).length - 1;

              return (
                <div key={href} className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  {isLast ? (
                    <span className="text-[#252525] font-semibold">{label}</span>
                  ) : (
                    <Link href={href} className="hover:text-[#252525] transition-colors font-medium">
                      {label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Action Button & User Profile */}
        <div className="flex items-center gap-3">
          {pathname !== "/dashboard/new" && (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white text-[13px] font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              <span>New scan</span>
            </Link>
          )}

          <div className="pl-2 border-l border-[#E8E8E8]">
            <UserMenu user={{ name: userName, email: userEmail }} />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-white border-r border-[#E8E8E8] shadow-2xl z-50">
            <DashboardSidebar userEmail={userEmail} userName={userName} />
          </div>
        </div>
      )}
    </>
  );
}
