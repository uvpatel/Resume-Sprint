import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { DecisionService } from '@/server/scan-sessions/decision.service';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { DecisionRequest } from '@/types/resume-sprint';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { operationId, baseDraftVersion, changeId, decision, editedText } = body;

    if (!operationId) {
      throw ApiError.badRequest('operationId is required.', 'Provide operationId for idempotency and tracing');
    }

    if (baseDraftVersion === undefined || baseDraftVersion === null || isNaN(Number(baseDraftVersion))) {
      throw ApiError.badRequest('baseDraftVersion is required.', 'Specify expected draft version');
    }

    if (!changeId) {
      throw ApiError.badRequest('changeId is required.', 'Specify target changeId');
    }

    if (!decision || !['accept', 'reject', 'edit', 'undo'].includes(decision)) {
      throw ApiError.badRequest('decision must be accept, reject, edit, or undo.', 'Provide valid decision type');
    }

    const decisionRequest: DecisionRequest = {
      operationId: String(operationId),
      baseDraftVersion: Number(baseDraftVersion),
      changeId: String(changeId),
      decision,
      editedText: editedText !== undefined ? String(editedText) : undefined,
    };

    const result = await DecisionService.applyDecision({
      sessionId: id,
      userId: user.id,
      request: decisionRequest,
    });

    return NextResponse.json({
      sessionId: id,
      decision: result.decision,
      changeId: result.changeId,
      previousDraftVersion: result.previousDraftVersion,
      newDraftVersion: result.newDraftVersion,
      draftHash: result.draftHash,
      preservation: result.preservation,
      draft: result.draft,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
