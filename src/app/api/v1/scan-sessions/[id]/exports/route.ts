import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { exportRateLimiter } from '@/lib/security/rate-limit';
import { ScanSessionRepository, IdempotencyRepository } from '@/server/persistence/repository';
import { SnapshotService } from '@/server/scoring/snapshot.service';
import { JobService } from '@/server/jobs/job.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    const rateCheck = exportRateLimiter.check(`export_${user.id}`);
    if (!rateCheck.allowed) {
      throw ApiError.rateLimitExceeded(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds}s before requesting a new export.`,
        'Wait for rate limit window to expire'
      );
    }

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { snapshot, format, idempotencyKey } = body;

    if (!snapshot) {
      throw ApiError.badRequest('snapshot is required.', 'Include current snapshot');
    }

    if (!format || !['pdf', 'docx'].includes(format)) {
      throw ApiError.badRequest('format must be pdf or docx.', 'Choose pdf or docx');
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

    // Snapshot freshness check
    const currentSnapshot = SnapshotService.buildSnapshot(session);
    if (!SnapshotService.compare(currentSnapshot, snapshot)) {
      throw ApiError.conflict(
        'Export requested for a stale snapshot. The draft has changed.',
        session.currentDraftVersion
      );
    }

    // Preservation gate
    if (!session.preservation || session.preservation.status !== 'VALIDATED') {
      throw ApiError.unprocessable(
        'Export blocked: draft preservation is not validated.',
        'Accept only supported improvements or undo conflicting edits before export',
        'EXPORT_PRESERVATION_GATE'
      );
    }

    const job = await JobService.createExportJob({
      sessionId: id,
      userId: user.id,
      snapshot,
      format,
    });

    const responseBody = {
      jobId: job.jobId,
      sessionId: id,
      status: job.status,
      format,
      message: 'Export job initiated successfully.',
    };

    if (idempotencyKey) {
      await IdempotencyRepository.save({
        key: idempotencyKey,
        userId: user.id,
        sessionId: id,
        operationId: `op_export_${job.jobId}`,
        endpoint: `/v1/scan-sessions/${id}/exports`,
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
