import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumeById, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  ArrowRight,
  Database,
  CheckCircle2,
} from "lucide-react";

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
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center max-w-xl mx-auto my-12">
        <h2 className="text-base font-semibold text-rose-700">Access Restricted</h2>
        <p className="text-xs text-rose-600 mt-1">
          You do not have permission to view this resume document.
        </p>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2996F3]/20 bg-[#EAF4FF] px-2.5 py-0.5 text-xs font-semibold text-[#147DD8] mb-2">
            <Database className="h-3 w-3 text-[#2996F3]" />
            <span>AUTHENTIC EVIDENCE INVENTORY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            {resume.originalFileName}
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Reconciled document facts and protected values verified for 100% content preservation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {scan ? (
            <Link
              href={`/dashboard/resumes/${id}/scan`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
            >
              <span>View Scan Report ({scan.score} / 100)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
            >
              <span>Scan Against Job Description</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Metadata Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-1">
            Format & Size
          </span>
          <span className="text-sm font-bold text-[#252525] uppercase">
            {resume.fileType} · {(resume.fileSize / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="rounded-xl border border-[#E8E8E8] bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-1">
            Coverage Status
          </span>
          <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Complete ({resume.sourceCoverage.processedPages}p)</span>
          </span>
        </div>

        <div className="rounded-xl border border-[#E8E8E8] bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-1">
            Inventory Units
          </span>
          <span className="text-sm font-bold text-[#252525]">
            {resume.blocks.length} blocks · {resume.facts.length} facts
          </span>
        </div>

        <div className="rounded-xl border border-[#E8E8E8] bg-white p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-1">
            Provenance SHA-256
          </span>
          <span className="text-xs font-mono text-[#626262] truncate block" title={resume.sourceFileSha256}>
            {resume.sourceFileSha256.slice(0, 16)}...
          </span>
        </div>
      </div>

      {/* Atomic Facts Inventory Table */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8E8E8] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#252525]">
              Atomic Fact Registry
            </h2>
            <p className="text-xs text-[#626262] mt-0.5">
              Extracted factual units with exact section categorization and protected values.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-[#626262] bg-[#F8FAFC] border border-[#E8E8E8] px-2.5 py-1 rounded-md">
            {resume.facts.length} facts verified
          </span>
        </div>

        <div className="divide-y divide-[#E8E8E8] max-h-[600px] overflow-y-auto">
          {resume.facts.map((fact) => (
            <div key={fact.factId} className="p-4 sm:p-5 text-xs space-y-2 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#F8FAFC] border border-[#E8E8E8] px-2 py-0.5 text-[11px] font-mono font-bold text-[#252525]">
                    {fact.section}
                  </span>
                  <span className="rounded-md bg-[#EAF4FF] border border-[#2996F3]/20 text-[#147DD8] px-2 py-0.5 text-[11px] font-mono font-semibold">
                    {fact.kind}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#9CA3AF]">
                  {fact.factId}
                </span>
              </div>

              <p className="text-[#252525] text-sm leading-relaxed font-sans">
                {fact.exactText}
              </p>

              {fact.protectedValues && fact.protectedValues.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#9CA3AF] font-mono">Protected values:</span>
                  {fact.protectedValues.map((v, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-mono font-semibold px-2 py-0.5"
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
