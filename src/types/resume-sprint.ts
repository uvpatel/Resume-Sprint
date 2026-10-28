// Canonical ResumeSprint Domain Types & Contracts

export type EvidenceStatus =
  | 'MATCHED'
  | 'SUPPORTED_MISSING'
  | 'NEEDS_CONFIRMATION'
  | 'UNSUPPORTED';

export interface Snapshot {
  sourceFileSha256: string;
  sourceVersion: number;
  draftVersion: number;
  draftHash: string;
  jdHash: string;
  rubricVersion: string;
  scorerVersion: string;
  promptVersion: string;
  evidenceVersion: number;
  atsVersion: number;
  templateVersion: string;
}

export interface Patch {
  changeId: string;
  entryId: string;
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

export interface Preservation {
  status: 'VALIDATED' | 'FAILED' | 'UNVERIFIED';
  totalFacts: number | null;
  preservedFacts: number | null;
  missingFactIds: string[];
  unresolvedFactIds: string[];
  alteredProtectedFields: string[];
  unsupportedClaimIds: string[];
  categoryCounts: Record<string, { original: number; returned: number }>;
  // Gated: Null unless complete source coverage and all facts resolved independently.
  contentPreservedPercentage: number | null;
  contentPreservedPercent?: number | null;
}

export interface ScoreBreakdown {
  keywordSkillMatch: number; // max 40
  roleTitleAlignment: number; // max 20
  quantifiedImpact: number; // max 20
  experienceDepth: number; // max 10
  formattingAtsReadability: number; // max 10
}

export interface Score {
  snapshot: Snapshot;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  status: 'CURRENT' | 'STALE';
  createdAt: string;
}

export interface DecisionRequest {
  operationId: string;
  baseDraftVersion: number;
  changeId: string;
  decision: 'accept' | 'reject' | 'edit' | 'undo';
  editedText?: string;
}

export interface ProgressEvent {
  id: string;
  sessionId: string;
  operationId: string;
  sequence: number;
  snapshot: Snapshot;
  stage: 'SAVING' | 'VALIDATING' | 'ESTIMATING' | 'SCORING' | 'READY' | 'FAILED';
  errorCode?: string;
}

export interface StandardErrorEnvelope {
  code: string;
  message: string;
  recoveryAction: string;
  operationId: string;
  retryable: boolean;
  currentVersion?: number;
}

// Canonical full ResumeData Schema
export interface BasicInfo {
  name: string;
  title?: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  github?: string;
  [key: string]: unknown;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
  [key: string]: unknown;
}

export interface EducationEntry {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  [key: string]: unknown;
}

export interface SkillEntry {
  id: string;
  name: string;
  category?: string;
  level?: string;
  [key: string]: unknown;
}

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  url?: string;
  technologies: string[];
  [key: string]: unknown;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  url?: string;
  [key: string]: unknown;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  [key: string]: unknown;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
  [key: string]: unknown;
}

export type HobbyItem = string | { id: string; name: string };

export interface CustomSection {
  id: string;
  title: string;
  items: unknown[];
  [key: string]: unknown;
}

export interface ResumeData {
  basicInfo: BasicInfo;
  summary: string;
  summaryAiEnabled: boolean;
  experience: ExperienceEntry[];
  educationEntries: EducationEntry[];
  skillEntries: SkillEntry[];
  projectEntries: ProjectEntry[];
  certificationEntries: CertificationEntry[];
  achievementEntries: AchievementEntry[];
  languageEntries: LanguageEntry[];
  hobbiesData: HobbyItem[];
  customSections: CustomSection[];
  [key: string]: unknown;
}

// Evidence and Provenance Layer Types
export interface SourceFact {
  factId: string;
  entryId: string;
  sourceSpanIds: string[];
  exactText: string;
  kind: 'NAME' | 'CONTACT' | 'TITLE' | 'COMPANY' | 'DATE' | 'METRIC' | 'SKILL' | 'EDUCATION' | 'LANGUAGE' | 'TEXT';
  protectedValues: Record<string, string>;
  roleScope?: string;
}

export interface SourceSpan {
  spanId: string;
  pageNumber: number;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface SourceCoverage {
  totalPages: number;
  processedPages: number;
  unmappedSpanIds: string[];
  unresolvedSpanIds: string[];
  complete: boolean;
}

export interface JobRequirement {
  id: string;
  text: string;
  category: string;
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: EvidenceStatus;
  factIds: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface UserEvidence {
  id: string;
  sessionId: string;
  requirementId: string;
  answer: string;
  roleScope: string;
  baseVersion: number;
  timestamp: string;
  userId: string;
}

// Scan Session and Jobs
export type EffectiveATS = 'Generic' | 'Workday' | 'Greenhouse' | 'Lever' | 'Taleo' | 'iCIMS';

export interface ScanSession {
  id: string;
  userId: string;
  sourceResumeId: string;
  sourceVersion: number;
  sourceFileSha256: string;
  sourceCoverage: SourceCoverage;
  sourceFacts: SourceFact[];
  sourceSpans: SourceSpan[];
  sourceResumeData: ResumeData;
  currentDraftVersion: number;
  currentDraftHash: string;
  currentResumeData: ResumeData;
  draftHistory: Array<{
    version: number;
    hash: string;
    resumeData: ResumeData;
    createdAt: string;
    reason: string;
    changeId?: string;
  }>;
  jd: string;
  jdHash: string;
  targetRole: string;
  effectiveATS: EffectiveATS;
  atsVersion: number;
  rubricVersion: string;
  scorerVersion: string;
  promptVersion: string;
  evidenceVersion: number;
  templateVersion: string;
  requirements: JobRequirement[];
  userEvidence: UserEvidence[];
  proposals: Patch[];
  rejectedProposalIds: string[];
  preservation?: Preservation;
  latestScore?: Score;
  state: 'INITIALIZED' | 'PROCESSING' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  jobId: string;
  sessionId: string;
  userId: string;
  type: 'SCORE' | 'EXPORT' | 'VALIDATION';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DISCARDED';
  progress: number;
  snapshot: Snapshot;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
  artifactUrl?: string;
  artifactExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportArtifact {
  artifactId: string;
  sessionId: string;
  userId: string;
  snapshot: Snapshot;
  format: 'pdf' | 'docx';
  fileName: string;
  fileBufferBase64: string;
  sha256: string;
  createdAt: string;
  expiresAt: string;
}

export interface IdempotencyRecord {
  key: string;
  userId: string;
  sessionId?: string;
  operationId: string;
  endpoint: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: string;
}
