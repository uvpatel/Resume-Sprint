"use client";

import { useState } from "react";
import {
  ResumeRecord,
  ScanRecord,
  OptimizationRecord,
} from "@/lib/db/types";
import { WordDiff } from "./word-diff";
import { KpiCard } from "./kpi-card";
import {
  Check,
  X,
  Undo2,
  Edit3,
  Download,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  Layers,
  FileCheck2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

interface OptimizationWorkspaceProps {
  initialResume: ResumeRecord;
  initialScan: ScanRecord;
  initialOptimization: OptimizationRecord;
}

export function OptimizationWorkspace({
  initialResume,
  initialScan,
  initialOptimization,
}: OptimizationWorkspaceProps) {
  const [opt, setOpt] = useState<OptimizationRecord>(initialOptimization);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [editingChangeId, setEditingChangeId] = useState<string | null>(null);
  const [customEditText, setCustomEditText] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Decisions: accept, reject, edit, undo
  const handleDecision = async (
    changeId: string,
    decision: "accept" | "reject" | "edit" | "undo",
    text?: string
  ) => {
    setLoadingAction(`${decision}-${changeId}`);
    try {
      const res = await fetch("/api/optimizations/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: initialResume.id,
          changeId,
          decision,
          editedText: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setOpt(data.optimization);
      if (decision === "edit") {
        setEditingChangeId(null);
        showToast("Custom edit saved for validation. Re-score to verify.");
      } else if (decision === "accept") {
        showToast("Proposal accepted. Working draft updated.");
      } else if (decision === "reject") {
        showToast("Proposal rejected. Original wording retained.");
      } else if (decision === "undo") {
        showToast("Decision undone. Source text restored.");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update decision");
    } finally {
      setLoadingAction(null);
    }
  };

  // ATS profile switch
  const handleAtsChange = async (newAts: string) => {
    setOpt((prev) => ({
      ...prev,
      atsProfile: newAts,
      finalScore: null,
      ledger: [
        ...prev.ledger,
        {
          event: `ATS_PROFILE_UPDATED:${newAts}`,
          version: prev.currentDraftVersion,
          time: new Date().toISOString(),
          details: { atsProfile: newAts },
        },
      ],
    }));
    showToast(`ATS profile switched to ${newAts}. Re-score to certify.`);
  };

  // Re-score trigger
  const handleRescore = async () => {
    setLoadingAction("rescore");
    try {
      const res = await fetch("/api/optimizations/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: initialResume.id,
          scanId: initialScan.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Re-score failed");
      }

      setOpt((prev) => ({
        ...prev,
        finalScore: {
          score: data.score,
          scoreBreakdown: data.scoreBreakdown,
          version: prev.currentDraftVersion,
          ats: prev.atsProfile,
          createdAt: new Date().toISOString(),
        },
        preservation: data.preservation,
      }));

      showToast(`Re-score complete! New score: ${data.score}/100.`);
    } catch (err: any) {
      showToast(err.message || "Failed to re-score draft");
    } finally {
      setLoadingAction(null);
    }
  };

  // Export handling
  const handleExport = async () => {
    setLoadingAction("export");
    try {
      const res = await fetch(
        `/api/optimizations/export?resumeId=${initialResume.id}&format=pdf`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${initialResume.originalFileName.replace(/\.[^/.]+$/, "")}_optimized.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("Optimized resume exported successfully as PDF.");
    } catch (err: any) {
      showToast(err.message || "Failed to export document");
    } finally {
      setLoadingAction(null);
    }
  };

  const acceptedCount = Object.values(opt.decisions).filter(
    (d) => d === "accepted" || d === "edited"
  ).length;

  const isCurrentScored =
    opt.finalScore !== null &&
    opt.finalScore !== undefined &&
    opt.preservation?.valid;

  const filteredProposals = opt.proposals.filter((p) => {
    const decision = opt.decisions[p.changeId] || "pending";
    if (filter === "all") return true;
    if (filter === "pending") return decision === "pending";
    if (filter === "accepted") return decision === "accepted" || decision === "edited";
    if (filter === "rejected") return decision === "rejected";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-white px-5 py-3.5 text-xs font-semibold shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>ANCHORED OPTIMIZATION WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {initialScan.targetRole}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review grounded rewrites anchored to verified source spans. Original resume facts remain immutable.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRescore}
            disabled={loadingAction === "rescore"}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 px-4 py-2 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loadingAction === "rescore" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4" />
                <span>Validate & Re-score</span>
              </>
            )}
          </button>

          <button
            onClick={handleExport}
            disabled={!isCurrentScored || !opt.preservation?.valid}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-200 px-4 py-2 text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <Download className="h-4 w-4 text-zinc-400" />
            <span>Export Document</span>
          </button>
        </div>
      </div>

      {/* Standardized KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Baseline Score"
          value={`${initialScan.score} / 100`}
          description="Original submission"
          icon={TrendingUp}
          accentColor="blue"
          sparklineData={[initialScan.score, initialScan.score]}
        />

        <KpiCard
          title="Draft Score"
          value={opt.finalScore ? `${opt.finalScore.score} / 100` : "Needs Re-score"}
          description={
            opt.finalScore
              ? `${opt.finalScore.score - initialScan.score >= 0 ? "+" : ""}${
                  opt.finalScore.score - initialScan.score
                } pts gained`
              : "Click Validate to calculate"
          }
          icon={CheckCircle2}
          accentColor="emerald"
          sparklineData={opt.finalScore ? [initialScan.score, opt.finalScore.score] : undefined}
        />

        <KpiCard
          title="Working Version"
          value={`v${opt.currentDraftVersion}`}
          description="Monotonically incremented"
          icon={Layers}
          accentColor="cream"
        />

        <KpiCard
          title="Accepted Patches"
          value={`${acceptedCount} of ${opt.proposals.length}`}
          description={`${opt.proposals.length - acceptedCount} pending or rejected`}
          icon={FileCheck2}
          accentColor="purple"
        />
      </div>

      {/* Preservation & Compliance Strip */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              opt.preservation?.valid
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {opt.preservation?.valid
                ? "100% Content Preserved & Verified"
                : "Preservation Unverified · Export Blocked"}
            </span>
          </span>

          <span className="text-xs text-zinc-400 font-mono">
            Profile: <b className="text-zinc-200">{opt.atsProfile}</b>
          </span>
        </div>

        <div>
          {isCurrentScored ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span>✓</span> Snapshot certified for current draft
            </span>
          ) : (
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span>!</span> Draft modified — re-score to certify
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Proposals and Decisions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 pb-1">
            {(["all", "pending", "accepted", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filter === tab
                    ? "bg-sky-500 text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          {filteredProposals.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 text-center text-xs text-zinc-400 shadow-xs backdrop-blur-sm">
              No proposal cards match the &quot;{filter}&quot; filter.
            </div>
          ) : (
            filteredProposals.map((proposal) => {
              const sourceBlock = initialResume.blocks.find(
                (b) => b.id === proposal.blockId
              );
              const decision = opt.decisions[proposal.changeId] || "pending";
              const currentDraftBlock = opt.draftBlocks.find(
                (b) => b.id === proposal.blockId
              );
              const isEditing = editingChangeId === proposal.changeId;

              return (
                <div
                  key={proposal.changeId}
                  className={`rounded-2xl border bg-zinc-900/60 p-5 sm:p-6 space-y-4 transition-all shadow-xs backdrop-blur-sm ${
                    decision === "accepted"
                      ? "border-emerald-500/40 ring-1 ring-emerald-500/30"
                      : decision === "rejected"
                      ? "border-zinc-800/60 opacity-60"
                      : "border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  {/* Proposal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 text-[11px] font-mono font-semibold text-sky-400">
                        {proposal.fieldPath}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        Target: {proposal.blockId}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        decision === "accepted"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : decision === "rejected"
                          ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                          : decision === "edited"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {decision}
                    </span>
                  </div>

                  {/* Word-level Diff */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                      Exact Diff Comparison
                    </span>
                    <WordDiff
                      before={sourceBlock?.text || proposal.before}
                      after={proposal.after}
                    />
                  </div>

                  {/* Rationale & Forecast Impact */}
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <p className="text-zinc-400 leading-relaxed">
                      {proposal.reason}
                    </p>
                    {proposal.forecastImpact !== null && (
                      <span className="shrink-0 text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-lg">
                        +{proposal.forecastImpact} pts
                      </span>
                    )}
                  </div>

                  {/* Custom Edit Accordion */}
                  {isEditing ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2.5">
                      <label className="block text-xs font-semibold text-zinc-200">
                        Custom replacement text:
                      </label>
                      <textarea
                        rows={3}
                        value={customEditText}
                        onChange={(e) => setCustomEditText(e.target.value)}
                        className="w-full rounded-xl border border-zinc-800 p-3 text-xs text-white bg-zinc-900 font-sans focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingChangeId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleDecision(proposal.changeId, "edit", customEditText)
                          }
                          className="px-3.5 py-1.5 bg-sky-500 text-zinc-950 rounded-xl text-xs font-semibold hover:bg-sky-400 shadow-xs"
                        >
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(proposal.changeId, "accept")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          decision === "accepted"
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-xs active:scale-[0.98]"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleDecision(proposal.changeId, "reject")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          decision === "rejected"
                            ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                            : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border-zinc-700/80"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      {decision !== "pending" && (
                        <button
                          onClick={() => handleDecision(proposal.changeId, "undo")}
                          disabled={loadingAction !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          title="Undo to original"
                        >
                          <Undo2 className="h-3.5 w-3.5" />
                          <span>Undo</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingChangeId(proposal.changeId);
                        setCustomEditText(currentDraftBlock?.text || proposal.after);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-sky-400 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Custom Edit</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Resume Preview, ATS Selector, and Ledger */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          {/* Live Preview Card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6 space-y-4 shadow-xs backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  Live Working Resume Preview
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full">
                Draft v{opt.currentDraftVersion}
              </span>
            </div>

            {/* Document Body */}
            <div className="max-h-[460px] overflow-y-auto space-y-4 pr-1 text-xs text-zinc-300 font-sans leading-relaxed">
              {opt.draftBlocks.map((block) => (
                <div key={block.id} className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold block border-b border-zinc-800 pb-0.5">
                    {block.section}
                  </span>
                  <p className="text-zinc-200">{block.text}</p>
                </div>
              ))}
            </div>

            {/* ATS Profile Picker */}
            <div className="pt-3.5 border-t border-zinc-800/80 space-y-1.5">
              <label
                htmlFor="atsProfile"
                className="block text-xs font-semibold text-zinc-200"
              >
                ATS Formatting Profile:
              </label>
              <select
                id="atsProfile"
                value={opt.atsProfile}
                onChange={(e) => handleAtsChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white font-sans focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              >
                <option value="Generic">Generic ATS (Clean Text & Bullets)</option>
                <option value="Workday">Workday Parsing Standard</option>
                <option value="Greenhouse">Greenhouse Layout</option>
                <option value="Lever">Lever Structured Data Parser</option>
              </select>
            </div>

            {/* View Immutable Source Toggle */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white py-1.5 transition-colors font-medium"
              >
                <span>View immutable original source text</span>
                {showOriginal ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showOriginal && (
                <div className="mt-2.5 max-h-40 overflow-y-auto p-3.5 bg-zinc-950 rounded-xl text-xs text-zinc-400 space-y-2 border border-zinc-800 font-mono">
                  {initialResume.blocks.map((b) => (
                    <div key={b.id}>
                      <span className="text-zinc-200 font-bold">{b.section}:</span>{" "}
                      {b.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Traceable Ledger Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLedger(!showLedger)}
                className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-white py-1.5 transition-colors font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-sky-400" />
                  <span>Traceable Change Ledger ({opt.ledger.length} events)</span>
                </span>
                {showLedger ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showLedger && (
                <div className="mt-2.5 max-h-40 overflow-y-auto p-3.5 bg-zinc-950 rounded-xl text-[11px] text-zinc-400 space-y-1.5 font-mono border border-zinc-800">
                  {opt.ledger.map((entry, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2">
                      <span className="text-sky-400 font-bold">v{entry.version}</span>
                      <span className="text-zinc-200 truncate flex-1">
                        {entry.event}
                      </span>
                      <span className="text-zinc-500 text-[10px]">
                        {new Date(entry.time).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
