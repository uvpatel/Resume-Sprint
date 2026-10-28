import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getResumeById,
  getOptimizationByResumeId,
  saveOptimization,
} from "@/lib/db/repository";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json({ error: "resumeId query param is required" }, { status: 400 });
    }

    const resume = await getResumeById(resumeId);
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
    }

    const opt = await getOptimizationByResumeId(resumeId);
    if (!opt) {
      return NextResponse.json({ error: "Optimization record not found" }, { status: 404 });
    }

    // Export gating:
    // 1. Must be validated
    if (!opt.preservation?.valid) {
      return NextResponse.json(
        { error: "Export blocked: Content preservation is unverified or contains unresolved changes." },
        { status: 422 }
      );
    }

    // 2. Must be re-scored for current version
    if (!opt.finalScore || opt.finalScore.version !== opt.currentDraftVersion) {
      return NextResponse.json(
        { error: "Export blocked: Current draft has not been re-scored. Please click 'Validate & Re-score' before downloading." },
        { status: 422 }
      );
    }

    // Generate output document
    let lastSection = "";
    const documentContent = opt.draftBlocks
      .map((block) => {
        let header = "";
        if (block.section !== lastSection) {
          header = `\n[${block.section.toUpperCase()}]\n`;
          lastSection = block.section;
        }
        return `${header}${block.text}`;
      })
      .join("\n\n");

    const exportFileName = `${resume.originalFileName.replace(/\.[^/.]+$/, "")}-Optimized.txt`;

    opt.ledger.push({
      event: "EXPORTED",
      version: opt.currentDraftVersion,
      time: new Date().toISOString(),
      details: { fileName: exportFileName },
    });
    await saveOptimization(opt);

    return new NextResponse(documentContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
