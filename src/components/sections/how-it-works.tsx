import { Upload, Search, CheckCircle } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Upload",
      description: "Upload your existing resume and provide the job description.",
      icon: Upload,
      detail: "Supports PDF, DOCX, & TXT",
    },
    {
      step: "02",
      title: "Analyze",
      description: "Review your match score, relevant keywords, and improvement opportunities.",
      icon: Search,
      detail: "Transparent match breakdown",
    },
    {
      step: "03",
      title: "Optimize",
      description: "Review each suggestion, choose your changes, and download your validated resume.",
      icon: CheckCircle,
      detail: "Accept, edit, or reject",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-20 border-t border-[#E8E8E8] py-20 sm:py-28 lg:py-32 bg-white"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2996F3]">
            WORKFLOW
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#252525] leading-tight mt-3">
            From Resume to Ready
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#626262] leading-relaxed">
            A simple workflow that puts you in control.
          </p>
        </div>

        {/* 3 Steps (3 columns desktop, vertical sequence mobile) */}
        <div className="relative mt-14 sm:mt-18">
          {/* Subtle horizontal connecting line on desktop */}
          <div
            className="hidden lg:block absolute top-12 left-16 right-16 h-px bg-[#E8E8E8] pointer-events-none"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group relative flex flex-col justify-between rounded-xl border border-[#E8E8E8] bg-white p-7 sm:p-8 transition-all duration-200 hover:border-[#2996F3]/50 hover:shadow-sm"
                >
                  <div>
                    {/* Header: Step number & Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono text-2xl font-bold text-[#2996F3]">
                        {item.step}
                      </span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#2996F3] group-hover:bg-[#2996F3] group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-[#252525] mb-2.5">
                      {item.title}
                    </h3>
                    <p className="text-sm sm:text-base leading-relaxed text-[#626262]">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#E8E8E8]">
                    <span className="text-xs font-mono text-[#626262]">
                      {item.detail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
