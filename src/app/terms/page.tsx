import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-[#252525] flex flex-col p-6 sm:p-12">
      <div className="max-w-3xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#626262] hover:text-[#252525] transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-[#252525] mb-4">
          Terms of Service
        </h1>
        <p className="text-sm font-mono text-[#626262] mb-8">
          Last updated: October 2026
        </p>

        <div className="space-y-6 text-sm text-[#4B5563] leading-relaxed">
          <p>
            By using ResumeSprint, you acknowledge that our tools provide evidence-based suggestions for tailoring your existing resume to specific job requirements.
          </p>
          <h2 className="text-lg font-bold text-[#252525] pt-4">User Responsibility</h2>
          <p>
            You maintain full ownership and ultimate responsibility for the factual truthfulness of any resume created, edited, or exported using the platform.
          </p>
          <h2 className="text-lg font-bold text-[#252525] pt-4">No Guarantees of Hiring</h2>
          <p>
            ResumeSprint helps optimize clarity and alignment. We make no representations or guarantees regarding interviews, job offers, or specific ATS algorithms.
          </p>
        </div>
      </div>
    </div>
  );
}
