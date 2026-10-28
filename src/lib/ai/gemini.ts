import { GoogleGenAI } from "@google/genai";
import {
  ResumeBlock,
  Fact,
  RequirementEvidence,
  ScoreBreakdown,
  TopImprovement,
  PatchProposal,
} from "../db/types";
import {
  evaluateRubricV1,
  extractAndMatchRequirements,
  generateAnchoredProposals,
} from "../engine/scoring";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getClient(): GoogleGenAI | null {
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch {
    return null;
  }
}

export interface ScanAiResult {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  componentReasons: Record<string, string>;
  requirements: RequirementEvidence[];
  matchedKeywords: string[];
  missingKeywords: string[];
  unsupportedMissingKeywords: string[];
  topImprovements: TopImprovement[];
  contentRisk: "low" | "medium" | "high";
  parsingWarnings: string[];
  targetForecast: number | null;
}

export async function runServerScan(
  resumeBlocks: ResumeBlock[],
  facts: Fact[],
  jobDescription: string,
  targetRole?: string
): Promise<ScanAiResult> {
  const resumeText = resumeBlocks.map((b) => b.text).join("\n");

  // Run deterministic analysis baseline
  const {
    requirements: baseReqs,
    matchedKeywords: baseMatched,
    missingKeywords: baseMissing,
    unsupportedMissingKeywords: baseUnsupported,
    topImprovements: baseImprovements,
  } = extractAndMatchRequirements(resumeBlocks, jobDescription);

  const deterministicScore = evaluateRubricV1(resumeText, resumeBlocks, baseReqs);

  const fallbackResult: ScanAiResult = {
    score: deterministicScore.score,
    scoreBreakdown: deterministicScore.breakdown,
    componentReasons: deterministicScore.reasons,
    requirements: baseReqs,
    matchedKeywords: baseMatched,
    missingKeywords: baseMissing,
    unsupportedMissingKeywords: baseUnsupported,
    topImprovements: baseImprovements,
    contentRisk: "low",
    parsingWarnings: [],
    targetForecast: Math.min(100, deterministicScore.score + 3),
  };

  const client = getClient();
  if (!client) {
    return fallbackResult;
  }

  try {
    const prompt = `
You are ResumeSprint's evidence-grounded resume analyst. Follow only this task contract.
Return strict JSON with no markdown wrapping.
Resume Text:
${resumeText}

Target Role: ${targetRole || "Role specified in JD"}
Job Description:
${jobDescription}

Rubric v1 rules:
- keywordSkillMatch: integer 0 to 40
- roleTitleAlignment: integer 0 to 20
- quantifiedImpact: integer 0 to 20
- experienceDepth: integer 0 to 10
- formattingAtsReadability: integer 0 to 10
Components MUST strictly sum to total score.
Never invent experience, skills, employers, or metrics not present in Resume Text.

Expected JSON output format:
{
  "scoreBreakdown": {
    "keywordSkillMatch": number,
    "roleTitleAlignment": number,
    "quantifiedImpact": number,
    "experienceDepth": number,
    "formattingAtsReadability": number
  },
  "matchedKeywords": ["string"],
  "missingKeywords": ["string"],
  "unsupportedKeywords": ["string"],
  "reasons": {
    "keywordSkillMatch": "string",
    "roleTitleAlignment": "string",
    "quantifiedImpact": "string",
    "experienceDepth": "string",
    "formattingAtsReadability": "string"
  }
}
`;

    const response = await client.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) return fallbackResult;

    const parsed = JSON.parse(responseText);

    // Validate server-side constraints
    const bd = parsed.scoreBreakdown;
    if (
      typeof bd?.keywordSkillMatch === "number" &&
      typeof bd?.roleTitleAlignment === "number" &&
      typeof bd?.quantifiedImpact === "number" &&
      typeof bd?.experienceDepth === "number" &&
      typeof bd?.formattingAtsReadability === "number"
    ) {
      const validatedBreakdown: ScoreBreakdown = {
        keywordSkillMatch: Math.max(0, Math.min(40, Math.round(bd.keywordSkillMatch))),
        roleTitleAlignment: Math.max(0, Math.min(20, Math.round(bd.roleTitleAlignment))),
        quantifiedImpact: Math.max(0, Math.min(20, Math.round(bd.quantifiedImpact))),
        experienceDepth: Math.max(0, Math.min(10, Math.round(bd.experienceDepth))),
        formattingAtsReadability: Math.max(0, Math.min(10, Math.round(bd.formattingAtsReadability))),
      };

      const calculatedTotal =
        validatedBreakdown.keywordSkillMatch +
        validatedBreakdown.roleTitleAlignment +
        validatedBreakdown.quantifiedImpact +
        validatedBreakdown.experienceDepth +
        validatedBreakdown.formattingAtsReadability;

      return {
        score: calculatedTotal,
        scoreBreakdown: validatedBreakdown,
        componentReasons: {
          keywordSkillMatch: parsed.reasons?.keywordSkillMatch || fallbackResult.componentReasons.keywordSkillMatch,
          roleTitleAlignment: parsed.reasons?.roleTitleAlignment || fallbackResult.componentReasons.roleTitleAlignment,
          quantifiedImpact: parsed.reasons?.quantifiedImpact || fallbackResult.componentReasons.quantifiedImpact,
          experienceDepth: parsed.reasons?.experienceDepth || fallbackResult.componentReasons.experienceDepth,
          formattingAtsReadability: parsed.reasons?.formattingAtsReadability || fallbackResult.componentReasons.formattingAtsReadability,
        },
        requirements: baseReqs,
        matchedKeywords: Array.isArray(parsed.matchedKeywords) && parsed.matchedKeywords.length > 0 ? parsed.matchedKeywords : baseMatched,
        missingKeywords: Array.isArray(parsed.missingKeywords) && parsed.missingKeywords.length > 0 ? parsed.missingKeywords : baseMissing,
        unsupportedMissingKeywords: Array.isArray(parsed.unsupportedKeywords) && parsed.unsupportedKeywords.length > 0 ? parsed.unsupportedKeywords : baseUnsupported,
        topImprovements: baseImprovements,
        contentRisk: "low",
        parsingWarnings: [],
        targetForecast: Math.min(100, calculatedTotal + 3),
      };
    }

    return fallbackResult;
  } catch (err) {
    console.warn("Gemini scan execution warning, using deterministic engine:", err);
    return fallbackResult;
  }
}

export async function runServerOptimizationProposals(
  blocks: ResumeBlock[],
  requirements: RequirementEvidence[]
): Promise<PatchProposal[]> {
  // Anchored deterministic proposals always grounded in actual candidate facts
  const baseProposals = generateAnchoredProposals(blocks, requirements);
  return baseProposals;
}
