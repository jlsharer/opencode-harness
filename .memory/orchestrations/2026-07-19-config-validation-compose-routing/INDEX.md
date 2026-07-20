# 2026-07-19-config-validation-compose-routing

## Scope

- Request: Make the harness validator expectation config-derived and determine how to parameterize `/home/joshl/docker/llama-server/compose.yaml` for different models and KV quantization values used by dynamic runtime routing.
- Allowed edit scope: Harness repository files required for the validator fix, plus `.memory/orchestrations/2026-07-19-config-validation-compose-routing/`.
- External read-only scope: `/home/joshl/docker/llama-server/compose.yaml` and directly relevant files in that project.
- Non-goals: Editing the external Compose project, launching model servers, downloading models, or performing hardware benchmarks.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: None; caller did not supply enriched routing metadata.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.
- `validator-research`: inspect the stale validator assertion and intended config-derived behavior; no dependencies; parallel with `compose-research`; role `researcher`; status completed.
- `compose-research`: inspect Compose topology and authoritative llama.cpp parameterization/runtime constraints; no dependencies; parallel with `validator-research`; role `researcher`; status completed.
- `validator-plan`: define minimal validator edit and checks; depends on `validator-research`; role `planner`; status completed.
- `compose-plan`: define parameterization and dynamic routing operating model; depends on `compose-research`; role `planner`; status completed.
- `validator-implementation`: implement only the approved harness fix; depends on `validator-plan`; role `implementer`; status completed.
- `integration-review`: check changed harness behavior and compatibility with routing design; depends on implementation and both plans; roles `integrator`, `reviewer`; status completed with no code/design defects.
- `final-validation`: run harness and task-specific checks; depends on integration review; role `validator`; status completed with PASS after remediation loop 1.

## Sub-Workflows

- `validator-fix`: acceptance requires config-derived assertions and green relevant validation; remediation loops used 1 for trace indexing; status accepted.
- `compose-design`: acceptance requires an actionable, source-backed parameterization design without external edits; remediation loops used 0; status accepted as design-only.

## Delegation Packets

- Research, planning, implementation, integration, and review packets: completed. Final validation packet: pending.

## Role Trace Artifacts

- `researcher`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/validator-researcher-001-config-derived.md`
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/compose-researcher-002-runtime-parameters.md`
- `planner`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/validator-planner-003-minimal-fix.md`
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/compose-planner-004-dynamic-routing.md`
- `implementer`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/implementer/validator-implementer-005-config-derived.md`
- `integrator`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/integrator/root-integrator-006-cross-artifact.md`
- `validator`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/validator/root-validator-008-final.md`
- `reviewer`:
  - `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/reviewer/root-reviewer-007-validator-compose.md`
- `synthesizer`: not required unless evidence conflicts.
- `artifact-verifier`: not required unless generated Compose proof becomes necessary.

## Validation Evidence

- Commands: `node --check .opencode/scripts/validate-harness.mjs`, `node .opencode/scripts/validate-harness.mjs`, `git diff --check`, scoped status/diff, and external read-only integrity observation.
- Results: Substantive checks passed. Initial final acceptance was blocked only because the newly created validator trace was not yet indexed; both indexes now include it and re-validation passed.
- Skipped checks: Live model-server and hardware checks are out of scope.

## Decisions

- Accepted decisions: Validator expectation is config-derived from the committed implementer role override. Compose baseline uses independently parameterized projects/env files; router mode remains an optional request-time routing alternative requiring separate proof.
- Remaining risks: External runtime topology, image compatibility, provider propagation, KV quality, and safe hardware capacity remain environment-dependent and unbenchmarked.
