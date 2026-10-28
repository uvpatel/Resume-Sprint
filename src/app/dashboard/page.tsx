import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getScansByUserId } from "@/lib/db/repository";
import {
  FileText,
  History,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
  ShieldCheck,
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
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>AUTHENTIC EVIDENCE MATCHING</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Run diagnostic scans against job descriptions, review grounded patches, and optimize your resume.
          </p>
        </div>

       
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Saved Resumes
            </span>
            <FileText className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              {totalResumes}
            </span>
            <span className="text-xs text-zinc-400">active documents</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Diagnostic Scans
            </span>
            <History className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              {totalScans}
            </span>
            <span className="text-xs text-zinc-400">job evaluations</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Average Match
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-zinc-900">
              {avgScore !== null ? `${avgScore}%` : "—"}
            </span>
            <span className="text-xs text-zinc-400">
              {avgScore !== null ? "across all target roles" : "no scans yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Resumes & Recent Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Resumes */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-zinc-900">Recent Resumes</h2>
            </div>
            {resumes.length > 0 && (
              <Link
                href="/dashboard/resumes"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
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
              <div className="divide-y divide-zinc-100">
                {resumes.slice(0, 4).map((resume) => (
                  <div
                    key={resume.id}
                    className="py-3 flex items-center justify-between hover:bg-zinc-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center font-mono text-xs uppercase shrink-0">
                        {resume.fileType}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/dashboard/resumes/${resume.id}`}
                          className="text-xs font-semibold text-zinc-900 hover:text-blue-600 truncate transition-colors"
                        >
                          {resume.originalFileName}
                        </Link>
                        <span className="text-[11px] text-zinc-400">
                          {resume.blocks.length} blocks · {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/resumes/${resume.id}/scan`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors shrink-0"
                    >
                      View Report →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Scan History */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-zinc-900">Recent Scans</h2>
            </div>
            {scans.length > 0 && (
              <Link
                href="/dashboard/history"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
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
              <div className="divide-y divide-zinc-100">
                {scans.slice(0, 4).map((scan) => (
                  <div
                    key={scan.id}
                    className="py-3 flex items-center justify-between hover:bg-zinc-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {scan.score}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/dashboard/resumes/${scan.resumeId}/scan`}
                          className="text-xs font-semibold text-zinc-900 hover:text-blue-600 truncate transition-colors"
                        >
                          {scan.targetRole}
                        </Link>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/resumes/${scan.resumeId}/optimize`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <span>Optimize</span>
                        <ArrowRight className="h-3 w-3" />
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
