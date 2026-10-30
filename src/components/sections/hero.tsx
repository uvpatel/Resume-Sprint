import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroGraphic } from "./hero-graphic";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white">
      {/* Decorative Geometric Graphic on right */}
      <HeroGraphic />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl text-left">
          {/* Editorial Dark Charcoal Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[4.75rem] font-bold tracking-[-0.035em] text-[#252525] leading-[1.08] sm:leading-[1.05]">
            Make Your Resume Stand Out.
            <br />
            <span className="text-[#252525]">Without Changing Your Story.</span>
          </h1>

          {/* Supporting Description */}
          <p className="mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-[#626262]">
            Match your resume to the role, discover improvement opportunities, and strengthen your experience with AI-powered guidance. Review every change before downloading.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Primary CTA */}
            <Link
              href="/dashboard/new"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] px-7 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-500/20 transition-all duration-200 hover:bg-[#147DD8] hover:shadow-md hover:shadow-blue-500/25 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
            >
              <span>Optimize My Resume</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            {/* Secondary CTA */}
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-[#E8E8E8] bg-white px-7 py-3.5 text-base font-medium text-[#252525] transition-all duration-200 hover:bg-[#F8FAFC] hover:border-[#D1D5DB] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
