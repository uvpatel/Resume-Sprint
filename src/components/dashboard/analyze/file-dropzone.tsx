"use client";

import { useState, useRef } from "react";
import { Upload, FileUp } from "lucide-react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelect, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload resume file dropzone. Click or press Enter or Space to choose a file"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 select-none group ${
        disabled
          ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
          : isDragging
          ? "border-primary bg-primary/5 ring-4 ring-primary/10 scale-[1.005]"
          : "border-border/80 hover:border-primary/60 bg-muted/15 hover:bg-muted/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
          }
        }}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
        {/* Animated icon circle */}
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-xs ${
            isDragging
              ? "bg-primary text-primary-foreground scale-110 shadow-primary/20"
              : "bg-card border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/40 group-hover:scale-105"
          }`}
        >
          {isDragging ? (
            <FileUp className="h-6 w-6 stroke-[2.2] animate-bounce" />
          ) : (
            <Upload className="h-5 w-5 stroke-[2]" />
          )}
        </div>

        {/* Action text */}
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isDragging ? (
              <span className="text-primary font-bold">Drop to upload your resume</span>
            ) : (
              <>
                <span className="text-primary hover:underline underline-offset-4 font-semibold">
                  Click to browse
                </span>{" "}
                or drag and drop here
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Standard text-based PDF, DOCX, or TXT (up to 5MB)
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px]">
          <span className="px-2 py-0.5 rounded-md font-mono font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            PDF
          </span>
          <span className="px-2 py-0.5 rounded-md font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            DOCX
          </span>
          <span className="px-2 py-0.5 rounded-md font-mono font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            TXT
          </span>
        </div>
      </div>
    </div>
  );
}
