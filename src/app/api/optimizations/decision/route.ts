import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getResumeById,
  getOptimizationByResumeId,
  saveOptimization,
} from "@/lib/db/repository";
import { validatePreservation } from "@/lib/engine/scoring";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resumeId, changeId, decision, editedText } = body;

    if (!resumeId || !changeId || !decision) {
      return NextResponse.json(
        { error: "resumeId, changeId, and decision ('accept' | 'reject' | 'edit' | 'undo') are required" },
        { status: 400 }
      );
    }

    const resume = await getResumeById(resumeId);
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    if (resume.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const opt = await getOptimizationByResumeId(resumeId);
    if (!opt) {
      return NextResponse.json({ error: "Optimization workspace not found" }, { status: 404 });
    }

    const proposal = opt.proposals.find((p) => p.changeId === changeId);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const sourceBlock = resume.blocks.find((b) => b.id === proposal.blockId);
    if (!sourceBlock) {
      return NextResponse.json({ error: "Source block not found" }, { status: 404 });
    }

    const targetDraftBlock = opt.draftBlocks.find((b) => b.id === proposal.blockId);
    if (!targetDraftBlock) {
      return NextResponse.json({ error: "Target draft block not found" }, { status: 404 });
    }

    // Apply decision
    if (decision === "accept") {
      targetDraftBlock.text = proposal.after;
      opt.decisions[changeId] = "accepted";
    } else if (decision === "reject") {
      targetDraftBlock.text = sourceBlock.text;
      opt.decisions[changeId] = "rejected";
    } else if (decision === "undo") {
      targetDraftBlock.text = sourceBlock.text;
      opt.decisions[changeId] = "undone";
    } else if (decision === "edit") {
      if (typeof editedText !== "string" || editedText.trim().length === 0) {
        return NextResponse.json({ error: "editedText is required for custom edits" }, { status: 400 });
      }
      targetDraftBlock.text = editedText.trim();
      opt.decisions[changeId] = "edited";
      opt.editedTexts[changeId] = editedText.trim();
    } else {
      return NextResponse.json({ error: `Unsupported decision: ${decision}` }, { status: 400 });
    }

    // Increment draft version and invalidate any previously cached final re-score
    opt.currentDraftVersion += 1;
    opt.finalScore = null; // Stale until explicit re-score

    const newDraftHash = crypto
      .createHash("sha256")
      .update(opt.draftBlocks.map((b) => b.text).join("\n"))
      .digest("hex")
      .slice(0, 16);
    opt.currentDraftHash = newDraftHash;

    // Validate 100% content preservation
    opt.preservation = validatePreservation(
      resume.blocks,
      opt.draftBlocks,
      opt.proposals,
      resume.facts
    );

    // Record ledger entry
    opt.ledger.push({
      event: `${decision.toUpperCase()}:${changeId}`,
      version: opt.currentDraftVersion,
      time: new Date().toISOString(),
      details: {
        changeId,
        decision,
        blockId: proposal.blockId,
      },
    });

    opt.updatedAt = new Date().toISOString();

    await saveOptimization(opt);

    return NextResponse.json({
      success: true,
      optimization: opt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
