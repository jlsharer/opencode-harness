# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-05-implement-feature-workflow`
- role: `researcher`
- artifactId: `root-researcher-001-workflow-context`
- createdAt: `2026-07-05`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Scoped research request for where and how to add an `implement-feature` workflow using existing role/subagent types; required paths; routing metadata status; downstream needs for planner/implementer.
- Required context present: yes; required files/directories were inspected except there is no existing `implement-feature` asset.
- Routing metadata status: absent

## Work Performed

- Summary: Inspected role contracts, trace schema, delegation skill, workflow docs, command prompts, role agents, manifest, routing config, workflow guidance skill, and memory templates to identify conventions and likely implementation targets.
- Files read:
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
  - `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
  - `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/commands/delegate-orchestration.md`
  - `.opencode/commands/delegate-research.md`
  - `.opencode/commands/delegate-plan.md`
  - `.opencode/commands/delegate-implement.md`
  - `.opencode/commands/delegate-integrate.md`
  - `.opencode/commands/delegate-validate.md`
  - `.opencode/commands/delegate-artifact-verify.md`
  - `.opencode/agents/{researcher,planner,implementer,integrator,validator,reviewer,synthesizer,artifact-verifier}.md`
  - `.opencode/harness.manifest.json`
  - `.opencode/routing/harness-model-routing.json`
  - `.memory/templates/orchestration-index.md`
  - `.memory/templates/role-trace-artifact.md`
- Files changed:
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
- Commands/checks:
  - Directory/file inspection via Read/Glob/Grep tools.
  - `ls .memory/orchestrations` before creating the orchestration memory directory.

## Output Contract

- Outputs: Source-backed findings, likely implementation files, acceptance criteria, risks, and handoff to planner.
- Evidence:
  1. **Where `implement-feature` should live.** Direct evidence: `.opencode/workflows/*.md` is project-local guidance, not an official native OpenCode workflow schema; slash commands belong under `.opencode/commands/*.md` when user-invoked. This is stated by the workflow guidance skill: use commands for user-invoked slash commands and project-local workflow documents for process guidance, and do not invent workflow frontmatter as official standards. The existing `.opencode/workflows/` directory contains only `delegation-workflow.md` and `validation-workflow.md`, while `.opencode/commands/` contains invocable `delegate-*` commands. Inference: `implement-feature` should likely be both an invocable command at `.opencode/commands/implement-feature.md` and a project-local process document at `.opencode/workflows/implement-feature-workflow.md` if the user wants a slash-command entry point plus detailed reusable workflow guidance; if only guidance is desired, the workflow doc alone is enough.
  2. **Orchestrator-owned command convention.** Direct evidence: `/delegate-orchestration` omits `agent` and sets `subtask: false`, and says it must not route to a fixed subagent because it coordinates subagent instances through the delegation protocol (`.opencode/commands/delegate-orchestration.md` lines 1-8). AGENTS.md also says `/delegate-orchestration` is orchestrator-owned, omits command `agent` frontmatter, builds a DAG, requires research before planning, and validation before acceptance. Inference: an `implement-feature` slash command that orchestrates all phases should also be orchestrator-owned and omit `agent`; whether it should set `subtask: false` should follow `/delegate-orchestration` if it is a top-level workflow command.
  3. **Role names and routing.** Direct evidence: fixed roles are `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier` in the contract schema and memory protocol; the role routing matrix maps research, planning, implementation, integration, validation, review, synthesis, and artifact proof to those roles. Existing agent files use `mode: subagent` and permission frontmatter. Inference: the requested “corresponding implementation subagents” should use repeatable `implementer` role instances scoped by target/component, not new role names, unless future requirements add role specialization.
  4. **Command frontmatter conventions.** Direct evidence: role-specific commands (`delegate-research`, `delegate-plan`, `delegate-implement`, `delegate-integrate`, `delegate-validate`, `delegate-artifact-verify`) have only `description` and `agent` frontmatter; `/delegate-orchestration` has `description` and `subtask: false` and intentionally omits `agent`. Validation docs require command frontmatter to include `description` and `agent`, with `/delegate-orchestration` specifically omitting `agent`, and no command file may set `model` (`.opencode/workflows/validation-workflow.md` lines 11-16; validation checklist lines 10-12). Inference: if `implement-feature` is orchestrator-owned, validator/planner should account for the exception to role-specific command rules, possibly updating validation assets if current checks only special-case `/delegate-orchestration`.
  5. **Workflow doc style.** Direct evidence: existing workflow docs are plain Markdown with heading, purpose, boundaries/required checks, numbered phase gates, and completion/acceptance standard; no frontmatter is used in current workflow docs. The workflow guidance skill warns not to invent workflow frontmatter or official workflow schema. Inference: `.opencode/workflows/implement-feature-workflow.md` should be plain Markdown documenting purpose, boundaries, phases/DAG, context economy, parallel strategy, role gates, artifact requirements, and validation standard.
  6. **Validation expectations.** Direct evidence: validation workflow requires existence/JSON parse checks, agent frontmatter checks, command frontmatter checks, routing resolver checks, plugin dependency checks, `node .opencode/scripts/validate-harness.mjs`, secret/prior-projection scan, and explicit pass/fail evidence. The delegation skill and workflows state lifecycle hooks/plugins are guardrails only and cannot replace validator evidence. Inference: acceptance for this feature should include running `node .opencode/scripts/validate-harness.mjs`, checking new command/workflow/manifest/routing consistency, and scanning for unintended `.agents/`/`.codex/` runtime dependencies.
  7. **Manifest/routing impact.** Direct evidence: `.opencode/harness.manifest.json` lists all harness-owned commands and workflows; `.opencode/routing/harness-model-routing.json` currently lists command overrides for role-specific `/delegate-*` commands and an `orchestratorCommands` entry only for `/delegate-orchestration`. Inference: adding `.opencode/commands/implement-feature.md` and/or `.opencode/workflows/implement-feature-workflow.md` likely requires manifest entries, and adding an orchestrator-owned command may require adding `/implement-feature` under routing `orchestratorCommands` rather than `commandOverrides`.
  8. **Memory/trace requirements.** Direct evidence: role contracts require each role output to include a trace artifact path, and the trace schema requires `orchestrationId`, `role`, `artifactId`, `createdAt`, `inputContract`, `workPerformed`, `outputContract`, and `handoff`. Memory protocol requires `.memory/orchestrations/<orchestration-id>/INDEX.md` and role artifacts under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`. Inference: the new workflow should explicitly remind the parent to create/update memory index and keep narrow role trace artifacts for each scoped phase.
  9. **Local AI/context economy implications.** Direct evidence: existing delegation docs require scoped work units, DAG parallelism, repeatable role instances, exact paths, required contracts, and concise trace artifacts. Inference: the `implement-feature` workflow can be local-model friendly by giving each delegated role a narrow packet: goal, exact allowed paths, relevant excerpts/source paths only, acceptance gates, routing metadata status, and trace path; run independent `researcher`, `planner`, `implementer`, or `validator` branches in parallel only when dependencies do not conflict.
- Artifact links:
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`

### Source List

- `.opencode/skills/opencode-workflow-guidance/SKILL.md` (loaded skill): command vs workflow surface guidance; non-native workflow boundary.
- `.opencode/commands/delegate-orchestration.md`: orchestrator-owned command frontmatter and recursive delegation protocol.
- `.opencode/commands/delegate-*.md`: role-specific command frontmatter/input/output pattern.
- `.opencode/workflows/delegation-workflow.md`: phase gates, role boundaries, DAG, memory requirements, validation-before-acceptance.
- `.opencode/workflows/validation-workflow.md`: required validation checks and acceptance rule.
- `.opencode/skills/delegation-orchestrator/SKILL.md` and references: non-negotiable constraints, role routing, validation checklist, restart/trust guidance.
- `.opencode/contracts/role-io-contracts.json`: role I/O contracts and verification expectations.
- `.opencode/schemas/memory-trace-artifact.schema.json`: trace artifact required fields.
- `.opencode/agents/*.md`: fixed role names, frontmatter, permissions, role boundaries.
- `.opencode/harness.manifest.json`: existing manifest coverage for commands/workflows.
- `.opencode/routing/harness-model-routing.json`: current role/command/orchestrator routing structure.
- `AGENTS.md`: harness conventions and restrictions from project instructions.

### Implementation Implications

- Likely create `.opencode/workflows/implement-feature-workflow.md` as project-local workflow guidance.
- Likely create `.opencode/commands/implement-feature.md` if `/implement-feature` should be user-invoked; use orchestrator-owned frontmatter (`description`, likely `subtask: false`, no `agent`, no `model`).
- Update `.opencode/harness.manifest.json` to list any new command/workflow assets.
- Update `.opencode/routing/harness-model-routing.json` to classify `/implement-feature` as an orchestrator command if a command is added.
- Consider updating validation docs/scripts if they special-case only `/delegate-orchestration` as the no-agent command.
- The workflow should not introduce new subagent role names; it should use repeatable existing role instances with scoped artifact IDs and narrow context windows.

### Risks / Unresolved Questions

- No existing `implement-feature` asset or “connector-source documentation” was found in repo search; planner should confirm intended connector-source docs/sources at task time.
- Current validation checklist explicitly names `/delegate-orchestration` as the no-agent command; adding another orchestrator-owned command may require corresponding validation rule/script updates.
- External OpenCode docs were not fetched during this research; findings are based on project-owned instructions, loaded workflow guidance skill, and supplied files.

## Handoff

- Next role: `planner`
- Limitations: Research only; did not edit `.opencode/` implementation assets, did not run harness validation, and did not verify current validation script behavior.
- Risks: Planner must decide whether the deliverable is command-only, workflow-doc-only, or both; validator must prove new assets are manifest/routing/script-consistent and do not add runtime dependencies on `.agents/` or `.codex/`.
