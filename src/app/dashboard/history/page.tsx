import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getScansByUserId, getResumeById } from "@/lib/db/repository";
import {
  History,
  Plus,
  Award,
  BarChart3,
  Calendar,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scans = await getScansByUserId(user.id);

  // Attach resume records in parallel
  const scansWithResumes = await Promise.all(
    scans.map(async (scan) => {
      const resume = await getResumeById(scan.resumeId);
      return {
        ...scan,
        resume,
      };
    })
  );

  const totalScans = scans.length;
  const bestScore = totalScans > 0 ? Math.max(...scans.map((s) => s.score)) : 0;
  const avgScore =
    totalScans > 0
      ? Math.round(scans.reduce((acc, s) => acc + s.score, 0) / totalScans)
      : 0;

  const scoreTrend = scans.length >= 2
    ? scans.slice(0, 6).reverse().map((s) => s.score)
    : undefined;

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Analysis History
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Diagnostic evaluations timestamped with job criteria hashes and rubric breakdown calculations.
          </p>
        </div>

        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Analyze Resume</span>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Evaluations"
          value={totalScans}
          description="Historical runs recorded"
          icon={History}
          accentColor="blue"
        />

        <KpiCard
          title="Peak Match Score"
          value={totalScans > 0 ? `${bestScore}%` : "—"}
          description="Highest rubric result"
          icon={Award}
          accentColor="emerald"
          sparklineData={scoreTrend}
        />

        <KpiCard
          title="Average Score"
          value={totalScans > 0 ? `${avgScore}%` : "—"}
          description="Across target roles"
          icon={BarChart3}
          accentColor="cream"
        />

        <KpiCard
          title="Latest Run"
          value={totalScans > 0 ? new Date(scans[0].createdAt).toLocaleDateString() : "None"}
          description={totalScans > 0 ? scans[0].targetRole : "Awaiting scan"}
          icon={Calendar}
          accentColor="purple"
        />
      </div>

      {/* Scans Table */}
      {scansWithResumes.length === 0 ? (
        <EmptyState
          icon={History}
          title="No evaluations found"
          description="Analyze your resume against a job description to calculate evidence-linked scores."
          actionText="Run First Analysis"
          actionHref="/dashboard/new"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-medium">
                  <th scope="col" className="py-2.5 px-4 font-medium">Target Role</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Resume</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Analyzed On</th>
                  <th scope="col" className="py-2.5 px-4 font-medium">Match Score</th>
                  <th scope="col" className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scansWithResumes.map((scan) => (
                  <tr
                    key={scan.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/resumes/${scan.resumeId}/scan`}
                        className="font-medium text-foreground hover:text-primary transition-colors block"
                      >
                        {scan.targetRole}
                      </Link>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {scan.matchedKeywords.length} verified skills • {scan.missingKeywords.length} gaps
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {scan.resume?.originalFileName || "Source Resume"}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(scan.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            scan.score >= 80
                              ? "bg-emerald-500"
                              : scan.score >= 60
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="font-mono tabular-nums">{scan.score}%</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/resumes/${scan.resumeId}/scan`}
                        className="text-xs font-medium text-primary hover:text-primary/80 px-2.5 py-1 rounded-md hover:bg-primary/10 transition-colors"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
