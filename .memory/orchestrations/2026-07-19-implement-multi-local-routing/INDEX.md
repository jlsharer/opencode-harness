# 2026-07-19-implement-multi-local-routing

## Scope

- Request: Implement the accepted multi-local model routing design, force-local/default behavior, shared routing policy, enforcement/tests/docs, and repository-local parameterized llama-server Compose assets.
- Allowed edit scope: Harness repository files and `.memory/orchestrations/2026-07-19-implement-multi-local-routing/`.
- External read-only source: `/home/joshl/docker/llama-server/compose.yaml` and directly relevant sibling files.
- Non-goals: Modify the external Compose project, download models, launch production servers, commit secrets/private model paths, or claim hardware capacity without benchmarks.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: None; caller did not supply enriched routing metadata.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.
- `baseline-research`: inspect current routing, validator fix, prior artifacts, external Compose source, local path conventions, and dirty worktree; role `researcher`; status completed.
- `implementation-plan`: freeze exact paths, schemas, APIs, migration, tests, docs, and Compose proof; depends on research; role `planner`; status completed.
- `routing-implementation`: shared policy, config/schema, resolver/helper, enforcement, validator/tests; depends on plan; role `implementer`; status completed with 19 unit tests passing.
- `compose-docs-implementation`: localized Compose/env templates and routing/operations documentation; depends on plan; role `implementer`; may run parallel with routing implementation; status completed with two Compose renders passing.
- `integration`: cross-file/schema/manifest/provider/path consistency; depends on both implementation branches; role `integrator`; status final PASS after remediation loop 2.
- `review`: defect/security/regression review; depends on both implementation branches; role `reviewer`; may run parallel with integration; status final PASS with no findings after remediation loop 2.
- `validation`: syntax, unit, harness, schema, resolver, Compose render, secrets/runtime dependency checks; depends on integration/review remediation; role `validator`; status PASS after trace-index remediation loop 1.
- `artifact-proof`: isolated Compose rendering/listing proof without server startup; depends on final implementation; role `artifact-verifier`; status PASS with 67 assertions and cleanup complete.

## Sub-Workflows

- `routing`: implement v2 named local model routing and force-local fixed-role enforcement; remediation loops used 2; status accepted.
- `compose`: localize safe parameterized llama-server assets and examples; remediation loops used 0; status accepted as offline deployment assets.

## Delegation Packets

- Research, plan, and implementation packets: completed. Integration, review, validation, and artifact proof packets: pending.

## Role Trace Artifacts

- `researcher`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/researcher/root-researcher-001-implementation-baseline.md`
- `planner`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/planner/root-planner-002-implementation-contracts.md`
- `implementer`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/implementer/routing-implementer-003-policy-runtime.md`
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/implementer/compose-implementer-004-deployment-docs.md`
- `integrator`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/integrator/root-integrator-005-cross-artifact.md`
- `validator`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/validator/root-validator-008-final.md`
- `reviewer`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/reviewer/root-reviewer-006-defects.md`
- `synthesizer`: not required unless role evidence conflicts.
- `artifact-verifier`:
  - `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/artifact-verifier/compose-artifact-verifier-007-render-proof.md`

## Validation Evidence

- Commands: JSON parse, six Node syntax checks, 21 policy tests, representative policy/resolver/helper/hook probes, full harness validator, both diff checks, static/security scans, and Compose artifact proof.
- Results: All implementation checks passed. Initial final acceptance was blocked only because the newly created validator trace was not yet indexed; both indexes now include it and re-validation passed.
- Skipped checks: Live model loading, OpenCode provider calls, tool-use proof, and RAM/VRAM benchmarking require operator infrastructure and are not offline acceptance gates.

## Decisions

- Accepted decisions: Strict v2 named local catalog; safe committed force false; all-eight force-local atomic startup enforcement when activated; external native provider transport; dependency-free policy validation/tests; repository-local parameterized static llama-server projects with ignored private env files.
- Remaining risks: Live provider visibility, actual model aliases, image/GPU compatibility, model quality, router behavior, and safe RAM/VRAM/concurrency capacity remain operator-dependent and require post-restart proof and benchmarks.
