# 2026-07-19-multi-local-model-routing

## Scope

- Request: Determine changes needed for multiple local models with distinct routing service URLs, an all-subagent local-model mode with defaults, and documented OpenCode parallel local-model context/VRAM/RAM behavior.
- Allowed edit scope: Analysis and required orchestration memory under `.memory/orchestrations/2026-07-19-multi-local-model-routing/` only.
- Non-goals: Implementing routing changes or changing runtime configuration in this workflow.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: None; caller did not supply enriched routing metadata.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.
- `routing-research`:
  - scope: Current harness routing schema, resolver, plugin, tests, docs, and likely affected paths.
  - dependsOn: None.
  - parallelizableWith: `runtime-research`.
  - requiredRoles: `researcher`.
  - status: completed.
- `runtime-research`:
  - scope: Upstream OpenCode session/subagent parallelism and local inference server context/VRAM/RAM behavior.
  - dependsOn: None.
  - parallelizableWith: `routing-research`.
  - requiredRoles: `researcher`.
  - status: completed.
- `change-plan`:
  - scope: Exact proposed configuration contract, precedence, paths, migration, documentation, and verification gates.
  - dependsOn: `routing-research`, `runtime-research`.
  - parallelizableWith: None.
  - requiredRoles: `planner`.
  - status: completed after validator remediation loop 1.
- `proposal-validation`:
  - scope: Validate evidence coverage and feasibility of the proposed change set without implementation.
  - dependsOn: `change-plan`.
  - parallelizableWith: None.
  - requiredRoles: `validator`.
  - status: completed; validator PASS after remediation loop 1.

## Sub-Workflows

- `root`:
  - parent: None.
  - goal: Produce a validated, evidence-backed change design.
  - acceptanceCriteria: Exact affected paths and config semantics; source-backed runtime resource explanation; executable future verification gates; explicit unknowns and risks.
  - remediationLoopsUsed: 1.
  - status: accepted.

## Delegation Packets

- `routing-research-packet`: completed via delegated researcher task.
- `runtime-research-packet`: completed via delegated researcher task.
- `change-plan-packet`: completed via delegated planner task and remediation loop 1.
- `proposal-validation-packet`: completed; initial fail remediated and second pass accepted.

## Role Trace Artifacts

- `researcher`:
  - `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/routing-researcher-001-current-harness.md`
  - `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/runtime-researcher-002-parallel-context.md`
- `planner`:
  - `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md`
- `implementer`: not required; implementation is out of scope.
- `integrator`: not required unless planning identifies unresolved cross-artifact conflicts.
- `validator`:
  - `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/validator/root-validator-004-proposal-evidence.md`
- `reviewer`: not required for an analysis-only proposal.
- `synthesizer`: not required unless delegated evidence conflicts.
- `artifact-verifier`: not required; no generated deliverable is being produced.

## Validation Evidence

- Commands: JSON parsing, syntax checks, resolver baseline, `node .opencode/scripts/validate-harness.mjs`, and `git diff --check`; see validator trace.
- Results: Initial proposal validation failed on two force-mode bypass semantics and incomplete index links. Planner remediation loop 1 addressed the semantic blockers; validator re-validation passed with no blocking remediation.
- Skipped checks: Full harness validation is not an acceptance substitute for this analysis and will be run only if the validator finds it relevant to baseline feasibility.

## Decisions

- Accepted decisions: Use a versioned named local-model catalog, fixed-eight force-local policy with role/default selection, fail-closed conflict handling, shared resolver/enforcer semantics, atomic provider coherence preflight, and backend-owned concurrency/resource guidance.
- Remaining risks: Current harness validation baseline is red due to a stale implementer-model assertion; fixed-eight-only enforcement and cooperative endpoint limits do not cover arbitrary agents or cross-process admission; provider visibility and safe RAM/VRAM capacity are environment-dependent.
