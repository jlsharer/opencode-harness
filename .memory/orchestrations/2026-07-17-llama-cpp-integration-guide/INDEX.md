# 2026-07-17-llama-cpp-integration-guide

## Scope

- Request: implement an approved documentation-only llama.cpp integration guide for the OpenCode harness.
- Allowed edit scope: add `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`; update `.opencode/skills/delegation-orchestrator/SKILL.md` with one reference bullet; create/update orchestration memory under this directory.
- Non-goals: no changes to `opencode.json`, routing files, commands, agents, plugins, schemas, or runtime behavior.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none supplied.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.
- `root-guide-doc`:
  - scope: documentation-only llama.cpp integration guide.
  - dependsOn: supplied research evidence and approved plan.
  - parallelizableWith: none during implementation.
  - requiredRoles: researcher, planner, implementer, validator.
  - status: implementation complete; validator evidence recorded.

## Sub-Workflows

- `root`:
  - parent: none
  - goal: add reference guide and index it from the delegation-orchestrator skill.
  - acceptanceCriteria: guide covers requested topics, remains ASCII-only, and does not alter runtime behavior.
  - remediationLoopsUsed: 0
  - status: validator evidence recorded; synthesis recommends acceptance.

## Delegation Packets

- none retained.

## Role Trace Artifacts

- `researcher`:
  - supplied evidence: research URLs listed in implementer request.
- `planner`:
  - supplied evidence: approved documentation-only change plan in implementer request.
- `implementer`:
  - `root-implementer-003-guide-doc`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-003-guide-doc.md`
  - `root-implementer-006-review-remediation`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-006-review-remediation.md`
  - `root-implementer-007-memory-index-remediation`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-007-memory-index-remediation.md`
- `integrator`:
  - `root-integrator-004-path-consistency`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/integrator/root-integrator-004-path-consistency.md`
- `validator`:
  - `root-validator-008-final`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/validator/root-validator-008-final.md`
- `reviewer`:
  - `root-reviewer-005-guide-defects`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/reviewer/root-reviewer-005-guide-defects.md`
- `synthesizer`:
  - `root-synthesizer-009-final`: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/synthesizer/root-synthesizer-009-final.md`
- `artifact-verifier`: none yet.

## Validation Evidence

- Commands: implementer self-check searches; validator guide scans; `node .opencode/scripts/validate-harness.mjs`.
- Results: final validator checks passed for guide-specific criteria; `node .opencode/scripts/validate-harness.mjs` passed with an unrelated Node module type warning for `.opencode/plugins/index.js`.
- Skipped checks: none intentionally skipped by index-remediation implementer.

## Decisions

- Accepted decisions: documentation-only implementation added within allowed scope; synthesizer recommends acceptance based on final validator PASS evidence.
- Remaining risks: repository contains unrelated working-tree changes outside this task scope; upstream llama.cpp/OpenCode docs may drift over time.
