import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { ScanSessionService } from '@/server/scan-sessions/scan-session.service';
import { handleApiError, ApiError } from '@/lib/errors/api-error';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { effectiveATS, baseVersion } = body;

    if (!effectiveATS) {
      throw ApiError.badRequest('effectiveATS is required.', 'Select an ATS profile from the allowlist');
    }

    if (baseVersion === undefined || isNaN(Number(baseVersion))) {
      throw ApiError.badRequest('baseVersion is required.', 'Specify current draft version');
    }

    const { session, snapshot } = await ScanSessionService.updateATS({
      sessionId: id,
      userId: user.id,
      effectiveATS: String(effectiveATS),
      baseVersion: Number(baseVersion),
    });

    return NextResponse.json({
      sessionId: id,
      effectiveATS: session.effectiveATS,
      atsVersion: session.atsVersion,
      snapshot,
      scoreStatus: session.latestScore?.status || 'STALE',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
