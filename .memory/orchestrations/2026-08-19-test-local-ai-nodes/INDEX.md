# 2026-08-19-test-local-ai-nodes

## Scope

- Request: Concrete operator steps to test the completed integration with actual local AI nodes.
- Allowed scope: Read-only implementation evidence and generated orchestration traces.
- Non-goals: Live execution, credentials, edits, global state, or Git mutation.

## Routing Metadata

- routingMetadataStatus: absent

## Workflow DAG

- `research-operator-commands`: researcher/research; completed.
- `synthesize-operator-runbook`: planner/synthesis; completed.
- `review-operator-runbook`: validator/review; blocked on tunnel/service rollback ownership.
- `correct-operator-runbook`: planner/synthesis; remediation 1 of 1; completed.
- `recheck-operator-runbook`: validator/review; failed with remediation budget exhausted.
- Execution: serial.

## Delegation Packets

- `research-operator-commands-researcher-001`: `delegation-packets/research-operator-commands-researcher-001.md`
- `synthesize-operator-runbook-planner-002`: `delegation-packets/synthesize-operator-runbook-planner-002.md`
- `review-operator-runbook-validator-003`: `delegation-packets/review-operator-runbook-validator-003.md`
- `correct-operator-runbook-planner-004`: `delegation-packets/correct-operator-runbook-planner-004.md`
- `recheck-operator-runbook-validator-005`: `delegation-packets/recheck-operator-runbook-validator-005.md`

## Validation Evidence

- Normalized specification: Draft 2020-12 valid.
- Results: FAIL. Exact integration commands and tunnel ownership gates passed, but local backup/restore mode checks did not fail closed and a failed service start could still set the test-owned marker.

## Decisions

- No live provider or node operations were performed. The runbook is not accepted for live use until the three command-control defects in `roles/validator/recheck-operator-runbook-validator-005.md` are corrected and independently reviewed.
