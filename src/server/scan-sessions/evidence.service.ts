import crypto from 'node:crypto';
import { ScanSession, UserEvidence } from '@/types/resume-sprint';
import { ScanSessionRepository, globalStore } from '@/server/persistence/repository';
import { ApiError } from '@/lib/errors/api-error';

export class EvidenceService {
  /**
   * Records user-provided evidence, increments evidenceVersion,
   * updates affected requirements, and marks existing score assessments stale.
   */
  public static async submitEvidence(params: {
    sessionId: string;
    userId: string;
    answer: string;
    requirementId: string;
    roleScope: string;
    baseVersion: number;
  }): Promise<{ session: ScanSession; evidenceId: string; evidenceVersion: number }> {
    const { sessionId, userId, answer, requirementId, roleScope, baseVersion } = params;

    if (!answer || answer.trim().length < 5) {
      throw ApiError.badRequest('Evidence answer must be at least 5 characters.', 'Provide detailed verifiable evidence');
    }

    return await globalStore.withLock(sessionId, async () => {
      const session = await ScanSessionRepository.findById(sessionId);
      if (!session) {
        throw ApiError.notFound('Scan session');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden();
      }

      // Check baseVersion
      if (session.currentDraftVersion !== baseVersion) {
        throw ApiError.conflict(
          `Evidence submitted for base draft version ${baseVersion}, but current draft is version ${session.currentDraftVersion}.`,
          session.currentDraftVersion
        );
      }

      const evidenceId = `ev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const evidenceRecord: UserEvidence = {
        id: evidenceId,
        sessionId,
        requirementId,
        answer: answer.trim(),
        roleScope: roleScope.trim(),
        baseVersion,
        timestamp: new Date().toISOString(),
        userId,
      };

      session.userEvidence.push(evidenceRecord);
      session.evidenceVersion += 1;

      // Reevaluate only the requirements affected by this evidence
      let matchedAny = false;
      session.requirements = session.requirements.map((req) => {
        if (req.id === requirementId) {
          // If the answer is substantiated, update requirement status
          const hasSpecificDetail = answer.length >= 10 && !/^(yes|no|maybe|true|false)$/i.test(answer.trim());
          if (hasSpecificDetail) {
            matchedAny = true;
            return {
              ...req,
              status: 'MATCHED',
              factIds: [...req.factIds, evidenceId],
            };
          }
        }
        return req;
      });

      // Mark current score stale because evidence has changed
      if (session.latestScore) {
        session.latestScore.status = 'STALE';
      }

      await ScanSessionRepository.update(session);

      return {
        session,
        evidenceId,
        evidenceVersion: session.evidenceVersion,
      };
    });
  }
}
