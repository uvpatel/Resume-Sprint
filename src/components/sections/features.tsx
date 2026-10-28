import { Search, Sparkles, Sliders } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Smart Resume Scanning",
      description:
        "Analyze your resume against a specific job description and understand where your experience already matches.",
      icon: Search,
      details: "Lexical & semantic matching",
    },
    {
      title: "Evidence-Based Suggestions",
      description:
        "Get targeted improvements grounded in your actual experience, without inventing skills, achievements, or metrics.",
      icon: Sparkles,
      details: "Zero hallucinated claims",
    },
    {
      title: "You Stay in Control",
      description:
        "Accept, edit, reject, or undo individual changes before generating your final resume.",
      icon: Sliders,
      details: "Granular change governance",
    },
  ];

  return (
    <section
      id="features"
      className="relative scroll-mt-20 border-t border-[#E8E8E8] py-20 sm:py-28 lg:py-32 bg-[#F8FAFC]"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2996F3]">
            CORE FEATURES
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#252525] leading-tight mt-3">
            Everything You Need to Improve Your Resume
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#626262] leading-relaxed">
            Understand how your experience matches the role, then improve your resume while keeping control of every change.
          </p>
        </div>

        {/* Feature Cards Grid (3 columns on desktop, stacked on mobile) */}
        <div className="mt-14 sm:mt-18 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between rounded-xl border border-[#E8E8E8] bg-white p-7 sm:p-8 transition-all duration-200 hover:border-[#2996F3]/50 hover:shadow-md hover:shadow-blue-500/5"
              >
                <div>
                  {/* Icon with pale blue accent container */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF4FF] text-[#2996F3] mb-6 transition-colors group-hover:bg-[#2996F3] group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold tracking-tight text-[#252525] group-hover:text-[#2996F3] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#626262]">
                    {feature.description}
                  </p>
                </div>

                {/* Bottom pill tag */}
                <div className="mt-8 pt-4 border-t border-[#E8E8E8] flex items-center">
                  <span className="text-xs font-mono font-medium text-[#626262]">
                    {feature.details}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
