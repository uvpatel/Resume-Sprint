import { describe, it, expect } from "bun:test";
import { validateResumeFile, parseResumeBuffer } from "@/lib/parser/extractor";
import {
  evaluateRubricV1,
  extractAndMatchRequirements,
  computeWordDiff,
  validatePreservation,
} from "@/lib/engine/scoring";
import { runServerScan } from "@/lib/ai/gemini";
import { PipelineTracer } from "@/lib/telemetry/performance";
import { ResumeBlock } from "@/lib/db/types";

describe("ResumeSprint Pipeline Speed & Performance Suite", () => {
  const sampleBlocks: ResumeBlock[] = [
    { id: "s1", section: "Summary", text: "Integration engineer building APIs with MuleSoft and SQL." },
    { id: "e1", section: "Experience", text: "Integration Engineer | Northstar Energy | London | 2021–Present" },
    { id: "b1", section: "Experience", text: "Responsible for building MuleSoft APIs connecting Salesforce and SAP." },
    { id: "b2", section: "Experience", text: "Worked on RabbitMQ messaging and SQL data pipelines." },
    { id: "b3", section: "Experience", text: "Reduced processing time by 30% through batch processing." },
    { id: "ed1", section: "Education", text: "MSc Computer Science | Example University | 2020" },
    { id: "sk1", section: "Skills", text: "MuleSoft, Salesforce, SAP, RabbitMQ, SQL, batch processing" },
  ];

  const sampleJd =
    "Senior Integration Engineer to build MuleSoft APIs connecting Salesforce and SAP. Work with RabbitMQ messaging and SQL data pipelines. Kubernetes and AWS experience desired.";

  // 1. Evidence Matching Speed & Sub-Millisecond Deterministic Latency
  it("executes deterministic canonical Rubric v1 evidence match in under 5ms", () => {
    const t0 = performance.now();
    const { requirements, matchedKeywords, missingKeywords, unsupportedMissingKeywords } =
      extractAndMatchRequirements(sampleBlocks, sampleJd);
    const duration = performance.now() - t0;

    expect(duration).toBeLessThan(5); // Sub-millisecond on modern hardware
    expect(requirements.length).toBeGreaterThan(0);
    expect(matchedKeywords).toContain("MuleSoft");
    expect(matchedKeywords).toContain("Salesforce");
    expect(missingKeywords).toContain("Kubernetes");
    expect(unsupportedMissingKeywords).toContain("AWS");
  });

  it("strictly enforces Rubric v1 mathematical invariants (sum equals total)", () => {
    const fullText = sampleBlocks.map((b) => b.text).join("\n");
    const { requirements } = extractAndMatchRequirements(sampleBlocks, sampleJd);
    const result = evaluateRubricV1(fullText, sampleBlocks, requirements);

    const sum =
      result.breakdown.keywordSkillMatch +
      result.breakdown.roleTitleAlignment +
      result.breakdown.quantifiedImpact +
      result.breakdown.experienceDepth +
      result.breakdown.formattingAtsReadability;

    expect(result.score).toBe(sum);
    expect(result.breakdown.keywordSkillMatch).toBeLessThanOrEqual(40);
    expect(result.breakdown.roleTitleAlignment).toBeLessThanOrEqual(20);
    expect(result.breakdown.quantifiedImpact).toBeLessThanOrEqual(20);
    expect(result.breakdown.experienceDepth).toBeLessThanOrEqual(10);
    expect(result.breakdown.formattingAtsReadability).toBeLessThanOrEqual(10);
  });

  // 2. High-Performance Word Diffing with Flat Int32Array
  it("computes word diff without memory corruption and guarantees lossless reconstruction", () => {
    const original = "Responsible for building MuleSoft APIs connecting Salesforce and SAP systems.";
    const revised = "Built high-throughput MuleSoft APIs connecting Salesforce and SAP systems.";

    const tokens = computeWordDiff(original, revised);

    const reconstructedBefore = tokens
      .filter((t) => t.type !== "add")
      .map((t) => t.text)
      .join("");

    const reconstructedAfter = tokens
      .filter((t) => t.type !== "remove")
      .map((t) => t.text)
      .join("");

    expect(reconstructedBefore).toBe(original);
    expect(reconstructedAfter).toBe(revised);
  });

  // 3. Document Extraction In-Memory Buffer Caching
  it("reuses parsed document buffers from in-memory cache for repeated files", async () => {
    const textBuffer = Buffer.from(
      "Summary: Senior Software Engineer with 8 years of TypeScript and Node.js experience.",
      "utf-8"
    );

    const t0 = performance.now();
    const firstPass = await parseResumeBuffer(textBuffer, "profile.txt", "txt");
    const durFirst = performance.now() - t0;

    const t1 = performance.now();
    const secondPass = await parseResumeBuffer(textBuffer, "profile.txt", "txt");
    const durSecond = performance.now() - t1;

    expect(secondPass.sourceFileSha256).toBe(firstPass.sourceFileSha256);
    expect(secondPass.blocks.length).toBe(firstPass.blocks.length);
    // Cached retrieval should be nearly instantaneous
    expect(durSecond).toBeLessThanOrEqual(durFirst + 1);
  });

  // 4. File Validation & Sandboxing Guardrails
  it("rejects oversized documents exceeding 5MB limit", () => {
    const bigFile = {
      name: "huge-resume.pdf",
      size: 6 * 1024 * 1024,
      type: "application/pdf",
    };
    const res = validateResumeFile(bigFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("5MB");
  });

  it("rejects unsupported document extensions", () => {
    const invalidFile = {
      name: "malicious.exe",
      size: 1024,
      type: "application/octet-stream",
    };
    const res = validateResumeFile(invalidFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Unsupported file format");
  });

  it("rejects empty or corrupt text buffers with clear sandboxed error", async () => {
    const emptyBuffer = Buffer.from("short", "utf-8");
    expect(parseResumeBuffer(emptyBuffer, "short.txt", "txt")).rejects.toThrow(
      "Unable to extract sufficient text"
    );
  });

  // 5. In-Memory AI Evaluation Cache & Bounded Execution
  it("returns cached scan result on repeated scan requests without network delay", async () => {
    const res1 = await runServerScan(sampleBlocks, [], sampleJd, "Integration Engineer");
    const t1 = performance.now();
    const res2 = await runServerScan(sampleBlocks, [], sampleJd, "Integration Engineer");
    const dur2 = performance.now() - t1;

    expect(res1.score).toBe(res2.score);
    expect(res2.telemetry?.cached).toBe(true);
    expect(dur2).toBeLessThan(10); // Cache hit resolves in under 10ms
  });

  // 6. Pipeline Telemetry & RFC Server-Timing Header Generation
  it("generates structured telemetry report and RFC-compliant Server-Timing header", () => {
    const tracer = new PipelineTracer("test_correlation_123");
    tracer.startStage("document_extraction");
    tracer.endStage("document_extraction", { itemCount: 5 });

    tracer.startStage("rubric_matching");
    tracer.endStage("rubric_matching", { itemCount: 10 });

    const report = tracer.getReport();
    expect(report.correlationId).toBe("test_correlation_123");
    expect(report.stages.length).toBe(2);
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);

    const timingHeader = tracer.toServerTimingHeader();
    expect(timingHeader).toContain("document_extraction;dur=");
    expect(timingHeader).toContain("rubric_matching;dur=");
    expect(timingHeader).toContain("total;dur=");
  });

  // 7. Preservation Gate Guardrail
  it("strictly enforces 100% preservation check during pipeline execution", () => {
    const preservation = validatePreservation(sampleBlocks, sampleBlocks, [], []);
    expect(preservation.valid).toBe(true);
    expect(preservation.status).toBe("VALIDATED");
    expect(preservation.contentPreservedPercent).toBe(100);
  });
});
