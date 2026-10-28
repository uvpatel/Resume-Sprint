import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  Plus,
  ArrowRight,
  FileText,
  Clock,
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            My Resumes
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Documents retained with verified source spans, atomic facts, and SHA-256 integrity.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-sm font-semibold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3]"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Resume</span>
        </Link>
      </div>

      {/* Resumes Collection */}
      {resumesWithScans.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No resumes uploaded yet"
          description="Upload your resume in PDF, DOCX, or TXT format to start analyzing keyword alignment and grounded improvements."
          actionText="Upload Your First Resume"
          actionHref="/dashboard/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumesWithScans.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#E8E8E8] bg-white p-6 hover:border-[#2996F3]/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#F8FAFC] text-[#252525] border border-[#E8E8E8] font-mono text-xs font-bold flex items-center justify-center uppercase shrink-0">
                    {item.fileType}
                  </div>

                  {item.latestScan ? (
                    <span className="rounded-full bg-[#EAF4FF] border border-[#2996F3]/20 px-2.5 py-1 text-xs font-mono font-bold text-[#147DD8]">
                      {item.latestScan.score} / 100
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F8FAFC] border border-[#E8E8E8] text-[#626262] text-[11px] px-2.5 py-1 font-medium">
                      Unscanned
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-[#252525] truncate" title={item.originalFileName}>
                    {item.originalFileName}
                  </h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono truncate">
                    SHA: {item.sourceFileSha256.slice(0, 16)}...
                  </p>
                </div>

                <div className="pt-3 text-xs text-[#626262] space-y-2 border-t border-[#E8E8E8]">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Parsed Blocks:</span>
                    <span className="text-[#252525] font-mono font-medium">{item.blocks.length} units</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Atomic Facts:</span>
                    <span className="text-[#252525] font-mono font-medium">{item.facts.length} verified</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Uploaded:</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3 text-[#9CA3AF]" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E8E8E8] flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/resumes/${item.id}`}
                  className="text-xs font-semibold text-[#626262] hover:text-[#252525] transition-colors"
                >
                  Inspect Facts
                </Link>

                <div className="flex items-center gap-2">
                  {item.latestScan ? (
                    <Link
                      href={`/dashboard/resumes/${item.id}/scan`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] transition-colors"
                    >
                      <span>Report</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/dashboard/new"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] transition-colors"
                    >
                      <span>Scan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
