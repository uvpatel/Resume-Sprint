import { PDFParse } from "pdf-parse";
import { ResumeExtractionResult, ResumeParserAdapter } from "../types";

export class PdfAdapter implements ResumeParserAdapter {
  readonly format = "pdf" as const;

  supports(format: string, buffer?: Buffer): boolean {
    if (format === "pdf") return true;
    if (buffer && buffer.length >= 4) {
      // Magic bytes for PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    }
    return false;
  }

  async extract(buffer: Buffer, fileName?: string): Promise<ResumeExtractionResult> {
    // 1. Verify basic PDF header
    if (buffer.length < 4 || buffer.toString("ascii", 0, 4) !== "%PDF") {
      throw new Error(
        `Invalid PDF file signature. The file "${fileName || "document"}" does not appear to be a valid PDF.`
      );
    }

    try {
      const parser = new (PDFParse as any)({ data: buffer });
      await parser.load();
      const data = await parser.getText();

      const totalPages = data?.total || data?.pages?.length || 1;

      // Extract text either from individual pages (cleaner, avoids pagination markers) or full text
      let rawText = "";
      if (Array.isArray(data?.pages) && data.pages.length > 0) {
        rawText = data.pages
          .map((p: any) => (typeof p.text === "string" ? p.text : ""))
          .filter(Boolean)
          .join("\n\n");
      } else {
        rawText = data?.text || "";
      }

      // Clean up common PDF extraction artifacts
      // Remove "-- X of Y --" page counters inserted by some PDF renderers
      const cleanedText = rawText
        .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
        // Normalize multiple spaces/tabs
        .replace(/[ \t]+/g, " ")
        // Normalize 3+ newlines down to 2
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // Scanned PDF detection:
      // Count alphabetic and numeric characters
      const alphaNumericCount = (cleanedText.match(/[a-zA-Z0-9]/g) || []).length;

      if (!cleanedText || alphaNumericCount < 30) {
        throw new Error(
          "Unable to extract readable text. This document appears to be a scanned image-only PDF. Please provide a text-based PDF or export your resume from Word or Google Docs."
        );
      }

      const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

      return {
        text: cleanedText,
        format: "pdf",
        metadata: {
          pageCount: totalPages,
          characterCount: cleanedText.length,
          wordCount,
          isScannedLikely: false,
        },
      };
    } catch (err: any) {
      const msg = (err.message || "").toLowerCase();
      const errName = err.name || "";

      if (
        errName === "PasswordException" ||
        msg.includes("password") ||
        msg.includes("encrypt") ||
        msg.includes("secured")
      ) {
        throw new Error(
          "The uploaded PDF is password-protected or encrypted. Please remove password protection before uploading."
        );
      }

      if (
        errName === "InvalidPDFException" ||
        errName === "FormatError" ||
        msg.includes("invalid pdf") ||
        msg.includes("corrupt") ||
        msg.includes("structure")
      ) {
        throw new Error(
          "The PDF file is corrupted or improperly structured. Please re-save or re-export the document."
        );
      }

      // Re-throw our own scanned PDF error directly
      if (msg.includes("scanned image-only")) {
        throw err;
      }

      throw new Error(`Failed to extract text from PDF: ${err.message || "Unknown error"}`);
    }
  }
}
