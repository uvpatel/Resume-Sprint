import { describe, it, expect } from "bun:test";
import { validatePreservation } from "@/lib/engine/scoring";
import { ResumeBlock, PatchProposal, Fact } from "@/lib/db/types";

describe("100% Content Preservation", () => {
  const sourceBlocks: ResumeBlock[] = [
    { id: "s1", section: "Summary", text: "Integration engineer building APIs with MuleSoft and SQL." },
    { id: "e1", section: "Experience", text: "Integration Engineer | Northstar Energy | London | 2021–Present" },
    { id: "b1", section: "Experience", text: "Responsible for building MuleSoft APIs connecting Salesforce and SAP." },
    { id: "b2", section: "Experience", text: "Worked on RabbitMQ messaging and SQL data pipelines." },
    { id: "b3", section: "Experience", text: "Reduced processing time by 30% through batch processing." },
    { id: "ed1", section: "Education", text: "MSc Computer Science | Example University | 2020" },
    { id: "sk1", section: "Skills", text: "MuleSoft, Salesforce, SAP, RabbitMQ, SQL, batch processing" },
    { id: "p1", section: "Projects", text: "Customer data synchronization using APIs and RabbitMQ." },
    { id: "l1", section: "Languages", text: "English, Marathi" },
  ];

  const approvedChanges: PatchProposal[] = [
    {
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
    },
  ];

  const sampleFacts: Fact[] = [
    {
      factId: "f_b3",
      entryId: "b3",
      section: "Experience",
      exactText: "Reduced processing time by 30% through batch processing.",
      kind: "metric",
      protectedValues: ["30%"],
    },
  ];

  it("validates 100% preservation when draft preserves all source blocks", () => {
    const draft = structuredClone(sourceBlocks);
    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);

    expect(result.valid).toBe(true);
    expect(result.status).toBe("VALIDATED");
    expect(result.contentPreservedPercent).toBe(100);
  });

  it("blocks missing section unit (e.g. lost languages entry)", () => {
    const draft = structuredClone(sourceBlocks);
    draft.pop(); // Remove languages entry
    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);

    expect(result.valid).toBe(false);
    expect(result.missingFactIds).toContain("l1");
  });

  it("blocks invented metric or unapproved factual modifications", () => {
    const draft = structuredClone(sourceBlocks);
    draft[3].text += " Processing 10 million records."; // Invented metric

    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);
    expect(result.valid).toBe(false);
    expect(result.unresolvedFactIds).toContain("b2");
  });

  it("blocks alteration of protected values (e.g. changing 30% to 50%)", () => {
    const draft = structuredClone(sourceBlocks);
    draft[4].text = "Reduced processing time by 50% through batch processing.";

    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);
    expect(result.valid).toBe(false);
    expect(result.alteredProtectedFields.length).toBeGreaterThan(0);
  });

  it("blocks duplicate IDs replacing source units", () => {
    const draft = structuredClone(sourceBlocks);
    draft[8] = { ...draft[0] }; // Duplicate s1 replacing l1

    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);
    expect(result.valid).toBe(false);
  });

  it("passes when approved changes are applied", () => {
    const draft = structuredClone(sourceBlocks);
    draft[2].text = approvedChanges[0].after;

    const result = validatePreservation(sourceBlocks, draft, approvedChanges, sampleFacts);
    expect(result.valid).toBe(true);
  });
});
