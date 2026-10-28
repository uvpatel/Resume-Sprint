import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { ScanSessionService } from '@/server/scan-sessions/scan-session.service';
import { handleApiError, ApiError } from '@/lib/errors/api-error';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON payload');
    });

    const { sourceResumeId, sourceVersion, jd, targetRole, idempotencyKey, customResumeData } = body;

    if (!sourceResumeId) {
      throw ApiError.badRequest('sourceResumeId is required.', 'Provide a valid sourceResumeId');
    }

    if (sourceVersion === undefined || sourceVersion === null || isNaN(Number(sourceVersion))) {
      throw ApiError.badRequest('sourceVersion must be a valid number.', 'Provide sourceVersion');
    }

    const { session, snapshot } = await ScanSessionService.createSession({
      userId: user.id,
      sourceResumeId: String(sourceResumeId),
      sourceVersion: Number(sourceVersion),
      jd: String(jd || ''),
      targetRole: String(targetRole || ''),
      idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined,
      customResumeData,
    });

    return NextResponse.json({
      sessionId: session.id,
      state: session.state,
      snapshot,
      sourceCoverage: session.sourceCoverage,
      latestScore: session.latestScore,
      preservation: session.preservation,
      draftVersion: session.currentDraftVersion,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
