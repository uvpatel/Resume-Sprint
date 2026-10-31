"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  X,
  FileSearch,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface ResumeWithScan {
  id: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  targetRole?: string;
  latestScan?: {
    score: number;
    targetRole?: string;
  } | null;
}

function FormatBadge({ format }: { format: string }) {
  const f = format.toUpperCase();
  if (f === "PDF") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        PDF
      </span>
    );
  }
  if (f === "DOCX") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        DOCX
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
      {f}
    </span>
  );
}

export function ResumesTable({ initialResumes }: { initialResumes: ResumeWithScan[] }) {
  const [filterQuery, setFilterQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialResumes.filter((r) => {
      const q = filterQuery.toLowerCase().trim();
      const matchesText =
        !q ||
        r.originalFileName.toLowerCase().includes(q) ||
        (r.targetRole && r.targetRole.toLowerCase().includes(q)) ||
        (r.latestScan?.targetRole &&
          r.latestScan.targetRole.toLowerCase().includes(q));

      const matchesFormat =
        formatFilter === "all" || r.fileType.toLowerCase() === formatFilter.toLowerCase();

      return matchesText && matchesFormat;
    });
  }, [initialResumes, filterQuery, formatFilter]);

  return (
    <div className="space-y-3">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter resumes by filename or role..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-2xs"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs self-start sm:self-auto">
          {["all", "pdf", "docx", "txt"].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormatFilter(fmt)}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-colors capitalize ${
                formatFilter === fmt
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {fmt === "all" ? "All Formats" : fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Resumes Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                <th scope="col" className="py-2.5 px-4 font-medium">Resume</th>
                <th scope="col" className="py-2.5 px-4 font-medium">Format</th>
                <th scope="col" className="py-2.5 px-4 font-medium">Uploaded</th>
                <th scope="col" className="py-2.5 px-4 font-medium">Latest Match</th>
                <th scope="col" className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-1">
                      <p className="font-medium text-foreground">No matching resumes</p>
                      <p className="text-[11px]">
                        No documents match &ldquo;{filterQuery}&rdquo;. Try clearing your search query or format filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/resumes/${r.id}`}
                            className="font-medium text-foreground hover:text-primary truncate block transition-colors"
                          >
                            {r.originalFileName}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {(r.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <FormatBadge format={r.fileType} />
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      {r.latestScan ? (
                        <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              r.latestScan.score >= 80
                                ? "bg-emerald-500"
                                : r.latestScan.score >= 60
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="font-mono tabular-nums">{r.latestScan.score}%</span>
                          {r.latestScan.targetRole && (
                            <span className="text-muted-foreground text-[11px] font-normal truncate max-w-[140px]">
                              ({r.latestScan.targetRole})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          Not yet scanned
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.latestScan ? (
                          <Link
                            href={`/dashboard/resumes/${r.id}/scan`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-muted text-[11px] font-medium transition-colors"
                          >
                            <span>Report</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard/new"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors"
                          >
                            <FileSearch className="h-3 w-3" />
                            <span>Scan</span>
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/resumes/${r.id}`}
                          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="View resume details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
