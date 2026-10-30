import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export function Pricing() {
  const tierFeatures = [
    "Full semantic & lexical resume scan",
    "Evidence-grounded patch suggestions",
    "Granular accept, edit, and reject controls",
    "Real-time ATS keyword matching",
    "100% preservation of authentic facts",
    "Clean export to TXT and structured formats",
  ];

  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 border-t border-[#E8E8E8] py-20 sm:py-28 lg:py-32 bg-white"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2996F3]">
            PRICING
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#252525] leading-tight mt-3">
            Transparent, Honest Access.
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#626262] leading-relaxed">
            No forced subscriptions, hidden paywalls, or manufactured score guarantees. ResumeSprint is completely free to use during our public beta.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="mt-14 sm:mt-18 max-w-2xl">
          <div className="relative rounded-2xl border border-[#D6EBFF] bg-gradient-to-br from-white to-[#F8FAFC] p-8 sm:p-10 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 border-b border-[#E8E8E8]">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2996F3] block">
                  PUBLIC BETA TIER
                </span>
                <h3 className="text-2xl font-bold text-[#252525] mt-2">
                  Full Platform Access
                </h3>
                <p className="text-sm text-[#626262] mt-1">
                  Everything you need to optimize your resume for your next target role.
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-[#252525]">
                  $0
                </div>
                <div className="text-xs font-mono text-[#2996F3] font-semibold mt-1">
                  FREE DURING BETA
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="py-8">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#626262] mb-5 font-semibold">
                INCLUDED IN BETA ACCESS
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tierFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-[#252525]">
                    <Check className="h-4 w-4 text-[#2996F3] flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-4 border-t border-[#E8E8E8]">
              <Link
                href="/dashboard/new"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] py-3.5 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#147DD8] hover:shadow"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-center text-xs text-[#626262] mt-3">
                No credit card required • Instant evidence-grounded analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
