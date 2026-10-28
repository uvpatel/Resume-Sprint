import { describe, it, expect } from "bun:test";
import { validateResumeFile } from "@/lib/parser/extractor";

describe("File Validation", () => {
  it("accepts valid PDF, DOCX, and TXT files under 5MB", () => {
    const pdf = validateResumeFile({
      name: "resume.pdf",
      size: 1024 * 1024,
      type: "application/pdf",
    });
    expect(pdf.valid).toBe(true);
    expect(pdf.fileType).toBe("pdf");

    const docx = validateResumeFile({
      name: "resume.docx",
      size: 2 * 1024 * 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    expect(docx.valid).toBe(true);
    expect(docx.fileType).toBe("docx");

    const txt = validateResumeFile({
      name: "resume.txt",
      size: 50 * 1024,
      type: "text/plain",
    });
    expect(txt.valid).toBe(true);
    expect(txt.fileType).toBe("txt");
  });

  it("rejects files larger than 5MB", () => {
    const oversized = validateResumeFile({
      name: "huge_resume.pdf",
      size: 6 * 1024 * 1024,
      type: "application/pdf",
    });
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain("5MB");
  });

  it("rejects unsupported extensions", () => {
    const exe = validateResumeFile({
      name: "malicious.exe",
      size: 1024,
      type: "application/x-msdownload",
    });
    expect(exe.valid).toBe(false);

    const image = validateResumeFile({
      name: "photo.jpg",
      size: 1024,
      type: "image/jpeg",
    });
    expect(image.valid).toBe(false);
  });
});
