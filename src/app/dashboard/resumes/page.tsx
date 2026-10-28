import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>IMMUTABLE EVIDENCE SOURCE STORE</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            My Resumes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Every document retains full source spans, atomic facts, and tamper-proof SHA-256 integrity hashes.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Upload & Scan Resume</span>
        </Link>
      </div>

      {/* List */}
      {resumesWithScans.length === 0 ? (
        <EmptyState
          title="No resumes uploaded yet"
          description="Upload your resume in PDF, DOCX, or TXT format to start analyzing keyword alignment and grounded improvements."
          actionText="Upload Your First Resume"
          actionHref="/dashboard/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumesWithScans.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold flex items-center justify-center uppercase shrink-0">
                    {item.fileType}
                  </div>

                  {item.latestScan ? (
                    <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 font-mono">
                      {item.latestScan.score} / 100
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-100 text-zinc-500 text-[11px] px-2 py-0.5 font-medium">
                      Unscanned
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 truncate">
                    {item.originalFileName}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5 font-mono truncate">
                    Hash: {item.sourceFileSha256.slice(0, 16)}...
                  </p>
                </div>

                <div className="pt-2 text-xs text-zinc-500 space-y-1 border-t border-zinc-100">
                  <div className="flex justify-between">
                    <span>Extracted units:</span>
                    <b className="text-zinc-800">{item.blocks.length} blocks</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Atomic facts:</span>
                    <b className="text-zinc-800">{item.facts.length} facts</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="text-zinc-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/resumes/${item.id}`}
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 py-1"
                >
                  Inspect Facts
                </Link>

                <Link
                  href={`/dashboard/resumes/${item.id}/scan`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1"
                >
                  <span>Report</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
