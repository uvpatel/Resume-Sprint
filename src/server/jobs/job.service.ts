import crypto from 'node:crypto';
import { JobRecord, Snapshot } from '@/types/resume-sprint';
import { JobRepository, ScanSessionRepository } from '@/server/persistence/repository';
import { SnapshotService } from '@/server/scoring/snapshot.service';
import { ScoreService } from '@/server/scoring/score.service';
import { EventService } from '@/server/events/event.service';
import { ExportService } from '@/server/exports/export.service';

export class JobService {
  public static async createScoreJob(params: {
    sessionId: string;
    userId: string;
    snapshot: Snapshot;
    operationId?: string;
  }): Promise<JobRecord> {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const opId = params.operationId || `op_${jobId}`;

    const job: JobRecord = {
      jobId,
      sessionId: params.sessionId,
      userId: params.userId,
      type: 'SCORE',
      status: 'QUEUED',
      progress: 0,
      snapshot: params.snapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await JobRepository.create(job);

    // Run async background processing
    queueMicrotask(() => {
      this.processScoreJob(jobId, opId).catch((err) => {
        console.error(`[JobService] Background job ${jobId} failed:`, err);
      });
    });

    return job;
  }

  public static async createExportJob(params: {
    sessionId: string;
    userId: string;
    snapshot: Snapshot;
    format: 'pdf' | 'docx';
    operationId?: string;
  }): Promise<JobRecord> {
    const jobId = `job_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const opId = params.operationId || `op_${jobId}`;

    const job: JobRecord = {
      jobId,
      sessionId: params.sessionId,
      userId: params.userId,
      type: 'EXPORT',
      status: 'QUEUED',
      progress: 0,
      snapshot: params.snapshot,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await JobRepository.create(job);

    queueMicrotask(() => {
      this.processExportJob(jobId, params.format, opId).catch((err) => {
        console.error(`[JobService] Background export job ${jobId} failed:`, err);
      });
    });

    return job;
  }

  private static async processScoreJob(jobId: string, operationId: string): Promise<void> {
    const job = await JobRepository.findById(jobId);
    if (!job) return;

    try {
      job.status = 'RUNNING';
      job.progress = 20;
      await JobRepository.update(job);

      const session = await ScanSessionRepository.findById(job.sessionId);
      if (!session) {
        throw new Error('Session not found during background rescore');
      }

      // Progress event: VALIDATING
      await EventService.recordAndEmit({
        sessionId: job.sessionId,
        operationId,
        stage: 'VALIDATING',
        snapshot: job.snapshot,
      });

      // Check snapshot freshness: if draft changed since job creation, discard
      const currentSnapshot = SnapshotService.buildSnapshot(session);
      if (currentSnapshot.draftHash !== job.snapshot.draftHash || currentSnapshot.draftVersion !== job.snapshot.draftVersion) {
        job.status = 'DISCARDED';
        job.progress = 100;
        job.error = {
          code: 'SUPERSEDED_SNAPSHOT',
          message: 'Draft changed during score processing. Obsolete score discarded.',
        };
        await JobRepository.update(job);
        return;
      }

      // Progress event: SCORING
      await EventService.recordAndEmit({
        sessionId: job.sessionId,
        operationId,
        stage: 'SCORING',
        snapshot: job.snapshot,
      });

      // Calculate score
      const score = ScoreService.calculateScore({
        resume: session.currentResumeData,
        jd: session.jd,
        targetRole: session.targetRole,
        requirements: session.requirements,
        effectiveATS: session.effectiveATS,
        snapshot: currentSnapshot,
      });

      // Revalidate before commit
      const freshSession = await ScanSessionRepository.findById(job.sessionId);
      if (!freshSession) return;
      const finalSnapshot = SnapshotService.buildSnapshot(freshSession);

      if (finalSnapshot.draftHash !== job.snapshot.draftHash || finalSnapshot.draftVersion !== job.snapshot.draftVersion) {
        job.status = 'DISCARDED';
        job.progress = 100;
        await JobRepository.update(job);
        return;
      }

      freshSession.latestScore = score;
      await ScanSessionRepository.update(freshSession);

      job.status = 'COMPLETED';
      job.progress = 100;
      job.result = score;
      await JobRepository.update(job);

      // Progress event: READY
      await EventService.recordAndEmit({
        sessionId: job.sessionId,
        operationId,
        stage: 'READY',
        snapshot: finalSnapshot,
      });
    } catch (err) {
      job.status = 'FAILED';
      job.progress = 100;
      job.error = {
        code: 'SCORING_FAILED',
        message: err instanceof Error ? err.message : 'Scoring failed',
      };
      await JobRepository.update(job);

      await EventService.recordAndEmit({
        sessionId: job.sessionId,
        operationId,
        stage: 'FAILED',
        snapshot: job.snapshot,
        errorCode: 'SCORING_FAILED',
      });
    }
  }

  private static async processExportJob(jobId: string, format: 'pdf' | 'docx', operationId: string): Promise<void> {
    const job = await JobRepository.findById(jobId);
    if (!job) return;

    try {
      job.status = 'RUNNING';
      job.progress = 30;
      await JobRepository.update(job);

      const session = await ScanSessionRepository.findById(job.sessionId);
      if (!session) {
        throw new Error('Session not found during export processing');
      }

      const artifact = await ExportService.generateArtifact({
        session,
        format,
        snapshot: job.snapshot,
      });

      const artifactUrl = `/api/v1/jobs/${job.jobId}?download=true`;

      job.status = 'COMPLETED';
      job.progress = 100;
      job.artifactUrl = artifactUrl;
      job.artifactExpiresAt = artifact.expiresAt;
      job.result = {
        artifactId: artifact.artifactId,
        fileName: artifact.fileName,
        sha256: artifact.sha256,
      };
      await JobRepository.update(job);
    } catch (err) {
      job.status = 'FAILED';
      job.progress = 100;
      job.error = {
        code: 'EXPORT_FAILED',
        message: err instanceof Error ? err.message : 'Export generation failed',
      };
      await JobRepository.update(job);
    }
  }
}
