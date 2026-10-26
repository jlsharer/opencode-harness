# Implementer trace: operator-only external QA

## Metadata
- orchestrationId: 2026-10-24-qa-execution-boundary
- delegationTaskId: qa-implement-001
- scopeKey: qa-boundary
- role: implementer
- taskMode: implementation
- artifactId: qa-boundary-implementer-001-external-qa
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: five assigned target paths; planner's operator QA receipt plan; source-only, no managed shell relaxation.
- Required context present: yes for implementation; external operator process and V2 release artifact are not supplied.
- Routing metadata status: absent; no caller routing labels supplied.

## Work Performed
- Summary: added fixed external-only QA CLI, focused tests, source manifest inventory and operator/design documentation. No runtime or portable projection changes.
- Files read: planner trace, contracts/schema/template, source manifest, README, design, new script and test.
- Files changed: `.opencode/scripts/operator-external-qa.mts`, `.opencode/scripts/operator-external-qa.test.mts`, `.opencode/harness.manifest.json`, `README.md`, `opencode-harness.design.md`.
- Commands/checks: reread new source and test; requested `git diff --name-only`, `git diff --check` and `node --check .opencode/plugins/index.js` through harness_verify; all three rejected with `managed verification requires an assigned validator command` (no successful command status). No write-producing suite run.

## Output Contract
- Outputs: CLI requires explicit canonical root and owner-only external receipt parent, writes exclusive receipt after fixed QA commands, detects HEAD/index/working inventory drift; failure preserves user edits. Private scratch and offline npm cache; stdout/stderr only hashed in receipt. Fixed source-only manifest entries and docs.
- Evidence: source reread; three managed command attempts refused before execution; no independent validator or external receipt evidence.
- Artifact links: `orchestrations/2026-10-24-qa-execution-boundary/roles/implementer/qa-boundary-implementer-001-external-qa.md`.

## Handoff
- Next role: independent validator, then separately authorized external operator for tests and actual QA.
- Limitations: no commands had observed exit status. Focused tests were authored but not executed; timeout fixture and positive complete run not covered. Receipt is not a managed gate, and npm tool version is not separately probed.
- Risks: Git/Node/npm from operator host, same-UID mutation races, possible retained scratch after cleanup failure, unbound ignored inputs and host dependencies; independent review required before any acceptance. V2 proof is separate.
