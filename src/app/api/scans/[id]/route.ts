import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getScanById, getResumeById } from "@/lib/db/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
    }

    const scan = await getScanById(id);
    if (!scan) {
      return NextResponse.json({ error: "Scan report not found" }, { status: 404 });
    }

    // Ownership check
    if (scan.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this scan." }, { status: 403 });
    }

    const resume = await getResumeById(scan.resumeId);

    return NextResponse.json({
      scan,
      resume,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
