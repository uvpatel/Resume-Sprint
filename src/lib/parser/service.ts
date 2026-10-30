import crypto from "crypto";
import {
  ResumeFormat,
  ResumeExtractionResult,
  ResumeParserAdapter,
  FileValidationResult,
} from "./types";
import { PdfAdapter } from "./adapters/pdf-adapter";
import { DocxAdapter } from "./adapters/docx-adapter";
import { TxtAdapter } from "./adapters/txt-adapter";
import { DocAdapter } from "./adapters/doc-adapter";
import { ResumeBlock, Fact, SourceCoverage } from "../db/types";

export interface ParsedResumeResult {
  rawText: string;
  blocks: ResumeBlock[];
  facts: Fact[];
  sourceCoverage: SourceCoverage;
  sourceFileSha256: string;
  fileType: ResumeFormat;
  fileSize: number;
}

export class ResumeParserService {
  private static instance: ResumeParserService;
  private adapters: Map<ResumeFormat, ResumeParserAdapter> = new Map();
  private cache: Map<string, ParsedResumeResult> = new Map();
  private readonly maxCacheSize = 100;
  private readonly maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

  constructor() {
    this.registerAdapter(new PdfAdapter());
    this.registerAdapter(new DocxAdapter());
    this.registerAdapter(new TxtAdapter());
    this.registerAdapter(new DocAdapter());
  }

  public static getInstance(): ResumeParserService {
    if (!ResumeParserService.instance) {
      ResumeParserService.instance = new ResumeParserService();
    }
    return ResumeParserService.instance;
  }

  public registerAdapter(adapter: ResumeParserAdapter): void {
    this.adapters.set(adapter.format, adapter);
  }

  /**
   * Validate file metadata, extension, MIME type, and optional buffer signature.
   */
  public validateFile(file: {
    name: string;
    size: number;
    type?: string;
    buffer?: Buffer;
  }): FileValidationResult {
    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    if (file.size <= 0) {
      return { valid: false, error: "The selected file is empty (0 bytes). Please upload a valid resume." };
    }

    if (file.size > this.maxFileSizeBytes) {
      return {
        valid: false,
        error: "File size exceeds the 5MB limit. Please upload a smaller document.",
      };
    }

    const name = file.name.toLowerCase();
    let detectedFormat: ResumeFormat | null = null;

    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      detectedFormat = "pdf";
    } else if (
      name.endsWith(".docx") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      detectedFormat = "docx";
    } else if (name.endsWith(".doc") || file.type === "application/msword") {
      detectedFormat = "doc";
    } else if (name.endsWith(".txt") || file.type === "text/plain") {
      detectedFormat = "txt";
    }

    if (!detectedFormat) {
      return {
        valid: false,
        error: "Unsupported file format. Please upload a PDF, DOCX, or TXT file.",
      };
    }

    // If buffer is available, verify magic-bytes signature to prevent extension spoofing
    if (file.buffer && file.buffer.length >= 4) {
      const buf = file.buffer;
      if (detectedFormat === "pdf") {
        const isPdfMagic = buf.toString("ascii", 0, 4) === "%PDF";
        if (!isPdfMagic) {
          return {
            valid: false,
            error: "File header does not match PDF specification. The file may be corrupted or disguised.",
          };
        }
      } else if (detectedFormat === "docx") {
        const isZipMagic = buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
        if (!isZipMagic) {
          return {
            valid: false,
            error: "File header does not match DOCX specification. The file may be corrupted or disguised.",
          };
        }
      }
    }

    return {
      valid: true,
      fileType: detectedFormat,
      detectedFormat,
    };
  }

  /**
   * Extract normalized text and metadata from buffer.
   */
  public async extract(
    buffer: Buffer,
    format: ResumeFormat,
    fileName?: string
  ): Promise<ResumeExtractionResult> {
    const adapter = this.adapters.get(format);
    if (!adapter) {
      throw new Error(`No parser adapter available for format: "${format}".`);
    }

    return await adapter.extract(buffer, fileName);
  }

  /**
   * Complete parsing pipeline: buffer -> text -> blocks & facts -> cached result.
   */
  public async parseBuffer(
    buffer: Buffer,
    fileName: string,
    fileType: ResumeFormat
  ): Promise<ParsedResumeResult> {
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");

    // Check cache hit
    const cached = this.cache.get(sha256);
    if (cached) {
      return {
        ...cached,
        blocks: structuredClone(cached.blocks),
        facts: structuredClone(cached.facts),
        sourceCoverage: structuredClone(cached.sourceCoverage),
      };
    }

    // Extract raw text with adapter
    const extraction = await this.extract(buffer, fileType, fileName);
    const rawText = extraction.text.trim();

    if (!rawText || rawText.length < 20) {
      throw new Error(
        "Unable to extract sufficient text from resume. Ensure the document is not an image-only scan."
      );
    }

    const { blocks, facts } = extractBlocksAndFacts(rawText);
    const totalPages = extraction.metadata?.pageCount || 1;

    const parsedResult: ParsedResumeResult = {
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

    // Cache management (LRU eviction)
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(sha256, parsedResult);

    return parsedResult;
  }
}

const SECTION_KEYWORDS: Record<string, string> = {
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

const BULLET_SPLIT_REGEX = /[•▪■●]/;
const METRIC_CHECK_REGEX = /\d+[%kKmMbB]?/;
const PROTECTED_VALUES_REGEX = /\b(?:\d+[%kKmMbB]?|\d{4}(?:[–-]\d{4}|[–-]Present)?)\b/g;

export function extractBlocksAndFacts(rawText: string): { blocks: ResumeBlock[]; facts: Fact[] } {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: ResumeBlock[] = [];
  const facts: Fact[] = [];

  let currentSection = "Summary";
  let blockCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanHeader = line.toLowerCase().replace(/[^a-z]/g, "");

    if (cleanHeader.length > 2 && SECTION_KEYWORDS[cleanHeader]) {
      currentSection = SECTION_KEYWORDS[cleanHeader];
      continue;
    }

    // Split paragraphs or bullet points if line contains bullet glyphs
    const subItems = BULLET_SPLIT_REGEX.test(line)
      ? line
          .split(BULLET_SPLIT_REGEX)
          .map((s) => s.trim())
          .filter((s) => s.length > 3)
      : null;

    const itemsToProcess = subItems && subItems.length > 1 ? subItems : [line];

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
          : METRIC_CHECK_REGEX.test(item)
          ? "metric"
          : "bullet";

      // Detect protected values (numbers, percentages, dates)
      const protectedValues = item.match(PROTECTED_VALUES_REGEX) || [];

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

  // If no blocks were created
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
