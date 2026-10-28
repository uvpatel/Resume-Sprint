import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { EvidenceService } from '@/server/scan-sessions/evidence.service';
import { handleApiError, ApiError } from '@/lib/errors/api-error';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { answer, requirementId, roleScope, baseVersion } = body;

    if (!answer) {
      throw ApiError.badRequest('answer is required.', 'Provide verified evidence answer');
    }

    if (!requirementId) {
      throw ApiError.badRequest('requirementId is required.', 'Provide target requirementId');
    }

    if (baseVersion === undefined || isNaN(Number(baseVersion))) {
      throw ApiError.badRequest('baseVersion is required.', 'Provide current draft version as baseVersion');
    }

    const result = await EvidenceService.submitEvidence({
      sessionId: id,
      userId: user.id,
      answer: String(answer),
      requirementId: String(requirementId),
      roleScope: String(roleScope || ''),
      baseVersion: Number(baseVersion),
    });

    return NextResponse.json({
      sessionId: id,
      evidenceId: result.evidenceId,
      evidenceVersion: result.evidenceVersion,
      requirements: result.session.requirements,
      scoreStatus: result.session.latestScore?.status || 'STALE',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
