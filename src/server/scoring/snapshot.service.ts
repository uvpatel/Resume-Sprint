import { Snapshot, ScanSession } from '@/types/resume-sprint';
import { computeDraftHash, compareSnapshots, areScoreInputsFresh } from '@/lib/validation/snapshot';

export const CANONICAL_RUBRIC_VERSION = 'v1.0.0';
export const CANONICAL_SCORER_VERSION = 'v1.0.0';
export const CANONICAL_PROMPT_VERSION = 'vNext';
export const CANONICAL_TEMPLATE_VERSION = 'clean-v1';

export class SnapshotService {
  public static buildSnapshot(session: ScanSession): Snapshot {
    const draftHash = session.currentDraftHash || computeDraftHash(session.currentResumeData);
    return {
      sourceFileSha256: session.sourceFileSha256,
      sourceVersion: session.sourceVersion,
      draftVersion: session.currentDraftVersion,
      draftHash,
      jdHash: session.jdHash,
      rubricVersion: session.rubricVersion || CANONICAL_RUBRIC_VERSION,
      scorerVersion: session.scorerVersion || CANONICAL_SCORER_VERSION,
      promptVersion: session.promptVersion || CANONICAL_PROMPT_VERSION,
      evidenceVersion: session.evidenceVersion,
      atsVersion: session.atsVersion,
      templateVersion: session.templateVersion || CANONICAL_TEMPLATE_VERSION,
    };
  }

  public static compare(a: Snapshot, b: Snapshot): boolean {
    return compareSnapshots(a, b);
  }

  public static isScoreFresh(current: Snapshot, scoreSnapshot: Snapshot): boolean {
    return areScoreInputsFresh(current, scoreSnapshot);
  }
}
