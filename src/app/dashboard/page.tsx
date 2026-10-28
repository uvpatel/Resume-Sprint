import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getScansByUserId } from "@/lib/db/repository";
import {
  FileText,
  History,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const resumes = await getResumesByUserId(user.id);
  const scans = await getScansByUserId(user.id);

  // Compute actual metrics from database
  const totalResumes = resumes.length;
  const totalScans = scans.length;
  const avgScore =
    totalScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + s.score, 0) / totalScans)
      : null;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            Overview
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Manage your resumes and track your diagnostic progress toward your next role.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span>New scan</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-xs hover:border-[#2996F3]/30 transition-all">
          <div className="flex items-center justify-between text-[#626262]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Saved Resumes
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] flex items-center justify-center text-[#626262]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#252525]">
              {totalResumes}
            </span>
            <span className="text-xs text-[#626262]">active documents</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-xs hover:border-[#2996F3]/30 transition-all">
          <div className="flex items-center justify-between text-[#626262]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Diagnostic Scans
            </span>
            <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] flex items-center justify-center text-[#626262]">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#252525]">
              {totalScans}
            </span>
            <span className="text-xs text-[#626262]">job evaluations</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-xs hover:border-[#2996F3]/30 transition-all">
          <div className="flex items-center justify-between text-[#626262]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Average Match
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-[#252525]">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </span>
            <span className="text-xs text-[#626262]">
              {avgScore !== null ? "across all target roles" : "no scans yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Resumes & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Resumes */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E8]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-[#252525]">Recent Resumes</h2>
            </div>
            {resumes.length > 0 && (
              <Link
                href="/dashboard/resumes"
                className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] inline-flex items-center gap-0.5 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="flex-1 mt-3">
            {resumes.length === 0 ? (
              <EmptyState
                title="No resumes uploaded"
                description="Upload your authentic resume in PDF, DOCX, or TXT format to start analyzing match scores."
                actionText="Upload Resume"
                actionHref="/dashboard/new"
              />
            ) : (
              <div className="divide-y divide-[#E8E8E8]">
                {resumes.slice(0, 5).map((resume) => (
                  <div
                    key={resume.id}
                    className="py-3 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] text-[#252525] flex items-center justify-center font-mono text-[11px] uppercase shrink-0 font-bold">
                        {resume.fileType}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/dashboard/resumes/${resume.id}`}
                          className="text-[13px] font-semibold text-[#252525] hover:text-[#2996F3] truncate transition-colors"
                        >
                          {resume.originalFileName}
                        </Link>
                        <span className="text-[11px] text-[#626262]">
                          {resume.blocks.length} blocks · {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/resumes/${resume.id}/scan`}
                      className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] px-2.5 py-1 rounded-md hover:bg-[#EAF4FF] transition-colors shrink-0"
                    >
                      Report →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Scan History */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E8]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
                <History className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-[#252525]">Recent Scans</h2>
            </div>
            {scans.length > 0 && (
              <Link
                href="/dashboard/history"
                className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] inline-flex items-center gap-0.5 transition-colors"
              >
                <span>Full history</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="flex-1 mt-3">
            {scans.length === 0 ? (
              <EmptyState
                title="No scan reports found"
                description="Scan your resume against a target job description to reveal keyword matches and improvement opportunities."
                actionText="Start First Scan"
                actionHref="/dashboard/new"
              />
            ) : (
              <div className="divide-y divide-[#E8E8E8]">
                {scans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="py-3 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {scan.score}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/dashboard/resumes/${scan.resumeId}/scan`}
                          className="text-[13px] font-semibold text-[#252525] hover:text-[#2996F3] truncate transition-colors"
                        >
                          {scan.targetRole}
                        </Link>
                        <span className="text-[11px] text-[#626262] flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#9CA3AF]" />
                          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/resumes/${scan.resumeId}/optimize`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#2996F3] hover:bg-[#147DD8] px-3 py-1.5 rounded-lg shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
                      >
                        <span>Optimize</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
