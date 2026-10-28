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
    <div className="rounded-2xl border border-dashed border-[#E8E8E8] bg-white p-8 sm:p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 shadow-xs">
      <div className="h-12 w-12 rounded-xl bg-[#EAF4FF] border border-[#2996F3]/20 text-[#2996F3] flex items-center justify-center mb-3.5 shadow-xs">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-[#252525] mb-1.5">{title}</h3>
      <p className="text-xs text-[#626262] max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {actionHref && actionText && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-lg bg-[#2996F3] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#147DD8] transition-all active:scale-[0.99]"
        >
          {actionText}
        </Link>
      )}
      {onAction && actionText && !actionHref && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-[#2996F3] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#147DD8] transition-all active:scale-[0.99]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
