# 2026-07-28-agentic-protocol-hooks

## Scope

- Request: Design an agentic harness hook implementation usable by OpenCode and Claude hooks to inject context-specific protocol reminders at the correct event timing, including Playwright page-object/spec micro-protocols and user-visible tracking of injections.
- Allowed edit scope: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/` for orchestration artifacts. No runtime implementation files are changed unless explicitly requested after design acceptance.
- Non-goals: Do not claim lifecycle hook output as validation proof. Do not add native provider transport or harness policy to `opencode.json`. Do not depend on `.agents/` or `.codex/` runtime paths.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none supplied by caller.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Delegation skill: `.opencode/skills/delegation-orchestrator/SKILL.md`
- Workflows: `.opencode/workflows/delegation-workflow.md`, `.opencode/workflows/validation-workflow.md`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `root-research`:
  - scope: Inspect existing OpenCode harness hook/plugin, workflow, schema, and command surfaces relevant to protocol injection.
  - dependsOn: none
  - parallelizableWith: none
  - requiredRoles: researcher
  - status: completed

- `root-plan`:
  - scope: Design event timing, classifier, protocol registry, injection delivery, telemetry, user notification, and cross-client boundaries.
  - dependsOn: `root-research`
  - parallelizableWith: none
  - requiredRoles: planner
  - status: completed

- `root-review`:
  - scope: Review design for behavioral regressions, prompt-injection risks, noise, false positives, and OpenCode/Claude compatibility risks.
  - dependsOn: `root-plan`
  - parallelizableWith: `root-synthesis`
  - requiredRoles: reviewer
  - status: completed

- `root-synthesis`:
  - scope: Consolidate research, plan, and review into final design recommendations.
  - dependsOn: `root-plan`
  - parallelizableWith: `root-review`
  - requiredRoles: synthesizer
  - status: completed

- `root-validation`:
  - scope: Validate memory artifacts and harness constraints with command-backed checks.
  - dependsOn: `root-synthesis`, `root-review`
  - parallelizableWith: none
  - requiredRoles: validator
  - status: completed

## Sub-Workflows

- `root`:
  - parent: none
  - goal: Produce an evidence-backed, implementation-ready hook design without modifying runtime code.
  - acceptanceCriteria: Role artifacts exist, routing decisions are recorded, design addresses pre-tool/post-tool timing, conditional protocol selection, OpenCode/Claude compatibility, telemetry/notifications, and validation evidence is present.
  - remediationLoopsUsed: 1
  - status: completed

## Delegation Packets

- `root-researcher-001-hooks`: completed
- `root-planner-002-design`: completed
- `root-reviewer-003-risk`: completed
- `root-synthesizer-004-final`: completed
- `root-validator-005-evidence`: completed
- `root-implementer-006-memory-index`: completed

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-hooks`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
- `planner`:
  - `root-planner-002-design`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
- `implementer`:
  - `root-implementer-006-memory-index`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/implementer/root-implementer-006-memory-index.md`
- `integrator`: none required unless validation finds cross-artifact inconsistencies
- `validator`:
  - `root-validator-005-evidence`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/validator/root-validator-005-evidence.md`
- `reviewer`:
  - `root-reviewer-003-risk`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/reviewer/root-reviewer-003-risk.md`
- `synthesizer`:
  - `root-synthesizer-004-final`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
- `artifact-verifier`: none required for design-only workflow

## Validation Evidence

- Commands: `node .opencode/scripts/validate-harness.mjs` passed; static artifact existence/schema/routing/index-entry checks passed after memory-index remediation.
- Results: accepting final validation evidence written at `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/validator/root-validator-005-evidence.md`.
- Skipped checks: future implementation tests, registry schema validation, runtime hook smoke checks, and strict JSON Schema validation skipped because this workflow is design-only Markdown artifact validation.

## Decisions

- Accepted decisions: design-only artifacts accepted after validation; future runtime implementation remains separate and must validate independently.
- Remaining risks: OpenCode hook API shape, ledger privacy/default ignore policy, prompt-injection boundaries, classifier false positives/noise, and future runtime smoke coverage remain implementation-phase risks.
