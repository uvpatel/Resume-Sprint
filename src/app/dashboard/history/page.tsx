import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getScansByUserId, getResumeById } from "@/lib/db/repository";
import {
  History,
  ArrowRight,
  Clock,
  FileText,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scans = await getScansByUserId(user.id);

  // Attach resume records in parallel
  const scansWithResumes = await Promise.all(
    scans.map(async (scan) => {
      const resume = await getResumeById(scan.resumeId);
      return {
        ...scan,
        resume,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <History className="h-3 w-3" />
            <span>SESSION AUDIT & SCAN LOGS</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Scan History
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Every scan report is timestamped with job criteria hashes and rubric breakdown calculations.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
        >
          <span>Run New Scan</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {scansWithResumes.length === 0 ? (
        <EmptyState
          icon={History}
          title="No scan history yet"
          description="When you analyze your resume against job postings, your match reports and improvement records will appear here."
          actionText="Create First Scan"
          actionHref="/dashboard/new"
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {scansWithResumes.map((scan) => (
              <div
                key={scan.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold flex flex-col items-center justify-center shrink-0">
                    <span className="text-base leading-none">{scan.score}</span>
                    <span className="text-[9px] font-mono text-blue-500 uppercase mt-0.5">
                      MATCH
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-semibold text-zinc-900 truncate">
                      {scan.targetRole}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <FileText className="h-3 w-3 text-zinc-400" />
                        {scan.resume?.originalFileName || "Resume document"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ {scan.matchedKeywords.length} verified
                      </span>
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        ? {scan.missingKeywords.length} unconfirmed
                      </span>
                      <span className="text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                        ✕ {scan.unsupportedMissingKeywords.length} unsupported gaps
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                  <Link
                    href={`/dashboard/resumes/${scan.resumeId}/scan`}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors"
                  >
                    View Report
                  </Link>

                  <Link
                    href={`/dashboard/resumes/${scan.resumeId}/optimize`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    <span>Optimize</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
