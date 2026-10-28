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
      <header className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Link href="/dashboard" className="hover:text-zinc-900 transition-colors">
              Workspace
            </Link>
            {segments.slice(1).map((seg, idx) => {
              const label = breadcrumbMap[seg] || (seg.startsWith("res_") ? "Resume" : seg);
              const href = `/${segments.slice(0, idx + 2).join("/")}`;
              const isLast = idx === segments.slice(1).length - 1;

              return (
                <div key={href} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                  {isLast ? (
                    <span className="text-zinc-900 font-semibold">{label}</span>
                  ) : (
                    <Link href={href} className="hover:text-zinc-900 transition-colors">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Resume Scan</span>
            </Link>
          )}

          <div className="pl-1 border-l border-zinc-200">
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
          <div className="relative flex flex-col w-64 max-w-xs bg-white shadow-xl z-50">
            <DashboardSidebar userEmail={userEmail} userName={userName} />
          </div>
        </div>
      )}
    </>
  );
}
