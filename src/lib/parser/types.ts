export type ResumeFormat = "pdf" | "docx" | "doc" | "txt";

export interface ResumeExtractionMetadata {
  pageCount?: number;
  characterCount: number;
  wordCount?: number;
  isScannedLikely?: boolean;
  warnings?: string[];
}

export interface ResumeExtractionResult {
  text: string;
  format: ResumeFormat;
  metadata?: ResumeExtractionMetadata;
}

export interface ResumeParserAdapter {
  readonly format: ResumeFormat;
  supports(format: ResumeFormat, buffer?: Buffer): boolean;
  extract(buffer: Buffer, fileName?: string): Promise<ResumeExtractionResult>;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: ResumeFormat;
  detectedFormat?: ResumeFormat;
}
