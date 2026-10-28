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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-base font-semibold text-red-900">Access Restricted</h2>
        <p className="text-xs text-red-700 mt-1">
          You do not have permission to view this resume document.
        </p>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <Database className="h-3 w-3" />
            <span>AUTHENTIC EVIDENCE INVENTORY</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {resume.originalFileName}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Reconciled document facts and protected values used for verification and 100% preservation gating.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {scan ? (
            <Link
              href={`/dashboard/resumes/${id}/scan`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
            >
              <span>View Scan Report ({scan.score}%)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
            >
              <span>Scan Against Job Description</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Metadata Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
            Format & Size
          </span>
          <span className="text-sm font-semibold text-zinc-900 uppercase">
            {resume.fileType} · {(resume.fileSize / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
            Coverage Status
          </span>
          <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            <span>Complete ({resume.sourceCoverage.processedPages}p)</span>
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
            Inventory Units
          </span>
          <span className="text-sm font-semibold text-zinc-900">
            {resume.blocks.length} blocks · {resume.facts.length} facts
          </span>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
            Provenance SHA-256
          </span>
          <span className="text-xs font-mono text-zinc-600 truncate block">
            {resume.sourceFileSha256.slice(0, 16)}...
          </span>
        </div>
      </div>

      {/* Atomic Facts Inventory Table */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Atomic Fact Inventory
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Extracted factual units with exact provenance spans and protected fields.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {resume.facts.length} facts registered
          </span>
        </div>

        <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
          {resume.facts.map((fact) => (
            <div key={fact.factId} className="py-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-700">
                    {fact.section}
                  </span>
                  <span className="rounded-md bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                    {fact.kind}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  {fact.factId}
                </span>
              </div>

              <p className="text-zinc-800 leading-relaxed font-sans">
                {fact.exactText}
              </p>

              {fact.protectedValues && fact.protectedValues.length > 0 && (
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-zinc-400 font-mono">Protected values:</span>
                  {fact.protectedValues.map((v, i) => (
                    <span
                      key={i}
                      className="rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-mono px-1.5 py-0.2"
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
