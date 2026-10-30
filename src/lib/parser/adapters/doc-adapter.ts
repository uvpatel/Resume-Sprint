import { ResumeExtractionResult, ResumeParserAdapter } from "../types";

export class DocAdapter implements ResumeParserAdapter {
  readonly format = "doc" as const;

  supports(format: string, buffer?: Buffer): boolean {
    if (format === "doc") return true;
    if (buffer && buffer.length >= 8) {
      // Magic bytes for OLE CFB (Compound File Binary): D0 CF 11 E0 A1 B1 1A E1
      return (
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0 &&
        buffer[4] === 0xa1 &&
        buffer[5] === 0xb1 &&
        buffer[6] === 0x1a &&
        buffer[7] === 0xe1
      );
    }
    return false;
  }

  async extract(buffer: Buffer, fileName?: string): Promise<ResumeExtractionResult> {
    // 1. Verify OLE CFB header if present
    const isOle =
      buffer.length >= 8 &&
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0 &&
      buffer[4] === 0xa1 &&
      buffer[5] === 0xb1 &&
      buffer[6] === 0x1a &&
      buffer[7] === 0xe1;

    // As per specification Section 2.5: Legacy .doc binary parsing is not reliable without
    // external native headless converters (like LibreOffice/antiword) which are not present
    // in modern serverless/container environments. Rather than producing corrupted text or
    // hallucinated tokens, explicitly report the limitation with clear, actionable advice.
    throw new Error(
      `Legacy Word (.doc) format detected${fileName ? ` in "${fileName}"` : ""}. ` +
      `Legacy Word 97-2003 binary formats cannot be parsed with a 100% content preservation guarantee. ` +
      `Please open your file in Microsoft Word, Google Docs, or Apple Pages and save it as modern Word (.docx) or PDF (.pdf) for diagnostic analysis.`
    );
  }
}
