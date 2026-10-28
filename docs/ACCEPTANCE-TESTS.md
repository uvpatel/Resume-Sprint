# Production acceptance matrix — specification, not executed backend tests
| Scenario | Required result |
|---|---|
| CV beyond all old character limits | Every page/span reconciled; no truncation |
| OCR/unreadable page | SOURCE_INCOMPLETE; ask for correction; no 100% badge |
| Empty/short/irrelevant JD | JD_INSUFFICIENT; no fabricated score |
| Scan only | Source and draft hashes unchanged |
| Supported accepted patch | Only anchored leaf changes; original immutable |
| Repeated before text in two roles | Entry ID/path selects correct role; ambiguity blocks |
| Base version mismatch | 409; retain local draft; reconcile |
| Unsupported AWS/Kubernetes demand | Excluded; zero evidence credit; no insertion |
| Keyword checkbox without evidence | Cannot auto-accept a factual claim |
| Missing metric | Specific question; no placeholder exported |
| Metric copied between roles | Block scope/evidence mismatch |
| Equal counts but deleted/replaced fact | VALIDATION_FAILED |
| Lost language/hobby/custom section | VALIDATION_FAILED |
| Invented URL from email domain | VALIDATION_FAILED |
| Legitimate original zero value | Preserved exactly; not discarded as placeholder |
| Manual edit changes employer/date | Block; resolve via explicit source correction workflow |
| Reject and regenerate | Same unchanged proposal does not return |
| Undo accepted change | Restore prior field state; invalidate score/export |
| Rapid edits/out-of-order SSE | Older version cannot overwrite current state |
| Offline/reconnect/retry | Fetch canonical state; no duplicate patch or charge |
| ATS change and revert | Preserve draft; invalidate ATS/score/export; audit event |
| No safe improvement | Honest empty state, no forced change |
| Same/lower re-score | Display actual result, never clamp upward |
| Component total mismatch/out of bounds | SCORE_BREAKDOWN_MISMATCH, block persistence |
| Edit during re-score/export generation | Discard stale job result; export blocked |
| Cross-user IDs | Authorization failure, no content leakage |
| Resume/JD prompt injection | Treated as data; no instructions/tools executed |
| PDF/DOCX export | Genuine format, same validated snapshot, extraction parity |
| Long CV / Unicode / page overflow | No clipped or missing content; visual review |
| Keyboard and mobile | Labeled controls, visible focus, logical order, no horizontal overflow |

Error UX: explain what happened, what was protected and what to do next. Example: “This change could remove an original fact. Your draft is saved and export is paused. Review the highlighted claim or undo the change.”

Suggested evaluation corpus: consenting anonymized long/short CVs; mixed-language CVs; tables, columns, OCR; missing metrics; repeated bullets; multiple roles; unsupported-heavy JDs. Measure supported-claim precision, fact retention, coverage failures and score stability before release. Hold rubric/model versions fixed during comparisons.
