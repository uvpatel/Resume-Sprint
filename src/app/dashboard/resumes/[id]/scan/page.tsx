import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumeById, getLatestScanByResumeId } from "@/lib/db/repository";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { RubricBreakdown } from "@/components/dashboard/rubric-breakdown";
import { KeywordChips } from "@/components/dashboard/keyword-chips";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
  CheckCircle2,
  ListOrdered,
  BookOpen,
  Target,
  BarChart3,
  Award,
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
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center max-w-xl mx-auto my-12">
        <h2 className="text-base font-semibold text-rose-600 dark:text-rose-300">Access Restricted</h2>
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
          You do not have permission to view this scan report.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-4 text-xs font-semibold text-rose-600 dark:text-rose-400 underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);
  if (!scan) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-xs">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-foreground">No Scan Report Found</h2>
        <p className="text-xs text-muted-foreground">
          This resume has not been analyzed against a job description yet.
        </p>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs"
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
    <div className="space-y-7 pb-10">
      {/* 1. Header: Assessment Identity & Contextual Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {scan.targetRole}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              {resume.originalFileName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              Scanned on {new Date(scan.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span className="font-mono text-muted-foreground">
              SHA: {scan.jobDescriptionHash.slice(0, 10)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/dashboard/resumes/${id}`}
            className="text-xs font-medium text-foreground hover:bg-muted px-3 py-2 rounded-xl border border-border bg-card transition-colors shadow-xs"
          >
            Inspect Facts
          </Link>
          <Link
            href={`/dashboard/resumes/${id}/optimize`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <span>Review & Optimize</span>
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Overall Alignment"
          value={`${scan.score}%`}
          description="Canonical Rubric v1"
          icon={Award}
          accentColor="blue"
        />

        <KpiCard
          title="Keywords & Skills"
          value={`${scan.scoreBreakdown.keywordSkillMatch} / 40`}
          description={`${scan.matchedKeywords.length} verified keywords`}
          icon={CheckCircle2}
          accentColor="emerald"
        />

        <KpiCard
          title="Quantified Impact"
          value={`${scan.scoreBreakdown.quantifiedImpact} / 20`}
          description="Measurable achievements"
          icon={BarChart3}
          accentColor="cream"
        />

        <KpiCard
          title="Role Progression"
          value={`${scan.scoreBreakdown.roleTitleAlignment} / 20`}
          description="Scope & seniority fit"
          icon={Target}
          accentColor="purple"
        />
      </div>

      {/* 2. Primary Report (8 cols) + Secondary Sticky Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Content Column: Structured Assessment Document */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section A: Assessment Overview */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Executive Assessment Overview
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {scan.score}% Match
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                {scoreAssessment.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {scoreAssessment.summary}
              </p>
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground leading-relaxed border-t border-border">
              Scored using canonical <b className="text-foreground">Rubric v1</b>. The score directly reflects verifiable evidence in your resume text. Missing requirements are recorded as explicit gaps rather than hallucinated or synthetically inflated.
            </div>
          </section>

          {/* Section B: Detailed Canonical Rubric v1 Breakdown */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Canonical Rubric v1 Evaluation
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Five calibrated dimensions strictly summing to the overall match score.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total: <span className="text-foreground font-bold">{scan.score}</span> / 100
              </span>
            </div>

            <RubricBreakdown breakdown={scan.scoreBreakdown} />
          </section>

          {/* Section C: Prioritized Recommendations & Action Plan */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Prioritized Improvement Plan
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recommended sequence to maximize evidence alignment without fabricating achievements.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {scan.topImprovements.map((imp, idx) => (
                <div
                  key={imp.id}
                  className="p-3.5 rounded-lg bg-muted/40 border border-border space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-md bg-primary/10 text-primary font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>
                    <h3 className="text-xs font-semibold text-foreground">
                      {imp.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground pl-7 leading-relaxed">
                    {imp.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
              </Link>
            </div>
          </section>

          {/* Section D: Keyword & Skill Evidence Grounding */}
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="pb-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Requirement Evidence Grounding
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
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
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold text-foreground">
                  Job Description Reference
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                SHA: {scan.jobDescriptionHash.slice(0, 16)}...
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-lg border border-border font-mono leading-relaxed whitespace-pre-wrap">
              {scan.jobDescription}
            </div>
          </section>
        </div>

        {/* Secondary Column: Sticky Summary Panel on Desktop */}
        <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-5">
            <div className="text-center space-y-2 pb-5 border-b border-border">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Overall Match Score
              </span>
              <div className="flex justify-center py-2">
                <ScoreRing score={scan.score} size={120} strokeWidth={10} />
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-xs font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Authentic Baseline</span>
              </div>
            </div>

            {/* Evidence Counts */}
            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="p-2 bg-muted/40 rounded-lg border border-border">
                <span className="block text-lg font-bold text-foreground font-mono tabular-nums">
                  {scan.matchedKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Verified
                </span>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <span className="block text-lg font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                  {scan.missingKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block">
                  Clarify
                </span>
              </div>
              <div className="p-2 bg-muted/40 rounded-lg border border-border">
                <span className="block text-lg font-bold text-muted-foreground font-mono tabular-nums">
                  {scan.unsupportedMissingKeywords.length}
                </span>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground mt-0.5 block">
                  Gaps
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Link
                href={`/dashboard/resumes/${id}/optimize`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 px-4 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
              >
                <span>Launch Optimization Workspace</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.2]" />
              </Link>
              <Link
                href={`/dashboard/resumes/${id}`}
                className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-foreground py-2 px-4 text-xs font-medium transition-colors"
              >
                <span>Inspect Atomic Facts ({resume.facts.length})</span>
              </Link>
            </div>

            {/* Fact Preservation Assurance */}
            <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Zero Hallucination Guarantee</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ResumeSprint preserves your career history intact. Unsupported gaps are highlighted, not masked.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
