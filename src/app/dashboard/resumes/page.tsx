import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getResumesByUserId, getLatestScanByResumeId } from "@/lib/db/repository";
import {
  Plus,
  ArrowRight,
  FileText,
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
    <div className="space-y-8">
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
          className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" />
          <span>Upload resume</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumesWithScans.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#E8E8E8] bg-white p-5 hover:border-[#2996F3]/40 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-[#F8FAFC] text-[#252525] border border-[#E8E8E8] font-mono text-xs font-bold flex items-center justify-center uppercase shrink-0">
                    {item.fileType}
                  </div>

                  {item.latestScan ? (
                    <span className="rounded-full bg-[#EAF4FF] border border-[#2996F3]/20 px-2.5 py-0.5 text-xs font-mono font-bold text-[#147DD8]">
                      {item.latestScan.score} / 100
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#F8FAFC] border border-[#E8E8E8] text-[#626262] text-[11px] px-2.5 py-0.5 font-medium">
                      Unscanned
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#252525] truncate">
                    {item.originalFileName}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono truncate">
                    SHA: {item.sourceFileSha256.slice(0, 16)}...
                  </p>
                </div>

                <div className="pt-3 text-xs text-[#626262] space-y-1.5 border-t border-[#E8E8E8]">
                  <div className="flex justify-between">
                    <span>Parsed units:</span>
                    <span className="text-[#252525] font-mono font-medium">{item.blocks.length} blocks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atomic facts:</span>
                    <span className="text-[#252525] font-mono font-medium">{item.facts.length} facts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 mt-4 border-t border-[#E8E8E8] flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/resumes/${item.id}`}
                  className="text-xs font-medium text-[#626262] hover:text-[#252525] transition-colors"
                >
                  Inspect Facts
                </Link>

                <Link
                  href={`/dashboard/resumes/${item.id}/scan`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] transition-colors"
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
