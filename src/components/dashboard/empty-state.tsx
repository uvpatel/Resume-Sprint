import Link from "next/link";
import { LucideIcon, FileSearch } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FileSearch,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6">
      <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3.5">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-5 leading-relaxed">
        {description}
      </p>
      {actionHref && actionText && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          {actionText}
        </Link>
      )}
      {onAction && actionText && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
