import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { ScanSessionService } from '@/server/scan-sessions/scan-session.service';
import { handleApiError } from '@/lib/errors/api-error';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const { session, snapshot, preservation, score } = await ScanSessionService.getSession(id, user.id);

    return NextResponse.json({
      sessionId: session.id,
      state: session.state,
      sourceCoverage: session.sourceCoverage,
      preservation: preservation || null,
      proposals: session.proposals,
      latestScore: score || null,
      snapshot,
      draftVersion: session.currentDraftVersion,
      draftHash: session.currentDraftHash,
      targetRole: session.targetRole,
      effectiveATS: session.effectiveATS,
      requirements: session.requirements,
      userEvidence: session.userEvidence,
      currentResumeData: session.currentResumeData,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const receipt = await ScanSessionService.deleteSession(id, user.id);

    return NextResponse.json(receipt, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
