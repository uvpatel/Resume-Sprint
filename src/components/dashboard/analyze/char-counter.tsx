"use client";

interface CharCounterProps {
  currentLength: number;
  minLength?: number;
}

export function CharCounter({ currentLength, minLength = 30 }: CharCounterProps) {
  const isSatisfied = currentLength >= minLength;
  const progressPercent = Math.min(100, Math.round((currentLength / minLength) * 100));

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
        <span
          className={`font-semibold transition-colors ${
            isSatisfied
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }`}
        >
          {currentLength}
        </span>
        <span className="text-muted-foreground">/ {minLength} chars min</span>
      </div>

      {/* Thin progress bar */}
      <div
        className="w-20 h-1 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={currentLength}
        aria-valuemin={0}
        aria-valuemax={minLength}
        aria-label="Character count progress towards 30 character minimum"
      >
        <div
          className={`h-full transition-all duration-200 rounded-full ${
            isSatisfied ? "bg-emerald-500 w-full" : "bg-primary/60"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
