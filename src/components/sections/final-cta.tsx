import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-[#E8E8E8] py-24 sm:py-32 lg:py-36 bg-gradient-to-b from-white to-[#F4F9FF]">
      {/* Subtle pale blue background radial wash */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 65% 50% at 50% 60%, rgba(234, 244, 255, 0.8) 0%, transparent 75%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D6EBFF] bg-[#EAF4FF] px-3.5 py-1 text-xs font-mono font-semibold text-[#147DD8] mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#2996F3]" />
            <span>START OPTIMIZING TODAY</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#252525] leading-tight">
            Ready for Your Next Opportunity?
          </h2>

          {/* Description */}
          <p className="mt-5 text-base sm:text-lg lg:text-xl text-[#626262] leading-relaxed max-w-xl mx-auto">
            Start with the experience you already have. Make it clearer, more relevant, and ready for the role.
          </p>

          {/* Primary Button */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/new"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] px-8 py-4 text-base font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-[#147DD8] hover:shadow-md hover:shadow-blue-500/30 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
            >
              <span>Optimize My Resume</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-5 text-xs text-[#626262]">
            Evidence-grounded • No credit card required • Instant review
          </p>
        </div>
      </div>
    </section>
  );
}
