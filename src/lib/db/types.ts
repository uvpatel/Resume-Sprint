export type EvidenceStatus = 'MATCHED' | 'SUPPORTED_MISSING' | 'NEEDS_CONFIRMATION' | 'UNSUPPORTED';

export interface ScoreBreakdown {
  keywordSkillMatch: number; // max 40
  roleTitleAlignment: number; // max 20
  quantifiedImpact: number; // max 20
  experienceDepth: number; // max 10
  formattingAtsReadability: number; // max 10
}

export interface RequirementEvidence {
  requirementId: string;
  requirement: string;
  status: EvidenceStatus;
  importance: 'high' | 'medium' | 'low';
  sourceSpanIds: string[];
  sourceFactIds: string[];
  explanation: string;
}

export interface Fact {
  factId: string;
  entryId: string;
  section: string;
  exactText: string;
  kind: 'role' | 'bullet' | 'skill' | 'education' | 'metric' | 'summary' | 'other';
  protectedValues?: string[];
}

export interface ResumeBlock {
  id: string;
  section: string;
  text: string;
}

export interface SourceCoverage {
  totalPages: number;
  processedPages: number;
  complete: boolean;
  unmappedSpanIds?: string[];
  unresolvedSpanIds?: string[];
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ResumeRecord {
  id: string;
  userId: string;
  originalFileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileSize: number;
  rawText: string;
  blocks: ResumeBlock[];
  facts: Fact[];
  sourceCoverage: SourceCoverage;
  sourceFileSha256: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatchProposal {
  changeId: string;
  blockId: string;
  fieldPath: string;
  before: string;
  after: string;
  baseDraftVersion: number;
  baseDraftHash: string;
  sourceFactIds: string[];
  sourceSpanIds: string[];
  requirementIds: string[];
  reason: string;
  confidence: number;
  safetyStatus: 'SUPPORTED' | 'BLOCKED' | 'REVIEW_REQUIRED';
  contentRisk: 'low' | 'medium' | 'high';
  forecastImpact: number | null;
}

export interface TopImprovement {
  id: string;
  title: string;
  category: string;
  description: string;
  impactScore?: number;
}

export interface ScanRecord {
  id: string;
  resumeId: string;
  userId: string;
  targetRole: string;
  jobDescription: string;
  jobDescriptionHash: string;
  rubricVersion: string;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  componentReasons: Record<string, string>;
  requirements: RequirementEvidence[];
  matchedKeywords: string[];
  missingKeywords: string[];
  unsupportedMissingKeywords: string[];
  topImprovements: TopImprovement[];
  contentRisk: 'low' | 'medium' | 'high';
  parsingWarnings: string[];
  targetForecast: number | null;
  status: 'CURRENT' | 'STALE';
  createdAt: string;
}

export interface LedgerEntry {
  event: string;
  version: number;
  time: string;
  details?: Record<string, unknown>;
}

export interface PreservationResult {
  status: 'VALIDATED' | 'FAILED' | 'UNVERIFIED';
  totalFacts: number | null;
  preservedFacts: number | null;
  missingFactIds: string[];
  unresolvedFactIds: string[];
  alteredProtectedFields: string[];
  unsupportedClaimIds: string[];
  categoryCounts: Record<string, { original: number; returned: number }>;
  contentPreservedPercent: number | null;
  valid: boolean;
}

export interface OptimizationRecord {
  id: string;
  resumeId: string;
  scanId: string;
  userId: string;
  currentDraftVersion: number;
  currentDraftHash: string;
  draftBlocks: ResumeBlock[];
  proposals: PatchProposal[];
  decisions: Record<string, 'accepted' | 'rejected' | 'edited' | 'undone' | 'pending'>;
  editedTexts: Record<string, string>;
  ledger: LedgerEntry[];
  preservation: PreservationResult;
  finalScore: {
    score: number;
    scoreBreakdown: ScoreBreakdown;
    version: number;
    ats: string;
    createdAt: string;
  } | null;
  atsProfile: string;
  createdAt: string;
  updatedAt: string;
}
