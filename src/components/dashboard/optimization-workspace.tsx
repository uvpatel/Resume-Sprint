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
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-white text-[#252525] px-4 py-3 text-xs shadow-xl flex items-center gap-2.5 border border-[#E8E8E8] animate-in fade-in slide-in-from-bottom-2">
          <div className="h-6 w-6 rounded-md bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E8E8] pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#2996F3]/20 bg-[#EAF4FF] px-3 py-1 text-xs font-semibold text-[#147DD8] mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#2996F3]" />
            <span>ANCHORED OPTIMIZATION WORKSPACE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
            {initialScan.targetRole}
          </h1>
          <p className="text-sm text-[#626262] mt-1">
            Review grounded rewrites anchored to verified source spans. Original resume facts remain immutable.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRescore}
            disabled={loadingAction === "rescore"}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 active:scale-[0.99]"
          >
            {loadingAction === "rescore" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
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
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8E8E8] bg-white hover:bg-[#F8FAFC] text-[#252525] px-4 py-2 text-xs font-semibold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            <Download className="h-4 w-4 text-[#626262]" />
            <span>Export Document</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-[#E8E8E8]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-1">
              Initial Match
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#252525]">
              {initialScan.score} / 100
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-1">
              Active Draft Score
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#2996F3]">
              {opt.finalScore ? `${opt.finalScore.score} / 100` : "Re-score needed"}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-1">
              Working Version
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#252525]">
              v{opt.currentDraftVersion}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] block mb-1">
              Accepted Patches
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#252525]">
              {acceptedCount} of {opt.proposals.length}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                opt.preservation?.valid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {opt.preservation?.valid
                  ? "100% Content Preserved & Verified"
                  : "Preservation Unverified · Export Blocked"}
              </span>
            </span>

            <span className="text-xs text-[#626262] font-mono">
              ATS: {opt.atsProfile}
            </span>
          </div>

          <div>
            {isCurrentScored ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                ✓ Snapshot certified for current draft
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-1">
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
          <div className="flex items-center gap-1.5 pb-1">
            {(["all", "pending", "accepted", "rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === tab
                    ? "bg-[#2996F3] text-white shadow-sm shadow-blue-500/20"
                    : "text-[#626262] hover:text-[#252525] hover:bg-white border border-transparent hover:border-[#E8E8E8]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Proposals List */}
          {filteredProposals.length === 0 ? (
            <div className="rounded-xl border border-[#E8E8E8] bg-white p-8 text-center text-xs text-[#626262] shadow-xs">
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
                  className={`rounded-xl border bg-white p-5 sm:p-6 space-y-4 transition-all shadow-xs ${
                    decision === "accepted"
                      ? "border-emerald-300 ring-1 ring-emerald-200"
                      : decision === "rejected"
                      ? "border-[#E8E8E8] opacity-75"
                      : "border-[#E8E8E8] hover:border-[#2996F3]/40"
                  }`}
                >
                  {/* Proposal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-[#EAF4FF] border border-[#2996F3]/20 px-2 py-0.5 text-[11px] font-mono font-semibold text-[#147DD8]">
                        {proposal.fieldPath}
                      </span>
                      <span className="text-xs text-[#9CA3AF] font-mono">
                        Target: {proposal.blockId}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        decision === "accepted"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : decision === "rejected"
                          ? "bg-[#F8FAFC] text-[#626262] border-[#E8E8E8]"
                          : decision === "edited"
                          ? "bg-[#EAF4FF] text-[#147DD8] border-[#2996F3]/20"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {decision}
                    </span>
                  </div>

                  {/* Word-level Diff */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
                      Exact Diff Comparison
                    </span>
                    <WordDiff
                      before={sourceBlock?.text || proposal.before}
                      after={proposal.after}
                    />
                  </div>

                  {/* Rationale & Forecast Impact */}
                  <div className="flex items-start justify-between gap-3 text-xs">
                    <p className="text-[#626262] leading-relaxed">
                      {proposal.reason}
                    </p>
                    {proposal.forecastImpact !== null && (
                      <span className="shrink-0 text-xs font-mono font-bold text-[#147DD8] bg-[#EAF4FF] border border-[#2996F3]/20 px-2.5 py-0.5 rounded-md">
                        +{proposal.forecastImpact} pts
                      </span>
                    )}
                  </div>

                  {/* Custom Edit Accordion */}
                  {isEditing ? (
                    <div className="rounded-xl border border-[#E8E8E8] bg-[#F8FAFC] p-4 space-y-2.5">
                      <label className="block text-xs font-semibold text-[#252525]">
                        Custom replacement text:
                      </label>
                      <textarea
                        rows={3}
                        value={customEditText}
                        onChange={(e) => setCustomEditText(e.target.value)}
                        className="w-full rounded-lg border border-[#E8E8E8] p-3 text-xs text-[#252525] bg-white font-sans focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingChangeId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-[#626262] hover:text-[#252525]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() =>
                            handleDecision(proposal.changeId, "edit", customEditText)
                          }
                          className="px-3.5 py-1.5 bg-[#2996F3] text-white rounded-lg text-xs font-semibold hover:bg-[#147DD8] shadow-sm shadow-blue-500/20"
                        >
                          Save Edit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#E8E8E8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDecision(proposal.changeId, "accept")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          decision === "accepted"
                            ? "bg-emerald-600 text-white"
                            : "bg-[#2996F3] hover:bg-[#147DD8] text-white shadow-sm shadow-blue-500/20 active:scale-[0.99]"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => handleDecision(proposal.changeId, "reject")}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          decision === "rejected"
                            ? "bg-[#F8FAFC] text-[#252525] border-[#E8E8E8]"
                            : "bg-white hover:bg-[#F8FAFC] text-[#626262] hover:text-[#252525] border-[#E8E8E8]"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      {decision !== "pending" && (
                        <button
                          onClick={() => handleDecision(proposal.changeId, "undo")}
                          disabled={loadingAction !== null}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#626262] hover:text-[#252525] hover:bg-[#F8FAFC] transition-colors"
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#626262] hover:text-[#2996F3] px-2.5 py-1.5 rounded-lg hover:bg-[#EAF4FF] transition-colors"
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
          <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E8E8]">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[#252525]">
                  Live Working Resume Preview
                </h3>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#147DD8] bg-[#EAF4FF] border border-[#2996F3]/20 px-2 py-0.5 rounded-full">
                Draft v{opt.currentDraftVersion}
              </span>
            </div>

            {/* Document Body */}
            <div className="max-h-[460px] overflow-y-auto space-y-4 pr-1 text-xs text-[#252525] font-sans leading-relaxed">
              {opt.draftBlocks.map((block) => (
                <div key={block.id} className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF] font-bold block border-b border-[#E8E8E8] pb-0.5">
                    {block.section}
                  </span>
                  <p className="text-[#252525]">{block.text}</p>
                </div>
              ))}
            </div>

            {/* ATS Profile Picker */}
            <div className="pt-3.5 border-t border-[#E8E8E8] space-y-1.5">
              <label
                htmlFor="atsProfile"
                className="block text-xs font-semibold text-[#252525]"
              >
                ATS Formatting Profile:
              </label>
              <select
                id="atsProfile"
                value={opt.atsProfile}
                onChange={(e) => handleAtsChange(e.target.value)}
                className="w-full rounded-lg border border-[#E8E8E8] bg-white p-2.5 text-xs text-[#252525] font-sans focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none"
              >
                <option value="Generic">Generic ATS (Clean Text & Bullets)</option>
                <option value="Workday">Workday Parsing Standard</option>
                <option value="Greenhouse">Greenhouse Layout</option>
                <option value="Lever">Lever Structured Data Parser</option>
              </select>
            </div>

            {/* View Immutable Source Toggle */}
            <div className="pt-2 border-t border-[#E8E8E8]">
              <button
                type="button"
                onClick={() => setShowOriginal(!showOriginal)}
                className="w-full flex items-center justify-between text-xs text-[#626262] hover:text-[#252525] py-1.5 transition-colors font-medium"
              >
                <span>View immutable original source text</span>
                {showOriginal ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showOriginal && (
                <div className="mt-2.5 max-h-40 overflow-y-auto p-3 bg-[#F8FAFC] rounded-lg text-xs text-[#626262] space-y-2 border border-[#E8E8E8] font-mono">
                  {initialResume.blocks.map((b) => (
                    <div key={b.id}>
                      <span className="text-[#252525] font-bold">{b.section}:</span>{" "}
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
                className="w-full flex items-center justify-between text-xs text-[#626262] hover:text-[#252525] py-1.5 transition-colors font-medium"
              >
                <span className="flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-[#2996F3]" />
                  <span>Traceable Change Ledger ({opt.ledger.length} events)</span>
                </span>
                {showLedger ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showLedger && (
                <div className="mt-2.5 max-h-40 overflow-y-auto p-3 bg-[#F8FAFC] rounded-lg text-[11px] text-[#626262] space-y-1.5 font-mono border border-[#E8E8E8]">
                  {opt.ledger.map((entry, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-2">
                      <span className="text-[#2996F3] font-bold">v{entry.version}</span>
                      <span className="text-[#252525] truncate flex-1">
                        {entry.event}
                      </span>
                      <span className="text-[#9CA3AF] text-[10px]">
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
