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
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h2 className="text-base font-semibold text-rose-700">Access Restricted</h2>
        <p className="text-xs text-rose-600 mt-1">
          You do not have permission to view this scan report.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 text-xs font-semibold text-rose-700 underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);
  if (!scan) {
    return (
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-8 text-center space-y-4 shadow-xs">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-[#252525]">No Scan Report Found</h2>
        <p className="text-xs text-[#626262] max-w-sm mx-auto">
          This resume has not been scanned against a job description yet.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white text-xs font-semibold shadow-sm shadow-blue-500/20"
        >
          <span>Run Scan Now</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2996F3]/20 bg-[#EAF4FF] px-3 py-1 text-xs font-semibold text-[#147DD8] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#2996F3]" />
            <span>CANONICAL SCAN REPORT · RUBRIC V1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            {scan.targetRole}
          </h1>
          <p className="text-xs text-[#626262] mt-1 flex items-center gap-2">
            <span>Source: <b className="text-[#252525]">{resume.originalFileName}</b></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
              {new Date(scan.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/dashboard/resumes/${id}`}
            className="text-xs font-semibold text-[#252525] hover:text-[#2996F3] px-3.5 py-2 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] transition-colors shadow-xs"
          >
            Inspect Facts
          </Link>
          <Link
            href={`/dashboard/resumes/${id}/optimize`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
          >
            <span>Review & Optimize</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Score Card & Rubric Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Match Score Card */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <ScoreRing score={scan.score} size={110} strokeWidth={9} />
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>100% Authentic Baseline</span>
                </div>
                <h2 className="text-base font-bold text-[#252525]">
                  {scan.score >= 70
                    ? "Solid Foundation with Focused Improvement Areas"
                    : "Clear Opportunities to Strengthen Grounded Evidence"}
                </h2>
                <p className="text-xs text-[#626262] leading-relaxed">
                  Scored using canonical Rubric v1. Components strictly sum to visible score. Unsupported requirements remain visible gaps and are not inflated.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E8E8E8] grid grid-cols-3 gap-2 text-center">
              <div className="p-2">
                <span className="block text-2xl font-bold text-[#252525]">
                  {scan.matchedKeywords.length}
                </span>
                <span className="text-xs text-[#626262]">Verified Skills</span>
              </div>
              <div className="p-2 border-x border-[#E8E8E8]">
                <span className="block text-2xl font-bold text-amber-600">
                  {scan.missingKeywords.length}
                </span>
                <span className="text-xs text-[#626262]">Needs Clarification</span>
              </div>
              <div className="p-2">
                <span className="block text-2xl font-bold text-[#9CA3AF]">
                  {scan.unsupportedMissingKeywords.length}
                </span>
                <span className="text-xs text-[#626262]">Unsupported Gaps</span>
              </div>
            </div>
          </div>

          {/* Rubric Breakdown */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
              <h3 className="text-sm font-bold text-[#252525]">
                Canonical Rubric v1 Breakdown
              </h3>
              <span className="text-xs font-mono font-medium text-[#626262]">
                Total: {scan.score} / 100
              </span>
            </div>
            <RubricBreakdown breakdown={scan.scoreBreakdown} />
          </div>

          {/* Safety Note */}
          <div className="rounded-xl border border-[#E8E8E8] bg-[#F8FAFC] p-4 text-xs text-[#626262] space-y-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#252525]">
              <ShieldCheck className="h-4 w-4 text-[#2996F3]" />
              <span>Evidence Preservation Commitment</span>
            </div>
            <p className="text-xs text-[#626262] leading-relaxed">
              Scan diagnoses without mutating your content. Optimization only proposes anchored improvements for verifiable facts. No hallucinated tools or inflated metrics.
            </p>
          </div>
        </div>

        {/* Right Column: Improvement Opportunities & Keyword Grounding */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top 3 Steps */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#2996F3] font-bold">
                PRIORITIZED ACTIONS
              </span>
              <span className="text-xs text-[#626262]">Top recommendations</span>
            </div>

            <div className="space-y-4">
              {scan.topImprovements.map((imp, idx) => (
                <div key={imp.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-[#252525]">
                      {imp.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#626262] pl-8 leading-relaxed">
                    {imp.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E8E8E8]">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white py-2.5 px-4 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Keyword Grounding */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#252525] pb-3 border-b border-[#E8E8E8]">
              Requirement Evidence Grounding
            </h3>
            <KeywordChips
              matchedKeywords={scan.matchedKeywords}
              missingKeywords={scan.missingKeywords}
              unsupportedKeywords={scan.unsupportedMissingKeywords}
            />
          </div>

          {/* Job Description Snapshot */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#252525]">
                Job Description Reference
              </span>
              <span className="text-[11px] font-mono text-[#9CA3AF]">
                Hash: {scan.jobDescriptionHash.slice(0, 12)}...
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto text-xs text-[#626262] bg-[#F8FAFC] p-3 rounded-lg border border-[#E8E8E8] font-mono leading-relaxed whitespace-pre-wrap">
              {scan.jobDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
