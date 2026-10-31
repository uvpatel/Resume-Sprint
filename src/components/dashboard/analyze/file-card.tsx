"use client";

import { useRef } from "react";
import { FileText, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";

interface FileCardProps {
  file: File;
  onReplace: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function FileCard({
  file,
  onReplace,
  onRemove,
  disabled = false,
}: FileCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFormatDetails = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return {
        label: "PDF",
        badgeBg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        iconColor: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
      };
    }
    if (ext === "docx" || ext === "doc") {
      return {
        label: "DOCX",
        badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        iconColor: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      };
    }
    return {
      label: "TXT",
      badgeBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      iconColor: "text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
    };
  };

  const format = getFormatDetails(file.name);
  const sizeKb = (file.size / 1024).toFixed(1);
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const formattedSize = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;

  return (
    <div className="w-full rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-all animate-in fade-in zoom-in-95 duration-150">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onReplace(e.target.files[0]);
          }
        }}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* File info */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div
            className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${format.iconColor}`}
          >
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground truncate max-w-[220px] sm:max-w-[320px]">
                {file.name}
              </p>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${format.badgeBg}`}
              >
                {format.label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{formattedSize}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ready for parsing</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            title="Choose a different resume file"
          >
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
            <span>Replace</span>
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-destructive disabled:opacity-50"
            title="Remove file"
          >
            <Trash2 className="h-3 w-3" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
