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
    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
      <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900 mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionHref && actionText && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
      {onAction && actionText && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
