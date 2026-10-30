import { getCurrentUser } from "@/lib/auth/session";
import {
  User,
  ShieldCheck,
  Cpu,
  FileCheck2,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings & Compliance
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Candidate profile, Rubric v1 scoring configurations, and data isolation policies.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Account Identity"
          value="Active"
          description={user.name || "Authenticated Candidate"}
          icon={User}
          accentColor="blue"
          badge="VERIFIED"
        />

        <KpiCard
          title="Scoring Rubric"
          value="v1.0"
          description="40/20/20/10/10 calibrated"
          icon={Cpu}
          accentColor="cream"
        />

        <KpiCard
          title="Content Preservation"
          value="100%"
          description="Strict fact invariance gate"
          icon={ShieldCheck}
          accentColor="emerald"
        />

        <KpiCard
          title="Multi-Format Engine"
          value="PDF/DOCX/TXT"
          description="Native parser sandboxes"
          icon={FileCheck2}
          accentColor="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Profile Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <User className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Candidate Profile
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Full Name
              </span>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {user.name}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                Email Address
              </span>
              <p className="text-sm font-mono text-foreground mt-0.5">
                {user.email}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-muted-foreground block">
                User Session ID
              </span>
              <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">
                {user.id}
              </p>
            </div>
          </div>
        </div>

        {/* Rubric v1 Governance Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">
              Rubric v1 Standards
            </h2>
          </div>

          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="font-semibold text-foreground block mb-0.5">
                Deterministic Scoring Guarantee
              </span>
              <span>
                Scores are calculated strictly against authenticated facts and target job requirements.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
              <span className="font-semibold text-foreground block mb-0.5">
                Zero Synthetic Hallucinations
              </span>
              <span>
                The platform blocks the addition of ungrounded dates, metrics, degrees, or certifications.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
