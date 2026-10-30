import { describe, it, expect } from "bun:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Paragraph, TextRun, Packer } from "docx";
import { ResumeParserService } from "@/lib/parser/service";
import { PdfAdapter } from "@/lib/parser/adapters/pdf-adapter";
import { DocxAdapter } from "@/lib/parser/adapters/docx-adapter";
import { TxtAdapter } from "@/lib/parser/adapters/txt-adapter";
import { DocAdapter } from "@/lib/parser/adapters/doc-adapter";

describe("ResumeSprint Multi-Format Extraction Suite", () => {
  const service = ResumeParserService.getInstance();

  // 1. PDF Parser Adapter & Real PDF Document Extraction
  describe("PDF Extraction", () => {
    it("extracts clean text, preserves page count and reading order from genuine multi-page PDF", async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);

      // Page 1
      const page1 = doc.addPage([600, 800]);
      page1.drawText("Summary:\nSenior Integration Engineer with 7+ years of experience in distributed systems.", {
        x: 50,
        y: 750,
        size: 12,
        font,
      });
      page1.drawText("Experience:\nLead Architect | Cloud Systems Inc | 2021-Present\n- Built MuleSoft APIs for enterprise data pipelines.", {
        x: 50,
        y: 650,
        size: 11,
        font,
      });

      // Page 2
      const page2 = doc.addPage([600, 800]);
      page2.drawText("Education:\nBSc Computer Science | Tech University | 2017\nSkills:\nTypeScript, Node.js, MuleSoft, SQL, Docker", {
        x: 50,
        y: 750,
        size: 11,
        font,
      });

      const pdfBytes = await doc.save();
      const buffer = Buffer.from(pdfBytes);

      const adapter = new PdfAdapter();
      expect(adapter.supports("pdf", buffer)).toBe(true);

      const result = await adapter.extract(buffer, "test-resume.pdf");
      expect(result.format).toBe("pdf");
      expect(result.metadata?.pageCount).toBe(2);
      expect(result.text).toContain("Senior Integration Engineer");
      expect(result.text).toContain("Lead Architect");
      expect(result.text).toContain("TypeScript, Node.js");
      expect(result.metadata?.characterCount).toBeGreaterThan(50);
      expect(result.metadata?.wordCount).toBeGreaterThan(15);
    });

    it("detects scanned image-only PDF and throws clear actionable error", async () => {
      // Create empty PDF with page but no text
      const doc = await PDFDocument.create();
      doc.addPage([600, 800]);
      const pdfBytes = await doc.save();
      const buffer = Buffer.from(pdfBytes);

      const adapter = new PdfAdapter();
      expect(adapter.extract(buffer, "scanned.pdf")).rejects.toThrow(
        "Unable to extract readable text. This document appears to be a scanned image-only PDF."
      );
    });

    it("handles corrupted or malformed PDF gracefully with actionable error", async () => {
      const corruptBuffer = Buffer.from("%PDF-1.4\ncorrupted bytes broken xref table");
      const adapter = new PdfAdapter();
      expect(adapter.extract(corruptBuffer, "corrupt.pdf")).rejects.toThrow(
        "corrupted or improperly structured"
      );
    });

    it("rejects non-PDF buffer with extension disguised as .pdf", async () => {
      const fakeBuffer = Buffer.from("MZ\x90\x00\x03\x00\x00\x00BinaryExeContent");
      const adapter = new PdfAdapter();
      expect(adapter.extract(fakeBuffer, "disguised.pdf")).rejects.toThrow(
        "Invalid PDF file signature"
      );
    });
  });

  // 2. DOCX Parser Adapter & Real Word Document Extraction
  describe("DOCX Extraction", () => {
    it("extracts text, paragraphs, and bullet points from genuine DOCX", async () => {
      const docxDoc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Summary: Full-Stack Engineer specializing in Next.js, TypeScript, and MongoDB.",
                    bold: true,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun("Experience: Staff Software Engineer at Acme Corp."),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                children: [
                  new TextRun("Architected high-throughput microservices handling 50k req/sec."),
                ],
              }),
            ],
          },
        ],
      });

      const docxBuffer = await Packer.toBuffer(docxDoc);
      const adapter = new DocxAdapter();
      expect(adapter.supports("docx", docxBuffer)).toBe(true);

      const result = await adapter.extract(docxBuffer, "resume.docx");
      expect(result.format).toBe("docx");
      expect(result.text).toContain("Full-Stack Engineer");
      expect(result.text).toContain("Staff Software Engineer");
      expect(result.text).toContain("Architected high-throughput");
      expect(result.metadata?.characterCount).toBeGreaterThan(50);
    });

    it("rejects corrupted DOCX buffer with clear error", async () => {
      const corruptBuffer = Buffer.from("Not a zip buffer at all");
      const adapter = new DocxAdapter();
      expect(adapter.extract(corruptBuffer, "corrupt.docx")).rejects.toThrow(
        "Invalid DOCX file signature"
      );
    });
  });

  // 3. TXT Parser Adapter
  describe("TXT Extraction", () => {
    it("extracts UTF-8 text and normalizes Windows CRLF line endings", async () => {
      const raw = "Summary:\r\nSenior Developer\r\n\r\n\r\nExperience:\r\nLead at Tech Co.\r\n• Point 1\r\n• Point 2";
      const buffer = Buffer.from(raw, "utf-8");

      const adapter = new TxtAdapter();
      expect(adapter.supports("txt")).toBe(true);

      const result = await adapter.extract(buffer, "resume.txt");
      expect(result.format).toBe("txt");
      expect(result.text).toContain("Senior Developer");
      expect(result.text).not.toContain("\r\n");
      expect(result.text).not.toContain("\n\n\n");
    });

    it("rejects binary files masquerading as .txt", async () => {
      const binaryBuf = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x00]);
      const adapter = new TxtAdapter();
      expect(adapter.extract(binaryBuf, "binary.txt")).rejects.toThrow(
        "appears to be a binary file"
      );
    });
  });

  // 4. Legacy DOC Adapter
  describe("Legacy DOC Handling", () => {
    it("identifies legacy Word 97-2003 OLE files and returns clear, actionable upgrade guidance", async () => {
      // Magic bytes for OLE CFB: D0 CF 11 E0 A1 B1 1A E1
      const oleDocBuffer = Buffer.from([
        0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00, 0x00, 0x00,
      ]);

      const adapter = new DocAdapter();
      expect(adapter.supports("doc", oleDocBuffer)).toBe(true);

      expect(adapter.extract(oleDocBuffer, "legacy.doc")).rejects.toThrow(
        "Legacy Word (.doc) format detected"
      );
    });
  });

  // 5. ResumeParserService Unified Pipeline & Validation
  describe("ResumeParserService Orchestration", () => {
    it("rejects empty 0-byte uploads", () => {
      const validation = service.validateFile({
        name: "empty.pdf",
        size: 0,
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("empty");
    });

    it("rejects files exceeding 5MB limit", () => {
      const validation = service.validateFile({
        name: "huge.pdf",
        size: 6 * 1024 * 1024,
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("5MB");
    });

    it("detects magic byte mismatches when buffer is provided", () => {
      const exeBufferDisguisedAsPdf = Buffer.from("MZ\x90\x00this is an exe");
      const validation = service.validateFile({
        name: "malicious.pdf",
        size: 1024,
        buffer: exeBufferDisguisedAsPdf,
      });
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain("does not match PDF specification");
    });

    it("successfully processes PDF through complete parseBuffer pipeline", async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const page = doc.addPage([500, 700]);
      page.drawText("Summary:\nExperienced Cloud Engineer with Kubernetes and Go.\nExperience:\nStaff DevOps | Tech Inc\nSkills:\nGo, Kubernetes, Terraform, Docker, AWS", {
        x: 40,
        y: 650,
        size: 12,
        font,
      });
      const pdfBytes = await doc.save();
      const buffer = Buffer.from(pdfBytes);

      const parsed = await service.parseBuffer(buffer, "cloud-resume.pdf", "pdf");
      expect(parsed.fileType).toBe("pdf");
      expect(parsed.blocks.length).toBeGreaterThan(0);
      expect(parsed.facts.length).toBeGreaterThan(0);
      expect(parsed.sourceCoverage.complete).toBe(true);
      expect(parsed.sourceCoverage.totalPages).toBe(1);
      expect(parsed.sourceFileSha256).toBeDefined();
    });
  });
});
