import { DecisionRequest, ScanSession, Preservation, ResumeData } from '@/types/resume-sprint';
import { ScanSessionRepository, globalStore } from '@/server/persistence/repository';
import { ApiError } from '@/lib/errors/api-error';
import { validatePatch } from '@/lib/validation/patch';
import { cloneResumeData, setFieldValue, validateResumeData } from '@/lib/validation/resume';
import { PreservationService } from '@/server/preservation/preservation.service';
import { computeDraftHash } from '@/lib/validation/snapshot';
import { SnapshotService } from '@/server/scoring/snapshot.service';
import { EventService } from '@/server/events/event.service';

export interface DecisionResult {
  decision: 'accept' | 'reject' | 'edit' | 'undo';
  changeId: string;
  previousDraftVersion: number;
  newDraftVersion: number;
  draftHash: string;
  preservation: Preservation;
  draft: ResumeData;
}

export class DecisionService {
  public static async applyDecision(params: {
    sessionId: string;
    userId: string;
    request: DecisionRequest;
  }): Promise<DecisionResult> {
    const { sessionId, userId, request } = params;
    const { operationId, baseDraftVersion, changeId, decision, editedText } = request;

    return await globalStore.withLock(sessionId, async () => {
      const session = await ScanSessionRepository.findById(sessionId);
      if (!session) {
        throw ApiError.notFound('Scan session');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden();
      }

      // Concurrency / Stale version guard
      if (session.currentDraftVersion !== baseDraftVersion) {
        throw ApiError.conflict(
          `Decision anchors base draft version ${baseDraftVersion}, but current draft is version ${session.currentDraftVersion}. Reconcile with latest server state.`,
          session.currentDraftVersion,
          'Fetch the latest draft version and retry your decision',
          operationId
        );
      }

      const prevVersion = session.currentDraftVersion;

      // Handle REJECT
      if (decision === 'reject') {
        if (!session.rejectedProposalIds.includes(changeId)) {
          session.rejectedProposalIds.push(changeId);
        }
        await ScanSessionRepository.recordDecision({
          sessionId,
          operationId,
          changeId,
          decision: 'reject',
          baseDraftVersion: prevVersion,
          newDraftVersion: prevVersion,
        });
        await ScanSessionRepository.update(session);

        const pres = session.preservation || PreservationService.evaluate({
          sourceResume: session.sourceResumeData,
          currentDraft: session.currentResumeData,
          sourceFacts: session.sourceFacts,
          sourceCoverage: session.sourceCoverage,
        });

        return {
          decision: 'reject',
          changeId,
          previousDraftVersion: prevVersion,
          newDraftVersion: prevVersion,
          draftHash: session.currentDraftHash,
          preservation: pres,
          draft: session.currentResumeData,
        };
      }

      // Handle ACCEPT
      if (decision === 'accept') {
        const patch = session.proposals.find((p) => p.changeId === changeId);
        if (!patch) {
          throw ApiError.badRequest(`Proposal with ID "${changeId}" was not found in this session.`, 'Generate proposals before applying decisions', 'PROPOSAL_NOT_FOUND', operationId);
        }

        // Validate patch against current draft
        const validation = validatePatch(patch, session.currentResumeData, session.currentDraftVersion, session.currentDraftHash);
        if (!validation.valid) {
          throw ApiError.unprocessable(validation.error || 'Patch validation failed.', 'Review patch safety constraints', validation.code, operationId, prevVersion);
        }

        // Apply patch to copy
        const newDraft = cloneResumeData(session.currentResumeData);
        const applied = setFieldValue(newDraft, patch.fieldPath, patch.after, patch.entryId);
        if (!applied) {
          throw ApiError.unprocessable('Failed to apply patch to target field path.', 'Verify field path target', 'PATCH_APPLICATION_FAILED', operationId, prevVersion);
        }

        const validResume = validateResumeData(newDraft);
        if (!validResume.success) {
          throw ApiError.unprocessable(`Resulting resume failed schema validation: ${validResume.error}`, 'Verify resume schema', 'SCHEMA_VALIDATION_FAILED', operationId, prevVersion);
        }

        // Evaluate preservation
        const pres = PreservationService.evaluate({
          sourceResume: session.sourceResumeData,
          currentDraft: newDraft,
          sourceFacts: session.sourceFacts,
          sourceCoverage: session.sourceCoverage,
          acceptedPatches: [patch],
        });

        if (pres.status === 'FAILED') {
          throw ApiError.unprocessable('Applying this change violates content preservation constraints.', 'Undo or adjust the proposed change', 'PRESERVATION_FAILED', operationId, prevVersion);
        }

        // Monotonic version increment
        const nextVersion = prevVersion + 1;
        const nextHash = computeDraftHash(newDraft);

        session.currentDraftVersion = nextVersion;
        session.currentDraftHash = nextHash;
        session.currentResumeData = newDraft;
        session.preservation = pres;

        session.draftHistory.push({
          version: nextVersion,
          hash: nextHash,
          resumeData: cloneResumeData(newDraft),
          createdAt: new Date().toISOString(),
          reason: `Accepted proposal ${changeId}: ${patch.reason}`,
          changeId,
        });

        // Invalidate scores and exports
        if (session.latestScore) {
          session.latestScore.status = 'STALE';
        }

        await ScanSessionRepository.appendDraftVersion({
          sessionId,
          version: nextVersion,
          hash: nextHash,
          resumeData: newDraft,
          reason: `Accepted proposal ${changeId}: ${patch.reason}`,
          changeId,
        });

        await ScanSessionRepository.recordDecision({
          sessionId,
          operationId,
          changeId,
          decision: 'accept',
          baseDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
        });

        await ScanSessionRepository.update(session);

        const currentSnapshot = SnapshotService.buildSnapshot(session);
        await EventService.recordAndEmit({
          sessionId,
          operationId,
          stage: 'READY',
          snapshot: currentSnapshot,
        });

        return {
          decision: 'accept',
          changeId,
          previousDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
          draftHash: nextHash,
          preservation: pres,
          draft: newDraft,
        };
      }

      // Handle EDIT
      if (decision === 'edit') {
        const patch = session.proposals.find((p) => p.changeId === changeId);
        if (!patch) {
          throw ApiError.badRequest(`Proposal with ID "${changeId}" was not found.`, 'Verify proposal ID', 'PROPOSAL_NOT_FOUND', operationId);
        }

        if (!editedText || editedText.trim().length === 0) {
          throw ApiError.badRequest('Edited replacement text cannot be empty.', 'Provide valid text', 'EMPTY_EDIT_TEXT', operationId);
        }

        const placeholderRegex = /\[(X|\.{3}|insert|metric|placeholder|your|number)\]/i;
        if (placeholderRegex.test(editedText)) {
          throw ApiError.unprocessable('Edited text contains forbidden placeholder tokens.', 'Provide genuine factual details without placeholders', 'FORBIDDEN_PLACEHOLDER', operationId, prevVersion);
        }

        const newDraft = cloneResumeData(session.currentResumeData);
        const applied = setFieldValue(newDraft, patch.fieldPath, editedText.trim(), patch.entryId);
        if (!applied) {
          throw ApiError.unprocessable('Failed to apply edited text to target path.', 'Verify field path', 'EDIT_APPLICATION_FAILED', operationId, prevVersion);
        }

        const validResume = validateResumeData(newDraft);
        if (!validResume.success) {
          throw ApiError.unprocessable(`Edited resume data failed schema validation: ${validResume.error}`, 'Check schema', 'SCHEMA_VALIDATION_FAILED', operationId, prevVersion);
        }

        const editedPatch = { ...patch, after: editedText.trim() };
        const pres = PreservationService.evaluate({
          sourceResume: session.sourceResumeData,
          currentDraft: newDraft,
          sourceFacts: session.sourceFacts,
          sourceCoverage: session.sourceCoverage,
          acceptedPatches: [editedPatch],
        });

        const nextVersion = prevVersion + 1;
        const nextHash = computeDraftHash(newDraft);

        session.currentDraftVersion = nextVersion;
        session.currentDraftHash = nextHash;
        session.currentResumeData = newDraft;
        session.preservation = pres;

        session.draftHistory.push({
          version: nextVersion,
          hash: nextHash,
          resumeData: cloneResumeData(newDraft),
          createdAt: new Date().toISOString(),
          reason: `Edited proposal ${changeId}`,
          changeId,
        });

        if (session.latestScore) {
          session.latestScore.status = 'STALE';
        }

        await ScanSessionRepository.appendDraftVersion({
          sessionId,
          version: nextVersion,
          hash: nextHash,
          resumeData: newDraft,
          reason: `Edited proposal ${changeId}`,
          changeId,
        });

        await ScanSessionRepository.recordDecision({
          sessionId,
          operationId,
          changeId,
          decision: 'edit',
          baseDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
          editedText,
        });

        await ScanSessionRepository.update(session);

        const currentSnapshot = SnapshotService.buildSnapshot(session);
        await EventService.recordAndEmit({
          sessionId,
          operationId,
          stage: 'READY',
          snapshot: currentSnapshot,
        });

        return {
          decision: 'edit',
          changeId,
          previousDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
          draftHash: nextHash,
          preservation: pres,
          draft: newDraft,
        };
      }

      // Handle UNDO
      if (decision === 'undo') {
        const patch = session.proposals.find((p) => p.changeId === changeId);
        const targetBefore = patch ? patch.before : null;

        let restoredDraft: ResumeData;
        if (patch && targetBefore) {
          restoredDraft = cloneResumeData(session.currentResumeData);
          setFieldValue(restoredDraft, patch.fieldPath, targetBefore, patch.entryId);
        } else if (session.draftHistory.length >= 2) {
          // Fallback to previous snapshot in history
          restoredDraft = cloneResumeData(session.draftHistory[session.draftHistory.length - 2].resumeData);
        } else {
          // Revert to immutable source resume
          restoredDraft = cloneResumeData(session.sourceResumeData);
        }

        // Monotonic version: UNDO creates a new monotonically increasing version
        const nextVersion = prevVersion + 1;
        const nextHash = computeDraftHash(restoredDraft);

        const pres = PreservationService.evaluate({
          sourceResume: session.sourceResumeData,
          currentDraft: restoredDraft,
          sourceFacts: session.sourceFacts,
          sourceCoverage: session.sourceCoverage,
        });

        session.currentDraftVersion = nextVersion;
        session.currentDraftHash = nextHash;
        session.currentResumeData = restoredDraft;
        session.preservation = pres;

        session.draftHistory.push({
          version: nextVersion,
          hash: nextHash,
          resumeData: cloneResumeData(restoredDraft),
          createdAt: new Date().toISOString(),
          reason: `Undo change ${changeId}`,
          changeId,
        });

        if (session.latestScore) {
          session.latestScore.status = 'STALE';
        }

        await ScanSessionRepository.appendDraftVersion({
          sessionId,
          version: nextVersion,
          hash: nextHash,
          resumeData: restoredDraft,
          reason: `Undo change ${changeId}`,
          changeId,
        });

        await ScanSessionRepository.recordDecision({
          sessionId,
          operationId,
          changeId,
          decision: 'undo',
          baseDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
        });

        await ScanSessionRepository.update(session);

        const currentSnapshot = SnapshotService.buildSnapshot(session);
        await EventService.recordAndEmit({
          sessionId,
          operationId,
          stage: 'READY',
          snapshot: currentSnapshot,
        });

        return {
          decision: 'undo',
          changeId,
          previousDraftVersion: prevVersion,
          newDraftVersion: nextVersion,
          draftHash: nextHash,
          preservation: pres,
          draft: restoredDraft,
        };
      }

      throw ApiError.badRequest(`Unknown decision action "${decision}".`, 'Choose accept, reject, edit, or undo', 'UNKNOWN_DECISION_ACTION', operationId);
    });
  }
}
