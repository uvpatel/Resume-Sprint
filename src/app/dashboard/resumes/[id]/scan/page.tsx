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
  FileText,
  CheckCircle2,
  ListOrdered,
  BookOpen,
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
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center max-w-xl mx-auto my-12">
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
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-8 text-center space-y-4 shadow-xs max-w-md mx-auto my-12">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-[#252525]">No Scan Report Found</h2>
        <p className="text-xs text-[#626262]">
          This resume has not been analyzed against a job description yet.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white text-xs font-semibold shadow-xs"
        >
          <span>Run Scan Now</span>
        </Link>
      </div>
    );
  }

  const scoreAssessment =
    scan.score >= 80
      ? {
          title: "Strong Evidence Alignment",
          summary:
            "Your background provides robust evidence for the core technical requirements. High-leverage refinements will focus on quantifying impact and elevating key domain phrasing.",
        }
      : scan.score >= 60
      ? {
          title: "Solid Foundation with Actionable Improvement Areas",
          summary:
            "Your resume contains relevant experience for this role, but several priority qualifications require explicit evidence anchoring or clearer framing.",
        }
      : {
          title: "Significant Gaps Identified Against Criteria",
          summary:
            "Target role requirements show substantial divergence from the verified facts in your resume. Prioritize addressing missing competencies and quantifying historical deliverables.",
        };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 1. Header: Assessment Identity & Contextual Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2996F3]/20 bg-[#EAF4FF] px-2.5 py-0.5 text-xs font-semibold text-[#147DD8] mb-2">
            <Sparkles className="h-3 w-3 text-[#2996F3]" />
            <span>CANONICAL ASSESSMENT REPORT · RUBRIC V1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            {scan.targetRole}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#626262] mt-1.5">
            <span className="flex items-center gap-1 font-medium text-[#252525]">
              <FileText className="h-3.5 w-3.5 text-[#626262]" />
              {resume.originalFileName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
              Scanned on {new Date(scan.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="font-mono text-[#9CA3AF]">
              SHA: {scan.jobDescriptionHash.slice(0, 10)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/dashboard/resumes/${id}`}
            className="text-xs font-semibold text-[#252525] hover:text-[#2996F3] px-3.5 py-2 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] transition-colors shadow-xs"
          >
            Inspect Facts
          </Link>
          <Link
            href={`/dashboard/resumes/${id}/optimize`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3]"
          >
            <span>Review & Optimize</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 2. Flexible Document Layout: Primary Report (8 cols) + Secondary Sticky Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Primary Content Column: Structured Assessment Document */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section A: Assessment Overview (Clean surface with whitespace, not a nested box) */}
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2996F3]" />
                <h2 className="text-base font-bold text-[#252525]">
                  Executive Assessment Overview
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-[#147DD8] bg-[#EAF4FF] px-2.5 py-0.5 rounded-md border border-[#2996F3]/20">
                {scan.score} / 100 Match
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#252525]">
                {scoreAssessment.title}
              </h3>
              <p className="text-sm text-[#626262] leading-relaxed">
                {scoreAssessment.summary}
              </p>
            </div>

            <div className="pt-2 text-xs text-[#626262] leading-relaxed border-t border-[#E8E8E8]">
              Scored using canonical <b>Rubric v1</b>. The score directly reflects verifiable evidence in your resume text. Missing requirements are recorded as explicit gaps rather than hallucinated or synthetically inflated.
            </div>
          </section>

          {/* Section B: Detailed Canonical Rubric v1 Breakdown */}
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E8E8]">
              <div>
                <h2 className="text-base font-bold text-[#252525]">
                  Canonical Rubric v1 Evaluation
                </h2>
                <p className="text-xs text-[#626262] mt-0.5">
                  Five calibrated dimensions strictly summing to the overall match score.
                </p>
              </div>
              <span className="text-xs font-mono text-[#9CA3AF]">
                Total: {scan.score} / 100
              </span>
            </div>

            <RubricBreakdown breakdown={scan.scoreBreakdown} />
          </section>

          {/* Section C: Prioritized Recommendations & Action Plan */}
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-[#2996F3]" />
                <div>
                  <h2 className="text-base font-bold text-[#252525]">
                    Prioritized Improvement Plan
                  </h2>
                  <p className="text-xs text-[#626262] mt-0.5">
                    Recommended sequence to maximize evidence alignment without fabricating achievements.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {scan.topImprovements.map((imp, idx) => (
                <div
                  key={imp.id}
                  className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] space-y-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-6 w-6 rounded-md bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-[#252525]">
                      {imp.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#626262] pl-8.5 leading-relaxed">
                    {imp.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>

          {/* Section D: Keyword & Skill Evidence Grounding */}
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="pb-3.5 border-b border-[#E8E8E8]">
              <h2 className="text-base font-bold text-[#252525]">
                Requirement Evidence Grounding
              </h2>
              <p className="text-xs text-[#626262] mt-0.5">
                Exact breakdown of qualifications supported by your resume versus gaps excluded from rewrites.
              </p>
            </div>

            <KeywordChips
              matchedKeywords={scan.matchedKeywords}
              missingKeywords={scan.missingKeywords}
              unsupportedKeywords={scan.unsupportedMissingKeywords}
            />
          </section>

          {/* Section E: Target Job Description Reference */}
          <section className="rounded-xl border border-[#E8E8E8] bg-white p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#626262]" />
                <h2 className="text-sm font-bold text-[#252525]">
                  Job Description Reference
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#9CA3AF]">
                SHA-256: {scan.jobDescriptionHash.slice(0, 16)}...
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto text-xs text-[#626262] bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E8E8E8] font-mono leading-relaxed whitespace-pre-wrap">
              {scan.jobDescription}
            </div>
          </section>
        </div>

        {/* Secondary Column: Sticky Summary Panel on Desktop */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Sticky Summary Card */}
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 shadow-xs space-y-6">
            <div className="text-center space-y-3 pb-6 border-b border-[#E8E8E8]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Overall Match Score
              </span>
              <div className="flex justify-center py-1">
                <ScoreRing score={scan.score} size={130} strokeWidth={10} />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Authentic Baseline</span>
              </div>
            </div>

            {/* Tripartite Evidence Counts */}
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8]">
                <span className="block text-xl font-bold text-[#252525] tabular-nums">
                  {scan.matchedKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#626262] mt-0.5 block tracking-wider">
                  Verified
                </span>
              </div>
              <div className="p-2 bg-amber-50/50 rounded-lg border border-amber-200/60">
                <span className="block text-xl font-bold text-amber-700 tabular-nums">
                  {scan.missingKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-amber-700 mt-0.5 block tracking-wider">
                  Clarify
                </span>
              </div>
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8]">
                <span className="block text-xl font-bold text-[#9CA3AF] tabular-nums">
                  {scan.unsupportedMissingKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-bold text-[#9CA3AF] mt-0.5 block tracking-wider">
                  Gaps
                </span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white py-2.5 px-4 text-xs font-semibold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3]"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/dashboard/resumes/${id}`}
                className="w-full inline-flex items-center justify-center rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-[#252525] py-2 px-4 text-xs font-semibold transition-colors"
              >
                <span>Inspect Atomic Facts ({resume.facts.length})</span>
              </Link>
            </div>

            {/* Zero Hallucination Guarantee */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] p-3 text-xs text-[#626262] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#252525] text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#2996F3]" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <p className="text-[11px] text-[#626262] leading-normal">
                ResumeSprint preserves your career history intact. Unsupported gaps are highlighted, not masked.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
