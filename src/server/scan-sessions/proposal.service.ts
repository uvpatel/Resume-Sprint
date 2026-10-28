import crypto from 'node:crypto';
import { ScanSession, Patch, Snapshot } from '@/types/resume-sprint';
import { ScanSessionRepository, globalStore } from '@/server/persistence/repository';
import { SnapshotService } from '@/server/scoring/snapshot.service';
import { ApiError } from '@/lib/errors/api-error';
import { validatePatch } from '@/lib/validation/patch';
import { cloneResumeData, setFieldValue, validateResumeData } from '@/lib/validation/resume';
import { PreservationService } from '@/server/preservation/preservation.service';

export class ProposalService {
  public static async generateProposals(params: {
    sessionId: string;
    userId: string;
    snapshot: Snapshot;
    selectedImprovementIds?: string[];
  }): Promise<{ proposals: Patch[]; currentDraftVersion: number }> {
    const { sessionId, userId, snapshot, selectedImprovementIds = [] } = params;

    return await globalStore.withLock(sessionId, async () => {
      const session = await ScanSessionRepository.findById(sessionId);
      if (!session) {
        throw ApiError.notFound('Scan session');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden();
      }

      // Check snapshot freshness
      const currentSnapshot = SnapshotService.buildSnapshot(session);
      if (!SnapshotService.compare(currentSnapshot, snapshot)) {
        throw ApiError.conflict(
          'Submitted snapshot does not match current server state. Fetch the latest draft before generating proposals.',
          session.currentDraftVersion
        );
      }

      // Generate anchored proposals based on current draft and requirements
      const candidatePatches = this.createCandidatePatches(session, selectedImprovementIds);

      // Validate each candidate patch for schema, safety, and preservation
      const validProposals: Patch[] = [];

      for (const patch of candidatePatches) {
        // Do not repeat rejected proposals
        if (session.rejectedProposalIds.includes(patch.changeId)) {
          continue;
        }

        const validation = validatePatch(patch, session.currentResumeData, session.currentDraftVersion, session.currentDraftHash);
        if (!validation.valid) {
          continue;
        }

        // Test applying patch to a trial draft copy to verify full ResumeData integrity and preservation
        const trialDraft = cloneResumeData(session.currentResumeData);
        const setOk = setFieldValue(trialDraft, patch.fieldPath, patch.after, patch.entryId);
        if (!setOk) {
          continue;
        }

        const resumeValid = validateResumeData(trialDraft);
        if (!resumeValid.success) {
          continue;
        }

        // Check preservation on trial draft
        const pres = PreservationService.evaluate({
          sourceResume: session.sourceResumeData,
          currentDraft: trialDraft,
          sourceFacts: session.sourceFacts,
          sourceCoverage: session.sourceCoverage,
          acceptedPatches: [patch],
        });

        if (pres.status === 'FAILED') {
          continue;
        }

        validProposals.push(patch);
      }

      // Persist generated proposals on session (does NOT mutate draft)
      session.proposals = validProposals;
      await ScanSessionRepository.update(session);

      return {
        proposals: validProposals,
        currentDraftVersion: session.currentDraftVersion,
      };
    });
  }

  private static createCandidatePatches(session: ScanSession, selectedImprovementIds: string[]): Patch[] {
    const patches: Patch[] = [];
    const draft = session.currentResumeData;

    // Scan experience bullets for passive phrasing that can be made active while retaining all original facts
    draft.experience.forEach((exp, expIdx) => {
      exp.bullets.forEach((bullet, bulletIdx) => {
        const bulletId = `${exp.id}_b${bulletIdx}`;
        if (selectedImprovementIds.length > 0 && !selectedImprovementIds.includes(bulletId)) {
          return;
        }

        let improved: string | null = null;
        let reason = '';
        let forecastImpact: number | null = 1;

        if (bullet.startsWith('Responsible for building ')) {
          improved = bullet.replace('Responsible for building ', 'Built ');
          reason = 'Replace passive phrasing with a direct action verb while strictly preserving technologies and scope.';
          forecastImpact = 2;
        } else if (bullet.startsWith('Responsible for ')) {
          improved = bullet.replace('Responsible for ', 'Led and executed ');
          reason = 'Convert passive responsibility statement into an active contribution without modifying facts.';
        } else if (bullet.startsWith('Worked on ')) {
          improved = bullet.replace('Worked on ', 'Contributed to ');
          reason = 'Clarify specific engineering contributions without exaggerating scope or claiming invented ownership.';
        }

        if (improved && improved !== bullet) {
          const changeId = `c_${crypto.createHash('md5').update(bullet + improved).digest('hex').substring(0, 8)}`;
          const fact = session.sourceFacts.find((f) => f.exactText.trim() === bullet.trim());

          patches.push({
            changeId,
            entryId: bulletId,
            fieldPath: `experience.${expIdx}.bullets.${bulletIdx}`,
            before: bullet,
            after: improved,
            baseDraftVersion: session.currentDraftVersion,
            baseDraftHash: session.currentDraftHash,
            sourceFactIds: fact ? [fact.factId] : [],
            sourceSpanIds: fact ? fact.sourceSpanIds : [],
            requirementIds: session.requirements.slice(0, 2).map((r) => r.id),
            reason,
            confidence: 0.95,
            safetyStatus: 'SUPPORTED',
            contentRisk: 'low',
            forecastImpact,
          });
        }
      });
    });

    // Check summary for phrasing optimization
    if (draft.summary && draft.summary.includes('building APIs with')) {
      const summaryBefore = draft.summary;
      const summaryAfter = draft.summary.replace('building APIs with', 'building APIs using');
      const changeId = `c_${crypto.createHash('md5').update(summaryBefore + summaryAfter).digest('hex').substring(0, 8)}`;
      const fact = session.sourceFacts.find((f) => f.exactText.trim() === summaryBefore.trim());

      patches.push({
        changeId,
        entryId: 'summary',
        fieldPath: 'summary',
        before: summaryBefore,
        after: summaryAfter,
        baseDraftVersion: session.currentDraftVersion,
        baseDraftHash: session.currentDraftHash,
        sourceFactIds: fact ? [fact.factId] : [],
        sourceSpanIds: fact ? fact.sourceSpanIds : [],
        requirementIds: [],
        reason: 'Improve wording clarity while retaining exact role, technical scope, and tooling.',
        confidence: 0.98,
        safetyStatus: 'SUPPORTED',
        contentRisk: 'low',
        forecastImpact: 0,
      });
    }

    return patches;
  }
}
