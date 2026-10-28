import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getResumeById,
  getOptimizationByResumeId,
  getLatestScanByResumeId,
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
    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    // Ownership check
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const optimization = await getOptimizationByResumeId(resumeId);
    const scan = await getLatestScanByResumeId(resumeId);

    return NextResponse.json({
      optimization,
      resume,
      scan,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
