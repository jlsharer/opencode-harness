# 2026-08-28-simplify-opencode-local

## Scope

- Request: Provide one easy OpenCode launcher usable from any directory, with harness assets and simple mixed, local-only, or cloud-only routing plus easy node addition.
- Allowed edit scope: `/home/joshl/projects/opencode-harness`, `/home/joshl/ai-infrastructure/llama-server`, `/home/joshl/.zshrc`, and owner-only launcher state beneath `/home/joshl/.local` or `/home/joshl/.config` when required.
- Non-goals: provider credentials, model downloads, server lifecycle mutation, publication, Git mutation, or unrelated historical cleanup.

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
- `research-current-friction`: scope: current launch/config/node surfaces; dependsOn: none; parallelizableWith: none; requiredRoles: researcher; status: completed
- `plan-simple-contract`: scope: smallest user-facing contract; dependsOn: research-current-friction; parallelizableWith: none; requiredRoles: planner; status: completed
- `implement-simple-contract`: scope: approved launcher/config simplification plus one bounded remediation; dependsOn: plan-simple-contract; parallelizableWith: none; requiredRoles: implementer; status: completed
- `validate-simple-contract`: scope: independent acceptance; dependsOn: implement-simple-contract; parallelizableWith: none; requiredRoles: validator; status: completed

## Sub-Workflows

- `simple-local-opencode`: parent: root; goal: one launcher and one routing/node configuration model; acceptanceCriteria: offline launch-path proof, two local nodes projected, three strict routing modes, easy node addition; remediationLoopsUsed: 1; status: accepted

## Delegation Packets

- `research-current-friction-researcher-001`: rejected malformed fresh envelope
- `research-current-friction-researcher-002`: fresh research retry packet
- `plan-simple-contract-planner-001`: fresh planning packet
- `implement-simple-contract-implementer-001`: fresh integration packet
- `validate-simple-contract-validator-001`: fresh integration-check packet
- `implement-simple-contract-implementer-002`: fresh remediation packet
- `validate-simple-contract-validator-002`: fresh final integration-check packet

## Delegated Tasks

- `simplify-research-001`: scopeKey: research-current-friction; role: researcher; taskMode: research; artifactId: root-researcher-001-current-friction; dispatchKind: fresh; childTaskOrSessionId: rejected; parentSessionId: current; predecessorTaskOrArtifact: none; clarificationRequestNonceStatus: none; remediationLoop: 0; terminalStatus: failed-malformed-envelope
- `simplify-research-002`: scopeKey: research-current-friction; role: researcher; taskMode: research; artifactId: root-researcher-002-current-friction; dispatchKind: fresh; childTaskOrSessionId: ses_fb500bdaeffeuXvGMCFOL2Wscb; parentSessionId: current; predecessorTaskOrArtifact: simplify-research-001; clarificationRequestNonceStatus: none; remediationLoop: 1; terminalStatus: completed
- `simplify-plan-001`: scopeKey: plan-simple-contract; role: planner; taskMode: plan; artifactId: root-planner-001-simple-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb4fc804effecUDuiGyr90e0Ao; parentSessionId: current; predecessorTaskOrArtifact: root-researcher-002-current-friction; clarificationRequestNonceStatus: none; remediationLoop: 0; terminalStatus: completed
- `simplify-implement-001`: scopeKey: implement-simple-contract; role: implementer; taskMode: integration; artifactId: root-implementer-001-simple-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb4f84e44ffeMu6Xp01306AfZC; parentSessionId: current; predecessorTaskOrArtifact: root-planner-001-simple-contract; clarificationRequestNonceStatus: none; remediationLoop: 0; terminalStatus: completed
- `simplify-validate-001`: scopeKey: validate-simple-contract; role: validator; taskMode: integration-check; artifactId: root-validator-001-simple-contract; dispatchKind: fresh; childTaskOrSessionId: ses_fb4e8378dffeLAYZpTv43zXgZd; parentSessionId: current; predecessorTaskOrArtifact: root-implementer-001-simple-contract; clarificationRequestNonceStatus: none; remediationLoop: 0; terminalStatus: failed-two-blockers
- `simplify-remediate-001`: scopeKey: implement-simple-contract; role: implementer; taskMode: integration; artifactId: root-implementer-002-remediation; dispatchKind: fresh; childTaskOrSessionId: ses_fb4e3bc78ffeBrtonyRU6Zc8nk; parentSessionId: current; predecessorTaskOrArtifact: root-validator-001-simple-contract; clarificationRequestNonceStatus: none; remediationLoop: 1; terminalStatus: completed
- `simplify-validate-002`: scopeKey: validate-simple-contract; role: validator; taskMode: integration-check; artifactId: root-validator-002-final; dispatchKind: fresh; childTaskOrSessionId: ses_fb4de634affeiyIPLb1oPdMTxY; parentSessionId: current; predecessorTaskOrArtifact: root-implementer-002-remediation; clarificationRequestNonceStatus: none; remediationLoop: 1; terminalStatus: completed-pass

## Role Trace Artifacts

- `researcher`: `root-researcher-002-current-friction`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/researcher/root-researcher-002-current-friction.md`
- `planner`: `root-planner-001-simple-contract`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/planner/root-planner-001-simple-contract.md`
- `implementer`: `root-implementer-001-simple-contract`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/implementer/root-implementer-001-simple-contract.md`; `root-implementer-002-remediation`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/implementer/root-implementer-002-remediation.md`
- `validator`: `root-validator-001-simple-contract`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/validator/root-validator-001-simple-contract.md` (failed); `root-validator-002-final`: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/validator/root-validator-002-final.md` (passed)

## Validation Evidence

- Commands: harness syntax, routing, runtime, foreign-repository, portable, source/portable validators, package dry run, infrastructure syntax/projection/integration fixtures, both diff checks, and interactive zsh activation.
- Results: final independent validation passed; routing 40/40, runtime 38/38, foreign repository 8 passed with 1 expected skip, portable 18 passed with 4 Darwin skips, both infrastructure suites passed, package 0.1.12 contains 40 dry-run entries.
- Skipped checks: live TUI, provider/model/endpoint/credential, SSH/tunnel/service, and network checks were outside authorization.

## Decisions

- Accepted decisions: one `opencode-local` front door; any directory inside a trusted Git worktree; `nodes.tsv` as the canonical node/default registry; transient generated launch inputs; strict mixed/local-only/cloud-only provider classes; thin user-global shell function; package 0.1.12; no Git mutation.
- Remaining risks: native provider filters and real model availability are proven offline only; fully quit and restart OpenCode before a separately authorized live launch.
