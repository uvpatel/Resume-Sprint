import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  trend?: {
    value: string | number;
    label?: string;
    direction?: "up" | "down" | "neutral";
  };
  badge?: string;
  sparklineData?: number[];
  accentColor?: "blue" | "amber" | "emerald" | "purple" | "cream";
  loading?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  badge,
  sparklineData,
  accentColor = "blue",
  loading = false,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between min-h-[128px] animate-pulse",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-7 w-7 bg-muted rounded-lg" />
        </div>
        <div className="space-y-1.5 mt-3">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted/60 rounded" />
        </div>
      </div>
    );
  }

  const iconBg = {
    blue: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/40",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/40",
    cream: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 border-orange-100 dark:border-orange-900/40",
  }[accentColor];

  const strokeColor = {
    blue: "#6366f1",
    amber: "#f59e0b",
    emerald: "#10b981",
    purple: "#a855f7",
    cream: "#f97316",
  }[accentColor];

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 68;
    const height = 24;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathData = `M ${points.join(" L ")}`;

    return (
      <svg
        className="w-16 h-6 overflow-visible opacity-70 group-hover:opacity-100 transition-opacity shrink-0"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(",")[0]}
            cy={points[points.length - 1].split(",")[1]}
            r="2.5"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border/80 hover:shadow-sm flex flex-col justify-between min-h-[128px]",
        className
      )}
    >
      {/* Top row: Label & Icon/Badge */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
        {badge ? (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-mono font-medium text-muted-foreground border border-border">
            {badge}
          </span>
        ) : Icon ? (
          <div
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center shrink-0",
              iconBg
            )}
          >
            {React.isValidElement(Icon) ? (
              Icon
            ) : (
              React.createElement(Icon as React.ComponentType<{ className?: string }>, { className: "h-3.5 w-3.5" })
            )}
          </div>
        ) : null}
      </div>

      {/* Metric value and trend row */}
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {value}
          </div>

          {(description || trend) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-semibold",
                    trend.direction === "up" && "text-emerald-600 dark:text-emerald-400",
                    trend.direction === "down" && "text-rose-600 dark:text-rose-400",
                    trend.direction === "neutral" && "text-muted-foreground"
                  )}
                >
                  {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
                  <span>{trend.value}</span>
                </span>
              )}
              {description && <span className="truncate">{description}</span>}
            </div>
          )}
        </div>

        {renderSparkline()}
      </div>
    </div>
  );
}
