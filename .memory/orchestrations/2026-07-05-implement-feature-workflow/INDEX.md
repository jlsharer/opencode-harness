# 2026-07-05-implement-feature-workflow

## Scope

- Request: Research, plan, and implement harness assets for an `implement-feature` workflow that uses phased delegated role work.
- Accepted implementation surface: `.opencode/commands/implement-feature.md`, `.opencode/workflows/implement-feature-workflow.md`, `.opencode/harness.manifest.json`, `.opencode/routing/harness-model-routing.json`, `.opencode/scripts/validate-harness.mjs`, `.opencode/workflows/validation-workflow.md`, `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`, and orchestration memory/index artifacts.
- Acceptance status: final validator evidence accepted by `root-validator-009-final`; final synthesis recorded by `root-synthesizer-010-final`.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none; caller stated routing metadata absent.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- `root-researcher-001-workflow-context`:
  - scope: command/workflow conventions and acceptance context for `implement-feature`
  - dependsOn: []
  - parallelizableWith: []
  - requiredRoles: [`researcher`]
  - status: complete
- `root-planner-002-implementation-plan`:
  - scope: bounded implementation plan, file contracts, DAG, parallelization, and verification gates
  - dependsOn: [`root-researcher-001-workflow-context`]
  - parallelizableWith: []
  - requiredRoles: [`planner`]
  - status: complete
- `root-implementer-003-command`:
  - scope: `.opencode/commands/implement-feature.md`
  - dependsOn: [`root-planner-002-implementation-plan`]
  - parallelizableWith: [`root-implementer-004-workflow-doc`, `root-implementer-005-routing-manifest`, `root-implementer-006-validation-assets`]
  - requiredRoles: [`implementer`]
  - status: complete
- `root-implementer-004-workflow-doc`:
  - scope: `.opencode/workflows/implement-feature-workflow.md`
  - dependsOn: [`root-planner-002-implementation-plan`]
  - parallelizableWith: [`root-implementer-003-command`, `root-implementer-005-routing-manifest`, `root-implementer-006-validation-assets`]
  - requiredRoles: [`implementer`]
  - status: complete
- `root-implementer-005-routing-manifest`:
  - scope: `.opencode/harness.manifest.json` and `.opencode/routing/harness-model-routing.json`
  - dependsOn: [`root-planner-002-implementation-plan`]
  - parallelizableWith: [`root-implementer-003-command`, `root-implementer-004-workflow-doc`, `root-implementer-006-validation-assets`]
  - requiredRoles: [`implementer`]
  - status: complete
- `root-implementer-006-validation-assets`:
  - scope: `.opencode/scripts/validate-harness.mjs`, `.opencode/workflows/validation-workflow.md`, and `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
  - dependsOn: [`root-planner-002-implementation-plan`]
  - parallelizableWith: [`root-implementer-003-command`, `root-implementer-004-workflow-doc`, `root-implementer-005-routing-manifest`]
  - requiredRoles: [`implementer`]
  - status: complete
- `root-integrator-007-consistency`:
  - scope: command/workflow/manifest/routing/validation consistency
  - dependsOn: [`root-implementer-003-command`, `root-implementer-004-workflow-doc`, `root-implementer-005-routing-manifest`, `root-implementer-006-validation-assets`]
  - parallelizableWith: []
  - requiredRoles: [`integrator`]
  - status: complete
- `root-validator-009-final`:
  - scope: command-backed final validation and acceptance matrix
  - dependsOn: [`root-integrator-007-consistency`]
  - parallelizableWith: []
  - requiredRoles: [`validator`]
  - status: accepted
- `root-reviewer-008-defect-review`:
  - scope: defect-focused review of combined changes and validation gaps
  - dependsOn: [`root-integrator-007-consistency`]
  - parallelizableWith: [`root-validator-009-final`]
  - requiredRoles: [`reviewer`]
  - status: complete
- `root-synthesizer-010-final`:
  - scope: final synthesis of accepted outcomes, DAG, role table, risks, validation evidence, and next steps
  - dependsOn: [`root-validator-009-final`, `root-reviewer-008-defect-review`]
  - parallelizableWith: []
  - requiredRoles: [`synthesizer`]
  - status: complete

## Sub-Workflows

- `root`:
  - parent: none
  - goal: create an orchestrator-owned `/implement-feature` command and project-local workflow guidance with manifest/routing/validation support
  - acceptanceCriteria: implementation paths satisfy planner file contracts and final validator trace includes passing command-backed evidence
  - remediationLoopsUsed: 0
  - status: accepted; final validation passed; final synthesis complete

## Delegation Packets

- `root-researcher-001-workflow-context`: supplied in user prompt.
- `root-planner-002-implementation-plan`: supplied by planner artifact.

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-workflow-context`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
- `planner`:
  - `root-planner-002-implementation-plan`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`
- `implementer`:
  - `root-implementer-003-command`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-003-command.md`
  - `root-implementer-004-workflow-doc`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-004-workflow-doc.md`
  - `root-implementer-005-routing-manifest`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-005-routing-manifest.md`
  - `root-implementer-006-validation-assets`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-006-validation-assets.md`
- `integrator`:
  - `root-integrator-007-consistency`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/integrator/root-integrator-007-consistency.md`
- `validator`:
  - `root-validator-009-final`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/validator/root-validator-009-final.md`
- `reviewer`:
  - `root-reviewer-008-defect-review`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/reviewer/root-reviewer-008-defect-review.md`
- `synthesizer`:
  - `root-synthesizer-010-final`: `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/synthesizer/root-synthesizer-010-final.md`
- `artifact-verifier`:

## Validation Evidence

- Commands: implementers ran JSON parse checks for `.opencode/harness.manifest.json` and `.opencode/routing/harness-model-routing.json`, `node .opencode/routing/resolve-model-routing.mjs --command /implement-feature`, `node --check .opencode/scripts/validate-harness.mjs`, and `node .opencode/scripts/validate-harness.mjs`; integrator ran `node --check .opencode/scripts/validate-harness.mjs`, `node .opencode/routing/resolve-model-routing.mjs --command /implement-feature`, a lightweight JSON/frontmatter consistency check, and `node .opencode/scripts/validate-harness.mjs`; final validation accepted by `root-validator-009-final`.
- Results: routing resolver returned `source: "orchestratorCommand"`, `agent: null`, and `variant: "feature-implementation"`; validation script syntax check passed; harness validation passed with a Node `MODULE_TYPELESS_PACKAGE_JSON` warning for `.opencode/plugins/index.js` during implementer/integrator/final validator checks; integrator consistency checks passed; final validation accepted by `root-validator-009-final`.
- Final synthesis: `root-synthesizer-010-final` recommends acceptance based on validator evidence, with residual risks limited to future real-feature dogfooding, future connector/source evidence quality, the known Node warning, and optional review of the noted `opencode.json` permission diff.
- Skipped checks: none for validation-assets implementer self-check; no required checks were skipped by final validator.

## Decisions

- Accepted decisions: create both `.opencode/commands/implement-feature.md` and `.opencode/workflows/implement-feature-workflow.md`; update manifest, routing, validation script, validation workflow, and validation checklist.
- Recommended decision: accept the `/implement-feature` workflow implementation as complete for this orchestration, per `root-synthesizer-010-final` and validator evidence in `root-validator-009-final`.
- Remaining risks: future `/implement-feature` runs must still provide connector/source evidence and avoid storing secrets in memory artifacts; optional follow-up may address the known Node module-type warning or dogfood the workflow end-to-end.
