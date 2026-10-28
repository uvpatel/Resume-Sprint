"use client";

import { useState } from "react";
import {
  FileText,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Edit3,
  Undo2,
  Lock,
} from "lucide-react";

export function ProductPreview() {
  const [decisionState, setDecisionState] = useState<"pending" | "accepted" | "rejected" | "editing">("pending");

  return (
    <section className="relative pt-4 pb-20 sm:pb-28 lg:pb-36 bg-white overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle Section Label */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E8E8] bg-[#F8FAFC] px-3.5 py-1 text-xs font-medium text-[#626262]">
            <Sparkles className="h-3 w-3 text-[#2996F3]" />
            <span>Interactive Platform Preview • Illustrative Interface</span>
          </span>
        </div>

        {/* Browser Mockup Window */}
        <div className="rounded-2xl border border-[#E8E8E8] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] overflow-hidden">
          {/* Browser Chrome Header */}
          <div className="flex items-center justify-between border-b border-[#E8E8E8] bg-[#F8FAFC] px-4 sm:px-6 py-3">
            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#EF4444]/70 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#F59E0B]/70 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#10B981]/70 inline-block" />
            </div>

            {/* Address bar pill */}
            <div className="flex items-center gap-2 rounded-md border border-[#E8E8E8] bg-white px-3 sm:px-6 py-1 text-xs text-[#626262] font-mono shadow-xs max-w-xs sm:max-w-md w-full justify-center">
              <Lock className="h-3 w-3 text-[#10B981]" />
              <span className="truncate">app.resumesprint.com/dashboard/scan/preview</span>
            </div>

            {/* Status indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#2996F3] bg-[#EAF4FF] px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2996F3] animate-pulse" />
              <span>Evidence Engine Active</span>
            </div>
          </div>

          {/* Application Layout: Two-Column Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E8E8E8] bg-[#FAFCFF]/30">
            {/* LEFT PANEL: Resume Analysis (5 cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 bg-white">
              {/* Target File & Role */}
              <div className="space-y-3 pb-6 border-b border-[#E8E8E8]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF4FF] text-[#2996F3]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono uppercase tracking-wider text-[#626262]">
                      Target Resume
                    </p>
                    <p className="text-sm font-semibold text-[#252525] truncate">
                      Alex_Morgan_Senior_Software_Engineer.pdf
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E8E8E8] text-[#626262]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono uppercase tracking-wider text-[#626262]">
                      Target Role
                    </p>
                    <p className="text-sm font-semibold text-[#252525] truncate">
                      Staff Systems Engineer @ CloudScale
                    </p>
                  </div>
                </div>
              </div>

              {/* Match Score Card */}
              <div className="rounded-xl border border-[#D6EBFF] bg-gradient-to-br from-[#EAF4FF] to-[#F4F9FF] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#147DD8] font-semibold">
                      Match Score
                    </span>
                    <h3 className="text-3xl font-extrabold text-[#252525] tracking-tight mt-1">
                      84%
                    </h3>
                    <p className="text-xs text-[#626262] mt-0.5">
                      Strong candidate alignment detected
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#2996F3] bg-white text-[#2996F3] font-bold text-sm shadow-xs">
                    84/100
                  </div>
                </div>

                {/* Score breakdown bar */}
                <div className="mt-4 pt-3 border-t border-blue-100/80 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-[#252525]">40/40</p>
                    <p className="text-[11px] text-[#626262]">Core Skills</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#252525]">24/30</p>
                    <p className="text-[11px] text-[#626262]">Experience</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#252525]">20/30</p>
                    <p className="text-[11px] text-[#626262]">Impact Metrics</p>
                  </div>
                </div>
              </div>

              {/* Matched Keywords */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#252525]">
                    Matched Competencies
                  </span>
                  <span className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 8 Verified
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Distributed Systems",
                    "Go & Kubernetes",
                    "High-Throughput",
                    "PostgreSQL Tuning",
                    "gRPC Architecture",
                    "Latency Optimization",
                  ].map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-md border border-[#E8E8E8] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#252525]"
                    >
                      <Check className="h-3 w-3 text-[#10B981]" />
                      <span>{kw}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Improvement Opportunities */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#252525]">
                    Improvement Opportunities
                  </span>
                  <span className="text-xs text-[#F59E0B] font-medium flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> 2 Actionable
                  </span>
                </div>
                <ul className="space-y-2 text-xs text-[#626262]">
                  <li className="flex items-start gap-2 rounded-lg border border-[#FDE68A]/60 bg-[#FEF3C7]/20 p-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                    <span>Quantify multi-region database replication throughput in role description.</span>
                  </li>
                  <li className="flex items-start gap-2 rounded-lg border border-[#FDE68A]/60 bg-[#FEF3C7]/20 p-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] mt-1.5 flex-shrink-0" />
                    <span>Highlight cloud infrastructure orchestration using Terraform.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* RIGHT PANEL: Optimization Suggestions (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-[#FAFBFD]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#2996F3] bg-[#EAF4FF] px-2 py-0.5 rounded">
                      PATCH 01 OF 03
                    </span>
                    <span className="text-xs text-[#626262]">
                      Experience Section: CloudScale / Platform Role
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded">
                    +12% Impact Score
                  </span>
                </div>

                {/* The Interactive Suggestion Card */}
                <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 space-y-4 shadow-xs">
                  {/* Original Sentence */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                      <span>Original Resume Text:</span>
                    </div>
                    <div className="rounded-lg border border-red-100 bg-red-50/50 p-3.5 text-sm text-[#4B5563] leading-relaxed line-through decoration-red-400/60">
                      Responsible for scaling microservices and fixing slow database queries across production clusters.
                    </div>
                  </div>

                  {/* Improved Sentence */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#10B981] mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                      <span>Suggested Evidence-Grounded Improvement:</span>
                    </div>
                    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/40 p-3.5 text-sm font-medium text-[#1F2937] leading-relaxed">
                      Architected distributed Go microservices and optimized Postgres query indexing, reducing p99 latency by 42% across high-throughput production clusters.
                    </div>
                  </div>

                  {/* Fact Preservation Assurance */}
                  <p className="text-xs text-[#626262] italic flex items-center gap-1.5 pt-1">
                    <span className="text-[#10B981]">✓</span> Verified against user experience inventory. Zero hallucinated qualifications.
                  </p>

                  {/* Granular Control Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E8E8]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDecisionState("accepted")}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          decisionState === "accepted"
                            ? "bg-[#10B981] text-white shadow-xs"
                            : "bg-[#2996F3] text-white hover:bg-[#147DD8]"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{decisionState === "accepted" ? "Accepted" : "Accept Suggestion"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionState("editing")}
                        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-medium text-[#252525] hover:bg-[#F8FAFC] transition-colors ${
                          decisionState === "editing" ? "ring-2 ring-[#2996F3]" : ""
                        }`}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-[#626262]" />
                        <span>Edit Text</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDecisionState("rejected")}
                        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-medium transition-colors ${
                          decisionState === "rejected"
                            ? "border-red-200 text-red-600 bg-red-50"
                            : "text-[#626262] hover:text-[#DC2626]"
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                    {decisionState !== "pending" && (
                      <button
                        type="button"
                        onClick={() => setDecisionState("pending")}
                        className="inline-flex items-center gap-1 text-xs text-[#626262] hover:text-[#252525] transition-colors"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Additional Preview Snippet: Second Patch */}
                <div className="mt-4 rounded-xl border border-dashed border-[#E8E8E8] bg-white/70 p-4 opacity-75">
                  <div className="flex items-center justify-between text-xs text-[#626262] mb-1">
                    <span className="font-mono font-medium">PATCH 02 OF 03 • INFRASTRUCTURE</span>
                    <span className="text-[#2996F3]">Pending Review</span>
                  </div>
                  <p className="text-xs text-[#4B5563] truncate">
                    &quot;Led cross-functional migration of 15+ workloads to AWS with Terraform, cutting deployment cycles...&quot;
                  </p>
                </div>
              </div>

              {/* Bottom Card Summary */}
              <div className="pt-3 border-t border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#626262]">
                <span>100% of candidate facts preserved in generated draft.</span>
                <span className="font-mono text-[#2996F3]">Export Ready: TXT / PDF format</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
