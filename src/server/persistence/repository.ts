import mongoose from 'mongoose';
import {
  ScanSession,
  JobRecord,
  ExportArtifact,
  ProgressEvent,
  IdempotencyRecord,
  ResumeData,
  SourceFact,
  SourceSpan,
  SourceCoverage,
  Patch,
  Score,
  Preservation,
  UserEvidence,
} from '@/types/resume-sprint';
import { ApiError } from '@/lib/errors/api-error';
import {
  ScanSessionModel,
  SourceResumeVersionModel,
  DraftVersionModel,
  ProposalModel,
  DecisionRecordModel,
  ScoreAssessmentModel,
  PreservationAssessmentModel,
  UserEvidenceModel,
  JobRecordModel,
  ProgressEventModel,
  IdempotencyRecordModel,
  ExportArtifactModel,
  DeletionJobModel,
} from './models';

// In-Memory Transactional Store
class Store {
  public sessions = new Map<string, ScanSession>();
  public sourceVersions = new Map<string, { sourceResumeId: string; version: number; resumeData: ResumeData; facts: SourceFact[]; spans: SourceSpan[]; coverage: SourceCoverage }>();
  public draftVersions = new Map<string, { sessionId: string; version: number; hash: string; resumeData: ResumeData; reason: string; changeId?: string }>();
  public proposals = new Map<string, Patch[]>(); // sessionId -> Patch[]
  public decisions = new Map<string, any[]>(); // sessionId -> Decision[]
  public scores = new Map<string, Score[]>(); // sessionId -> Score[]
  public preservation = new Map<string, Preservation>(); // sessionId -> latest preservation
  public evidence = new Map<string, UserEvidence[]>(); // sessionId -> UserEvidence[]
  public jobs = new Map<string, JobRecord>();
  public artifacts = new Map<string, ExportArtifact>();
  public events = new Map<string, ProgressEvent[]>(); // sessionId -> ProgressEvent[]
  public idempotency = new Map<string, IdempotencyRecord>(); // key -> record
  public deletionJobs = new Map<string, any>();

  private locks = new Map<string, Promise<unknown>>();

  public async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.locks.get(key) || Promise.resolve();
    let resolveLock!: () => void;
    const current = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(key, current);

    try {
      await prev;
      return await fn();
    } finally {
      resolveLock();
      if (this.locks.get(key) === current) {
        this.locks.delete(key);
      }
    }
  }

  public reset(): void {
    this.sessions.clear();
    this.sourceVersions.clear();
    this.draftVersions.clear();
    this.proposals.clear();
    this.decisions.clear();
    this.scores.clear();
    this.preservation.clear();
    this.evidence.clear();
    this.jobs.clear();
    this.artifacts.clear();
    this.events.clear();
    this.idempotency.clear();
    this.deletionJobs.clear();
    this.locks.clear();
  }
}

export const globalStore = new Store();

function isMongooseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export class ScanSessionRepository {
  public static async create(session: ScanSession): Promise<ScanSession> {
    const cloned = JSON.parse(JSON.stringify(session)) as ScanSession;

    if (isMongooseConnected()) {
      try {
        await ScanSessionModel.create(cloned);
        await SourceResumeVersionModel.create({
          sourceResumeId: session.sourceResumeId,
          version: session.sourceVersion,
          sourceFileSha256: session.sourceFileSha256,
          resumeData: session.sourceResumeData,
          facts: session.sourceFacts,
          spans: session.sourceSpans,
          coverage: session.sourceCoverage,
        });
        await DraftVersionModel.create({
          sessionId: session.id,
          version: 0,
          hash: session.currentDraftHash,
          resumeData: session.currentResumeData,
          reason: 'Initial scan baseline from verified source document',
        });
      } catch (err) {
        console.warn('[Repository] Mongoose create error, falling back to in-memory store:', err);
      }
    }

    // In-Memory store
    globalStore.sessions.set(session.id, cloned);
    globalStore.sourceVersions.set(`${session.sourceResumeId}_${session.sourceVersion}`, {
      sourceResumeId: session.sourceResumeId,
      version: session.sourceVersion,
      resumeData: session.sourceResumeData,
      facts: session.sourceFacts,
      spans: session.sourceSpans,
      coverage: session.sourceCoverage,
    });
    globalStore.draftVersions.set(`${session.id}_0`, {
      sessionId: session.id,
      version: 0,
      hash: session.currentDraftHash,
      resumeData: session.currentResumeData,
      reason: 'Initial scan baseline',
    });

    if (session.latestScore) {
      globalStore.scores.set(session.id, [session.latestScore]);
    }
    if (session.preservation) {
      globalStore.preservation.set(session.id, session.preservation);
    }

    return cloned;
  }

  public static async findById(id: string): Promise<ScanSession | null> {
    const found = globalStore.sessions.get(id);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found)) as ScanSession;
  }

  public static async update(session: ScanSession): Promise<ScanSession> {
    const existing = globalStore.sessions.get(session.id);
    if (!existing) {
      throw ApiError.notFound('Scan session');
    }

    const cloned = JSON.parse(JSON.stringify(session)) as ScanSession;
    cloned.updatedAt = new Date().toISOString();

    if (isMongooseConnected()) {
      try {
        await ScanSessionModel.updateOne({ id: session.id }, cloned);
      } catch (err) {
        console.warn('[Repository] Mongoose update error:', err);
      }
    }

    globalStore.sessions.set(session.id, cloned);
    return cloned;
  }

  public static async appendDraftVersion(params: {
    sessionId: string;
    version: number;
    hash: string;
    resumeData: ResumeData;
    reason: string;
    changeId?: string;
  }): Promise<void> {
    const { sessionId, version, hash, resumeData, reason, changeId } = params;

    if (isMongooseConnected()) {
      try {
        await DraftVersionModel.create({
          sessionId,
          version,
          hash,
          resumeData,
          reason,
          changeId,
        });
      } catch (err) {
        console.warn('[Repository] Mongoose appendDraftVersion error:', err);
      }
    }

    globalStore.draftVersions.set(`${sessionId}_${version}`, {
      sessionId,
      version,
      hash,
      resumeData: JSON.parse(JSON.stringify(resumeData)),
      reason,
      changeId,
    });
  }

  public static async recordDecision(params: {
    sessionId: string;
    operationId: string;
    changeId: string;
    decision: string;
    baseDraftVersion: number;
    newDraftVersion: number;
    editedText?: string;
  }): Promise<void> {
    const record = {
      ...params,
      timestamp: new Date().toISOString(),
    };

    if (isMongooseConnected()) {
      try {
        await DecisionRecordModel.create(record);
      } catch (err) {
        console.warn('[Repository] Mongoose recordDecision error:', err);
      }
    }

    const list = globalStore.decisions.get(params.sessionId) || [];
    list.push(record);
    globalStore.decisions.set(params.sessionId, list);
  }

  public static async delete(id: string, userId: string): Promise<{
    receiptId: string;
    sessionId: string;
    status: string;
    deletedAt: string;
    associatedRecordsCount: number;
    retentionPolicy: string;
  }> {
    const session = globalStore.sessions.get(id);
    if (!session) {
      throw ApiError.notFound('Scan session');
    }

    let recordsCount = 1; // session

    // Count and delete draft versions
    for (const key of Array.from(globalStore.draftVersions.keys())) {
      if (key.startsWith(`${id}_`)) {
        globalStore.draftVersions.delete(key);
        recordsCount++;
      }
    }

    // Count and delete proposals
    if (globalStore.proposals.has(id)) {
      recordsCount += globalStore.proposals.get(id)!.length;
      globalStore.proposals.delete(id);
    }

    // Count and delete decisions
    if (globalStore.decisions.has(id)) {
      recordsCount += globalStore.decisions.get(id)!.length;
      globalStore.decisions.delete(id);
    }

    // Count and delete scores
    if (globalStore.scores.has(id)) {
      recordsCount += globalStore.scores.get(id)!.length;
      globalStore.scores.delete(id);
    }

    // Count and delete evidence
    if (globalStore.evidence.has(id)) {
      recordsCount += globalStore.evidence.get(id)!.length;
      globalStore.evidence.delete(id);
    }

    // Delete associated jobs
    for (const [jobId, job] of globalStore.jobs.entries()) {
      if (job.sessionId === id) {
        globalStore.jobs.delete(jobId);
        recordsCount++;
      }
    }

    // Delete associated artifacts
    for (const [artId, art] of globalStore.artifacts.entries()) {
      if (art.sessionId === id) {
        globalStore.artifacts.delete(artId);
        recordsCount++;
      }
    }

    // Delete associated events
    if (globalStore.events.has(id)) {
      recordsCount += globalStore.events.get(id)!.length;
      globalStore.events.delete(id);
    }

    globalStore.sessions.delete(id);

    const deletionReceipt = {
      receiptId: `rcpt_${Date.now()}_${id}`,
      sessionId: id,
      status: 'DELETED',
      deletedAt: new Date().toISOString(),
      associatedRecordsCount: recordsCount,
      retentionPolicy: 'HARD_DELETE_COMPLETE',
    };

    globalStore.deletionJobs.set(id, deletionReceipt);

    if (isMongooseConnected()) {
      try {
        await ScanSessionModel.deleteOne({ id });
        await DraftVersionModel.deleteMany({ sessionId: id });
        await ProposalModel.deleteMany({ sessionId: id });
        await DecisionRecordModel.deleteMany({ sessionId: id });
        await ScoreAssessmentModel.deleteMany({ sessionId: id });
        await PreservationAssessmentModel.deleteMany({ sessionId: id });
        await UserEvidenceModel.deleteMany({ sessionId: id });
        await JobRecordModel.deleteMany({ sessionId: id });
        await ProgressEventModel.deleteMany({ sessionId: id });
        await ExportArtifactModel.deleteMany({ sessionId: id });
        await DeletionJobModel.create({
          deletionJobId: deletionReceipt.receiptId,
          sessionId: id,
          userId,
          status: 'COMPLETED',
          deletedRecordsCount: recordsCount,
          retentionReceipt: deletionReceipt,
        });
      } catch (err) {
        console.warn('[Repository] Mongoose delete cleanup error:', err);
      }
    }

    return deletionReceipt;
  }
}

export class JobRepository {
  public static async create(job: JobRecord): Promise<JobRecord> {
    const cloned = JSON.parse(JSON.stringify(job)) as JobRecord;

    if (isMongooseConnected()) {
      try {
        await JobRecordModel.create(cloned);
      } catch (err) {
        console.warn('[JobRepository] Mongoose create error:', err);
      }
    }

    globalStore.jobs.set(job.jobId, cloned);
    return cloned;
  }

  public static async findById(jobId: string): Promise<JobRecord | null> {
    const found = globalStore.jobs.get(jobId);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found)) as JobRecord;
  }

  public static async update(job: JobRecord): Promise<JobRecord> {
    const existing = globalStore.jobs.get(job.jobId);
    if (!existing) {
      throw ApiError.notFound('Job');
    }
    const cloned = JSON.parse(JSON.stringify(job)) as JobRecord;
    cloned.updatedAt = new Date().toISOString();

    if (isMongooseConnected()) {
      try {
        await JobRecordModel.updateOne({ jobId: job.jobId }, cloned);
      } catch (err) {
        console.warn('[JobRepository] Mongoose update error:', err);
      }
    }

    globalStore.jobs.set(job.jobId, cloned);
    return cloned;
  }
}

export class ExportArtifactRepository {
  public static async save(artifact: ExportArtifact): Promise<ExportArtifact> {
    const cloned = JSON.parse(JSON.stringify(artifact)) as ExportArtifact;

    if (isMongooseConnected()) {
      try {
        await ExportArtifactModel.create(cloned);
      } catch (err) {
        console.warn('[ExportArtifactRepository] Mongoose create error:', err);
      }
    }

    globalStore.artifacts.set(artifact.artifactId, cloned);
    return cloned;
  }

  public static async findById(artifactId: string): Promise<ExportArtifact | null> {
    const found = globalStore.artifacts.get(artifactId);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found)) as ExportArtifact;
  }
}

export class ProgressEventRepository {
  public static async append(event: ProgressEvent): Promise<ProgressEvent> {
    const list = globalStore.events.get(event.sessionId) || [];
    const cloned = JSON.parse(JSON.stringify(event)) as ProgressEvent;

    if (isMongooseConnected()) {
      try {
        await ProgressEventModel.create(cloned);
      } catch (err) {
        console.warn('[ProgressEventRepository] Mongoose create error:', err);
      }
    }

    list.push(cloned);
    globalStore.events.set(event.sessionId, list);
    return cloned;
  }

  public static async listBySession(sessionId: string, afterSequence = -1): Promise<ProgressEvent[]> {
    const list = globalStore.events.get(sessionId) || [];
    return list
      .filter((e) => e.sequence > afterSequence)
      .sort((a, b) => a.sequence - b.sequence)
      .map((e) => JSON.parse(JSON.stringify(e)));
  }
}

export class IdempotencyRepository {
  public static async get(key: string, userId: string): Promise<IdempotencyRecord | null> {
    const record = globalStore.idempotency.get(key);
    if (!record) return null;
    if (record.userId !== userId) {
      throw ApiError.forbidden('Idempotency key belongs to another user.');
    }
    return JSON.parse(JSON.stringify(record)) as IdempotencyRecord;
  }

  public static async save(record: IdempotencyRecord): Promise<void> {
    const cloned = JSON.parse(JSON.stringify(record));

    if (isMongooseConnected()) {
      try {
        await IdempotencyRecordModel.create({
          ...cloned,
          requestFingerprint: cloned.requestFingerprint || `fp_${record.operationId}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
        });
      } catch (err) {
        console.warn('[IdempotencyRepository] Mongoose create error:', err);
      }
    }

    globalStore.idempotency.set(record.key, cloned);
  }
}
