# 2026-08-04-harness-portability

## Scope

- Request: Define and integrate a source/release profile and a destination-independent `portable-core` harness profile.
- Allowed edit scope: Approved I1-I5 implementation paths, retained role traces, this orchestration index, and `.memory/INDEX.md`.
- Non-goals: Editing the ignored custom routing override, adding provider transport, copying source-only roots/history into portable installs, or replacing validator/artifact-verifier acceptance evidence.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: None; caller routing metadata was absent, so no values were invented.
- Routing preflight: unavailable because the ignored custom routing override is invalid; committed fixtures are used explicitly for deterministic checks.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `R1`:
  - scope: Portable dependency audit.
  - dependsOn: none
  - parallelizableWith: `R2`
  - requiredRoles: `researcher`
  - status: complete
- `R2`:
  - scope: Routing portability cases.
  - dependsOn: none
  - parallelizableWith: `R1`
  - requiredRoles: `researcher`
  - status: complete
- `P1`:
  - scope: Portability implementation plan and contracts.
  - dependsOn: `R1`, `R2`
  - parallelizableWith: none
  - requiredRoles: `planner`
  - status: complete
- `I1`:
  - scope: Trace contract and minimal memory seeds.
  - dependsOn: `P1`
  - parallelizableWith: `I2`
  - requiredRoles: `implementer`
  - status: complete
- `I2`:
  - scope: Neutral/local routing fixtures, policy, schema, and tests.
  - dependsOn: `P1`
  - parallelizableWith: `I1`
  - requiredRoles: `implementer`
  - status: complete
- `I3`:
  - scope: Portable documentation and runtime-reference scrub.
  - dependsOn: `P1`
  - parallelizableWith: `I1`, `I2`
  - requiredRoles: `implementer`
  - status: complete
- `I4`:
  - scope: Portable manifest, bootstrap, installed validator, and E2E tests.
  - dependsOn: `I1`, `I2`, `I3`
  - parallelizableWith: none after inventory freeze
  - requiredRoles: `implementer`
  - status: complete
- `I5`:
  - scope: Source manifest, release QA, and source-only guidance.
  - dependsOn: `I1`, `I2`, `I3`, `I4`
  - parallelizableWith: none
  - requiredRoles: `implementer`
  - status: complete
- `G1`:
  - scope: Cross-profile integration and index reconciliation.
  - dependsOn: `I1`, `I2`, `I3`, `I4`, `I5`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: complete
- `RV1`:
  - scope: Initial defect review.
  - dependsOn: `G1`
  - parallelizableWith: none
  - requiredRoles: `reviewer`
  - status: complete; blocking findings issued
- `RM1`:
  - scope: Remediation loop 1 for bootstrap safety, portable validation, path leakage, and source documentation.
  - dependsOn: `RV1`
  - parallelizableWith: documentation remediation where independent
  - requiredRoles: `implementer`
  - status: complete
- `RV2`:
  - scope: Remediation loop 1 review.
  - dependsOn: `RM1`
  - parallelizableWith: none
  - requiredRoles: `reviewer`
  - status: complete; additional blocking findings issued
- `RM2`:
  - scope: Remediation loop 2 for target binding, exact inventory, path detection, and capability contract.
  - dependsOn: `RV2`
  - parallelizableWith: none
  - requiredRoles: `implementer`
  - status: complete
- `RV3`:
  - scope: Remediation loop 2 review.
  - dependsOn: `RM2`
  - parallelizableWith: none
  - requiredRoles: `reviewer`
  - status: complete; remaining blocking findings issued
- `RM3`:
  - scope: Remediation loop 3 for descriptor-only publication, all-parent capability preflight, cleanup, and UNC detection.
  - dependsOn: `RV3`
  - parallelizableWith: none
  - requiredRoles: `implementer`
  - status: complete; remediation loop limit reached
- `RV4`:
  - scope: Final acceptance review after remediation loop 3.
  - dependsOn: `RM3`
  - parallelizableWith: none
  - requiredRoles: `reviewer`
  - status: complete; reviewer unblocked with no HIGH or MEDIUM findings
- `G2`:
  - scope: Final manifest/capability/inventory and memory-index integration.
  - dependsOn: `RV4`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: complete
- `V1`:
  - scope: Final acceptance matrix.
  - dependsOn: `G2`
  - parallelizableWith: post-remediation artifact verification where independent
  - requiredRoles: `validator`
  - status: complete; implementation validation passed in trace 020 and final acceptance passed in superseding trace 022
- `AV1`:
  - scope: Initial temporary installed-tree proof.
  - dependsOn: `G1`
  - parallelizableWith: initial review where independent
  - requiredRoles: `artifact-verifier`
  - status: complete for the pre-remediation build; retained evidence is superseded for final loop-3 acceptance
- `AV2`:
  - scope: Post-remediation temporary installed-tree proof.
  - dependsOn: `G2`
  - parallelizableWith: `V1` where independent
  - requiredRoles: `artifact-verifier`
  - status: complete; current post-loop3 tree, hashes, behavior, and cleanup verified in trace 021
- `A1`:
  - scope: Acceptance decision.
  - dependsOn: `V1`, `AV2`
  - parallelizableWith: none
  - requiredRoles: orchestrator; `synthesizer` if needed
  - status: complete; PASS — final acceptance granted by superseding validator trace 022
- `G3`:
  - scope: Acceptance closure and final index consistency.
  - dependsOn: `V1`, `AV2`, `A1`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: complete

## Sub-Workflows

- `portable-core-profile`:
  - parent: `2026-08-04-harness-portability`
  - goal: Install and validate the managed portable profile in a foreign repository without source roots or history.
  - acceptanceCriteria: Portable validator, routing suite, E2E install proof, and independent artifact verification pass.
  - remediationLoopsUsed: 3
  - status: complete; final acceptance PASS
- `source-release-qa`:
  - parent: `2026-08-04-harness-portability`
  - goal: Keep the complete source inventory and source-only QA coherent with the portable subset.
  - acceptanceCriteria: Source validator and task-specific checks pass, followed by validator evidence.
  - remediationLoopsUsed: 1 documentation remediation within the three overall portability loops
  - status: complete; final acceptance PASS

## Delegation Packets

- None retained.

## Role Trace Artifacts

- `researcher`:
  - [`portability-researcher-001-dependencies`](roles/researcher/portability-researcher-001-dependencies.md)
  - [`routing-researcher-002-cases`](roles/researcher/routing-researcher-002-cases.md)
- `planner`:
  - [`root-planner-003-portability-plan`](roles/planner/root-planner-003-portability-plan.md)
- `implementer`:
  - [`memory-implementer-004-seeds`](roles/implementer/memory-implementer-004-seeds.md)
  - [`routing-implementer-005-neutral`](roles/implementer/routing-implementer-005-neutral.md)
  - [`docs-implementer-006-scrub`](roles/implementer/docs-implementer-006-scrub.md)
  - [`portable-implementer-007-bootstrap`](roles/implementer/portable-implementer-007-bootstrap.md)
  - [`source-implementer-008-release-qa`](roles/implementer/source-implementer-008-release-qa.md)
  - [`portable-implementer-012-remediation`](roles/implementer/portable-implementer-012-remediation.md)
  - [`source-implementer-013-doc-remediation`](roles/implementer/source-implementer-013-doc-remediation.md)
  - [`portable-implementer-015-remediation-loop2`](roles/implementer/portable-implementer-015-remediation-loop2.md)
  - [`portable-implementer-017-remediation-loop3`](roles/implementer/portable-implementer-017-remediation-loop3.md)
- `integrator`:
  - [`root-integrator-009-profiles`](roles/integrator/root-integrator-009-profiles.md)
  - [`root-integrator-019-final-index`](roles/integrator/root-integrator-019-final-index.md)
  - [`root-integrator-023-closure`](roles/integrator/root-integrator-023-closure.md)
- `validator`:
  - [`root-validator-020-final-acceptance`](roles/validator/root-validator-020-final-acceptance.md) — implementation PASS; orchestration acceptance initially withheld pending AV2
  - [`root-validator-022-accepted`](roles/validator/root-validator-022-accepted.md) — supersedes trace 020 provisional decision; final acceptance PASS
- `reviewer`:
  - [`root-reviewer-010-defects`](roles/reviewer/root-reviewer-010-defects.md)
  - [`root-reviewer-014-remediation-review`](roles/reviewer/root-reviewer-014-remediation-review.md)
  - [`root-reviewer-016-final-review`](roles/reviewer/root-reviewer-016-final-review.md)
  - [`root-reviewer-018-acceptance-review`](roles/reviewer/root-reviewer-018-acceptance-review.md) — unblocked; no HIGH or MEDIUM findings remain
- `synthesizer`: not required unless conflicts/blockers arise
- `artifact-verifier`:
  - [`portable-artifact-verifier-011-temp-install`](roles/artifact-verifier/portable-artifact-verifier-011-temp-install.md) — retained historical pre-remediation evidence; superseded for final acceptance
  - [`portable-artifact-verifier-021-final-temp-install`](roles/artifact-verifier/portable-artifact-verifier-021-final-temp-install.md) — current post-loop3 AV2 evidence; exact tree/hash/cleanup PASS

## Validation Evidence

- Commands: Initial integration checks are recorded in [`root-integrator-009-profiles`](roles/integrator/root-integrator-009-profiles.md); manifest/capability checks are recorded in [`root-integrator-019-final-index`](roles/integrator/root-integrator-019-final-index.md); final source/portable validators, diff hygiene, and complete index-link checks are recorded in [`root-integrator-023-closure`](roles/integrator/root-integrator-023-closure.md). Validator evidence is in traces 020 and 022, with current generated-tree proof in artifact-verifier trace 021.
- Results: PASS. All planner gates A1-A13 are accepted by validator trace 022. AV2 confirms the final 47-file installed tree, 43/43 managed hashes, 4/4 memory seed hashes, descriptor capability behavior, and cleanup. Source and portable validators and final index consistency pass.
- Skipped checks: Live OpenCode restart, providers, routing service, network, endpoint health, and model execution were not exercised. Implicit source routing is unavailable because the ignored custom override is invalid.

## Decisions

- Accepted decisions: `portable-core` is governed only by `.opencode/portable.manifest.json`; source/release QA remains a superset; destination roots and orchestration history are not portable prerequisites; the committed routing default is neutral and the enabled-local fixture is explicit only.
- Acceptance history: Validator trace 020 passed implementation validation but explicitly withheld orchestration acceptance because current AV2 evidence was absent. Artifact-verifier trace 021 then supplied post-loop3 exact tree/hash/cleanup proof. Validator trace 022 superseded only that provisional decision and granted final acceptance PASS.
- Final decision: **PASS — orchestration accepted and closed.** V1, AV2, A1, and final closure integration are complete.
- Remaining risks: Process interruption after publication begins can leave partial installation artifacts; `/dev/fd`, live providers, routing services, network/model execution, and operational restart were not exercised. The ignored custom routing override remains invalid and fail-closed. Fully quit and restart OpenCode before relying on changed config-time/plugin behavior.
