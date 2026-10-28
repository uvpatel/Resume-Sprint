import crypto from "crypto";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { ResumeBlock, Fact, SourceCoverage } from "../db/types";

export interface ParsedResumeResult {
  rawText: string;
  blocks: ResumeBlock[];
  facts: Fact[];
  sourceCoverage: SourceCoverage;
  sourceFileSha256: string;
  fileType: "pdf" | "docx" | "txt";
  fileSize: number;
}

export function validateResumeFile(
  file: { name: string; size: number; type?: string }
): { valid: boolean; error?: string; fileType?: "pdf" | "docx" | "txt" } {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds the 5MB limit. Please upload a smaller document." };
  }

  const name = file.name.toLowerCase();
  let fileType: "pdf" | "docx" | "txt" | null = null;

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    fileType = "pdf";
  } else if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    fileType = "docx";
  } else if (name.endsWith(".txt") || file.type === "text/plain") {
    fileType = "txt";
  }

  if (!fileType) {
    return { valid: false, error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file." };
  }

  return { valid: true, fileType };
}

export async function parseResumeBuffer(
  buffer: Buffer,
  fileName: string,
  fileType: "pdf" | "docx" | "txt"
): Promise<ParsedResumeResult> {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  let rawText = "";
  let totalPages = 1;

  if (fileType === "txt") {
    rawText = buffer.toString("utf-8");
  } else if (fileType === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    rawText = result.value;
  } else if (fileType === "pdf") {
    try {
      const parser = new (PDFParse as any)({ data: buffer });
      await parser.load();
      const data = await parser.getText();
      rawText = data?.text || "";
      totalPages = data?.pages?.length || 1;
    } catch (e: any) {
      throw new Error(`Failed to extract text from PDF: ${e.message || "Corrupt PDF"}`);
    }
  }

  rawText = rawText.trim();
  if (!rawText || rawText.length < 20) {
    throw new Error("Unable to extract sufficient text from resume. Ensure the document is not an image-only scan.");
  }

  const { blocks, facts } = extractBlocksAndFacts(rawText);

  return {
    rawText,
    blocks,
    facts,
    sourceCoverage: {
      totalPages,
      processedPages: totalPages,
      complete: true,
      unmappedSpanIds: [],
      unresolvedSpanIds: [],
    },
    sourceFileSha256: sha256,
    fileType,
    fileSize: buffer.length,
  };
}

export function extractBlocksAndFacts(rawText: string): { blocks: ResumeBlock[]; facts: Fact[] } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: ResumeBlock[] = [];
  const facts: Fact[] = [];

  let currentSection = "Summary";
  let blockCounter = 1;

  // Recognizable section headers
  const sectionKeywords: Record<string, string> = {
    summary: "Summary",
    profile: "Summary",
    objective: "Summary",
    experience: "Experience",
    employment: "Experience",
    work: "Experience",
    history: "Experience",
    education: "Education",
    qualifications: "Education",
    skills: "Skills",
    technologies: "Skills",
    tech: "Skills",
    competencies: "Skills",
    projects: "Projects",
    certifications: "Certifications",
    certificates: "Certifications",
    achievements: "Achievements",
    awards: "Achievements",
    languages: "Languages",
    hobbies: "Hobbies",
    interests: "Hobbies",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanHeader = line.toLowerCase().replace(/[^a-z]/g, "");

    if (cleanHeader.length > 2 && sectionKeywords[cleanHeader]) {
      currentSection = sectionKeywords[cleanHeader];
      continue;
    }

    // Split paragraphs or bullet points if line contains bullet glyphs
    const subItems = line
      .split(/[•▪■●]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    const itemsToProcess = subItems.length > 1 ? subItems : [line];

    for (const item of itemsToProcess) {
      const blockId = `b${blockCounter++}`;
      blocks.push({
        id: blockId,
        section: currentSection,
        text: item,
      });

      // Extract atomic facts
      const kind: Fact["kind"] =
        currentSection === "Skills"
          ? "skill"
          : currentSection === "Education"
          ? "education"
          : currentSection === "Summary"
          ? "summary"
          : item.match(/\d+[%kKmMbB]?/)
          ? "metric"
          : "bullet";

      // Detect protected values (numbers, percentages, dates)
      const protectedValues = item.match(/\b(?:\d+[%kKmMbB]?|\d{4}(?:[–-]\d{4}|[–-]Present)?)\b/g) || [];

      facts.push({
        factId: `f_${blockId}`,
        entryId: blockId,
        section: currentSection,
        exactText: item,
        kind,
        protectedValues: Array.from(new Set(protectedValues)),
      });
    }
  }

  // If no blocks were created (empty document or edge case)
  if (blocks.length === 0) {
    blocks.push({
      id: "b1",
      section: "Summary",
      text: rawText,
    });
    facts.push({
      factId: "f_b1",
      entryId: "b1",
      section: "Summary",
      exactText: rawText,
      kind: "summary",
    });
  }

  return { blocks, facts };
}
