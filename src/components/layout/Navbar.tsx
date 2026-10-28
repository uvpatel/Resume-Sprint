"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UserMenu } from "@/components/auth/user-menu";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
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

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8E8E8] bg-white/95 backdrop-blur-md transition-all">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#2996F3] rounded-md py-1"
            aria-label="ResumeSprint Home"
          >
            {/* Custom typographic / geometric logo mark */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2996F3] to-[#147DD8] shadow-sm shadow-blue-500/20 text-white font-mono text-sm font-black tracking-tight">
              RS
            </div>

            {/* Dark, bold wordmark */}
            <div className="flex items-baseline">
              <span className="text-xl font-bold tracking-tight text-[#252525]">
                Resume<span className="text-[#252525] font-semibold">Sprint</span>
              </span>
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#2996F3]" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-8"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#626262] transition-colors hover:text-[#252525] focus-visible:text-[#252525]"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Right CTA */}
          <div className="hidden md:flex items-center gap-5">
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-[#252525] transition-colors hover:text-[#2996F3] px-2 py-1 rounded-md focus-visible:text-[#2996F3]"
                >
                  <LayoutDashboard className="h-4 w-4 text-[#626262]" />
                  <span>Dashboard</span>
                </Link>
                <UserMenu user={session.user} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#252525] transition-colors hover:text-[#2996F3] px-2 py-1 rounded-md focus-visible:text-[#2996F3]"
                >
                  Sign In
                </Link>

                <Link
                  href="/dashboard/new"
                  className="group inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2996F3] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#147DD8] hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-[#E8E8E8] bg-white p-2 text-[#626262] hover:border-[#D1D5DB] hover:text-[#252525] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-b border-[#E8E8E8] bg-white/98 backdrop-blur-xl px-4 pt-4 pb-6 transition-all shadow-lg"
        >
          <nav className="flex flex-col space-y-3" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium text-[#626262] transition-colors hover:bg-[#F8FAFC] hover:text-[#252525]"
              >
                {link.name}
              </a>
            ))}

            <div className="pt-4 border-t border-[#E8E8E8] flex flex-col gap-3">
              {session?.user ? (
                <>
                  <div className="px-3 py-1 text-xs text-[#626262]">
                    Signed in as <span className="font-semibold text-[#252525]">{session.user.name || session.user.email}</span>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#147DD8]"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center rounded-lg border border-[#E8E8E8] bg-white py-2.5 text-sm font-medium text-[#252525] transition-colors hover:bg-[#F8FAFC]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/dashboard/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#147DD8]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
