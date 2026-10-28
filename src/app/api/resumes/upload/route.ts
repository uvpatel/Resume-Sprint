import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateResumeFile, parseResumeBuffer } from "@/lib/parser/extractor";
import { saveResume, saveScan, saveOptimization } from "@/lib/db/repository";
import { runServerScan, runServerOptimizationProposals } from "@/lib/ai/gemini";
import { validatePreservation } from "@/lib/engine/scoring";
import { ResumeRecord, ScanRecord, OptimizationRecord } from "@/lib/db/types";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobDescription = (formData.get("jobDescription") as string | null) || "";
    const targetRole = (formData.get("targetRole") as string | null) || "";

    if (!file) {
      return NextResponse.json({ error: "Please upload a resume file (PDF, DOCX, or TXT)." }, { status: 400 });
    }

    if (jobDescription.trim().length < 30) {
      return NextResponse.json(
        { error: "Please provide a job description of at least 30 characters." },
        { status: 400 }
      );
    }

    // Validate file type & size
    const validation = validateResumeFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid || !validation.fileType) {
      return NextResponse.json({ error: validation.error || "Invalid file" }, { status: 400 });
    }

    // Extract text and blocks server-side
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await parseResumeBuffer(buffer, file.name, validation.fileType);

    // Create and persist Resume Record
    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const resumeRecord: ResumeRecord = {
      id: resumeId,
      userId: user.id,
      originalFileName: file.name,
      fileType: parsed.fileType,
      fileSize: parsed.fileSize,
      rawText: parsed.rawText,
      blocks: parsed.blocks,
      facts: parsed.facts,
      sourceCoverage: parsed.sourceCoverage,
      sourceFileSha256: parsed.sourceFileSha256,
      targetRole: targetRole || undefined,
      createdAt: now,
      updatedAt: now,
    };

    await saveResume(resumeRecord);

    // Run server-side scan
    const scanResult = await runServerScan(
      parsed.blocks,
      parsed.facts,
      jobDescription,
      targetRole
    );

    const jdHash = crypto.createHash("sha256").update(jobDescription).digest("hex").slice(0, 16);
    const scanId = `scn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const scanRecord: ScanRecord = {
      id: scanId,
      resumeId,
      userId: user.id,
      targetRole: targetRole || "Target Position",
      jobDescription,
      jobDescriptionHash: jdHash,
      rubricVersion: "v1.0",
      score: scanResult.score,
      scoreBreakdown: scanResult.scoreBreakdown,
      componentReasons: scanResult.componentReasons,
      requirements: scanResult.requirements,
      matchedKeywords: scanResult.matchedKeywords,
      missingKeywords: scanResult.missingKeywords,
      unsupportedMissingKeywords: scanResult.unsupportedMissingKeywords,
      topImprovements: scanResult.topImprovements,
      contentRisk: scanResult.contentRisk,
      parsingWarnings: scanResult.parsingWarnings,
      targetForecast: scanResult.targetForecast,
      status: "CURRENT",
      createdAt: now,
    };

    await saveScan(scanRecord);

    // Initialize Optimization proposals grounded in source facts
    const proposals = await runServerOptimizationProposals(parsed.blocks, scanResult.requirements);
    const preservation = validatePreservation(parsed.blocks, parsed.blocks, proposals, parsed.facts);

    const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const draftHash = crypto
      .createHash("sha256")
      .update(parsed.blocks.map((b) => b.text).join("\n"))
      .digest("hex")
      .slice(0, 16);

    const optimizationRecord: OptimizationRecord = {
      id: optimizationId,
      resumeId,
      scanId,
      userId: user.id,
      currentDraftVersion: 1,
      currentDraftHash: draftHash,
      draftBlocks: structuredClone(parsed.blocks),
      proposals,
      decisions: {},
      editedTexts: {},
      ledger: [
        {
          event: "INITIAL_SCAN_COMPLETED",
          version: 1,
          time: now,
          details: { initialScore: scanResult.score },
        },
      ],
      preservation,
      finalScore: null,
      atsProfile: "Generic",
      createdAt: now,
      updatedAt: now,
    };

    await saveOptimization(optimizationRecord);

    return NextResponse.json({
      success: true,
      resumeId,
      scanId,
      score: scanResult.score,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}
