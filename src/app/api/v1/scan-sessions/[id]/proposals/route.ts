import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/security/authorization';
import { ProposalService } from '@/server/scan-sessions/proposal.service';
import { handleApiError, ApiError } from '@/lib/errors/api-error';
import { proposalRateLimiter } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await authenticateRequest(req);
    const { id } = await params;

    // Rate limit check
    const rateCheck = proposalRateLimiter.check(`proposals_${user.id}`);
    if (!rateCheck.allowed) {
      throw ApiError.rateLimitExceeded(
        `Rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds}s before generating more proposals.`,
        'Wait for the rate limit window to expire'
      );
    }

    const body = await req.json().catch(() => {
      throw ApiError.badRequest('Invalid JSON body.', 'Provide valid JSON');
    });

    const { snapshot, selectedImprovementIds } = body;
    if (!snapshot) {
      throw ApiError.badRequest('snapshot is required.', 'Include current snapshot in request body');
    }

    const { proposals, currentDraftVersion } = await ProposalService.generateProposals({
      sessionId: id,
      userId: user.id,
      snapshot,
      selectedImprovementIds: Array.isArray(selectedImprovementIds) ? selectedImprovementIds : [],
    });

    return NextResponse.json({
      sessionId: id,
      proposals,
      currentDraftVersion,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
