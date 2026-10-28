import crypto from 'node:crypto';
import { z } from 'zod';
import { Snapshot } from '@/types/resume-sprint';

export const SnapshotSchema = z.object({
  sourceFileSha256: z.string().min(16),
  sourceVersion: z.number().int().nonnegative(),
  draftVersion: z.number().int().nonnegative(),
  draftHash: z.string().min(16),
  jdHash: z.string().min(16),
  rubricVersion: z.string().min(1),
  scorerVersion: z.string().min(1),
  promptVersion: z.string().min(1),
  evidenceVersion: z.number().int().nonnegative(),
  atsVersion: z.number().int().nonnegative(),
  templateVersion: z.string().min(1),
});

/**
 * Deterministically sorts object keys recursively for canonical JSON representation
 */
export function canonicalStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalStringify(val);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes canonical SHA-256 hash of a string, Buffer, or object
 */
export function computeSha256(content: string | Buffer | object): string {
  const hash = crypto.createHash('sha256');
  if (typeof content === 'string') {
    hash.update(content, 'utf8');
  } else if (Buffer.isBuffer(content)) {
    hash.update(content);
  } else {
    hash.update(canonicalStringify(content), 'utf8');
  }
  return hash.digest('hex');
}

export function computeDraftHash(resume: unknown): string {
  return computeSha256(resume as object);
}

export function computeJdHash(jd: string): string {
  // Normalize whitespace to prevent frivolous whitespace drift
  const normalized = jd.trim().replace(/\r\n/g, '\n');
  return computeSha256(normalized);
}

/**
 * Deterministic comparison: strictly verifies every field of two snapshots.
 */
export function compareSnapshots(a: Snapshot, b: Snapshot): boolean {
  if (!a || !b) return false;
  return (
    a.sourceFileSha256 === b.sourceFileSha256 &&
    a.sourceVersion === b.sourceVersion &&
    a.draftVersion === b.draftVersion &&
    a.draftHash === b.draftHash &&
    a.jdHash === b.jdHash &&
    a.rubricVersion === b.rubricVersion &&
    a.scorerVersion === b.scorerVersion &&
    a.promptVersion === b.promptVersion &&
    a.evidenceVersion === b.evidenceVersion &&
    a.atsVersion === b.atsVersion &&
    a.templateVersion === b.templateVersion
  );
}

/**
 * Checks whether score-relevant inputs match between two snapshots.
 * Note: templateVersion change does not invalidate numerical score,
 * but draftHash, jdHash, rubricVersion, scorerVersion, promptVersion, evidenceVersion, atsVersion do.
 */
export function areScoreInputsFresh(current: Snapshot, assessed: Snapshot): boolean {
  if (!current || !assessed) return false;
  return (
    current.draftHash === assessed.draftHash &&
    current.draftVersion === assessed.draftVersion &&
    current.jdHash === assessed.jdHash &&
    current.rubricVersion === assessed.rubricVersion &&
    current.scorerVersion === assessed.scorerVersion &&
    current.promptVersion === assessed.promptVersion &&
    current.evidenceVersion === assessed.evidenceVersion &&
    current.atsVersion === assessed.atsVersion
  );
}
