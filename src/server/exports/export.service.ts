import crypto from 'node:crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { ExportArtifact, ScanSession, Snapshot, ResumeData } from '@/types/resume-sprint';
import { ExportArtifactRepository } from '@/server/persistence/repository';
import { ApiError } from '@/lib/errors/api-error';
import { computeSha256 } from '@/lib/validation/snapshot';
import { SnapshotService } from '@/server/scoring/snapshot.service';

export class ExportService {
  /**
   * Generates a genuine binary PDF or DOCX file bound strictly to the current validated snapshot.
   */
  public static async generateArtifact(params: {
    session: ScanSession;
    format: 'pdf' | 'docx';
    snapshot: Snapshot;
  }): Promise<ExportArtifact> {
    const { session, format, snapshot } = params;

    // Freshness check: snapshot must match current draft snapshot
    const currentSnapshot = SnapshotService.buildSnapshot(session);
    if (!SnapshotService.compare(currentSnapshot, snapshot)) {
      throw ApiError.conflict('Requested export snapshot is stale. Current draft has changed.', session.currentDraftVersion);
    }

    // Preservation gate: Must be VALIDATED
    if (!session.preservation || session.preservation.status !== 'VALIDATED') {
      throw ApiError.unprocessable(
        'Export blocked: draft preservation is not validated.',
        'Review and accept only verified improvements or undo conflicting changes',
        'EXPORT_PRESERVATION_GATE'
      );
    }

    const artifactId = `art_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let buffer: Buffer;
    let fileName: string;

    const baseName = session.targetRole.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Resume';

    if (format === 'pdf') {
      fileName = `${baseName}_Optimized_v${session.currentDraftVersion}.pdf`;
      buffer = await this.renderPdf(session.currentResumeData);
    } else {
      fileName = `${baseName}_Optimized_v${session.currentDraftVersion}.docx`;
      buffer = await this.renderDocx(session.currentResumeData);
    }

    const sha256 = computeSha256(buffer);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

    const artifact: ExportArtifact = {
      artifactId,
      sessionId: session.id,
      userId: session.userId,
      snapshot,
      format,
      fileName,
      fileBufferBase64: buffer.toString('base64'),
      sha256,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    await ExportArtifactRepository.save(artifact);
    return artifact;
  }

  private static async renderPdf(resume: ResumeData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    let y = height - 50;

    // Header: Name & Contact
    page.drawText(resume.basicInfo.name || 'Anonymous Candidate', {
      x: 50,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 20;

    const contactParts = [
      resume.basicInfo.email,
      resume.basicInfo.phone,
      resume.basicInfo.location,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      page.drawText(contactParts.join('  •  '), {
        x: 50,
        y,
        size: 10,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 25;
    }

    // Summary
    if (resume.summary) {
      page.drawText('SUMMARY', { x: 50, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
      page.drawText(resume.summary.substring(0, 300), { x: 50, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 25;
    }

    // Experience
    if (resume.experience.length > 0) {
      page.drawText('PROFESSIONAL EXPERIENCE', { x: 50, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 16;

      for (const exp of resume.experience) {
        if (y < 60) break;
        page.drawText(`${exp.title} — ${exp.company}`, { x: 50, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
        y -= 14;

        for (const bullet of exp.bullets) {
          if (y < 50) break;
          page.drawText(`•  ${bullet.substring(0, 90)}`, { x: 60, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.25) });
          y -= 12;
        }
        y -= 8;
      }
    }

    // Skills
    if (resume.skillEntries.length > 0 && y > 60) {
      page.drawText('SKILLS', { x: 50, y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 14;
      const skillsStr = resume.skillEntries.map((s) => s.name).join(', ');
      page.drawText(skillsStr.substring(0, 200), { x: 50, y, size: 9.5, font, color: rgb(0.25, 0.25, 0.25) });
      y -= 20;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private static async renderDocx(resume: ResumeData): Promise<Buffer> {
    const children: Paragraph[] = [
      new Paragraph({
        text: resume.basicInfo.name || 'Anonymous Candidate',
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: [resume.basicInfo.email, resume.basicInfo.phone, resume.basicInfo.location].filter(Boolean).join(' | '),
            italics: true,
          }),
        ],
      }),
    ];

    if (resume.summary) {
      children.push(
        new Paragraph({ text: 'Professional Summary', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: resume.summary })
      );
    }

    if (resume.experience.length > 0) {
      children.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_1 }));
      for (const exp of resume.experience) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${exp.title} at ${exp.company}`, bold: true }),
              new TextRun({ text: ` (${exp.startDate} - ${exp.endDate})`, italics: true }),
            ],
          })
        );
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
            })
          );
        }
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children }],
    });

    return await Packer.toBuffer(doc);
  }
}
