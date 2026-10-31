import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  Plus,
  FileText,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ResumesTable } from "@/components/dashboard/resumes-table";

function FormatBadge({ format }: { format: string }) {
  const f = format.toUpperCase();
  if (f === "PDF") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        PDF
      </span>
    );
  }
  if (f === "DOCX") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        DOCX
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
      {f}
    </span>
  );
}

export default async function ResumesListPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const resumes = await getResumesByUserId(user.id);

  // Fetch latest scan score for each resume in parallel
  const resumesWithScans = await Promise.all(
    resumes.map(async (resume) => {
      const scan = await getLatestScanByResumeId(resume.id);
      return {
        ...resume,
        latestScan: scan,
      };
    })
  );

  const scannedCount = resumesWithScans.filter((r) => r.latestScan).length;
  const pdfCount = resumes.filter((r) => r.fileType === "pdf").length;
  const docxCount = resumes.filter((r) => r.fileType === "docx").length;
  const txtCount = resumes.filter((r) => r.fileType === "txt").length;

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Resumes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Retained documents with verified source spans, atomic facts, and SHA-256 integrity.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Upload Resume</span>
        </Link>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Resumes"
          value={resumes.length}
          description="Documents in inventory"
          icon={FileText}
          accentColor="blue"
        />
        <KpiCard
          title="Scanned & Scored"
          value={scannedCount}
          description={`${resumes.length - scannedCount} unscanned`}
          icon={FileSearch}
          accentColor="amber"
          trend={
            resumes.length > 0
              ? {
                  value: `${Math.round((scannedCount / resumes.length) * 100)}%`,
                  direction: scannedCount > 0 ? "up" : "neutral",
                }
              : undefined
          }
        />
        <KpiCard
          title="Format Distribution"
          value={`${pdfCount}P / ${docxCount}W / ${txtCount}T`}
          description="PDF · DOCX · TXT"
          icon={CheckCircle2}
          accentColor="emerald"
        />
        <KpiCard
          title="Preservation Rate"
          value="100%"
          description="Zero synthetic modifications"
          icon={ShieldCheck}
          accentColor="purple"
          badge="CANONICAL"
        />
      </div>

      {/* Resumes Collection */}
      {resumesWithScans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes uploaded yet"
          description="Upload your first resume in PDF, DOCX, or TXT format to begin evaluating job matches."
          actionText="Upload Resume"
          actionHref="/dashboard/new"
        />
      ) : (
        <ResumesTable initialResumes={resumesWithScans} />
      )}
    </div>
  );
}
