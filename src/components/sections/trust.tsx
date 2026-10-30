import { Shield, FileCheck, CheckCircle2 } from "lucide-react";

export function Trust() {
  const principles = [
    {
      title: "No invented skills or experience.",
      description:
        "Every keyword recommendation is matched against your actual background. We do not insert capabilities you do not possess.",
      icon: Shield,
    },
    {
      title: "No fabricated achievements or metrics.",
      description:
        "We strengthen wording without fabricating numbers or manufacturing false impact statements.",
      icon: FileCheck,
    },
    {
      title: "You review and control every change.",
      description:
        "No silent rewrites. Accept, edit, or reject each proposed patch before generating your finalized application.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="relative border-t border-[#E8E8E8] py-20 sm:py-28 bg-[#F4F8FD]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-18">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2996F3] block mb-3">
            FACT PRESERVATION FIRST
          </span>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#252525] leading-tight">
            Your Experience Should Stay Yours.
          </h2>

          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-[#626262] leading-relaxed max-w-2xl mx-auto">
            ResumeSprint helps you communicate your experience more clearly without making up qualifications or changing the facts.
          </p>
        </div>

        {/* 3 Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-[#D6EBFF] bg-white p-7 sm:p-8 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#2996F3] mb-5">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#252525] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#626262]">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
