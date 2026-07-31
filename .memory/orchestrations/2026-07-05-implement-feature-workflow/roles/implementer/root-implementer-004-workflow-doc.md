# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-05-implement-feature-workflow`
- role: `implementer`
- artifactId: `root-implementer-004-workflow-doc`
- createdAt: `2026-07-05`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: User-assigned implementer scope to create project-local workflow guidance at `.opencode/workflows/implement-feature-workflow.md`, using researcher artifact `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md` and planner artifact `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`.
- Required context present: yes; target path, allowed edit scope, workflow boundary, fixed roles, context-window discipline, connector source handling, parallel implementation strategy, integration/validation gates, memory conventions, and trace requirements were supplied or confirmed from project contracts.
- Routing metadata status: absent

## Work Performed

- Summary: Created a plain Markdown project-local `implement-feature` workflow document and indexed this implementer trace in orchestration memory.
- Files read:
  - `.memory/protocols/memory-management.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.memory/INDEX.md`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/scripts/validate-harness.mjs`
- Files changed:
  - `.opencode/workflows/implement-feature-workflow.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-004-workflow-doc.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.memory/INDEX.md`
- Commands/checks:
  - `node .opencode/scripts/validate-harness.mjs` — first run failed while cross-scope manifest/script changes were still inconsistent; rerun passed after those other scoped updates landed, with a Node `MODULE_TYPELESS_PACKAGE_JSON` warning for `.opencode/plugins/index.js`.

## Output Contract

- Outputs: Added workflow guidance covering non-native workflow boundary, delegated DAG phases, fixed-role responsibilities, local-model context discipline, connector source handling, parallel implementation strategy, integration/validation gates, and memory trace conventions.
- Evidence: `.opencode/workflows/implement-feature-workflow.md` is plain Markdown with no frontmatter and includes the required project-local boundary plus acceptance standard. Orchestration index references this trace artifact. Harness validation passed on rerun after other scoped implementation updates landed.
- Artifact links:
  - `.opencode/workflows/implement-feature-workflow.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/implementer/root-implementer-004-workflow-doc.md`

## Handoff

- Next role: `integrator`
- Limitations: This scope intentionally did not edit command, config, manifest, routing, or script files. Full workflow acceptance remains pending downstream integration and validation.
- Risks: Current worktree includes command/manifest/routing/validation changes from other scopes; downstream integrator and validator must review the combined diff, not only this workflow document.
