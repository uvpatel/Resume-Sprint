import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { rescoreRateLimiter } from '@/lib/security/rate-limit';
import { ScanSessionRepository, IdempotencyRepository } from '@/server/persistence/repository';
import { SnapshotService } from '@/server/scoring/snapshot.service';
import { JobService } from '@/server/jobs/job.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const rateCheck = rescoreRateLimiter.check(`rescore_${user.id}`);
    if (!rateCheck.allowed) {
      throw ApiError.rateLimitExceeded(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds}s before requesting a new rescore.`,
        'Wait for rate limit window to expire'
      );
    }

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { snapshot, idempotencyKey } = body;

    if (!snapshot) {
      throw ApiError.badRequest('snapshot is required.', 'Include current snapshot');
    }

    if (idempotencyKey) {
      const existing = await IdempotencyRepository.get(idempotencyKey, user.id);
      if (existing) {
        return NextResponse.json(existing.responseBody, { status: existing.statusCode });
      }
    }

    const session = await ScanSessionRepository.findById(id);
    if (!session) {
      throw ApiError.notFound('Scan session');
    }

    if (session.userId !== user.id) {
      throw ApiError.forbidden();
    }

    const currentSnapshot = SnapshotService.buildSnapshot(session);
    if (!SnapshotService.compare(currentSnapshot, snapshot)) {
      throw ApiError.conflict(
        'Submitted snapshot is stale. Fetch the latest draft before requesting a rescore.',
        session.currentDraftVersion
      );
    }

    const job = await JobService.createScoreJob({
      sessionId: id,
      userId: user.id,
      snapshot,
    });

    const responseBody = {
      jobId: job.jobId,
      sessionId: id,
      status: job.status,
      message: 'Rescore job scheduled successfully.',
    };

    if (idempotencyKey) {
      await IdempotencyRepository.save({
        key: idempotencyKey,
        userId: user.id,
        sessionId: id,
        operationId: `op_rescore_${job.jobId}`,
        endpoint: `/v1/scan-sessions/${id}/rescores`,
        statusCode: 202,
        responseBody,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(responseBody, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
