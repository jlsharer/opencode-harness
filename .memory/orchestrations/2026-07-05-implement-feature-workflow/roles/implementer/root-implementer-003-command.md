# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-05-implement-feature-workflow`
- role: `implementer`
- artifactId: `root-implementer-003-command`
- createdAt: `2026-07-05`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Implementer request scoped to create only `.opencode/commands/implement-feature.md`, using researcher artifact `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md` and planner artifact `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`.
- Required context present: yes; required command style, role contract, trace schema, memory protocol, research evidence, planner file contract, and current orchestration index were inspected.
- Routing metadata status: absent

## Work Performed

- Summary: Created the orchestrator-owned `/implement-feature` command prompt and updated this role trace plus orchestration index reference for the command implementer node.
- Files read:
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/protocols/memory-management.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.opencode/commands/delegate-orchestration.md`
- Files changed:
  - `.opencode/commands/implement-feature.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-003-command.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
- Commands/checks:
  - `mkdir -p ".memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer"`

## Output Contract

- Outputs: Added command file with `description` and `subtask: false` frontmatter only; no `agent`; no `model`; body defines parent orchestration intake, phased delegation workflow, routing metadata preservation, local-model context economy, remediation limits, trace artifacts, and validation-before-acceptance requirements.
- Evidence:
  - `.opencode/commands/implement-feature.md` frontmatter follows the existing orchestrator-owned command style from `.opencode/commands/delegate-orchestration.md`.
  - The command body requires collection or confirmation of goal, scope boundaries, non-goals, acceptance criteria, connector/documentation sources, allowed paths, write permissions, memory root, contract/schema/workflow/skill references, and routing metadata.
  - The command body preserves the caller-supplied routing labels exactly when present and requires `routingMetadataStatus: absent` when absent.
  - The command body requires intake, source research, requirements synthesis, scoped planning, parallel implementers, integration, validation/artifact proof, review/synthesis/final acceptance, narrow packets, max 3 remediation loops, and validation before acceptance.
- Artifact links:
  - `.opencode/commands/implement-feature.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-003-command.md`

## Handoff

- Next role: `integrator` after remaining implementation branches complete.
- Limitations: Scoped to command creation and memory/index updates only; did not create workflow guidance, manifest/routing updates, or validation asset updates; did not run final harness validation because parallel planned assets are not yet implemented.
- Risks: Current repository validation may fail until manifest, routing, validation script, and validation documentation branches are completed as planned.
