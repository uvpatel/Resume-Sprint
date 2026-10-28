# ResumeSprint Scan & Improve API Documentation

## Overview

The ResumeSprint Scan & Improve API provides evidence-grounded resume optimization with strict content preservation, deterministic scoring under Rubric v1, snapshot versioning, and durable background job processing.

---

## Standard Error Envelope

All error responses return the standard error envelope:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable explanation",
  "recoveryAction": "Suggested next action",
  "operationId": "op_xyz123",
  "retryable": false,
  "currentVersion": 1
}
```

### HTTP Status Code Mapping
- `400 Bad Request`: Schema failure or insufficient input (e.g. `JD_INSUFFICIENT`, `INVALID_REQUEST`).
- `401 Unauthorized`: Authentication required (`UNAUTHENTICATED`).
- `403 Forbidden`: Authenticated user does not own the requested resource (`FORBIDDEN`).
- `404 Not Found`: Target resource not found (`NOT_FOUND`).
- `409 Conflict`: Stale draft version or superseded snapshot (`STALE_VERSION`).
- `422 Unprocessable`: Preservation failure, unsupported claim, or protected field modification (`VALIDATION_FAILED`, `EXPORT_PRESERVATION_GATE`).
- `429 Too Many Requests`: Rate limit exceeded on AI or export operations (`RATE_LIMIT_EXCEEDED`).
- `503 Service Unavailable`: Temporary upstream service outage (`SERVICE_UNAVAILABLE`).

---

## Endpoints

### 1. Create Scan Session
`POST /api/v1/scan-sessions`

**Request Headers:**
- `x-user-id`: string (or session cookie)

**Request Body:**
```json
{
  "sourceResumeId": "res_001",
  "sourceVersion": 1,
  "jd": "Complete job description text with at least 50 characters...",
  "targetRole": "Integration Engineer",
  "idempotencyKey": "optional-uuid"
}
```

**Response (201 Created):**
```json
{
  "sessionId": "scan_1730123456_abc1",
  "state": "ACTIVE",
  "snapshot": {
    "sourceFileSha256": "...",
    "sourceVersion": 1,
    "draftVersion": 0,
    "draftHash": "...",
    "jdHash": "...",
    "rubricVersion": "v1.0.0",
    "scorerVersion": "v1.0.0",
    "promptVersion": "vNext",
    "evidenceVersion": 1,
    "atsVersion": 1,
    "templateVersion": "clean-v1"
  },
  "sourceCoverage": { "complete": true, "totalPages": 1, "processedPages": 1 },
  "latestScore": {
    "score": 70,
    "scoreBreakdown": {
      "keywordSkillMatch": 32,
      "roleTitleAlignment": 16,
      "quantifiedImpact": 8,
      "experienceDepth": 8,
      "formattingAtsReadability": 6
    },
    "status": "CURRENT"
  },
  "preservation": {
    "status": "VALIDATED",
    "contentPreservedPercentage": 100
  },
  "draftVersion": 0
}
```

---

### 2. Retrieve Scan Session
`GET /api/v1/scan-sessions/:id`

**Response (200 OK):**
Returns the current session state, source coverage, latest score, draft version, and validation state. Cross-user access is denied with 403 Forbidden.

---

### 3. Generate Improvement Proposals
`POST /api/v1/scan-sessions/:id/proposals`

**Request Body:**
```json
{
  "snapshot": { ... },
  "selectedImprovementIds": []
}
```

**Response (200 OK):**
```json
{
  "sessionId": "scan_...",
  "proposals": [
    {
      "changeId": "c_a1b2c3d4",
      "entryId": "e1_b0",
      "fieldPath": "experience.0.bullets.0",
      "before": "Responsible for building MuleSoft APIs connecting Salesforce and SAP.",
      "after": "Built MuleSoft APIs connecting Salesforce and SAP.",
      "baseDraftVersion": 0,
      "baseDraftHash": "...",
      "sourceFactIds": ["f_bullet_e1_0"],
      "sourceSpanIds": ["spn_3"],
      "requirementIds": ["req_1"],
      "reason": "Replace passive phrasing with direct action verb while preserving scope.",
      "confidence": 0.95,
      "safetyStatus": "SUPPORTED",
      "contentRisk": "low",
      "forecastImpact": 2
    }
  ],
  "currentDraftVersion": 0
}
```

---

### 4. Apply Proposal Decisions
`POST /api/v1/scan-sessions/:id/decisions`

Supports `accept`, `reject`, `edit`, and `undo`.

**Request Body:**
```json
{
  "operationId": "op_decide_1",
  "baseDraftVersion": 0,
  "changeId": "c_a1b2c3d4",
  "decision": "accept"
}
```

**Response (200 OK):**
```json
{
  "sessionId": "scan_...",
  "decision": "accept",
  "changeId": "c_a1b2c3d4",
  "previousDraftVersion": 0,
  "newDraftVersion": 1,
  "draftHash": "...",
  "preservation": {
    "status": "VALIDATED",
    "contentPreservedPercentage": 100
  },
  "draft": { ... }
}
```

---

### 5. Submit Additional Evidence
`POST /api/v1/scan-sessions/:id/evidence`

**Request Body:**
```json
{
  "answer": "Engineered high-throughput MuleSoft ESB endpoints connecting SAP ERP and Salesforce CRM.",
  "requirementId": "req_1",
  "roleScope": "e1",
  "baseVersion": 0
}
```

---

### 6. Update ATS Profile
`PATCH /api/v1/scan-sessions/:id/ats`

**Request Body:**
```json
{
  "effectiveATS": "Workday",
  "baseVersion": 0
}
```
Approved allowlist: `Generic`, `Workday`, `Greenhouse`, `Lever`, `Taleo`, `iCIMS`.

---

### 7. Request Rescore (Asynchronous)
`POST /api/v1/scan-sessions/:id/rescores`

**Request Body:**
```json
{
  "snapshot": { ... },
  "idempotencyKey": "optional-key"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job_1730123456_def1",
  "sessionId": "scan_...",
  "status": "QUEUED",
  "message": "Rescore job scheduled successfully."
}
```

---

### 8. Progress Events (SSE)
`GET /api/v1/scan-sessions/:id/events`

Establishes Server-Sent Events stream.
- Replays past events since `Last-Event-ID` header.
- Sends ordered events: `SAVING` → `VALIDATING` → `ESTIMATING` → `SCORING` → `READY` (or `FAILED`).
- Transmits periodic `: heartbeat` comments to keep connections open.

---

### 9. Export Resume (PDF & DOCX)
`POST /api/v1/scan-sessions/:id/exports`

**Request Body:**
```json
{
  "snapshot": { ... },
  "format": "pdf",
  "idempotencyKey": "export-key"
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "job_1730123456_exp1",
  "sessionId": "scan_...",
  "status": "QUEUED",
  "format": "pdf"
}
```

---

### 10. Background Job & Artifact Download
`GET /api/v1/jobs/:jobId`
`GET /api/v1/jobs/:jobId?download=true`

Retrieves job status or downloads authorized binary PDF/DOCX.

---

### 11. Delete Scan Session
`DELETE /api/v1/scan-sessions/:id`

**Response (200 OK):**
```json
{
  "receiptId": "rcpt_1730123456_...",
  "sessionId": "scan_...",
  "status": "DELETED",
  "deletedAt": "2026-10-28T...",
  "associatedRecordsCount": 12,
  "retentionPolicy": "HARD_DELETE_COMPLETE"
}
```
