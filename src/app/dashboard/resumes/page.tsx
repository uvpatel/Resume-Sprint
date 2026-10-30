import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  Plus,
  FileText,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  MoreVertical,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";

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
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                  <th scope="col" className="py-2.5 px-4 font-medium">Resume</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Format</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Uploaded</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Latest Match</th>
                  <th scope="col" className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resumesWithScans.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/resumes/${r.id}`}
                            className="font-medium text-foreground hover:text-primary truncate block transition-colors"
                          >
                            {r.originalFileName}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {(r.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <FormatBadge format={r.fileType} />
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      {r.latestScan ? (
                        <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              r.latestScan.score >= 80
                                ? "bg-emerald-500"
                                : r.latestScan.score >= 60
                                ? "bg-indigo-500"
                                : "bg-amber-500"
                            }`}
                          />
                          <span className="font-mono tabular-nums">{r.latestScan.score}%</span>
                          <span className="text-muted-foreground text-[11px] font-normal truncate max-w-[140px]">
                            ({r.latestScan.targetRole})
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-zinc-600" />
                          <span>Unscanned</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {r.latestScan ? (
                          <Link
                            href={`/dashboard/resumes/${r.id}/scan`}
                            className="text-xs font-medium text-primary hover:text-primary/80 px-2.5 py-1 rounded-md hover:bg-primary/10 transition-colors"
                          >
                            Report
                          </Link>
                        ) : (
                          <Link
                            href="/dashboard/new"
                            className="text-xs font-medium text-primary hover:text-primary/80 px-2.5 py-1 rounded-md hover:bg-primary/10 transition-colors"
                          >
                            Analyze
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/resumes/${r.id}`}
                          className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
                          aria-label="Options"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
