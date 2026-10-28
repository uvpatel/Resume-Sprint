import { describe, it, expect } from "bun:test";
import {
  evaluateRubricV1,
  computeWordDiff,
  extractAndMatchRequirements,
} from "@/lib/engine/scoring";
import { ResumeBlock, RequirementEvidence } from "@/lib/db/types";

describe("Canonical Rubric v1 & Scoring", () => {
  const sampleBlocks: ResumeBlock[] = [
    { id: "s1", section: "Summary", text: "Integration engineer building APIs with MuleSoft and SQL." },
    { id: "e1", section: "Experience", text: "Integration Engineer | Northstar Energy | London | 2021–Present" },
    { id: "b1", section: "Experience", text: "Responsible for building MuleSoft APIs connecting Salesforce and SAP." },
    { id: "b2", section: "Experience", text: "Worked on RabbitMQ messaging and SQL data pipelines." },
    { id: "b3", section: "Experience", text: "Reduced processing time by 30% through batch processing." },
    { id: "ed1", section: "Education", text: "MSc Computer Science | Example University | 2020" },
    { id: "sk1", section: "Skills", text: "MuleSoft, Salesforce, SAP, RabbitMQ, SQL, batch processing" },
  ];

  const fullText = sampleBlocks.map((b) => b.text).join("\n");
  const jd = "Integration Engineer building MuleSoft APIs connecting Salesforce and SAP. Experience with RabbitMQ and SQL data pipelines.";

  it("strictly enforces component sum equals total score", () => {
    const { requirements } = extractAndMatchRequirements(sampleBlocks, jd);
    const result = evaluateRubricV1(fullText, sampleBlocks, requirements);

    const sum =
      result.breakdown.keywordSkillMatch +
      result.breakdown.roleTitleAlignment +
      result.breakdown.quantifiedImpact +
      result.breakdown.experienceDepth +
      result.breakdown.formattingAtsReadability;

    expect(result.score).toBe(sum);
  });

  it("respects Rubric v1 maximum bounds (40/20/20/10/10)", () => {
    const mockReqs: RequirementEvidence[] = [
      { requirementId: "r1", requirement: "MuleSoft", status: "MATCHED", importance: "high", sourceSpanIds: ["b1"], sourceFactIds: ["f1"], explanation: "" },
      { requirementId: "r2", requirement: "SQL", status: "MATCHED", importance: "high", sourceSpanIds: ["b2"], sourceFactIds: ["f2"], explanation: "" },
    ];

    const result = evaluateRubricV1(fullText, sampleBlocks, mockReqs);

    expect(result.breakdown.keywordSkillMatch).toBeLessThanOrEqual(40);
    expect(result.breakdown.roleTitleAlignment).toBeLessThanOrEqual(20);
    expect(result.breakdown.quantifiedImpact).toBeLessThanOrEqual(20);
    expect(result.breakdown.experienceDepth).toBeLessThanOrEqual(10);
    expect(result.breakdown.formattingAtsReadability).toBeLessThanOrEqual(10);
  });

  it("lossless word diff reconstructs before and after text perfectly", () => {
    const before = "Responsible for building MuleSoft APIs connecting Salesforce and SAP.";
    const after = "Built MuleSoft APIs connecting Salesforce and SAP.";

    const tokens = computeWordDiff(before, after);

    // Reconstruct before by taking all tokens except 'add'
    const reconstructedBefore = tokens
      .filter((t) => t.type !== "add")
      .map((t) => t.text)
      .join("");

    // Reconstruct after by taking all tokens except 'remove'
    const reconstructedAfter = tokens
      .filter((t) => t.type !== "remove")
      .map((t) => t.text)
      .join("");

    expect(reconstructedBefore).toBe(before);
    expect(reconstructedAfter).toBe(after);
  });
});
