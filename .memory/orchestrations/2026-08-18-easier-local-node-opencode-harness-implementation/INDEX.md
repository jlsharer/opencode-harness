# 2026-08-18-easier-local-node-opencode-harness-implementation

## Scope

- Request: Implement `/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md`.
- Allowed edit scope: Plan-designated or directly required `/home/joshl/ai-infrastructure/llama-server/` paths, plus this orchestration trace directory. Harness compatibility surfaces are read-only.
- Non-goals: Unplanned scope expansion; live providers; user-global, Git, or publication mutations.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Orchestration input schema: `.opencode/schemas/orchestration-input.schema.json`
- Normalized specification validation: initial and explicitly expanded specifications passed Draft 2020-12 validation. The user authorized the external-workspace research, implementation, and validation sequence.

## Workflow DAG

- `research-compatibility`: scope `research-compatibility`; dependsOn none; required role `researcher/research`; status `completed; compatibility gap found`.
- `resolve-compatibility-gap`: scope `resolve-compatibility-gap`; dependsOn `research-compatibility`; required role `planner/synthesis`; status `completed; harness prerequisite required`.
- `plan-harness-cli`: dependsOn `resolve-compatibility-gap`; required role `planner/plan`; status `completed`.
- `implement-harness-cli`: dependsOn `plan-harness-cli`; required role `implementer/implementation`; status `completed; self-checks passed`.
- `validate-harness-cli`: dependsOn `implement-harness-cli`; required role `validator/validation`; status `blocked by single-line stderr defect`.
- `remediate-harness-cli`: dependsOn `validate-harness-cli`; required role `implementer/implementation`; status `completed; remediation loop 1 of 1`.
- `revalidate-harness-cli`: dependsOn `remediate-harness-cli`; required role `validator/validation`; status `behavior/release passed; trace contract blocked`.
- `correct-blocked-trace`: dependsOn `revalidate-harness-cli`; required role `implementer/integration`; status `completed; artifact remediation 1 of 1`.
- `prove-trace-integrity`: dependsOn `correct-blocked-trace`; required role `validator/artifact-proof`; status `passed`.
- `commit-harness-identity`: dependsOn `prove-trace-integrity`; required role `implementer/integration`; status `completed at c1c16cc55ca2c4787f000d01ff05ffe05734a3d3`.
- `implement-llama-setup`: dependsOn `commit-harness-identity`; required role `implementer/implementation`; status `completed; self-checks passed`.
- `validate-end-to-end`: dependsOn `implement-llama-setup`; required role `validator/validation`; status `blocked by strict-plan and unsafe-binding-reuse defects`.
- `remediate-external-integration`: dependsOn `validate-end-to-end`; required role `implementer/implementation`; status `completed; remediation loop 1 of 1`.
- `revalidate-end-to-end`: dependsOn `remediate-external-integration`; required role `validator/validation`; status `passed`.
- `implement-llama-setup`: dependsOn `validate-harness-cli`; required role `implementer/implementation`; status `pending`.
- `validate-end-to-end`: dependsOn `implement-llama-setup`; required role `validator/validation`; status `pending`.
- Parallelism: serial; not authorized.

## Delegation Packets

- `implement-plan-implementer-001`: `delegation-packets/implement-plan-implementer-001.md`
- `implement-plan-implementer-002`: `delegation-packets/implement-plan-implementer-002.md`
- `research-compatibility-researcher-003`: `delegation-packets/research-compatibility-researcher-003.md`
- `resolve-compatibility-gap-planner-004`: `delegation-packets/resolve-compatibility-gap-planner-004.md`
- `plan-harness-cli-planner-005`: `delegation-packets/plan-harness-cli-planner-005.md`
- `implement-harness-cli-implementer-006`: `delegation-packets/implement-harness-cli-implementer-006.md`
- `validate-harness-cli-validator-007`: `delegation-packets/validate-harness-cli-validator-007.md`
- `remediate-harness-cli-implementer-008`: `delegation-packets/remediate-harness-cli-implementer-008.md`
- `revalidate-harness-cli-validator-009`: `delegation-packets/revalidate-harness-cli-validator-009.md`
- `correct-blocked-trace-implementer-010`: `delegation-packets/correct-blocked-trace-implementer-010.md`
- `prove-trace-integrity-validator-011`: `delegation-packets/prove-trace-integrity-validator-011.md`
- `commit-harness-identity-implementer-012`: `delegation-packets/commit-harness-identity-implementer-012.md`
- `implement-llama-setup-implementer-013`: `delegation-packets/implement-llama-setup-implementer-013.md`
- `validate-end-to-end-validator-014`: `delegation-packets/validate-end-to-end-validator-014.md`
- `remediate-external-integration-implementer-015`: `delegation-packets/remediate-external-integration-implementer-015.md`
- `revalidate-end-to-end-validator-016`: `delegation-packets/revalidate-end-to-end-validator-016.md`

## Delegated Tasks

- `implement-plan-implementer-001`: rejected by task-thread guard before child creation due to invalid envelope kind.
- `implement-plan-implementer-002`: scope `implement-plan`; role `implementer`; mode `implementation`; fresh thread; remediation loop 0.
- `research-compatibility-researcher-003`: scope `research-compatibility`; role `researcher`; mode `research`; fresh thread; remediation loop 0.
- `resolve-compatibility-gap-planner-004`: scope `resolve-compatibility-gap`; role `planner`; mode `synthesis`; fresh thread; remediation loop 0.
- `plan-harness-cli-planner-005`: scope `plan-harness-cli`; role `planner`; mode `plan`; fresh thread; remediation loop 0.
- `implement-harness-cli-implementer-006`: scope `implement-harness-cli`; role `implementer`; mode `implementation`; fresh thread; remediation loop 0.
- `validate-harness-cli-validator-007`: scope `validate-harness-cli`; role `validator`; mode `validation`; fresh thread; remediation loop 0.
- `remediate-harness-cli-implementer-008`: scope `implement-harness-cli`; role `implementer`; mode `implementation`; fresh thread; remediation loop 1; predecessor `validate-harness-cli-validator-007`.
- `revalidate-harness-cli-validator-009`: scope `validate-harness-cli`; role `validator`; mode `validation`; fresh thread; predecessor `remediate-harness-cli-implementer-008`.
- `correct-blocked-trace-implementer-010`: scope `implement-plan`; role `implementer`; mode `integration`; fresh thread; artifact remediation loop 1; predecessor `revalidate-harness-cli-validator-009`.
- `prove-trace-integrity-validator-011`: scope `prove-trace-integrity`; role `validator`; mode `artifact-proof`; fresh thread; predecessor `correct-blocked-trace-implementer-010`.
- `commit-harness-identity-implementer-012`: scope `commit-harness-identity`; role `implementer`; mode `integration`; fresh thread; predecessor `prove-trace-integrity-validator-011`.
- `implement-llama-setup-implementer-013`: scope `implement-llama-setup`; role `implementer`; mode `implementation`; fresh thread; predecessor `commit-harness-identity-implementer-012`.
- `validate-end-to-end-validator-014`: scope `validate-end-to-end`; role `validator`; mode `validation`; fresh thread; predecessor `implement-llama-setup-implementer-013`.
- `remediate-external-integration-implementer-015`: scope `implement-llama-setup`; role `implementer`; mode `implementation`; fresh thread; remediation loop 1 of 1; predecessor `validate-end-to-end-validator-014`.
- `revalidate-end-to-end-validator-016`: scope `revalidate-end-to-end`; role `validator`; mode `validation`; fresh thread; predecessor `remediate-external-integration-implementer-015`.

## Role Trace Artifacts

- Implementer: pending `roles/implementer/implement-plan-implementer-002-changes.md`.
- Researcher: `roles/researcher/research-compatibility-researcher-003-contract.md`.
- Planner: `roles/planner/resolve-compatibility-gap-planner-004-synthesis.md`; `roles/planner/plan-harness-cli-planner-005-contract.md`.
- Implementer: `roles/implementer/implement-harness-cli-implementer-006-changes.md`.
- Validator: `roles/validator/validate-harness-cli-validator-007-evidence.md`.
- Implementer remediation: `roles/implementer/remediate-harness-cli-implementer-008-stderr.md`.
- Validator recheck: `roles/validator/revalidate-harness-cli-validator-009-evidence.md`.
- Artifact correction: `roles/implementer/correct-blocked-trace-implementer-010-proof.md`.
- Artifact proof: `roles/validator/prove-trace-integrity-validator-011-evidence.md`.
- Commit identity: `roles/implementer/commit-harness-identity-implementer-012.md`.
- External implementation: `roles/implementer/implement-llama-setup-implementer-013-changes.md`.
- Final validation: `roles/validator/validate-end-to-end-validator-014-evidence.md`.
- External remediation: `roles/implementer/remediate-external-integration-implementer-015-changes.md`.
- Final revalidation: `roles/validator/revalidate-end-to-end-validator-016-evidence.md`.
- Validator: pending.

## Validation Evidence

- Commands: Plan integration fixtures; hostile binding/profile checks; projection, tunnel, safety, context, context-worker, syntax, schema, no-write/no-secret, forwarding, exit propagation; harness source/runtime/routing/foreign/portable/package checks; trace schema and role-contract checks; diff hygiene.
- Results: PASS for the authorized offline scope. Harness runtime 34/34, routing 39/39, foreign repository 8 with 1 optional skip, portable 18 with 4 Darwin-only skips, package 0.1.10 with 40 files, and 18/18 retained traces valid.
- Skipped checks: Foreign-owner mutation unavailable without privilege; Darwin-only checks skipped on Linux; live provider, real prepare/OpenCode, SSH/tunnel/service, Docker, credential, global-state, publication, and rollback checks were unauthorized.

## Decisions

- Accepted decisions: Offline implementation accepted. Harness prerequisite is commit `c1c16cc55ca2c4787f000d01ff05ffe05734a3d3`, package `0.1.10`, launcher SHA-256 `c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156`.
- Remaining risks: Live readiness and privileged foreign-owner behavior remain unverified by authorization/environment boundary. Fully restart OpenCode before later activation.
