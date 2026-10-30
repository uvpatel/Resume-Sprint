"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { UserMenu } from "@/components/auth/user-menu";

interface DashboardHeaderProps {
  userEmail?: string;
  userName?: string;
}

export function DashboardHeader({ userEmail, userName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Generate breadcrumb items from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    dashboard: "Overview",
    new: "Analyze Resume",
    resumes: "My Resumes",
    scan: "Analysis Report",
    optimize: "AI Optimize",
    history: "Analysis History",
    settings: "Settings",
  };

  return (
    <>
      <header className="h-16 border-b border-zinc-800/80 bg-[#09090B]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label="Toggle navigation drawer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Link
              href="/dashboard"
              className="hover:text-zinc-200 transition-colors font-medium focus-visible:underline"
            >
              ResumeSprint
            </Link>
            {segments.map((seg, idx) => {
              const label =
                breadcrumbMap[seg] ||
                (seg.startsWith("res_") ? "Resume Details" : seg);
              const href = `/${segments.slice(0, idx + 1).join("/")}`;
              const isLast = idx === segments.length - 1;

              return (
                <div key={href} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  {isLast ? (
                    <span className="text-zinc-200 font-semibold">{label}</span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-zinc-200 transition-colors font-medium focus-visible:underline"
                    >
                      {label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Primary Action Button & User Profile */}
        <div className="flex items-center gap-3">
          {pathname !== "/dashboard/new" && (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-semibold shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Analyze Resume</span>
              <span className="sm:hidden">Analyze</span>
            </Link>
          )}

          <div className="pl-2 border-l border-zinc-800">
            <UserMenu user={{ name: userName, email: userEmail }} />
          </div>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex flex-col w-[270px] max-w-xs bg-[#0C0D10] border-r border-zinc-800/80 shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            <DashboardSidebar
              userEmail={userEmail}
              userName={userName}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
