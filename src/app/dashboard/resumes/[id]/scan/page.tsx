import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumeById, getLatestScanByResumeId } from "@/lib/db/repository";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { RubricBreakdown } from "@/components/dashboard/rubric-breakdown";
import { KeywordChips } from "@/components/dashboard/keyword-chips";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!id) notFound();

  const resume = await getResumeById(id);
  if (!resume) notFound();

  // Strict ownership check
  if (resume.userId !== user.id) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-base font-semibold text-red-900">Access Restricted</h2>
        <p className="text-xs text-red-700 mt-1">
          You do not have permission to view this scan report.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 text-xs font-semibold text-red-900 underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);
  if (!scan) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-semibold text-zinc-900">No Scan Report Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          This resume has not been scanned against a job description yet.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          <span>Run Scan Now</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>CANONICAL SCAN REPORT · RUBRIC V1</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {scan.targetRole}
          </h1>
          <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
            <span>Source: <b className="text-zinc-700">{resume.originalFileName}</b></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(scan.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/resumes/${id}`}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
          >
            View Parsed Facts
          </Link>
          <Link
            href={`/dashboard/resumes/${id}/optimize`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
          >
            <span>Review & Optimize Resume</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Score Card & Rubric Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Match Score Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <ScoreRing score={scan.score} size={130} strokeWidth={11} />
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>100% Authentic Baseline</span>
                </div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  {scan.score >= 70
                    ? "Solid Foundation with Focused Improvement Areas"
                    : "Clear Opportunities to Strengthen Grounded Evidence"}
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Scored using canonical Rubric v1. Components strictly sum to the visible score. Unsupported requirements remain visible gaps and are not inflated.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-3 gap-2 text-center">
              <div className="p-2">
                <span className="block text-xl font-bold text-zinc-900">
                  {scan.matchedKeywords.length}
                </span>
                <span className="text-[11px] text-zinc-400">Verified Skills</span>
              </div>
              <div className="p-2 border-x border-zinc-100">
                <span className="block text-xl font-bold text-amber-600">
                  {scan.missingKeywords.length}
                </span>
                <span className="text-[11px] text-zinc-400">Needs Clarification</span>
              </div>
              <div className="p-2">
                <span className="block text-xl font-bold text-zinc-400">
                  {scan.unsupportedMissingKeywords.length}
                </span>
                <span className="text-[11px] text-zinc-400">Unsupported Gaps</span>
              </div>
            </div>
          </div>

          {/* Rubric Breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-900">
                Canonical Rubric v1 Breakdown
              </h3>
              <span className="text-xs font-mono text-zinc-500">
                Total: {scan.score} / 100
              </span>
            </div>
            <RubricBreakdown breakdown={scan.scoreBreakdown} />
          </div>

          {/* Target Forecast & Safety Note */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Evidence Preservation Commitment</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Scan diagnoses without mutating your content. Optimization only proposes anchored improvements for verifiable facts. No hallucinated tools or inflated metrics.
            </p>
          </div>
        </div>

        {/* Right Column: Improvement Opportunities & Keyword Grounding */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top 3 Steps */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                PRIORITIZED ACTIONS
              </span>
              <span className="text-xs text-zinc-400">Top 3 recommendations</span>
            </div>

            <div className="space-y-4">
              {scan.topImprovements.map((imp, idx) => (
                <div key={imp.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-900">
                      {imp.title}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-500 pl-7 leading-relaxed">
                    {imp.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Keyword Grounding */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 pb-3 border-b border-zinc-100">
              Requirement Evidence Grounding
            </h3>
            <KeywordChips
              matchedKeywords={scan.matchedKeywords}
              missingKeywords={scan.missingKeywords}
              unsupportedKeywords={scan.unsupportedMissingKeywords}
            />
          </div>

          {/* Job Description Snapshot */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">
                Job Description Reference
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Hash: {scan.jobDescriptionHash}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100 font-sans leading-relaxed whitespace-pre-wrap">
              {scan.jobDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
