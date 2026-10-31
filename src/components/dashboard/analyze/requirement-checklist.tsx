"use client";

import { Check, Circle } from "lucide-react";

interface RequirementChecklistProps {
  hasFile: boolean;
  hasJobDescription: boolean;
}

export function RequirementChecklist({
  hasFile,
  hasJobDescription,
}: RequirementChecklistProps) {
  const requirements = [
    {
      id: "file",
      label: "Resume document uploaded",
      isMet: hasFile,
    },
    {
      id: "jd",
      label: "Job description (min. 30 chars)",
      isMet: hasJobDescription,
    },
  ];

  return (
    <ul
      className="space-y-1 text-xs text-muted-foreground"
      aria-label="Submission requirements"
    >
      {requirements.map((req) => (
        <li key={req.id} className="flex items-center gap-1.5">
          {req.isMet ? (
            <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[2.5]" aria-hidden="true" />
            </div>
          ) : (
            <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
          )}
          <span
            className={
              req.isMet
                ? "text-foreground font-medium transition-colors"
                : "text-muted-foreground transition-colors"
            }
          >
            {req.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
