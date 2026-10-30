import {
  ResumeParserService,
  type ParsedResumeResult,
  extractBlocksAndFacts,
} from "./service";
import type { ResumeFormat, FileValidationResult } from "./types";

export type { ParsedResumeResult, ResumeFormat, FileValidationResult };
export { extractBlocksAndFacts };

const parserService = ResumeParserService.getInstance();

export function validateResumeFile(
  file: { name: string; size: number; type?: string; buffer?: Buffer }
): FileValidationResult {
  return parserService.validateFile(file);
}

export async function parseResumeBuffer(
  buffer: Buffer,
  fileName: string,
  fileType: ResumeFormat
): Promise<ParsedResumeResult> {
  return parserService.parseBuffer(buffer, fileName, fileType);
}
