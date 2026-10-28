import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getResumeById,
  getOptimizationByResumeId,
  getLatestScanByResumeId,
  saveOptimization,
} from "@/lib/db/repository";
import { evaluateRubricV1, validatePreservation } from "@/lib/engine/scoring";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resumeId, atsProfile } = body;

    if (!resumeId) {
      return NextResponse.json({ error: "resumeId is required" }, { status: 400 });
    }

    const resume = await getResumeById(resumeId);
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
    }

    const opt = await getOptimizationByResumeId(resumeId);
    if (!opt) {
      return NextResponse.json({ error: "Optimization record not found" }, { status: 404 });
    }

    const scan = await getLatestScanByResumeId(resumeId);
    if (!scan) {
      return NextResponse.json({ error: "Original scan record not found" }, { status: 404 });
    }

    // Preservation check: must pass validation
    const preservation = validatePreservation(
      resume.blocks,
      opt.draftBlocks,
      opt.proposals,
      resume.facts
    );
    opt.preservation = preservation;

    if (!preservation.valid) {
      return NextResponse.json(
        {
          error: "Validation blocked: Draft contains unverified or missing content. Restore original text or accept an approved suggestion before re-scoring.",
          preservation,
        },
        { status: 422 }
      );
    }

    // Run authoritative Rubric v1 re-score
    const draftText = opt.draftBlocks.map((b) => b.text).join("\n");
    const reScoreResult = evaluateRubricV1(draftText, opt.draftBlocks, scan.requirements);

    const effectiveAts = atsProfile || opt.atsProfile || "Generic";
    opt.atsProfile = effectiveAts;

    opt.finalScore = {
      score: reScoreResult.score,
      scoreBreakdown: reScoreResult.breakdown,
      version: opt.currentDraftVersion,
      ats: effectiveAts,
      createdAt: new Date().toISOString(),
    };

    opt.ledger.push({
      event: "RESCORED",
      version: opt.currentDraftVersion,
      time: new Date().toISOString(),
      details: {
        score: reScoreResult.score,
        ats: effectiveAts,
      },
    });

    opt.updatedAt = new Date().toISOString();
    await saveOptimization(opt);

    return NextResponse.json({
      success: true,
      optimization: opt,
      finalScore: opt.finalScore,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
