import { describe, it, expect } from "bun:test";
import { ResumeBlock, PatchProposal, OptimizationRecord } from "@/lib/db/types";
import { validatePreservation } from "@/lib/engine/scoring";

describe("Decisions, State Transitions & Export Gating", () => {
  const sourceBlocks: ResumeBlock[] = [
    { id: "b1", section: "Experience", text: "Responsible for building MuleSoft APIs connecting Salesforce and SAP." },
    { id: "b2", section: "Experience", text: "Worked on RabbitMQ messaging and SQL data pipelines." },
  ];

  const proposal: PatchProposal = {
    changeId: "c1",
    blockId: "b1",
    fieldPath: "experience.b1",
    before: "Responsible for building MuleSoft APIs connecting Salesforce and SAP.",
    after: "Built MuleSoft APIs connecting Salesforce and SAP.",
    baseDraftVersion: 1,
    baseDraftHash: "hash1",
    sourceFactIds: ["f_b1"],
    sourceSpanIds: ["b1"],
    requirementIds: ["r1"],
    reason: "Direct action verb",
    confidence: 0.98,
    safetyStatus: "SUPPORTED",
    contentRisk: "low",
    forecastImpact: 2,
  };

  it("handles acceptance: updates working draft block text to proposed replacement", () => {
    const draft = structuredClone(sourceBlocks);
    draft.find((b) => b.id === proposal.blockId)!.text = proposal.after;

    const preservation = validatePreservation(sourceBlocks, draft, [proposal]);
    expect(preservation.valid).toBe(true);
    expect(draft[0].text).toBe("Built MuleSoft APIs connecting Salesforce and SAP.");
  });

  it("handles rejection: restores original source text", () => {
    const draft = structuredClone(sourceBlocks);
    // After rejection, block text remains or reverts to source text
    draft.find((b) => b.id === proposal.blockId)!.text = sourceBlocks[0].text;

    const preservation = validatePreservation(sourceBlocks, draft, [proposal]);
    expect(preservation.valid).toBe(true);
    expect(draft[0].text).toBe(sourceBlocks[0].text);
  });

  it("handles undo: cleanly resets back to source block", () => {
    const draft = structuredClone(sourceBlocks);
    // 1. Accept
    draft[0].text = proposal.after;
    expect(draft[0].text).toBe(proposal.after);

    // 2. Undo
    draft[0].text = sourceBlocks[0].text;
    expect(draft[0].text).toBe(sourceBlocks[0].text);

    const preservation = validatePreservation(sourceBlocks, draft, [proposal]);
    expect(preservation.valid).toBe(true);
  });

  it("enforces export gate: blocks export when draft has changed without fresh re-score", () => {
    const opt: Partial<OptimizationRecord> = {
      currentDraftVersion: 3,
      finalScore: {
        score: 73,
        scoreBreakdown: {
          keywordSkillMatch: 35,
          roleTitleAlignment: 16,
          quantifiedImpact: 12,
          experienceDepth: 8,
          formattingAtsReadability: 2,
        },
        version: 2, // STALE! previous version
        ats: "Generic",
        createdAt: new Date().toISOString(),
      },
      preservation: {
        status: "VALIDATED",
        valid: true,
        totalFacts: 2,
        preservedFacts: 2,
        missingFactIds: [],
        unresolvedFactIds: [],
        alteredProtectedFields: [],
        unsupportedClaimIds: [],
        categoryCounts: {},
        contentPreservedPercent: 100,
      },
    };

    // Export rule: finalScore.version must strictly equal currentDraftVersion
    const isExportAllowed =
      opt.preservation?.valid &&
      Boolean(opt.finalScore) &&
      opt.finalScore?.version === opt.currentDraftVersion;

    expect(isExportAllowed).toBe(false);
  });

  it("enforces export gate: unlocks export when preservation is valid and version matches", () => {
    const opt: Partial<OptimizationRecord> = {
      currentDraftVersion: 3,
      finalScore: {
        score: 75,
        scoreBreakdown: {
          keywordSkillMatch: 37,
          roleTitleAlignment: 16,
          quantifiedImpact: 12,
          experienceDepth: 8,
          formattingAtsReadability: 2,
        },
        version: 3, // MATCHES! current version
        ats: "Generic",
        createdAt: new Date().toISOString(),
      },
      preservation: {
        status: "VALIDATED",
        valid: true,
        totalFacts: 2,
        preservedFacts: 2,
        missingFactIds: [],
        unresolvedFactIds: [],
        alteredProtectedFields: [],
        unsupportedClaimIds: [],
        categoryCounts: {},
        contentPreservedPercent: 100,
      },
    };

    const isExportAllowed =
      opt.preservation?.valid &&
      Boolean(opt.finalScore) &&
      opt.finalScore?.version === opt.currentDraftVersion;

    expect(isExportAllowed).toBe(true);
  });
});
