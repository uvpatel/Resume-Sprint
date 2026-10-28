import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getScansByUserId } from "@/lib/db/repository";
import {
  FileText,
  ArrowRight,
  Clock,
  ChevronRight,
  FileSearch,
  Sparkles,
  CheckCircle2,
  FileCode,
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            Dashboard
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Evaluate and align your resumes with target roles using evidence-linked diagnostic scoring.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-sm font-semibold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3]"
          >
            <FileSearch className="h-4 w-4" />
            <span>Analyze Resume</span>
          </Link>
        </div>
      </div>

      {/* 2. Prominent Resume-Analysis Entry Point + Compact Progress Strip */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E8E8E8]">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4FF] border border-[#2996F3]/20 px-2.5 py-0.5 text-xs font-semibold text-[#147DD8]">
              <Sparkles className="h-3 w-3 text-[#2996F3]" />
              <span>Evidence-Grounding Engine</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#252525]">
              Match your resume against a target role
            </h2>
            <p className="text-xs sm:text-sm text-[#626262] leading-relaxed">
              Upload your resume alongside a job description. We extract atomic facts, evaluate alignment against Rubric v1, and propose anchored optimizations without hallucinating skills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.99]"
            >
              <FileSearch className="h-4 w-4" />
              <span>Start Analysis</span>
            </Link>
            {totalResumes > 0 && (
              <Link
                href="/dashboard/resumes"
                className="inline-flex items-center justify-center rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-[#252525] px-4 py-2.5 text-sm font-medium transition-colors"
              >
                <span>View Resumes ({totalResumes})</span>
              </Link>
            )}
          </div>
        </div>

        {/* Compact Summary Strip - Clean data without oversized cards */}
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-xs text-[#626262]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] flex items-center justify-center text-[#252525] font-semibold">
              <FileText className="h-4 w-4 text-[#626262]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                Saved Resumes
              </span>
              <span className="text-base font-bold text-[#252525] tabular-nums">
                {totalResumes} {totalResumes === 1 ? "document" : "documents"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-[#E8E8E8] sm:pl-6">
            <div className="h-8 w-8 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] flex items-center justify-center text-[#252525] font-semibold">
              <FileSearch className="h-4 w-4 text-[#626262]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                Diagnostic Scans
              </span>
              <span className="text-base font-bold text-[#252525] tabular-nums">
                {totalScans} {totalScans === 1 ? "evaluation" : "evaluations"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:border-l sm:border-[#E8E8E8] sm:pl-6">
            <div className="h-8 w-8 rounded-lg bg-[#EAF4FF] border border-[#2996F3]/20 flex items-center justify-center text-[#147DD8] font-semibold">
              <CheckCircle2 className="h-4 w-4 text-[#2996F3]" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] block">
                Average Match
              </span>
              <span className="text-base font-bold text-[#252525] tabular-nums">
                {avgScore !== null ? `${avgScore} / 100` : "No scans yet"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Recent Analyses & Previously Analyzed Resumes */}
      <div className="space-y-8">
        {/* Recent Analyses Section */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#E8E8E8] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#252525]">
                Recent Analyses
              </h2>
              <p className="text-xs text-[#626262] mt-0.5">
                Evaluations calculated against canonical Rubric v1 with verified skills breakdown.
              </p>
            </div>
            {scans.length > 0 && (
              <Link
                href="/dashboard/history"
                className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] inline-flex items-center gap-1 transition-colors"
              >
                <span>Full history</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {scans.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileSearch}
                title="No analyses performed yet"
                description="Upload your resume and evaluate it against a target job description to compute evidence-linked scores."
                actionText="Analyze First Resume"
                actionHref="/dashboard/new"
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E8]">
              {scans.slice(0, 5).map((scan) => (
                <div
                  key={scan.id}
                  className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] font-mono font-bold flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-bold leading-none">{scan.score}</span>
                      <span className="text-[8px] uppercase tracking-wider text-[#2996F3] mt-0.5 font-semibold">
                        SCORE
                      </span>
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/resumes/${scan.resumeId}/scan`}
                        className="text-sm font-semibold text-[#252525] hover:text-[#2996F3] truncate block transition-colors"
                      >
                        {scan.targetRole}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#626262]">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-[#9CA3AF]" />
                          <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium text-[11px]">
                          {scan.matchedKeywords.length} verified skills
                        </span>
                        <span>•</span>
                        <span className="text-amber-700 font-medium text-[11px]">
                          {scan.missingKeywords.length} gaps
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/dashboard/resumes/${scan.resumeId}/scan`}
                      className="px-3 py-1.5 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#252525] transition-colors shadow-xs"
                    >
                      Report
                    </Link>
                    <Link
                      href={`/dashboard/resumes/${scan.resumeId}/optimize`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.99]"
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

        {/* Previously Analyzed Resumes Section */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-[#E8E8E8] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#252525]">
                Saved Resume Documents
              </h2>
              <p className="text-xs text-[#626262] mt-0.5">
                Authentic resumes preserved with atomic blocks and factual integrity guarantees.
              </p>
            </div>
            {resumes.length > 0 && (
              <Link
                href="/dashboard/resumes"
                className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] inline-flex items-center gap-1 transition-colors"
              >
                <span>View all ({resumes.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {resumes.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={FileCode}
                title="No resumes saved"
                description="Upload your resume in PDF, DOCX, or TXT format to begin."
                actionText="Upload Resume"
                actionHref="/dashboard/new"
              />
            </div>
          ) : (
            <div className="divide-y divide-[#E8E8E8]">
              {resumes.slice(0, 5).map((resume) => (
                <div
                  key={resume.id}
                  className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] text-[#252525] flex items-center justify-center font-mono text-[11px] uppercase shrink-0 font-bold">
                      {resume.fileType}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/resumes/${resume.id}`}
                        className="text-sm font-semibold text-[#252525] hover:text-[#2996F3] truncate block transition-colors"
                      >
                        {resume.originalFileName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#626262]">
                        <span className="text-[11px] font-mono">
                          {(resume.fileSize / 1024).toFixed(1)} KB
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">
                          {resume.blocks.length} blocks
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">
                          {resume.facts.length} atomic facts
                        </span>
                        <span>•</span>
                        <span className="text-[11px]">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/dashboard/resumes/${resume.id}`}
                      className="px-3 py-1.5 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#252525] transition-colors shadow-xs"
                    >
                      Inspect Facts
                    </Link>
                    <Link
                      href={`/dashboard/resumes/${resume.id}/scan`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#EAF4FF] hover:bg-[#D6EBFF] text-[#147DD8] text-xs font-semibold transition-colors"
                    >
                      <span>Scan Report</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
