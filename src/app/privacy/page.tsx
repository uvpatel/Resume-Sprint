import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm font-mono text-[#626262] mb-8">
          Last updated: October 2026
        </p>

        <div className="space-y-6 text-sm text-[#4B5563] leading-relaxed">
          <p>
            ResumeSprint is designed with data minimization as a core tenet. We analyze resume text and job descriptions to provide optimization guidance.
          </p>
          <h2 className="text-lg font-bold text-[#252525] pt-4">Data Usage</h2>
          <p>
            Uploaded resume content is processed solely for generating evidence matches, identifying skill alignments, and proposing user-governed changes.
          </p>
          <h2 className="text-lg font-bold text-[#252525] pt-4">Fact Preservation</h2>
          <p>
            We do not manufacture qualifications or sell candidate data. All edits remain strictly under candidate control.
          </p>
        </div>
      </div>
    </div>
  );
}
