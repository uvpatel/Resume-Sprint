"use client";

import { useState } from "react";
import {
  ResumeRecord,
  ScanRecord,
  OptimizationRecord,
} from "@/lib/db/types";
import { WordDiff } from "./word-diff";
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
      finalScore: null, // Profile change invalidates snapshot
      ledger: [
        ...prev.ledger,
        {
          event: `ATS_PROFILE_CHANGED:${newAts}`,
          version: prev.currentDraftVersion,
          time: new Date().toISOString(),
        },
      ],
    }));
    showToast(`ATS profile set to ${newAts}. Re-score required to certify snapshot.`);
  };

  // Validate & Re-score
  const handleRescore = async () => {
    setLoadingAction("rescore");
    try {
      const res = await fetch("/api/optimizations/rescore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: initialResume.id,
          atsProfile: opt.atsProfile,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Re-score validation blocked");
      }

      setOpt(data.optimization);
      showToast(`Draft validated and re-scored: ${data.finalScore.score} / 100! Export unlocked.`);
    } catch (err: any) {
      showToast(err.message || "Validation failed");
    } finally {
      setLoadingAction(null);
    }
  };

  // Export Validated Resume
  const handleExport = () => {
    if (!opt.finalScore || opt.finalScore.version !== opt.currentDraftVersion) {
      showToast("Export blocked: You must validate & re-score the current draft first.");
      return;
    }
    if (!opt.preservation?.valid) {
      showToast("Export blocked: Content preservation check failed.");
      return;
    }
    window.location.href = `/api/optimizations/export?resumeId=${initialResume.id}`;
    showToast("Downloading validated resume document...");
  };

  // Filtered proposals
  const filteredProposals = opt.proposals.filter((p) => {
    const dec = opt.decisions[p.changeId] || "pending";
    if (filter === "all") return true;
    if (filter === "pending") return dec === "pending" || dec === "undone";
    if (filter === "accepted") return dec === "accepted" || dec === "edited";
    if (filter === "rejected") return dec === "rejected";
    return true;
  });

  const acceptedCount = Object.values(opt.decisions).filter(
    (d) => d === "accepted" || d === "edited"
  ).length;

  const isCurrentScored =
    opt.finalScore !== null && opt.finalScore.version === opt.currentDraftVersion;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-zinc-900 text-white px-4 py-3 text-xs shadow-xl flex items-center gap-2 border border-zinc-700 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>ANCHORED OPTIMIZATION WORKSPACE</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {initialScan.targetRole}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review grounded rewrites anchored to verified source spans. Original resume facts remain immutable.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRescore}
            disabled={loadingAction === "rescore"}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 active:scale-95"
          >
            {loadingAction === "rescore" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Validate & Re-score</span>
              </>
            )}
          </button>

          <button
            onClick={handleExport}
            disabled={!isCurrentScored || !opt.preservation?.valid}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-zinc-600" />
            <span>Export Validated Document</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-zinc-100">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Initial Match
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              {initialScan.score} / 100
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Active Draft Score
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {opt.finalScore ? `${opt.finalScore.score} / 100` : "Re-score needed"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Working Version
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              v{opt.currentDraftVersion}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
              Accepted Patches
            </span>
            <span className="text-2xl font-bold text-zinc-900">
              {acceptedCount} of {opt.proposals.length}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                opt.preservation?.valid
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>
                {opt.preservation?.valid
                  ? "100% Content Preserved & Verified"
                  : "Preservation Unverified · Export Blocked"}
              </span>
            </span>

            <span className="text-[11px] text-zinc-400 font-mono">
              ATS: {opt.atsProfile}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400">
            {isCurrentScored ? (
              <span className="text-emerald-700 font-medium">
                ✓ Snapshot certified for current draft
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Draft changed since last re-score
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Proposals and Decisions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 pb-2">
            {(["all", "pending", "accepted", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  filter === tab
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          {filteredProposals.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-500">
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
                  className={`rounded-xl border bg-white p-5 shadow-xs space-y-3.5 transition-all ${
                    decision === "accepted"
                      ? "border-emerald-300 ring-1 ring-emerald-100"
                      : decision === "rejected"
                      ? "border-zinc-300 opacity-75"
                      : "border-zinc-200"
                  }`}
                >
                  {/* Proposal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-blue-700">
                        {proposal.fieldPath}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        Target: {proposal.blockId}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md uppercase ${
                        decision === "accepted"
                          ? "bg-emerald-100 text-emerald-800"
                          : decision === "rejected"
                          ? "bg-zinc-100 text-zinc-600"
                          : decision === "edited"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {decision}
                    </span>
                  </div>

                  {/* Word-level Diff */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      Exact Diff Comparison
                    </span>
                    <WordDiff
                      before={sourceBlock?.text || proposal.before}
                      after={proposal.after}
                    />
                  </div>

                  {/* Rationale & Forecast Impact */}
                  <div className="flex items-start justify-between gap-4 text-xs">
                    <p className="text-zinc-600 text-xs leading-relaxed">
                      {proposal.reason}
                    </p>
                    {proposal.forecastImpact !== null && (
                      <span className="shrink-0 text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        +{proposal.forecastImpact} pts
                      </span>
                    )}
                  </div>

                  {/* Custom Edit Accordion */}
                  {isEditing ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                      <label className="block text-[11px] font-semibold text-zinc-900">
                        Custom replacement text:
                      </label>
                      <textarea
                        rows={3}
                        value={customEditText}
                        onChange={(e) => setCustomEditText(e.target.value)}
                        className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 bg-white font-sans focus:border-blue-600 outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingChangeId(null)}
                          className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleDecision(proposal.changeId, "edit", customEditText)
                          }
                          className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700"
                        >
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(proposal.changeId, "accept")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          decision === "accepted"
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleDecision(proposal.changeId, "reject")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          decision === "rejected"
                            ? "bg-zinc-800 text-white border-zinc-800"
                            : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200"
                        }`}
                      >
                        <X className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Reject</span>
                      </button>

                      {decision !== "pending" && (
                        <button
                          onClick={() => handleDecision(proposal.changeId, "undo")}
                          disabled={loadingAction !== null}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
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
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-zinc-50"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Custom Edit</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Resume Preview, ATS Selector, and Ledger */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          {/* Live Preview Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-semibold text-zinc-900">
                  Live Working Resume Preview
                </h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                Draft v{opt.currentDraftVersion}
              </span>
            </div>

            {/* Document Body */}
            <div className="max-h-[460px] overflow-y-auto space-y-4 pr-1 text-xs text-zinc-700 font-serif leading-relaxed">
              {opt.draftBlocks.map((block) => (
                <div key={block.id} className="space-y-1">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-100 pb-0.5">
                    {block.section}
                  </span>
                  <p className="text-zinc-800">{block.text}</p>
                </div>
              ))}
            </div>

            {/* ATS Profile Picker */}
            <div className="pt-3 border-t border-zinc-100 space-y-1.5">
              <label
                htmlFor="atsProfile"
                className="block text-[11px] font-semibold text-zinc-700"
              >
                ATS Formatting Profile:
              </label>
              <select
                id="atsProfile"
                value={opt.atsProfile}
                onChange={(e) => handleAtsChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-xs text-zinc-900 font-sans focus:border-blue-600 outline-none"
              >
                <option value="Generic">Generic ATS (Clean Text & Bullets)</option>
                <option value="Workday">Workday Parsing Standard</option>
                <option value="Greenhouse">Greenhouse Greenhouse-safe Layout</option>
                <option value="Lever">Lever Structured Data Parser</option>
              </select>
            </div>

            {/* View Immutable Source Toggle */}
            <div className="pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full flex items-center justify-between text-[11px] font-medium text-zinc-500 hover:text-zinc-800 py-1"
              >
                <span>View immutable original source text</span>
                {showOriginal ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showOriginal && (
                <div className="mt-2 max-h-40 overflow-y-auto p-3 bg-zinc-50 rounded-lg text-[11px] text-zinc-600 space-y-2 border border-zinc-100 font-mono">
                  {initialResume.blocks.map((b) => (
                    <div key={b.id}>
                      <span className="text-zinc-400 font-bold">{b.section}:</span>{" "}
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
                className="w-full flex items-center justify-between text-[11px] font-medium text-zinc-500 hover:text-zinc-800 py-1"
              >
                <span className="flex items-center gap-1">
                  <History className="h-3 w-3" />
                  <span>Traceable Change Ledger ({opt.ledger.length} events)</span>
                </span>
                {showLedger ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {showLedger && (
                <div className="mt-2 max-h-40 overflow-y-auto p-3 bg-zinc-900 rounded-lg text-[10px] text-zinc-300 space-y-1 font-mono border border-zinc-800">
                  {opt.ledger.map((entry, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2">
                      <span className="text-blue-400">v{entry.version}</span>
                      <span className="text-zinc-200 truncate flex-1">
                        {entry.event}
                      </span>
                      <span className="text-zinc-500 text-[9px]">
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
