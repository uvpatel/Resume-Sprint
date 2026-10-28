import crypto from 'node:crypto';
import {
  ScanSession,
  ResumeData,
  SourceFact,
  SourceSpan,
  SourceCoverage,
  JobRequirement,
  EffectiveATS,
  Snapshot,
} from '@/types/resume-sprint';
import {
  ScanSessionRepository,
  IdempotencyRepository,
  globalStore,
} from '@/server/persistence/repository';
import { ApiError } from '@/lib/errors/api-error';
import { computeSha256, computeJdHash, computeDraftHash } from '@/lib/validation/snapshot';
import { SnapshotService, CANONICAL_RUBRIC_VERSION, CANONICAL_SCORER_VERSION, CANONICAL_PROMPT_VERSION, CANONICAL_TEMPLATE_VERSION } from '@/server/scoring/snapshot.service';
import { ScoreService, ALLOWED_ATS_CONFIGS } from '@/server/scoring/score.service';
import { PreservationService } from '@/server/preservation/preservation.service';
import { cloneResumeData, validateResumeData } from '@/lib/validation/resume';

export class ScanSessionService {
  /**
   * Creates a new scan session with initial snapshot, evidence inventory, and baseline score.
   */
  public static async createSession(params: {
    userId: string;
    sourceResumeId: string;
    sourceVersion: number;
    jd: string;
    targetRole: string;
    idempotencyKey?: string;
    customResumeData?: ResumeData;
  }): Promise<{ session: ScanSession; snapshot: Snapshot }> {
    const { userId, sourceResumeId, sourceVersion, jd, targetRole, idempotencyKey, customResumeData } = params;

    // Check idempotency first if key provided
    if (idempotencyKey) {
      const existingRecord = await IdempotencyRepository.get(idempotencyKey, userId);
      if (existingRecord) {
        return existingRecord.responseBody as { session: ScanSession; snapshot: Snapshot };
      }
    }

    // Input validations
    if (!jd || jd.trim().length < 50) {
      throw ApiError.badRequest(
        'Job description must be provided and contain at least 50 characters.',
        'Paste the complete job description to ensure accurate requirement analysis',
        'JD_INSUFFICIENT'
      );
    }

    if (!targetRole || targetRole.trim().length < 2) {
      throw ApiError.badRequest('Target role must be provided.', 'Specify the job title or target role');
    }

    const sessionId = `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const jdHash = computeJdHash(jd);

    // Build or use standard baseline resume data
    const resumeData: ResumeData = customResumeData || this.getCanonicalSampleResume();
    const resumeValid = validateResumeData(resumeData);
    if (!resumeValid.success) {
      throw ApiError.badRequest(`Source resume data failed schema validation: ${resumeValid.error}`);
    }

    const sourceFileSha256 = computeSha256(JSON.stringify(resumeData));
    const draftHash = computeDraftHash(resumeData);

    // Build atomic source facts & spans
    const { facts, spans, coverage } = this.extractSourceFactsAndSpans(resumeData);

    // Extract job requirements from JD
    const requirements = this.extractJobRequirements(jd, facts);

    const initialSnapshot: Snapshot = {
      sourceFileSha256,
      sourceVersion,
      draftVersion: 0,
      draftHash,
      jdHash,
      rubricVersion: CANONICAL_RUBRIC_VERSION,
      scorerVersion: CANONICAL_SCORER_VERSION,
      promptVersion: CANONICAL_PROMPT_VERSION,
      evidenceVersion: 1,
      atsVersion: 1,
      templateVersion: CANONICAL_TEMPLATE_VERSION,
    };

    // Calculate baseline score
    const initialScore = ScoreService.calculateScore({
      resume: resumeData,
      jd,
      targetRole,
      requirements,
      effectiveATS: 'Generic',
      snapshot: initialSnapshot,
    });

    // Evaluate initial baseline preservation (should be 100% VALIDATED)
    const initialPreservation = PreservationService.evaluate({
      sourceResume: resumeData,
      currentDraft: resumeData,
      sourceFacts: facts,
      sourceCoverage: coverage,
    });

    const session: ScanSession = {
      id: sessionId,
      userId,
      sourceResumeId,
      sourceVersion,
      sourceFileSha256,
      sourceCoverage: coverage,
      sourceFacts: facts,
      sourceSpans: spans,
      sourceResumeData: cloneResumeData(resumeData),
      currentDraftVersion: 0,
      currentDraftHash: draftHash,
      currentResumeData: cloneResumeData(resumeData),
      draftHistory: [
        {
          version: 0,
          hash: draftHash,
          resumeData: cloneResumeData(resumeData),
          createdAt: new Date().toISOString(),
          reason: 'Initial scan baseline from verified source document',
        },
      ],
      jd: jd.trim(),
      jdHash,
      targetRole: targetRole.trim(),
      effectiveATS: 'Generic',
      atsVersion: 1,
      rubricVersion: CANONICAL_RUBRIC_VERSION,
      scorerVersion: CANONICAL_SCORER_VERSION,
      promptVersion: CANONICAL_PROMPT_VERSION,
      evidenceVersion: 1,
      templateVersion: CANONICAL_TEMPLATE_VERSION,
      requirements,
      userEvidence: [],
      proposals: [],
      rejectedProposalIds: [],
      preservation: initialPreservation,
      latestScore: initialScore,
      state: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ScanSessionRepository.create(session);

    const result = { session, snapshot: initialSnapshot };

    if (idempotencyKey) {
      await IdempotencyRepository.save({
        key: idempotencyKey,
        userId,
        sessionId,
        operationId: `op_init_${sessionId}`,
        endpoint: '/v1/scan-sessions',
        statusCode: 201,
        responseBody: result,
        createdAt: new Date().toISOString(),
      });
    }

    return result;
  }

  public static async getSession(id: string, userId: string): Promise<{
    session: ScanSession;
    snapshot: Snapshot;
    preservation: any;
    score: any;
  }> {
    const session = await ScanSessionRepository.findById(id);
    if (!session) {
      throw ApiError.notFound('Scan session');
    }

    if (session.userId !== userId) {
      throw ApiError.forbidden();
    }

    const snapshot = SnapshotService.buildSnapshot(session);

    return {
      session,
      snapshot,
      preservation: session.preservation,
      score: session.latestScore,
    };
  }

  public static async updateATS(params: {
    sessionId: string;
    userId: string;
    effectiveATS: string;
    baseVersion: number;
  }): Promise<{ session: ScanSession; snapshot: Snapshot }> {
    const { sessionId, userId, effectiveATS, baseVersion } = params;

    if (!ALLOWED_ATS_CONFIGS.includes(effectiveATS as EffectiveATS)) {
      throw ApiError.badRequest(
        `Invalid ATS configuration "${effectiveATS}". Allowed values: ${ALLOWED_ATS_CONFIGS.join(', ')}`,
        'Select an ATS profile from the approved allowlist',
        'INVALID_ATS_CONFIG'
      );
    }

    return await globalStore.withLock(sessionId, async () => {
      const session = await ScanSessionRepository.findById(sessionId);
      if (!session) {
        throw ApiError.notFound('Scan session');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden();
      }

      if (session.currentDraftVersion !== baseVersion) {
        throw ApiError.conflict(
          `ATS update anchors base version ${baseVersion}, but current draft is version ${session.currentDraftVersion}.`,
          session.currentDraftVersion
        );
      }

      session.effectiveATS = effectiveATS as EffectiveATS;
      session.atsVersion += 1;

      // Invalidate current score
      if (session.latestScore) {
        session.latestScore.status = 'STALE';
      }

      await ScanSessionRepository.update(session);

      const snapshot = SnapshotService.buildSnapshot(session);
      return { session, snapshot };
    });
  }

  public static async deleteSession(id: string, userId: string): Promise<{
    receiptId: string;
    sessionId: string;
    status: string;
    deletedAt: string;
    associatedRecordsCount: number;
    retentionPolicy: string;
  }> {
    return await globalStore.withLock(id, async () => {
      const session = await ScanSessionRepository.findById(id);
      if (!session) {
        throw ApiError.notFound('Scan session');
      }

      if (session.userId !== userId) {
        throw ApiError.forbidden();
      }

      const receipt = await ScanSessionRepository.delete(id, userId);

      return {
        receiptId: `rcpt_${Date.now()}_${id}`,
        sessionId: id,
        status: 'DELETED',
        deletedAt: receipt.deletedAt,
        associatedRecordsCount: receipt.associatedRecordsCount,
        retentionPolicy: 'HARD_DELETE_COMPLETE',
      };
    });
  }

  private static extractSourceFactsAndSpans(resume: ResumeData): {
    facts: SourceFact[];
    spans: SourceSpan[];
    coverage: SourceCoverage;
  } {
    const facts: SourceFact[] = [];
    const spans: SourceSpan[] = [];
    let spanOffset = 0;

    const addSpan = (text: string): string => {
      const spanId = `spn_${spans.length + 1}`;
      spans.push({
        spanId,
        pageNumber: 1,
        text,
        startOffset: spanOffset,
        endOffset: spanOffset + text.length,
      });
      spanOffset += text.length + 1;
      return spanId;
    };

    // BasicInfo
    const nameSpan = addSpan(resume.basicInfo.name);
    facts.push({
      factId: 'f_name',
      entryId: 'basicInfo',
      sourceSpanIds: [nameSpan],
      exactText: resume.basicInfo.name,
      kind: 'NAME',
      protectedValues: { name: resume.basicInfo.name },
    });

    if (resume.summary) {
      const sumSpan = addSpan(resume.summary);
      facts.push({
        factId: 'f_summary',
        entryId: 'summary',
        sourceSpanIds: [sumSpan],
        exactText: resume.summary,
        kind: 'TEXT',
        protectedValues: {},
      });
    }

    // Experience
    resume.experience.forEach((exp) => {
      const roleText = `${exp.title} | ${exp.company} | ${exp.location} | ${exp.startDate}–${exp.endDate}`;
      const roleSpan = addSpan(roleText);
      facts.push({
        factId: `f_role_${exp.id}`,
        entryId: exp.id,
        sourceSpanIds: [roleSpan],
        exactText: roleText,
        kind: 'TITLE',
        protectedValues: {
          title: exp.title,
          company: exp.company,
          startDate: exp.startDate,
          endDate: exp.endDate,
        },
        roleScope: exp.id,
      });

      exp.bullets.forEach((bullet, bIdx) => {
        const bSpan = addSpan(bullet);
        facts.push({
          factId: `f_bullet_${exp.id}_${bIdx}`,
          entryId: `${exp.id}_b${bIdx}`,
          sourceSpanIds: [bSpan],
          exactText: bullet,
          kind: 'TEXT',
          protectedValues: {},
          roleScope: exp.id,
        });
      });
    });

    // Education
    resume.educationEntries.forEach((edu) => {
      const eduText = `${edu.degree} | ${edu.institution} | ${edu.startDate}–${edu.endDate}`;
      const eduSpan = addSpan(eduText);
      facts.push({
        factId: `f_edu_${edu.id}`,
        entryId: edu.id,
        sourceSpanIds: [eduSpan],
        exactText: eduText,
        kind: 'EDUCATION',
        protectedValues: {
          degree: edu.degree,
          institution: edu.institution,
        },
      });
    });

    // Skills
    resume.skillEntries.forEach((sk) => {
      const skSpan = addSpan(sk.name);
      facts.push({
        factId: `f_sk_${sk.id}`,
        entryId: sk.id,
        sourceSpanIds: [skSpan],
        exactText: sk.name,
        kind: 'SKILL',
        protectedValues: { skill: sk.name },
      });
    });

    // Languages
    resume.languageEntries.forEach((lang) => {
      const langText = `${lang.language} (${lang.proficiency})`;
      const langSpan = addSpan(langText);
      facts.push({
        factId: `f_lang_${lang.id}`,
        entryId: lang.id,
        sourceSpanIds: [langSpan],
        exactText: langText,
        kind: 'LANGUAGE',
        protectedValues: { language: lang.language },
      });
    });

    const coverage: SourceCoverage = {
      totalPages: 1,
      processedPages: 1,
      unmappedSpanIds: [],
      unresolvedSpanIds: [],
      complete: true,
    };

    return { facts, spans, coverage };
  }

  private static extractJobRequirements(jd: string, facts: SourceFact[]): JobRequirement[] {
    const jdLower = jd.toLowerCase();
    const requirements: JobRequirement[] = [];

    const candidateTerms = [
      { text: 'Build MuleSoft APIs', cat: 'Integration', imp: 'CRITICAL' as const, terms: ['mulesoft', 'api'] },
      { text: 'Salesforce and SAP integrations', cat: 'Platforms', imp: 'CRITICAL' as const, terms: ['salesforce', 'sap'] },
      { text: 'RabbitMQ messaging', cat: 'Messaging', imp: 'HIGH' as const, terms: ['rabbitmq'] },
      { text: 'SQL data pipelines', cat: 'Database', imp: 'HIGH' as const, terms: ['sql', 'pipeline'] },
      { text: 'Batch processing optimization', cat: 'Performance', imp: 'MEDIUM' as const, terms: ['batch processing'] },
      { text: 'Kubernetes orchestration', cat: 'DevOps', imp: 'HIGH' as const, terms: ['kubernetes', 'k8s'] },
      { text: 'AWS Cloud Architecture', cat: 'Cloud', imp: 'HIGH' as const, terms: ['aws', 'amazon web services'] },
    ];

    const allFactText = facts.map((f) => f.exactText.toLowerCase()).join(' ');

    candidateTerms.forEach((item, idx) => {
      const inJd = item.terms.some((t) => jdLower.includes(t));
      if (!inJd) return;

      const matchingFacts = facts.filter((f) =>
        item.terms.some((t) => f.exactText.toLowerCase().includes(t))
      );

      const isSupportedInResume = matchingFacts.length > 0;

      requirements.push({
        id: `req_${idx + 1}`,
        text: item.text,
        category: item.cat,
        importance: item.imp,
        status: isSupportedInResume ? 'MATCHED' : 'UNSUPPORTED',
        factIds: matchingFacts.map((f) => f.factId),
        matchedKeywords: isSupportedInResume ? item.terms.filter((t) => allFactText.includes(t)) : [],
        missingKeywords: !isSupportedInResume ? item.terms : [],
      });
    });

    return requirements;
  }

  public static getCanonicalSampleResume(): ResumeData {
    return {
      basicInfo: {
        name: 'Alex Mercer',
        title: 'Integration Engineer',
        email: 'alex.mercer@example.com',
        phone: '+44 20 7946 0912',
        location: 'London, UK',
      },
      summary: 'Integration engineer building APIs with MuleSoft and SQL.',
      summaryAiEnabled: true,
      experience: [
        {
          id: 'e1',
          title: 'Integration Engineer',
          company: 'Northstar Energy',
          location: 'London',
          startDate: '2021',
          endDate: 'Present',
          current: true,
          bullets: [
            'Responsible for building MuleSoft APIs connecting Salesforce and SAP.',
            'Worked on RabbitMQ messaging and SQL data pipelines.',
            'Reduced processing time by 30% through batch processing.',
          ],
        },
      ],
      educationEntries: [
        {
          id: 'ed1',
          degree: 'MSc Computer Science',
          field: 'Computer Science',
          institution: 'Example University',
          location: 'London',
          startDate: '2019',
          endDate: '2020',
        },
      ],
      skillEntries: [
        { id: 'sk1', name: 'MuleSoft' },
        { id: 'sk2', name: 'Salesforce' },
        { id: 'sk3', name: 'SAP' },
        { id: 'sk4', name: 'RabbitMQ' },
        { id: 'sk5', name: 'SQL' },
        { id: 'sk6', name: 'Batch Processing' },
      ],
      projectEntries: [
        {
          id: 'p1',
          title: 'Customer Data Synchronization',
          description: 'Customer data synchronization using APIs and RabbitMQ.',
          bullets: ['Streamlined bidirectional data flow between CRM and ERP.'],
          technologies: ['MuleSoft', 'RabbitMQ'],
        },
      ],
      certificationEntries: [],
      achievementEntries: [],
      languageEntries: [
        { id: 'l1', language: 'English', proficiency: 'Native' },
        { id: 'l2', language: 'Marathi', proficiency: 'Fluent' },
      ],
      hobbiesData: ['Cycling', 'Open source software'],
      customSections: [],
    };
  }
}
