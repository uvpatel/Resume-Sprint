# ResumeSprint — Scan & Optimize developer pack
26 October 2026 · Proposed implementation specification · No builder or cover-letter scope

## Start here
Open `ResumeSprint-Scan-Optimize.html` directly. No build, account or external dependency is needed. This is a working local interaction prototype with fictional data, not a connected AI service. Run `node tests.cjs` to verify the demo engine. `engine.js` is a fixture-only engine: do not deploy it as the production scorer or validator.

Deliverables: standalone HTML prototype; source HTML/JS; revised prompt templates; API/schema contracts; implementation guide; meaningful executable fixture tests; acceptance matrix.

## Source decisions and migration
Reviewed current Library content of AI_PROMPTS.pdf (8 July 2026), ResumeSprint_Prompt_Improvements.docx (8 July 2026), README-DEVELOPER.md (14 August 2026), plus retrieved discussion through 5 October 2026. The exact RESUMESPRINT-PROMPTS.md filename was not recovered; AI_PROMPTS.pdf supplies the actual scan/improve prompt text and service paths. These are historical snapshots, not a verified current repository audit.

Keep the approved flow: upload/select → full parse → JD → Scan → report → AI Optimize → Accept/Edit/Reject → re-score → validate → download. Scan diagnoses without mutating content. Optimization is an explicit, reviewable action.

Retain canonical rubric v1: keywordSkillMatch 40, roleTitleAlignment 20, quantifiedImpact 20, experienceDepth 10, formattingAtsReadability 10. Components must sum to the visible score. A later 25/25/15/15/10/5/5 weighting is an experimental proposal, not an approved replacement; evaluate offline and version separately. Never compare scores across rubric versions as improvement.

Change these legacy behaviors:
- Remove silent 6,000-character scan, 16,000-character parse and 12,000-character improve truncation. Chunk full documents if needed, reconcile every span and entry, and block SOURCE_INCOMPLETE if coverage is uncertain. Apply the same completeness discipline to the JD.
- Remove the predetermined “most resumes score 55–75” bias and any interview-likelihood claim. Score against evidence and calibrated rules, not a desired distribution.
- Replace unconstrained full-object rewrite with anchored patch proposals. Server code applies approved patches to the full object.
- Replace unconditional forced_keywords with a separate confirmation evidence workflow. A tick box does not substantiate experience.
- Do not force the final score to rise. Same or lower scores are legitimate.
- Remove ambiguous permission to fix unrelated wording and empty-before edits. Every changed leaf requires explicit approval and a specific anchor.
- Never treat an AI-supplied contentPreservedPercent or equal entry counts as proof. The old example with 96% and empty warnings fails the 100% requirement.
- Do not export placeholders such as [X]%. Genuine original zero values must be preserved; only invented/placeholder zeros are forbidden.

## Product scope and pricing
First scan free, subsequent new job-analysis sessions paid. Re-score within the same JD/session is included. ATS profile changes do not consume credits. Optimize entitlement and prices require product configuration; do not invent a price or imply all optimization is free. Builder remains free but is outside this app. No job tracker, cover letter or outreach generator.

## Architecture
Client → authenticated session API → extraction worker → immutable source store + source span/evidence inventory → canonical scan service → proposal worker → validation service → versioned draft store → canonical re-score service → snapshot-bound export worker.

Use full structured ResumeData as the scan input, with the original document/text as provenance and reconciliation evidence. Retain all existing fields: basicInfo, summary, summaryAiEnabled, experience, educationEntries, skillEntries, projectEntries, certificationEntries, achievementEntries, languageEntries, hobbiesData and customSections. Keep stable IDs and unknown custom content. Parsing must not infer proficiency, dates, seniority or skill level without evidence; use unknown in a versioned schema or collect confirmation rather than fabricate required enum values.

Maintain sourceResumeData immutable; currentResumeData is a versioned draft. Keep sourceResumeId, sourceVersion, sourceFileSha256, sourceParseVersion, currentDraftVersion/hash, jobDescriptionHash, rubricVersion, scorerVersion, promptVersion, modelVersion, evidenceVersion and ATS assessment version. Preserve the raw file separately; never confuse parsed-data preservation with original visual formatting fidelity.

## 100% content preservation: a gated result
Definition: all original factual units, entries, relationships and protected values survive in the final draft, with no unsupported additions. Wording may change. This does not promise identical text, page layout or mathematically perfect semantic AI verification.

1. Establish input coverage: file pages, extraction spans, warnings, OCR confidence, all sections reconciled. User review resolves ambiguous extraction before a baseline is certified.
2. Assign stable IDs to every job, bullet, skill, education record, certification, project, achievement, language, hobby and custom-section unit. Inventory atomic facts with source offsets and parent-role relationships.
3. Exact checks protect names, organizations, titles, dates, locations, contacts, URLs, numbers, units and entity-role relationships. A 30% metric from role A cannot migrate to role B.
4. All source IDs must be present once or linked via an explicit approved reclassification map. Equal counts are necessary but insufficient. Duplicate IDs, disappeared facts, merged roles, lost environment lines or unsupported additions block validation.
5. Semantic checks assess fact entailment for rewritten prose. Use independently validated evidence mapping, not the generator's own assurance. Ambiguous claims require human review. Model confidence is not proof.
6. Confirmed new facts live in a provenance layer with user ID, original answer, unit, timeframe, role scope and timestamp. They do not silently change the immutable baseline. Require review of a new patch before applying.
7. Compute preserved/total atomic facts only after coverage is complete and every unit is resolved. For unknown denominator or uncertain entailment display “Preservation unverified,” not 100%. Report counts by category plus missingFactIds, alteredProtectedFields, unsupportedClaimIds and unresolvedFactIds.
8. Block re-score/export on unresolved preservation or factual conflicts. Preserve the user's draft and give recovery actions; never silently delete it.

Demo limitation: the bundled validator recognizes only the fixture's original strings and pre-reviewed alternatives. Arbitrary custom edits are deliberately blocked, even when harmless. Production requires the full checks above. The fixture has 9 content blocks, not 9 atomic facts. Do not reuse that denominator for production claims.

## Evidence and keyword behavior
Matched: evidence supports the requirement. Supported missing: source supports an approved synonym but wording is not surfaced. Needs confirmation: plausible but insufficient evidence; ask a specific question. Unsupported: no evidence, excluded by default. Unsupported requirements remain in the denominator when relevant, but receive zero supported-match credit; do not hide gaps to inflate the score.

Each proposal carries changeId, block/field path, exact before, after, sourceFactIds, sourceSpanIds, requirementIds, confidence, reason, risk, forecastImpact and anchor draft version. A matched keyword can be inspected or excluded from optimization focus; exclusion cannot rewrite the canonical JD or silently raise a score. Never insert a keyword just because a user selected it. Newly supplied evidence requires validation and explicit patch review.

## Scores
Original = immutable initial canonical scan. Live = provisional UI/session estimate. Target = optional forecast, nullable if no defensible estimate. Final = persisted canonical re-score of the exact current validated draft. Never derive final by adding forecast impacts. Re-score uses the same rubric/service as initial scan and may stay unchanged or fall.

Use requirement weighting and evidence-linked semantics in a versioned scorer. Exact/synonym matches must be explainable. Keyword repetition gives no incremental credit. Missing evidence stays missing. Formatting scores require parser/layout evidence; plain text alone cannot prove absence of tables or images. Resume Quality may be a separate diagnostic, never silently blended into Match; production rubric for that diagnostic is not defined here.

## Real-time implementation plan
Immediate optimistic preview and diff after a decision; visible provisional status. Draft save target <300 ms on healthy connections; debounce manual edits 500 ms (initial engineering targets, not guarantees). Send baseVersion + operationId. Server verifies ownership, exact before anchor, schema, evidence and protected fields, then commits one new draft version transactionally. On 409 conflict, retain the local text, show the latest server draft and require reconciliation; never last-write-wins over new work.

Cheap structural validation runs on each accepted patch. Semantic validation and canonical scoring are asynchronous jobs. Subscribe using SSE (WebSocket only if collaborative editing is later needed). Each event includes sessionId, operationId, draftVersion, draftHash, jdHash, atsVersion, sequence and status. Discard out-of-order or mismatched responses. Abort superseded work where possible, but version guards are still mandatory. Stream status/proposals only: never stream unvalidated replacement text straight into the resume.

Use states IDLE → SAVING → VALIDATING → ESTIMATING → READY or FAILED. A final score is separate: STALE → SCORING → CURRENT or FAILED. Disable export while saving, validation unresolved, scoring, stale or failed. Reconnect by last event ID and fetch canonical state. Retries use the same idempotency key. A timeout retains the draft, offers retry and never consumes another same-job scan credit.

## ATS profiles
Start Generic when detection is unavailable. For a production detector, use application URL/recognized metadata; confidence >=.85 high, .55–.84 likely with confirmation, below .55 generic. These are product thresholds to calibrate, not evidence of vendor support. Persist detectedATS, effectiveATS, manualOverride, signal, detectorVersion and confidence. Manual changes preserve all decisions and draft content, refresh parsing/readability guidance, mark ATS/score/export stale, audit ATS_PROFILE_CHANGED and require re-score. Do not claim ATS-specific scores without validated vendor-specific assessment. The demo selector only demonstrates invalidation.

## Final export
Snapshot key = source hash + draft hash/version + JD hash + rubric/scorer/prompt versions + ATS version + validation/evidence version + rendering template version. Check freshness again in a transaction when creating the export job and before delivering the artifact. Revalidate if any component changes. Render real PDF and DOCX from the same snapshot; re-extract and compare factual units, check page overflow and Unicode, and block incomplete output. A .txt blob renamed .pdf is not acceptable. The sample exports genuine .txt only.

## Security, privacy and billing
Treat resume/JD text as untrusted data, never instructions. Strict schema validation; escape UI text; no HTML interpretation; model cannot call tools or follow embedded prompts. File MIME/signature checks, size/page limits, malware controls and parser isolation. Server-side ownership for every session/file/change/job. Signed download URLs, encryption, configurable retention, deletion propagation, no raw CV/JD in logs, privacy-safe telemetry. Confirm provider data handling before production deployment. API keys stay server-side. Charge new scans with an idempotent ledger after the agreed billable milestone; failed retries and same-session re-scores must not double-charge.

## Delivery plan
P0: extraction coverage, immutable evidence, canonical scorer, anchored patches, preserve-all validator, accept/reject/undo, authoritative re-score, stale export gate, regression suite.
P1: word diffs, section heatmap with explanations, structured confirmation questions, debounced save/SSE, draft recovery, impact explanations, audit ledger.
P2: calibrated ATS guidance, separate Resume Quality rubric, multilingual parsing evaluations, accessible keyboard walkthrough, measured prompt/model experiments.

Success measures: preservation-block rate by cause; unauthorized addition rate; source truncation rate (zero allowed); score reproducibility; accepted/rejected changes; rescore latency; stale-result drops; export extraction parity. Track rates without raw PII. Do not optimize conversion by inflating scores.

## Prototype verification and limits
Node tests cover source loss, equal-count substitutions, invented claims, legal fixture edits, unchanged scores, score arithmetic and lossless word diffs. Browser review covers report rendering and the core accept/re-score path if the available preview supports it. Production acceptance cases are in ACCEPTANCE-TESTS.md and are not claimed as executed against a backend.
