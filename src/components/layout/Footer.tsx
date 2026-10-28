import Link from "next/link";

export function Footer() {
  const currentYear = 2026;

  return (
    <footer className="border-t border-[#E8E8E8] bg-white py-14 sm:py-16 text-[#626262]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[#E8E8E8]">
          {/* Brand & Description */}
          <div className="max-w-md">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-[#252525] font-bold text-lg tracking-tight hover:opacity-90"
              aria-label="ResumeSprint Home"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2996F3] text-white font-mono text-xs font-bold shadow-xs">
                RS
              </div>
              <span>
                Resume<span className="text-[#252525]">Sprint</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-[#626262] leading-relaxed">
              AI-powered resume optimization for your next opportunity.
            </p>
          </div>

          {/* Links */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm"
          >
            <a
              href="#features"
              className="text-[#626262] transition-colors hover:text-[#252525]"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-[#626262] transition-colors hover:text-[#252525]"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-[#626262] transition-colors hover:text-[#252525]"
            >
              Pricing
            </a>
            <Link
              href="/privacy"
              className="text-[#626262] transition-colors hover:text-[#252525]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-[#626262] transition-colors hover:text-[#252525]"
            >
              Terms
            </Link>
          </nav>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#626262]">
          <p>© {currentYear} ResumeSprint. All rights reserved.</p>
          <p>Evidence-grounded resume optimization.</p>
        </div>
      </div>
    </footer>
  );
}
