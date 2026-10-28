import { z } from 'zod';
import { Patch, ResumeData } from '@/types/resume-sprint';
import { isProtectedFieldPath, getFieldValue } from './resume';

export const PatchSchema = z.object({
  changeId: z.string().min(1),
  entryId: z.string().min(1),
  fieldPath: z.string().min(1),
  before: z.string(),
  after: z.string().min(1),
  baseDraftVersion: z.number().int().nonnegative(),
  baseDraftHash: z.string().min(16),
  sourceFactIds: z.array(z.string()),
  sourceSpanIds: z.array(z.string()),
  requirementIds: z.array(z.string()),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
  safetyStatus: z.enum(['SUPPORTED', 'BLOCKED', 'REVIEW_REQUIRED']),
  contentRisk: z.enum(['low', 'medium', 'high']),
  forecastImpact: z.number().nullable(),
});

export interface PatchValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
  details?: {
    isProtectedField: boolean;
    beforeMatches: boolean;
    containsForbiddenPlaceholder: boolean;
    currentValue?: string | null;
  };
}

/**
 * Validates a proposal patch against the draft resume before application.
 */
export function validatePatch(patch: Patch, currentResume: ResumeData, currentDraftVersion: number, currentDraftHash: string): PatchValidationResult {
  const schemaResult = PatchSchema.safeParse(patch);
  if (!schemaResult.success) {
    return {
      valid: false,
      code: 'INVALID_PATCH_SCHEMA',
      error: schemaResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }

  // Version anchor check
  if (patch.baseDraftVersion !== currentDraftVersion) {
    return {
      valid: false,
      code: 'STALE_VERSION',
      error: `Patch anchors version ${patch.baseDraftVersion}, but current draft is version ${currentDraftVersion}.`,
    };
  }

  if (patch.baseDraftHash !== currentDraftHash) {
    return {
      valid: false,
      code: 'HASH_MISMATCH',
      error: 'Base draft content hash does not match current draft state.',
    };
  }

  // Prototype pollution or protected field check
  if (isProtectedFieldPath(patch.fieldPath)) {
    return {
      valid: false,
      code: 'PROTECTED_FIELD_MODIFICATION',
      error: `Field path "${patch.fieldPath}" is protected and cannot be altered by optimization proposals.`,
      details: {
        isProtectedField: true,
        beforeMatches: false,
        containsForbiddenPlaceholder: false,
      },
    };
  }

  // Check for forbidden placeholders: [X]%, [Metric], etc.
  const placeholderRegex = /\[(X|\.{3}|insert|metric|placeholder|your|number)\]/i;
  if (placeholderRegex.test(patch.after)) {
    return {
      valid: false,
      code: 'FORBIDDEN_PLACEHOLDER',
      error: 'Proposed change contains placeholder tokens (e.g., [X]%). Placeholders are strictly forbidden in final drafts.',
      details: {
        isProtectedField: false,
        beforeMatches: false,
        containsForbiddenPlaceholder: true,
      },
    };
  }

  // Anchor check: verify that current resume has the exact "before" text
  const currentVal = getFieldValue(currentResume, patch.fieldPath, patch.entryId);
  if (currentVal === null) {
    return {
      valid: false,
      code: 'TARGET_FIELD_NOT_FOUND',
      error: `Target field "${patch.fieldPath}" (entry "${patch.entryId}") does not exist in the current draft.`,
      details: {
        isProtectedField: false,
        beforeMatches: false,
        containsForbiddenPlaceholder: false,
        currentValue: null,
      },
    };
  }

  if (currentVal.trim() !== patch.before.trim()) {
    return {
      valid: false,
      code: 'ANCHOR_BEFORE_MISMATCH',
      error: `Before text does not match current draft content. Expected: "${patch.before}", Found: "${currentVal}"`,
      details: {
        isProtectedField: false,
        beforeMatches: false,
        containsForbiddenPlaceholder: false,
        currentValue: currentVal,
      },
    };
  }

  // Safety status check
  if (patch.safetyStatus === 'BLOCKED') {
    return {
      valid: false,
      code: 'PATCH_BLOCKED',
      error: `Patch is marked BLOCKED for safety reasons: ${patch.reason}`,
      details: {
        isProtectedField: false,
        beforeMatches: true,
        containsForbiddenPlaceholder: false,
        currentValue: currentVal,
      },
    };
  }

  return {
    valid: true,
    details: {
      isProtectedField: false,
      beforeMatches: true,
      containsForbiddenPlaceholder: false,
      currentValue: currentVal,
    },
  };
}
