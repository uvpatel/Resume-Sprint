import { getCurrentUser } from "@/lib/auth/session";
import {
  User,
  Database,
  Lock,
} from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8E8E8] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
          Settings & Compliance
        </h1>
        <p className="text-sm text-[#626262] mt-1">
          Candidate profile, Rubric v1 scoring configurations, and data isolation policies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Profile Card */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#E8E8E8]">
            <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#252525]">
              Candidate Profile
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Full Name
              </span>
              <p className="text-sm font-bold text-[#252525] mt-0.5">
                {user.name}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Email Address
              </span>
              <p className="text-sm font-mono text-[#252525] mt-0.5">
                {user.email}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                User ID
              </span>
              <p className="text-xs font-mono text-[#626262] mt-0.5">
                {user.id}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-1">
                Authentication Status
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active & Authenticated</span>
              </span>
            </div>
          </div>
        </div>

        {/* ATS & Engine Configuration */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#E8E8E8]">
            <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#252525]">
              Scoring & Rubric Engine
            </h2>
          </div>

          <div className="space-y-3.5 text-xs text-[#626262] leading-relaxed">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                Active Rubric Standard
              </span>
              <p className="font-mono font-bold text-[#252525] text-sm mt-0.5">
                Canonical Rubric v1.0 (40 / 20 / 20 / 10 / 10)
              </p>
            </div>

            <p className="text-xs text-[#626262]">
              Strictly calibrated dimensions: Keywords (40), Alignment (20), Quantified Impact (20), Experience Depth (10), and ATS Formatting (10).
            </p>

            <div className="p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8] space-y-1">
              <span className="text-xs font-bold text-[#252525] block">
                Zero Fabrication Policy
              </span>
              <p className="text-[11px] text-[#626262] leading-normal">
                ResumeSprint will never inject synthetic accomplishments, invented employers, or fictitious metrics into your resume.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Isolation */}
        <div className="md:col-span-2 rounded-xl border border-[#E8E8E8] bg-white p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#E8E8E8]">
            <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
              <Lock className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-[#252525]">
              Security & Data Governance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8] space-y-1">
              <span className="font-bold text-[#252525] block">
                User Isolation
              </span>
              <p className="text-xs text-[#626262] leading-relaxed">
                All resume documents and scans are strictly scoped and authorized to your user session ID.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8] space-y-1">
              <span className="font-bold text-[#252525] block">
                Server-Side Processing
              </span>
              <p className="text-xs text-[#626262] leading-relaxed">
                Document text extraction and AI evaluation occur strictly in isolated server-side sandboxes.
              </p>
            </div>

            <div className="p-4 bg-[#F8FAFC] rounded-lg border border-[#E8E8E8] space-y-1">
              <span className="font-bold text-[#252525] block">
                Preservation Verification
              </span>
              <p className="text-xs text-[#626262] leading-relaxed">
                Exports are cryptographically gated. Any accidental omission of historical facts halts file download.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
