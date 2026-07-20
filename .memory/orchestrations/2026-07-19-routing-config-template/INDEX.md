# 2026-07-19-routing-config-template

## Scope

- Request: Replace the committed user-specific `harness-model-routing.json` with a committed default example and gitignore the operator-specific runtime file.
- Allowed edit scope: Harness repository files and this orchestration memory.
- Non-goals: Commit operator model paths, endpoints, credentials, or private provider configuration; modify external llama-server files.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: None.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research precedes planning; validation precedes acceptance.
- `research`: inspect every routing-file consumer, manifest/validator/docs behavior, Git tracked state, and safe missing-file behavior; role `researcher`; status completed.
- `plan`: freeze example/custom naming, defaults, loader precedence, setup error, tests, manifest, and migration; depends on research; role `planner`; status completed.
- `implementation`: apply example/custom split and all consumer/docs/test updates; depends on plan; role `implementer`; status completed with 27 routing tests and harness validation passing.
- `integration-review`: check runtime/setup/path/manifest consistency and regressions; depends on implementation; roles `integrator`, `reviewer`; status PASS after remediation loop 2.
- `validation`: prove template-only and custom-file scenarios plus full harness checks; depends on integration/review; role `validator`; status PASS.

## Sub-Workflows

- `routing-template`: remediation loops used 2; status accepted.

## Delegation Packets

- Research, plan, implementation, integration, review, and validation evidence: completed.

## Role Trace Artifacts

- `researcher`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/researcher/root-researcher-001-config-consumers.md`
- `planner`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/planner/root-planner-002-example-custom-contract.md`
- `implementer`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/implementer/root-implementer-003-config-template.md`
- `integrator`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/integrator/root-integrator-004-config-template.md`
- `validator`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/validator/root-validator-006-final.md`
- `reviewer`:
  - `.memory/orchestrations/2026-07-19-routing-config-template/roles/reviewer/root-reviewer-005-config-template.md`
- `synthesizer`: not required unless evidence conflicts.
- `artifact-verifier`: not required unless temp-copy proof is requested by validation.

## Validation Evidence

- Commands: 27-test suite; full worktree validator; syntax/JSON/resolver/manifest/Git/security probes; exact staged snapshot proofs; trace/index rerun.
- Results: PASS. Worktree and exact staged validators pass; manifest closure is 49/49; staged example plugin startup does not mutate models. Historical staged memory-index failure no longer reproduces.
- Skipped checks: Live provider/model checks remain outside this configuration-packaging change.

## Decisions

- Accepted decisions: Routing template feature accepted by `root-validator-006-final`.
- Remaining risks: Broad commits remain unsafe in the dirty repository; full restart and operator-dependent live gates remain downstream.
