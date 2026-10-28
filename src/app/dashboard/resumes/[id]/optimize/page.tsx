import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getResumeById,
  getLatestScanByResumeId,
  getOptimizationByResumeId,
  saveOptimization,
} from "@/lib/db/repository";
import { runServerOptimizationProposals } from "@/lib/ai/gemini";
import { validatePreservation } from "@/lib/engine/scoring";
import { OptimizationRecord } from "@/lib/db/types";
import { OptimizationWorkspace } from "@/components/dashboard/optimization-workspace";
import crypto from "crypto";

export default async function OptimizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!id) notFound();

  const resume = await getResumeById(id);
  if (!resume) notFound();

  // Ownership verification
  if (resume.userId !== user.id) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="text-base font-semibold text-red-900">Access Restricted</h2>
        <p className="text-xs text-red-700 mt-1">
          You do not have permission to optimize this resume.
        </p>
      </div>
    );
  }

  const scan = await getLatestScanByResumeId(id);
  if (!scan) {
    redirect(`/dashboard/resumes/${id}/scan`);
  }

  // Get or initialize optimization workspace record
  let opt = await getOptimizationByResumeId(id);
  if (!opt) {
    const proposals = await runServerOptimizationProposals(resume.blocks, scan.requirements);
    const preservation = validatePreservation(resume.blocks, resume.blocks, proposals, resume.facts);
    const now = resume.updatedAt || new Date("2026-01-01").toISOString();
    const optId = `opt_${crypto.createHash("sha256").update(id).digest("hex").slice(0, 12)}`;
    const draftHash = crypto
      .createHash("sha256")
      .update(resume.blocks.map((b) => b.text).join("\n"))
      .digest("hex")
      .slice(0, 16);

    const newOpt: OptimizationRecord = {
      id: optId,
      resumeId: resume.id,
      scanId: scan.id,
      userId: user.id,
      currentDraftVersion: 1,
      currentDraftHash: draftHash,
      draftBlocks: structuredClone(resume.blocks),
      proposals,
      decisions: {},
      editedTexts: {},
      ledger: [
        {
          event: "INITIAL_SCAN_COMPLETED",
          version: 1,
          time: now,
          details: { initialScore: scan.score },
        },
      ],
      preservation,
      finalScore: null,
      atsProfile: "Generic",
      createdAt: now,
      updatedAt: now,
    };

    opt = await saveOptimization(newOpt);
  }

  return (
    <OptimizationWorkspace
      initialResume={resume}
      initialScan={scan}
      initialOptimization={opt}
    />
  );
}
