// Proposed API domain contract; integrate with existing full ResumeData schema.
export type EvidenceStatus = 'MATCHED'|'SUPPORTED_MISSING'|'NEEDS_CONFIRMATION'|'UNSUPPORTED';
export interface Snapshot {
 sourceFileSha256:string; sourceVersion:number; draftVersion:number; draftHash:string;
 jdHash:string; rubricVersion:string; scorerVersion:string; promptVersion:string;
 evidenceVersion:number; atsVersion:number; templateVersion:string;
}
export interface Patch {
 changeId:string; entryId:string; fieldPath:string; before:string; after:string;
 baseDraftVersion:number; baseDraftHash:string; sourceFactIds:string[];
 sourceSpanIds:string[]; requirementIds:string[]; reason:string;
 confidence:number; safetyStatus:'SUPPORTED'|'BLOCKED'|'REVIEW_REQUIRED';
 contentRisk:'low'|'medium'|'high'; forecastImpact:number|null;
}
export interface Preservation {
 status:'VALIDATED'|'FAILED'|'UNVERIFIED'; totalFacts:number|null;
 preservedFacts:number|null; missingFactIds:string[]; unresolvedFactIds:string[];
 alteredProtectedFields:string[]; unsupportedClaimIds:string[];
 categoryCounts:Record<string,{original:number;returned:number}>;
 // Null unless complete source coverage and all facts resolved independently.
 contentPreservedPercent:number|null;
}
export interface Score {
 snapshot:Snapshot; score:number;
 scoreBreakdown:{keywordSkillMatch:number;roleTitleAlignment:number;
 quantifiedImpact:number;experienceDepth:number;formattingAtsReadability:number};
 status:'CURRENT'|'STALE'; createdAt:string;
}
export interface DecisionRequest {
 operationId:string; baseDraftVersion:number; changeId:string;
 decision:'accept'|'reject'|'edit'|'undo'; editedText?:string;
}
export interface ProgressEvent {
 id:string;sessionId:string;operationId:string;sequence:number;snapshot:Snapshot;
 stage:'SAVING'|'VALIDATING'|'ESTIMATING'|'SCORING'|'READY'|'FAILED';
 errorCode?:string;
}
// Minimum routes (server auth/ownership applies to every resource):
// POST /v1/scan-sessions {sourceResumeId,sourceVersion,jd,targetRole,idempotencyKey}
// GET /v1/scan-sessions/:id -> state + source coverage + report + current snapshot
// POST /v1/scan-sessions/:id/proposals {snapshot,selectedImprovementIds}
// POST /v1/scan-sessions/:id/decisions DecisionRequest -> draft + new version + validation
// POST /v1/scan-sessions/:id/evidence {answer,requirementId,roleScope,baseVersion}
// PATCH /v1/scan-sessions/:id/ats {effectiveATS,baseVersion} -> stale score/assessment
// POST /v1/scan-sessions/:id/rescores {snapshot,idempotencyKey} -> 202 jobId
// GET /v1/scan-sessions/:id/events -> SSE ProgressEvent
// POST /v1/scan-sessions/:id/exports {snapshot,format:'pdf'|'docx',idempotencyKey}
// GET /v1/jobs/:jobId -> status + authorized expiring artifact URL
// DELETE /v1/scan-sessions/:id -> deletion receipt/retention status
// 400 schema/insufficient input; 401/403 auth; 409 stale version; 422 validation;
// 429 rate limit; 503 retryable service unavailable. Never return partial success as final.
// Error envelope: {code,message,recoveryAction,operationId,retryable,currentVersion?}
