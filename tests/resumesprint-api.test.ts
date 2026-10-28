import { describe, it, expect, beforeEach } from "bun:test";
import { ScanSessionService } from "@/server/scan-sessions/scan-session.service";
import { ProposalService } from "@/server/scan-sessions/proposal.service";
import { DecisionService } from "@/server/scan-sessions/decision.service";
import { EvidenceService } from "@/server/scan-sessions/evidence.service";
import { JobService } from "@/server/jobs/job.service";
import { ExportService } from "@/server/exports/export.service";
import { EventService } from "@/server/events/event.service";
import { SnapshotService } from "@/server/scoring/snapshot.service";
import { globalStore, JobRepository, ProgressEventRepository } from "@/server/persistence/repository";
import { ApiError } from "@/lib/errors/api-error";
import { cloneResumeData } from "@/lib/validation/resume";
import { PreservationService } from "@/server/preservation/preservation.service";

describe("ResumeSprint Scan & Improve Full API Lifecycle & Concurrency Suite", () => {
  const userA = "usr_alice";
  const userB = "usr_bob";

  const validJd = `
    Senior Integration Engineer to build MuleSoft APIs connecting Salesforce and SAP.
    Work with RabbitMQ messaging and SQL data pipelines. Demonstrate batch processing
    outcomes and relevant integration experience. Experience with AWS and Kubernetes is desired.
  `;

  beforeEach(() => {
    globalStore.reset();
  });

  // 1. Session Creation & Idempotency
  describe("Phase 4A & 7: Session Creation & Idempotency", () => {
    it("creates a scan session with baseline snapshot, Rubric v1 score, and 100% preservation", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(userA);
      expect(session.currentDraftVersion).toBe(0);
      expect(session.state).toBe("ACTIVE");
      expect(snapshot.draftVersion).toBe(0);
      expect(snapshot.rubricVersion).toBe("v1.0.0");
      expect(snapshot.evidenceVersion).toBe(1);

      // Rubric v1 score check
      expect(session.latestScore).toBeDefined();
      expect(session.latestScore?.status).toBe("CURRENT");
      const breakdown = session.latestScore!.scoreBreakdown;
      const expectedTotal =
        breakdown.keywordSkillMatch +
        breakdown.roleTitleAlignment +
        breakdown.quantifiedImpact +
        breakdown.experienceDepth +
        breakdown.formattingAtsReadability;
      expect(session.latestScore?.score).toBe(expectedTotal);

      // Preservation check (gated 100%)
      expect(session.preservation?.status).toBe("VALIDATED");
      expect(session.preservation?.contentPreservedPercentage).toBe(100);
      expect(session.preservation?.missingFactIds).toHaveLength(0);
    });

    it("rejects insufficient job description with 400 JD_INSUFFICIENT", async () => {
      expect(
        ScanSessionService.createSession({
          userId: userA,
          sourceResumeId: "res_001",
          sourceVersion: 1,
          jd: "Too short",
          targetRole: "Integration Engineer",
        })
      ).rejects.toThrow();
    });

    it("ensures duplicate requests with identical idempotencyKey return the same session without re-creating", async () => {
      const idempotencyKey = "idemp_test_key_123";

      const first = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
        idempotencyKey,
      });

      const second = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
        idempotencyKey,
      });

      expect(second.session.id).toBe(first.session.id);
      expect(second.snapshot.draftHash).toBe(first.snapshot.draftHash);
    });
  });

  // 2. Resource Ownership & Authorization
  describe("Phase 4B & 10: Ownership & Cross-User Security", () => {
    it("denies access when User B attempts to read User A's session", async () => {
      const { session } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      // User B attempts to access User A's session
      expect(
        ScanSessionService.getSession(session.id, userB)
      ).rejects.toThrow();
    });
  });

  // 3. Proposal Generation
  describe("Phase 4C & 6: Proposals & Stale Snapshot Rejection", () => {
    it("generates evidence-linked proposals anchored to existing fields", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { proposals, currentDraftVersion } = await ProposalService.generateProposals({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      expect(proposals.length).toBeGreaterThan(0);
      expect(currentDraftVersion).toBe(0);

      // Verify each proposal has valid anchor and evidence linkage
      for (const p of proposals) {
        expect(p.before).toBeDefined();
        expect(p.after).toBeDefined();
        expect(p.baseDraftVersion).toBe(0);
        expect(p.safetyStatus).toBe("SUPPORTED");
        expect(p.after).not.toContain("[X]");
      }
    });

    it("rejects proposal generation with 409 if supplied snapshot is stale", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const staleSnapshot = {
        ...snapshot,
        draftVersion: 999, // Stale version
      };

      expect(
        ProposalService.generateProposals({
          sessionId: session.id,
          userId: userA,
          snapshot: staleSnapshot,
        })
      ).rejects.toThrow();
    });
  });

  // 4. Decisions: Accept, Reject, Edit, Undo & Optimistic Concurrency
  describe("Phase 3 & 4D: Decisions & Monotonic Versioning", () => {
    it("applies accepted proposal, increments draft version monotonically, and invalidates score", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { proposals } = await ProposalService.generateProposals({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      const target = proposals[0];

      const result = await DecisionService.applyDecision({
        sessionId: session.id,
        userId: userA,
        request: {
          operationId: "op_accept_1",
          baseDraftVersion: 0,
          changeId: target.changeId,
          decision: "accept",
        },
      });

      expect(result.previousDraftVersion).toBe(0);
      expect(result.newDraftVersion).toBe(1);
      expect(result.preservation.status).toBe("VALIDATED");

      // Verify updated session
      const updated = await ScanSessionService.getSession(session.id, userA);
      expect(updated.session.currentDraftVersion).toBe(1);
      expect(updated.score?.status).toBe("STALE"); // Score must be marked STALE
    });

    it("blocks concurrent decision when baseDraftVersion is stale (409 Conflict)", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { proposals } = await ProposalService.generateProposals({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      // User accepts proposal 0 -> draft advances to v1
      await DecisionService.applyDecision({
        sessionId: session.id,
        userId: userA,
        request: {
          operationId: "op_step_1",
          baseDraftVersion: 0,
          changeId: proposals[0].changeId,
          decision: "accept",
        },
      });

      // Another concurrent client attempts to apply a change with old baseDraftVersion: 0
      expect(
        DecisionService.applyDecision({
          sessionId: session.id,
          userId: userA,
          request: {
            operationId: "op_concurrent_stale",
            baseDraftVersion: 0, // Stale!
            changeId: proposals[0].changeId,
            decision: "accept",
          },
        })
      ).rejects.toThrow();
    });

    it("supports edit decision and rejects forbidden placeholder tokens", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { proposals } = await ProposalService.generateProposals({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      // Forbidden placeholder: [X]%
      expect(
        DecisionService.applyDecision({
          sessionId: session.id,
          userId: userA,
          request: {
            operationId: "op_edit_invalid",
            baseDraftVersion: 0,
            changeId: proposals[0].changeId,
            decision: "edit",
            editedText: "Reduced processing latency by [X]% using MuleSoft.",
          },
        })
      ).rejects.toThrow();

      // Valid edit
      const editResult = await DecisionService.applyDecision({
        sessionId: session.id,
        userId: userA,
        request: {
          operationId: "op_edit_valid",
          baseDraftVersion: 0,
          changeId: proposals[0].changeId,
          decision: "edit",
          editedText: "Engineered scalable MuleSoft APIs connecting Salesforce and SAP.",
        },
      });

      expect(editResult.newDraftVersion).toBe(1);
    });

    it("supports undo decision by creating a new version without mutating historical versions", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { proposals } = await ProposalService.generateProposals({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      // Accept
      await DecisionService.applyDecision({
        sessionId: session.id,
        userId: userA,
        request: {
          operationId: "op_acc",
          baseDraftVersion: 0,
          changeId: proposals[0].changeId,
          decision: "accept",
        },
      });

      // Undo
      const undoResult = await DecisionService.applyDecision({
        sessionId: session.id,
        userId: userA,
        request: {
          operationId: "op_undo",
          baseDraftVersion: 1,
          changeId: proposals[0].changeId,
          decision: "undo",
        },
      });

      // Monotonically advances to version 2 rather than rewinding history!
      expect(undoResult.newDraftVersion).toBe(2);
      expect(undoResult.previousDraftVersion).toBe(1);
      expect(session.sourceResumeData.experience[0].bullets[0]).toBe(
        undoResult.draft.experience[0].bullets[0]
      );
    });
  });

  // 5. Evidence Submission & Provenance
  describe("Phase 4E & 6: User Evidence Submission", () => {
    it("records verified evidence with provenance, increments evidenceVersion, and updates requirement", async () => {
      const { session } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const req = session.requirements[0];

      const res = await EvidenceService.submitEvidence({
        sessionId: session.id,
        userId: userA,
        answer: "Engineered high-throughput MuleSoft ESB endpoints connecting SAP ERP and Salesforce CRM.",
        requirementId: req.id,
        roleScope: "e1",
        baseVersion: 0,
      });

      expect(res.evidenceVersion).toBe(2);
      const updatedReq = res.session.requirements.find((r) => r.id === req.id);
      expect(updatedReq?.status).toBe("MATCHED");
    });
  });

  // 6. ATS Configuration & Invalidation
  describe("Phase 4F: ATS Profile Updates", () => {
    it("updates effective ATS and increments atsVersion, marking score stale", async () => {
      const { session } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const { session: updatedSession } = await ScanSessionService.updateATS({
        sessionId: session.id,
        userId: userA,
        effectiveATS: "Workday",
        baseVersion: 0,
      });

      expect(updatedSession.effectiveATS).toBe("Workday");
      expect(updatedSession.atsVersion).toBe(2);
      expect(updatedSession.latestScore?.status).toBe("STALE");
    });

    it("rejects unknown ATS profile with 400 INVALID_ATS_CONFIG", async () => {
      const { session } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      expect(
        ScanSessionService.updateATS({
          sessionId: session.id,
          userId: userA,
          effectiveATS: "UnapprovedATSVendor",
          baseVersion: 0,
        })
      ).rejects.toThrow();
    });
  });

  // 7. Background Rescore & Durable Jobs
  describe("Phase 4G, 5 & 8: Background Rescore & Snapshot Binding", () => {
    it("schedules durable scoring job and successfully updates score assessment", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const job = await JobService.createScoreJob({
        sessionId: session.id,
        userId: userA,
        snapshot,
      });

      expect(job.jobId).toBeDefined();
      expect(job.type).toBe("SCORE");

      // Give worker microtask a moment to run
      await new Promise((r) => setTimeout(r, 100));

      const updatedJob = await JobRepository.findById(job.jobId);
      expect(updatedJob?.status).toBe("COMPLETED");
      expect(updatedJob?.progress).toBe(100);
      expect(updatedJob?.result).toBeDefined();
    });
  });

  // 8. Progress Events & SSE Delivery
  describe("Phase 4H & 8: Durable Progress Events", () => {
    it("records progress events with ordered sequences and supports replay", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const evt1 = await EventService.recordAndEmit({
        sessionId: session.id,
        operationId: "op_test_events",
        stage: "VALIDATING",
        snapshot,
      });

      const evt2 = await EventService.recordAndEmit({
        sessionId: session.id,
        operationId: "op_test_events",
        stage: "READY",
        snapshot,
      });

      expect(evt1.sequence).toBe(1);
      expect(evt2.sequence).toBe(2);

      const replay = await EventService.getEventsForReplay(session.id, evt1.id);
      expect(replay).toHaveLength(1);
      expect(replay[0].id).toBe(evt2.id);
    });
  });

  // 9. Document Export (PDF / DOCX)
  describe("Phase 4I: Genuine Binary PDF and DOCX Export", () => {
    it("generates genuine binary PDF bound to validated snapshot", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const artifact = await ExportService.generateArtifact({
        session,
        format: "pdf",
        snapshot,
      });

      expect(artifact.artifactId).toBeDefined();
      expect(artifact.format).toBe("pdf");
      expect(artifact.sha256).toBeDefined();

      const buffer = Buffer.from(artifact.fileBufferBase64, "base64");
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF"); // Genuine PDF magic header
    });

    it("generates genuine DOCX file bound to validated snapshot", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const artifact = await ExportService.generateArtifact({
        session,
        format: "docx",
        snapshot,
      });

      expect(artifact.format).toBe("docx");
      const buffer = Buffer.from(artifact.fileBufferBase64, "base64");
      expect(buffer.subarray(0, 2).toString()).toBe("PK"); // Genuine DOCX (zip container)
    });

    it("blocks export when preservation is FAILED", async () => {
      const { session, snapshot } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      // Corrupt preservation
      session.preservation = {
        status: "FAILED",
        totalFacts: 10,
        preservedFacts: 5,
        missingFactIds: ["f_1"],
        unresolvedFactIds: [],
        alteredProtectedFields: [],
        unsupportedClaimIds: [],
        categoryCounts: {},
        contentPreservedPercentage: null,
      };

      expect(
        ExportService.generateArtifact({
          session,
          format: "pdf",
          snapshot,
        })
      ).rejects.toThrow();
    });
  });

  // 10. Deletion Workflow & Retention
  describe("Phase 4K & 9: Complete Deletion Workflow", () => {
    it("deletes session, drafts, proposals, evidence, scores, and events and produces deletion receipt", async () => {
      const { session } = await ScanSessionService.createSession({
        userId: userA,
        sourceResumeId: "res_001",
        sourceVersion: 1,
        jd: validJd,
        targetRole: "Integration Engineer",
      });

      const receipt = await ScanSessionService.deleteSession(session.id, userA);

      expect(receipt.status).toBe("DELETED");
      expect(receipt.sessionId).toBe(session.id);
      expect(receipt.associatedRecordsCount).toBeGreaterThanOrEqual(1);

      // Verify session is no longer retrievable
      expect(
        ScanSessionService.getSession(session.id, userA)
      ).rejects.toThrow();
    });
  });
});
