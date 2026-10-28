import { getCurrentUser } from "@/lib/auth/session";
import {
  User,
  Settings as SettingsIcon,
  Database,
  Lock,
} from "lucide-react";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
          <SettingsIcon className="h-3 w-3" />
          <span>ACCOUNT & PREFERENCES</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Settings & Compliance
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Manage your account profile, ATS parser configurations, and privacy commitments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <User className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-zinc-900">
              Candidate Profile
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Full Name
              </span>
              <p className="text-sm font-semibold text-zinc-900 mt-0.5">
                {user.name}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Email Address
              </span>
              <p className="text-sm font-mono text-zinc-800 mt-0.5">
                {user.email}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Candidate ID
              </span>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                {user.id}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Session Status
              </span>
              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Active & Authenticated</span>
              </span>
            </div>
          </div>
        </div>

        {/* ATS & Engine Configuration */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Database className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-zinc-900">
              Scoring & Rubric Model
            </h2>
          </div>

          <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                Scoring Rubric Version
              </span>
              <p className="font-semibold text-zinc-900 mt-0.5">
                Rubric v1.0 (40 / 20 / 20 / 10 / 10)
              </p>
            </div>

            <p className="text-[11px] text-zinc-500">
              Scores are calibrated strictly against evidence: Keyword & Skill Match (40), Role Alignment (20), Quantified Impact (20), Experience Depth (10), and ATS Readability (10).
            </p>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-[11px] font-semibold text-zinc-800 block mb-1">
                Zero Fabrication Policy
              </span>
              <p className="text-[11px] text-zinc-500 leading-normal">
                ResumeSprint will never inject synthetic employers, unverified technologies, or fictitious percentage metrics into your resume.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Data Privacy */}
        <div className="md:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Lock className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-zinc-900">
              Data Privacy & Protection
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="font-semibold text-zinc-900 block mb-1">
                User Isolation
              </span>
              <p className="text-[11px] text-zinc-500">
                Every resume document and scan session is cryptographically bound to your user ID.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="font-semibold text-zinc-900 block mb-1">
                Server-Side AI Secrets
              </span>
              <p className="text-[11px] text-zinc-500">
                Gemini API tokens and models remain strictly on the server and are never exposed to browser clients.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="font-semibold text-zinc-900 block mb-1">
                Preservation Gate
              </span>
              <p className="text-[11px] text-zinc-500">
                Export and downloads are blocked if any original fact or date disappears from your working draft.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
