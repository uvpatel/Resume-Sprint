import { ScoreBreakdown } from "@/lib/db/types";

interface RubricBreakdownProps {
  breakdown: ScoreBreakdown;
}

export function RubricBreakdown({ breakdown }: RubricBreakdownProps) {
  const parts = [
    {
      title: "Keywords & Skill Match",
      value: breakdown.keywordSkillMatch,
      max: 40,
      description: "Direct evidence for required core technical skills & domain competencies.",
    },
    {
      title: "Role Alignment",
      value: breakdown.roleTitleAlignment,
      max: 20,
      description: "Job title progression, domain scope, and seniority trajectory.",
    },
    {
      title: "Quantified Impact",
      value: breakdown.quantifiedImpact,
      max: 20,
      description: "Presence of concrete metrics, percentages, volume, or performance data.",
    },
    {
      title: "Experience Depth",
      value: breakdown.experienceDepth,
      max: 10,
      description: "Substantive career history and chronological responsibility scope.",
    },
    {
      title: "ATS Readability & Layout",
      value: breakdown.formattingAtsReadability,
      max: 10,
      description: "Standard section structures, clean headers, and parseable plain layout.",
    },
  ];

  return (
    <div className="space-y-4">
      {parts.map((p) => {
        const percent = Math.min(100, Math.round((p.value / p.max) * 100));

        return (
          <div key={p.title} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#252525]">{p.title}</span>
              <span className="font-mono text-[#626262]">
                <b className="text-[#252525]">{p.value}</b> / {p.max}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#E8E8E8] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2996F3] transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#626262] leading-normal">{p.description}</p>
          </div>
        );
      })}
    </div>
  );
}
