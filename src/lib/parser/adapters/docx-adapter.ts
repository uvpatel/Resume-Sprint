import mammoth from "mammoth";
import { ResumeExtractionResult, ResumeParserAdapter } from "../types";

export class DocxAdapter implements ResumeParserAdapter {
  readonly format = "docx" as const;

  supports(format: string, buffer?: Buffer): boolean {
    if (format === "docx") return true;
    if (buffer && buffer.length >= 4) {
      // Magic bytes for ZIP/DOCX: PK\x03\x04 (0x50 0x4B 0x03 0x04)
      return (
        buffer[0] === 0x50 &&
        buffer[1] === 0x4B &&
        buffer[2] === 0x03 &&
        buffer[3] === 0x04
      );
    }
    return false;
  }

  async extract(buffer: Buffer, fileName?: string): Promise<ResumeExtractionResult> {
    // 1. Verify ZIP header
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4B ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      throw new Error(
        `Invalid DOCX file signature. The file "${fileName || "document"}" is not a valid Word (.docx) document.`
      );
    }

    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
      if (!text || alphaNumericCount < 20) {
        throw new Error(
          "Unable to extract sufficient text from the DOCX file. Ensure the document contains text content."
        );
      }

      const warnings = result.messages?.map((m) => m.message) || [];
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      return {
        text,
        format: "docx",
        metadata: {
          pageCount: 1,
          characterCount: text.length,
          wordCount,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (err: any) {
      if (err.message?.includes("sufficient text")) {
        throw err;
      }
      throw new Error(
        `Failed to parse DOCX document: ${err.message || "Corrupted file structure."}`
      );
    }
  }
}
