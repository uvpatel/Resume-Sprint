// Bun compatibility polyfill for bson v8 startup snapshot check
if (typeof process !== "undefined" && typeof (process as any).getBuiltinModule === "function") {
  try {
    const v8 = (process as any).getBuiltinModule("v8");
    if (v8) {
      v8.startupSnapshot = { isBuildingSnapshot: () => false };
    }
  } catch {}
}

import mongoose, { Schema } from 'mongoose';

// 1. Scan Sessions
const ScanSessionSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  sourceResumeId: { type: String, required: true, index: true },
  sourceVersion: { type: Number, required: true },
  sourceFileSha256: { type: String, required: true },
  sourceCoverage: { type: Schema.Types.Mixed, required: true },
  currentDraftVersion: { type: Number, required: true },
  currentDraftHash: { type: String, required: true },
  jd: { type: String, required: true },
  jdHash: { type: String, required: true },
  targetRole: { type: String, required: true },
  effectiveATS: { type: String, default: 'Generic' },
  atsVersion: { type: Number, default: 1 },
  rubricVersion: { type: String, default: 'v1.0.0' },
  scorerVersion: { type: String, default: 'v1.0.0' },
  promptVersion: { type: String, default: 'vNext' },
  evidenceVersion: { type: Number, default: 1 },
  templateVersion: { type: String, default: 'clean-v1' },
  requirements: { type: [Schema.Types.Mixed], default: [] },
  rejectedProposalIds: { type: [String], default: [] },
  state: { type: String, default: 'ACTIVE' },
}, { timestamps: true });

ScanSessionSchema.index({ userId: 1, createdAt: -1 });

// 2. Immutable Source Resume Versions
const SourceResumeVersionSchema = new Schema({
  sourceResumeId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  sourceFileSha256: { type: String, required: true },
  resumeData: { type: Schema.Types.Mixed, required: true },
  facts: { type: [Schema.Types.Mixed], default: [] },
  spans: { type: [Schema.Types.Mixed], default: [] },
  coverage: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

SourceResumeVersionSchema.index({ sourceResumeId: 1, version: 1 }, { unique: true });

// 3. Immutable Draft Resume Versions (Monotonically increasing per session)
const DraftVersionSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  hash: { type: String, required: true },
  resumeData: { type: Schema.Types.Mixed, required: true },
  reason: { type: String, default: '' },
  changeId: { type: String },
}, { timestamps: true });

DraftVersionSchema.index({ sessionId: 1, version: 1 }, { unique: true });

// 4. Proposals (Anchored to draft)
const ProposalSchema = new Schema({
  changeId: { type: String, required: true },
  sessionId: { type: String, required: true, index: true },
  entryId: { type: String, required: true },
  fieldPath: { type: String, required: true },
  before: { type: String, required: true },
  after: { type: String, required: true },
  baseDraftVersion: { type: Number, required: true },
  baseDraftHash: { type: String, required: true },
  sourceFactIds: { type: [String], default: [] },
  sourceSpanIds: { type: [String], default: [] },
  requirementIds: { type: [String], default: [] },
  reason: { type: String, required: true },
  confidence: { type: Number, required: true },
  safetyStatus: { type: String, required: true },
  contentRisk: { type: String, required: true },
  forecastImpact: { type: Number, default: null },
}, { timestamps: true });

ProposalSchema.index({ sessionId: 1, changeId: 1 }, { unique: true });

// 5. Decision History
const DecisionRecordSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  operationId: { type: String, required: true, index: true },
  changeId: { type: String, required: true },
  decision: { type: String, required: true }, // accept, reject, edit, undo
  baseDraftVersion: { type: Number, required: true },
  newDraftVersion: { type: Number, required: true },
  editedText: { type: String },
  timestamp: { type: String, required: true },
}, { timestamps: true });

DecisionRecordSchema.index({ sessionId: 1, operationId: 1 });

// 6. Score Assessments (Immutable with snapshot)
const ScoreAssessmentSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  score: { type: Number, required: true },
  scoreBreakdown: { type: Schema.Types.Mixed, required: true },
  status: { type: String, required: true, default: 'CURRENT' }, // CURRENT, STALE
}, { timestamps: true });

ScoreAssessmentSchema.index({ sessionId: 1, createdAt: -1 });

// 7. Preservation Assessments
const PreservationAssessmentSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  draftVersion: { type: Number, required: true },
  draftHash: { type: String, required: true },
  status: { type: String, required: true },
  totalFacts: { type: Number, default: null },
  preservedFacts: { type: Number, default: null },
  missingFactIds: { type: [String], default: [] },
  unresolvedFactIds: { type: [String], default: [] },
  alteredProtectedFields: { type: [String], default: [] },
  unsupportedClaimIds: { type: [String], default: [] },
  categoryCounts: { type: Schema.Types.Mixed, required: true },
  contentPreservedPercentage: { type: Number, default: null },
}, { timestamps: true });

PreservationAssessmentSchema.index({ sessionId: 1, draftVersion: 1 });

// 8. User Evidence
const UserEvidenceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: String, required: true, index: true },
  requirementId: { type: String, required: true },
  answer: { type: String, required: true },
  roleScope: { type: String, default: '' },
  baseVersion: { type: Number, required: true },
  userId: { type: String, required: true },
  timestamp: { type: String, required: true },
}, { timestamps: true });

// 9. Background Jobs (Durable with retry, timeout, leases)
const JobRecordSchema = new Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true }, // SCORE, EXPORT, VALIDATION
  status: { type: String, required: true, index: true }, // QUEUED, RUNNING, COMPLETED, FAILED, DISCARDED
  progress: { type: Number, default: 0 },
  snapshot: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed },
  error: { type: Schema.Types.Mixed },
  artifactUrl: { type: String },
  artifactExpiresAt: { type: String },
  leaseExpiresAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
}, { timestamps: true });

JobRecordSchema.index({ status: 1, createdAt: 1 });

// 10. Progress Events (Monotonic sequence per operation / session)
const ProgressEventSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  operationId: { type: String, required: true },
  sequence: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  stage: { type: String, required: true },
  errorCode: { type: String },
}, { timestamps: true });

ProgressEventSchema.index({ sessionId: 1, sequence: 1 }, { unique: true });

// 11. Idempotency Records
const IdempotencyRecordSchema = new Schema({
  key: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String },
  operationId: { type: String, required: true },
  requestFingerprint: { type: String, required: true },
  endpoint: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseBody: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
}, { timestamps: true });

IdempotencyRecordSchema.index({ key: 1, userId: 1 }, { unique: true });

// 12. Export Artifacts
const ExportArtifactSchema = new Schema({
  artifactId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
  format: { type: String, required: true },
  fileName: { type: String, required: true },
  fileBufferBase64: { type: String, required: true },
  sha256: { type: String, required: true },
  expiresAt: { type: String, required: true },
}, { timestamps: true });

// 13. Deletion Jobs
const DeletionJobSchema = new Schema({
  deletionJobId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: { type: String, required: true, default: 'COMPLETED' }, // QUEUED, IN_PROGRESS, COMPLETED, FAILED
  deletedRecordsCount: { type: Number, default: 0 },
  retentionReceipt: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const ScanSessionModel = mongoose.models.ScanSession || mongoose.model('ScanSession', ScanSessionSchema);
export const SourceResumeVersionModel = mongoose.models.SourceResumeVersion || mongoose.model('SourceResumeVersion', SourceResumeVersionSchema);
export const DraftVersionModel = mongoose.models.DraftVersion || mongoose.model('DraftVersion', DraftVersionSchema);
export const ProposalModel = mongoose.models.Proposal || mongoose.model('Proposal', ProposalSchema);
export const DecisionRecordModel = mongoose.models.DecisionRecord || mongoose.model('DecisionRecord', DecisionRecordSchema);
export const ScoreAssessmentModel = mongoose.models.ScoreAssessment || mongoose.model('ScoreAssessment', ScoreAssessmentSchema);
export const PreservationAssessmentModel = mongoose.models.PreservationAssessment || mongoose.model('PreservationAssessment', PreservationAssessmentSchema);
export const UserEvidenceModel = mongoose.models.UserEvidence || mongoose.model('UserEvidence', UserEvidenceSchema);
export const JobRecordModel = mongoose.models.JobRecord || mongoose.model('JobRecord', JobRecordSchema);
export const ProgressEventModel = mongoose.models.ProgressEvent || mongoose.model('ProgressEvent', ProgressEventSchema);
export const IdempotencyRecordModel = mongoose.models.IdempotencyRecord || mongoose.model('IdempotencyRecord', IdempotencyRecordSchema);
export const ExportArtifactModel = mongoose.models.ExportArtifact || mongoose.model('ExportArtifact', ExportArtifactSchema);
export const DeletionJobModel = mongoose.models.DeletionJob || mongoose.model('DeletionJob', DeletionJobSchema);
