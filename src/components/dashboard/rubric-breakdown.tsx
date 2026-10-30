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
      color: "bg-sky-400",
    },
    {
      title: "Role Alignment",
      value: breakdown.roleTitleAlignment,
      max: 20,
      description: "Job title progression, domain scope, and seniority trajectory.",
      color: "bg-[#F5D0B5]",
    },
    {
      title: "Quantified Impact",
      value: breakdown.quantifiedImpact,
      max: 20,
      description: "Presence of concrete metrics, percentages, volume, or performance data.",
      color: "bg-emerald-400",
    },
    {
      title: "Experience Depth",
      value: breakdown.experienceDepth,
      max: 10,
      description: "Substantive career history and chronological responsibility scope.",
      color: "bg-purple-400",
    },
    {
      title: "ATS Readability & Layout",
      value: breakdown.formattingAtsReadability,
      max: 10,
      description: "Standard section structures, clean headers, and parseable plain layout.",
      color: "bg-amber-400",
    },
  ];

  return (
    <div className="space-y-4">
      {parts.map((p) => {
        const percent = Math.min(100, Math.round((p.value / p.max) * 100));

        return (
          <div key={p.title} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200">{p.title}</span>
              <span className="font-mono text-zinc-400">
                <b className="text-white font-bold">{p.value}</b> / {p.max}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${p.color} transition-all duration-500 ease-out`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">{p.description}</p>
          </div>
        );
      })}
    </div>
  );
}
