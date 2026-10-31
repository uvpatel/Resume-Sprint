"use client";

import { Check } from "lucide-react";

interface StepIndicatorProps {
  hasFile: boolean;
  hasJobDescription: boolean;
  isAnalyzing: boolean;
}

export function StepIndicator({
  hasFile,
  hasJobDescription,
  isAnalyzing,
}: StepIndicatorProps) {
  const steps = [
    {
      id: 1,
      title: "Upload resume",
      subtitle: "PDF, DOCX, or TXT",
      isComplete: hasFile,
      isActive: !hasFile,
    },
    {
      id: 2,
      title: "Add job details",
      subtitle: "Role & requirements",
      isComplete: hasJobDescription,
      isActive: hasFile && !hasJobDescription,
    },
    {
      id: 3,
      title: "Analyze & score",
      subtitle: "Rubric v1 evaluation",
      isComplete: false,
      isActive: hasFile && hasJobDescription,
    },
  ];

  return (
    <nav
      aria-label="Analysis progress"
      className="w-full bg-card border border-border rounded-xl p-3 sm:p-4 shadow-2xs"
    >
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {steps.map((step, idx) => {
          const isDone = step.isComplete;
          const isCurrent = step.isActive || (step.id === 3 && isAnalyzing);

          return (
            <li
              key={step.id}
              className="relative flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Step indicator circle */}
              <div
                className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  isDone
                    ? "bg-emerald-600 text-white shadow-2xs shadow-emerald-500/20"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/10 shadow-2xs shadow-primary/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isDone ? (
                  <Check className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>

              {/* Text metadata */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                    isCurrent
                      ? "text-foreground"
                      : isDone
                      ? "text-foreground/90"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="hidden md:block text-[11px] text-muted-foreground truncate">
                  {step.subtitle}
                </p>
              </div>

              {/* Connector line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-4 lg:w-6 h-px bg-border pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
