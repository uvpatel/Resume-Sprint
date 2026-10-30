import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateResumeFile, parseResumeBuffer } from "@/lib/parser/extractor";
import { saveResume, saveScan, saveOptimization } from "@/lib/db/repository";
import { runServerScan, runServerOptimizationProposals } from "@/lib/ai/gemini";
import { validatePreservation } from "@/lib/engine/scoring";
import { ResumeRecord, ScanRecord, OptimizationRecord } from "@/lib/db/types";
import { PipelineTracer } from "@/lib/telemetry/performance";
import crypto from "crypto";

// In-flight request deduplication map to prevent race conditions & duplicate model calls
const IN_FLIGHT_ANALYSES = new Map<string, Promise<{ resumeId: string; scanId: string; score: number }>>();

export async function POST(req: NextRequest) {
  const tracer = new PipelineTracer();

  try {
    tracer.startStage("authentication");
    const user = await getCurrentUser();
    tracer.endStage("authentication", { success: !!user });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    tracer.startStage("upload_validation");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jobDescription = (formData.get("jobDescription") as string | null) || "";
    const targetRole = (formData.get("targetRole") as string | null) || "";

    if (!file) {
      tracer.endStage("upload_validation", { success: false, error: "No file provided" });
      return NextResponse.json(
        { error: "Please upload a resume file (PDF, DOCX, or TXT)." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 30) {
      tracer.endStage("upload_validation", { success: false, error: "Job description too short" });
      return NextResponse.json(
        { error: "Please provide a job description of at least 30 characters." },
        { status: 400 }
      );
    }

    // Read buffer for magic bytes validation and text extraction
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate file type, size & magic bytes
    const validation = validateResumeFile({
      name: file.name,
      size: file.size,
      type: file.type,
      buffer,
    });

    if (!validation.valid || !validation.fileType) {
      tracer.endStage("upload_validation", { success: false, error: validation.error });
      return NextResponse.json(
        { error: validation.error || "Invalid file" },
        { status: 400 }
      );
    }
    tracer.endStage("upload_validation", { success: true, itemCount: file.size });

    // Extract text and blocks server-side (with in-memory cache for repeated buffers)
    tracer.startStage("document_extraction");
    const parsed = await parseResumeBuffer(buffer, file.name, validation.fileType);
    tracer.endStage("document_extraction", {
      success: true,
      itemCount: parsed.blocks.length,
      metadata: { fileType: parsed.fileType, pages: parsed.sourceCoverage.totalPages },
    });

    const jdHash = crypto.createHash("sha256").update(jobDescription).digest("hex").slice(0, 16);
    const dedupKey = `${user.id}:${parsed.sourceFileSha256}:${jdHash}:${targetRole}`;

    // Deduplicate in-flight requests for the exact same document and job description
    const inFlight = IN_FLIGHT_ANALYSES.get(dedupKey);
    if (inFlight) {
      tracer.setCached(true);
      const result = await inFlight;
      tracer.logSummary();
      return NextResponse.json(
        {
          success: true,
          resumeId: result.resumeId,
          scanId: result.scanId,
          score: result.score,
          telemetry: tracer.getReport(),
        },
        {
          headers: {
            "Server-Timing": tracer.toServerTimingHeader(),
            "X-Deduplicated": "true",
          },
        }
      );
    }

    // Process new analysis pipeline
    const processingPromise = (async () => {
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

      // Safe concurrency: saveResume can run concurrently with evidence matching!
      tracer.startStage("persistence_resume");
      const saveResumePromise = saveResume(resumeRecord).then((r) => {
        tracer.endStage("persistence_resume", { success: true });
        return r;
      });

      // Run server-side scan & canonical Rubric v1 evidence match
      tracer.startStage("rubric_evidence_matching");
      const scanResult = await runServerScan(
        parsed.blocks,
        parsed.facts,
        jobDescription,
        targetRole
      );
      tracer.endStage("rubric_evidence_matching", {
        success: true,
        itemCount: scanResult.requirements.length,
        metadata: {
          score: scanResult.score,
          llmUsed: scanResult.telemetry?.llmUsed ?? false,
          cached: scanResult.telemetry?.cached ?? false,
        },
      });

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

      // Generate optimization proposals grounded in source facts
      tracer.startStage("proposal_generation");
      const proposals = await runServerOptimizationProposals(parsed.blocks, scanResult.requirements);
      tracer.endStage("proposal_generation", { success: true, itemCount: proposals.length });

      // Preservation validation gate
      tracer.startStage("preservation_gate");
      const preservation = validatePreservation(parsed.blocks, parsed.blocks, proposals, parsed.facts);
      tracer.endStage("preservation_gate", {
        success: preservation.valid,
        metadata: { valid: preservation.valid },
      });

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

      // Concurrent persistence of scan record and optimization record
      tracer.startStage("persistence_records");
      await Promise.all([
        saveResumePromise,
        saveScan(scanRecord),
        saveOptimization(optimizationRecord),
      ]);
      tracer.endStage("persistence_records", { success: true });

      return {
        resumeId,
        scanId,
        score: scanResult.score,
      };
    })();

    IN_FLIGHT_ANALYSES.set(dedupKey, processingPromise);

    try {
      const result = await processingPromise;
      tracer.logSummary();

      return NextResponse.json(
        {
          success: true,
          resumeId: result.resumeId,
          scanId: result.scanId,
          score: result.score,
          telemetry: tracer.getReport(),
        },
        {
          headers: {
            "Server-Timing": tracer.toServerTimingHeader(),
          },
        }
      );
    } finally {
      IN_FLIGHT_ANALYSES.delete(dedupKey);
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}
