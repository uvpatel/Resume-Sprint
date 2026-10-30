import { ResumeExtractionResult, ResumeParserAdapter } from "../types";

export class TxtAdapter implements ResumeParserAdapter {
  readonly format = "txt" as const;

  supports(format: string): boolean {
    return format === "txt";
  }

  async extract(buffer: Buffer, fileName?: string): Promise<ResumeExtractionResult> {
    // Check for excessive binary null bytes (binary file renamed to .txt)
    const checkLength = Math.min(buffer.length, 1024);
    let nullBytes = 0;
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0) nullBytes++;
    }
    if (nullBytes > 2) {
      throw new Error(
        `File "${fileName || "document"}" appears to be a binary file, not a valid plain text document.`
      );
    }

    let text = buffer.toString("utf-8");

    // Normalize Windows/Mac line endings and excessive blank lines
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    if (!text || alphaNumericCount < 20) {
      throw new Error(
        "Unable to extract sufficient text from text file. Ensure the file contains resume content."
      );
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      text,
      format: "txt",
      metadata: {
        pageCount: 1,
        characterCount: text.length,
        wordCount,
      },
    };
  }
}
