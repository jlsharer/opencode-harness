# 2026-08-28-centralize-node-yaml

## Scope

- Request: Replace the TSV and manually maintained per-node server/OpenCode files with one private YAML source of truth and eliminate avoidable manual touch points.
- Allowed edit scope: `/home/joshl/ai-infrastructure/llama-server` and orchestration artifacts under this directory.
- Non-goals: live provider/service/SSH mutation, model downloads, global OpenCode configuration, publication, or Git mutation.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Orchestration input schema: `.opencode/schemas/orchestration-input.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.
- `research-config-surface`: dependsOn: none; requiredRoles: researcher; status: completed
- `plan-yaml-contract`: dependsOn: research-config-surface; requiredRoles: planner; status: completed
- `implement-yaml-contract`: dependsOn: plan-yaml-contract; requiredRoles: implementer; status: completed
- `validate-yaml-contract`: dependsOn: implement-yaml-contract; requiredRoles: validator; status: failed-final-remediation-exhausted

## Sub-Workflows

- `central-node-config`: goal: one private YAML source and generated compatibility artifacts only where unavoidable; remediationLoopsUsed: 0; status: in-progress

## Delegation Packets

- `research-config-surface-researcher-001`: fresh research packet
- `plan-yaml-contract-planner-001`: fresh planning packet
- `implement-yaml-contract-implementer-001`: fresh integration packet
- `implement-yaml-contract-implementer-002`: fresh integration packet with explicit archive authorization
- `implement-yaml-contract-implementer-003`: fresh bounded remediation packet
- `implement-yaml-contract-implementer-004`: fresh explicitly authorized extra remediation packet
- `validate-yaml-contract-validator-001`: fresh integration-check packet
- `implement-yaml-contract-implementer-005`: fresh final explicitly authorized remediation packet
- `validate-yaml-contract-validator-002`: fresh final integration-check packet

## Delegated Tasks

- `centralize-research-001`: scopeKey: research-config-surface; role: researcher; taskMode: research; artifactId: root-researcher-001-config-surface; dispatchKind: fresh; childTaskOrSessionId: ses_fb4af716affeU5FD8IpPfQcF7M; terminalStatus: completed
- `centralize-plan-001`: scopeKey: plan-yaml-contract; role: planner; taskMode: plan; artifactId: root-planner-001-yaml-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb4ab79bbffeWRQlmtNPvMcxrH; terminalStatus: completed
- `centralize-implement-001`: scopeKey: implement-yaml-contract; role: implementer; taskMode: integration; artifactId: root-implementer-001-yaml-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb4a62bfeffe78FqcvKEsHo5ut; terminalStatus: blocked-no-edits
- `centralize-implement-002`: scopeKey: implement-yaml-contract; role: implementer; taskMode: integration; artifactId: root-implementer-002-yaml-contract; dispatchKind: fresh; childTaskOrSessionId: pending; predecessorTaskOrArtifact: root-implementer-001-yaml-contract; terminalStatus: pending
- `centralize-remediate-001`: scopeKey: implement-yaml-contract; role: implementer; taskMode: integration; artifactId: root-implementer-003-yaml-remediation; dispatchKind: fresh; childTaskOrSessionId: ses_fb498fc74ffenNhWT7vAlfJS1l; predecessorTaskOrArtifact: root-implementer-002-yaml-contract; remediationLoop: 1; terminalStatus: blocked-contract-gaps
- `centralize-remediate-002`: scopeKey: implement-yaml-contract; role: implementer; taskMode: integration; artifactId: root-implementer-004-context-remediation; dispatchKind: fresh; childTaskOrSessionId: pending; predecessorTaskOrArtifact: root-implementer-003-yaml-remediation; remediationLoop: 2-explicitly-authorized; terminalStatus: pending
- `centralize-validate-001`: scopeKey: validate-yaml-contract; role: validator; taskMode: integration-check; artifactId: root-validator-001-yaml-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb46c9603ffelMidoLjKvOf566; predecessorTaskOrArtifact: root-implementer-004-context-remediation; terminalStatus: failed-four-blockers
- `centralize-remediate-003`: scopeKey: implement-yaml-contract; role: implementer; taskMode: integration; artifactId: root-implementer-005-final-remediation; dispatchKind: fresh; childTaskOrSessionId: pending; predecessorTaskOrArtifact: root-validator-001-yaml-contract; remediationLoop: 3-explicitly-authorized-final; terminalStatus: pending
- `centralize-validate-002`: scopeKey: validate-yaml-contract; role: validator; taskMode: integration-check; artifactId: root-validator-002-yaml-final; dispatchKind: fresh; childTaskOrSessionId: ses_fb4590e1effeeDzHbmULENED1T; predecessorTaskOrArtifact: root-implementer-005-final-remediation; terminalStatus: failed-three-blockers

## Role Trace Artifacts

- `researcher`: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/researcher/root-researcher-001-config-surface.md`
- `planner`: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/planner/root-planner-001-yaml-contract.md`
- `implementer`: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-001-yaml-contract.md` (blocked); `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-002-yaml-contract.md` (partial); `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-003-yaml-remediation.md` (blocked); `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-004-context-remediation.md` (completed); `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-005-final-remediation.md` (completed)
- `validator`: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/validator/root-validator-001-yaml-contract.md` (failed); `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/validator/root-validator-002-yaml-final.md` (failed)

## Validation Evidence

- Commands: pending
- Results: all eleven assigned offline commands pass and the sole-parser blocker is closed. Final validation still blocks on one private scalar mirrored in a test, private node slugs in parity mismatch diagnostics, and missing remote controller-commit/status-loss/failpoint plus installer old-schema coverage.
- Skipped checks: live provider, model, SSH, Docker/service mutation, and network actions.

## Decisions

- Accepted decisions: private ignored owner-mode-0600 `config/nodes.yaml`; committed safe example/schema; serial execution; no Git mutation; archive three unresolved context plans without applying; one additional bounded remediation cycle explicitly authorized after the default budget was exhausted.
- Remaining risks: remote controller-commit compensation and status-loss paths lack executable proof; installer old-schema coverage remains partial; strict privacy/value-silent gates still have two defects. Do not activate this migration.
