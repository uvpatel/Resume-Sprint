import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getScansByUserId, getResumeById } from "@/lib/db/repository";
import {
  History,
  ArrowRight,
  Clock,
  FileText,
  Plus,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            Scan History
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Historical diagnostic evaluations timestamped with job criteria hashes and rubric breakdown calculations.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          <span>New scan</span>
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
        <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
          <div className="divide-y divide-[#E8E8E8]">
            {scansWithResumes.map((scan) => (
              <div
                key={scan.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] font-bold flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-base font-mono leading-none">{scan.score}</span>
                    <span className="text-[9px] font-mono text-[#2996F3] uppercase mt-0.5 tracking-wider font-semibold">
                      MATCH
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-sm font-bold text-[#252525] truncate">
                      {scan.targetRole}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#626262]">
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <FileText className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {scan.resume?.originalFileName || "Resume document"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
                        ✓ {scan.matchedKeywords.length} verified
                      </span>
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                        ? {scan.missingKeywords.length} unconfirmed
                      </span>
                      <span className="text-[#626262] bg-[#F8FAFC] border border-[#E8E8E8] px-2 py-0.5 rounded-md">
                        ✕ {scan.unsupportedMissingKeywords.length} gaps
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  <Link
                    href={`/dashboard/resumes/${scan.resumeId}/scan`}
                    className="px-3.5 py-1.5 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#252525] transition-colors shadow-xs"
                  >
                    View Report
                  </Link>

                  <Link
                    href={`/dashboard/resumes/${scan.resumeId}/optimize`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-xs font-semibold text-white shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
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
