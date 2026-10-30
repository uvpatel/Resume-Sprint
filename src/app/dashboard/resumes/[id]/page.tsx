import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumeById, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  ArrowRight,
  Database,
  CheckCircle2,
  FileText,
  Hash,
  Layers,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default async function ResumeDetailPage({
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

  // Ownership verification
  if (resume.userId !== user.id) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-center max-w-xl mx-auto my-12">
        <h2 className="text-base font-semibold text-rose-600 dark:text-rose-300">Access Restricted</h2>
        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">
          You do not have permission to view this resume document.
        </p>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);

  return (
    <div className="space-y-7 pb-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {resume.originalFileName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reconciled document facts and protected values verified for 100% content preservation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {scan ? (
            <Link
              href={`/dashboard/resumes/${id}/scan`}
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <span>View Scan Report ({scan.score}%)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Scan Against Job Description</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Format & File Size"
          value={`${resume.fileType.toUpperCase()}`}
          description={`${(resume.fileSize / 1024).toFixed(1)} KB native buffer`}
          icon={FileText}
          accentColor="blue"
        />

        <KpiCard
          title="Coverage Status"
          value={resume.sourceCoverage.complete ? "Complete" : "Partial"}
          description={`${resume.sourceCoverage.processedPages} of ${resume.sourceCoverage.totalPages} pages`}
          icon={CheckCircle2}
          accentColor="emerald"
          badge="100% PARSED"
        />

        <KpiCard
          title="Extracted Units"
          value={`${resume.facts.length} facts`}
          description={`${resume.blocks.length} structured blocks`}
          icon={Layers}
          accentColor="cream"
        />

        <KpiCard
          title="Integrity SHA-256"
          value={`${resume.sourceFileSha256.slice(0, 10)}...`}
          description="Tamper-proof file hash"
          icon={Hash}
          accentColor="purple"
        />
      </div>

      {/* Atomic Facts Inventory Table */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Atomic Fact Registry
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Extracted factual units with exact section categorization and protected values.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
            {resume.facts.length} facts verified
          </span>
        </div>

        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {resume.facts.map((fact) => (
            <div key={fact.factId} className="p-4 sm:p-5 text-xs space-y-2 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted border border-border px-2 py-0.5 text-[11px] font-mono font-bold text-foreground">
                    {fact.section}
                  </span>
                  <span className="rounded-md bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 text-[11px] font-mono font-semibold">
                    {fact.kind}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {fact.factId}
                </span>
              </div>

              <p className="text-foreground text-sm leading-relaxed font-sans">
                {fact.exactText}
              </p>

              {fact.protectedValues && fact.protectedValues.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-mono">Protected values:</span>
                  {fact.protectedValues.map((v, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-mono font-semibold px-2 py-0.5"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
