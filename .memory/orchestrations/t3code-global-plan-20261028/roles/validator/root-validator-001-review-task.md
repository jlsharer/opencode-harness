# Validator task record

## Metadata

- orchestrationId: t3code-global-plan-20261028
- role: validator
- artifactId: root-validator-001-review-task
- createdAt: 2026-10-29T00:58:46.184923+00:00
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- taskId: review-1
- taskMode: review

## Input Contract

- Inputs received: version-1 Codex task packet and approved predecessor evidence; validator record contains assigned future review context only.
- Required context present: goal, scope, constraints and acceptance were supplied; role/mode are explicit.
- Routing metadata status: absent.

## Work Performed

- Summary: Pending task record precreated by document-1 for a fresh independent read-only validator. No validator execution or findings are claimed.
- Files changed: none by this role; this record is written by document-1.
- Commands/checks: pending; no validator checks claimed.

## Output Contract

- Outputs: assigned independent review, not yet executed.
- Evidence: Assigned review: assess final plan against user requirements, linked source evidence and official support; run node .opencode/scripts/validate-harness.mts if feasible and report observed outcomes.
- Artifact links: [Refactor plan](../../../../../docs/global-t3code-wsl2-refactor-plan.md).

## Handoff

- Next role: parent synthesis after independent review.
- Limitations: PENDING: this is task context, not completed validation or acceptance. The validator returns its own correlated result without modifying this record.
- Risks: native hook compatibility and real T3Code integration remain future acceptance gates.
