# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-05-implement-feature-workflow`
- role: `planner`
- artifactId: `root-planner-002-implementation-plan`
- createdAt: `2026-07-05`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to plan an `implement-feature` workflow/command using existing harness roles; scope boundaries, constraints, acceptance criteria, and researcher artifact `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`.
- Required context present: yes; inspected research evidence plus command, workflow, manifest, routing, validation script, validation checklist, contracts, trace schema, and memory indexes needed to bound implementation.
- Routing metadata status: absent

## Work Performed

- Summary: Converted research findings into a bounded implementation plan with exact deliverable paths, file contracts, dependency DAG, parallelization strategy, verification gates, assumptions, and handoff notes.
- Files read:
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.memory/INDEX.md`
  - `.opencode/harness.manifest.json`
  - `.opencode/routing/harness-model-routing.json`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/commands/delegate-orchestration.md`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
  - `.opencode/routing/resolve-model-routing.mjs`
- Files changed:
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/INDEX.md`
  - `.memory/INDEX.md`
- Commands/checks:
  - `ls .memory/orchestrations/2026-07-05-implement-feature-workflow/roles`
  - `ls .memory/orchestrations/2026-07-05-implement-feature-workflow`

## Output Contract

- Outputs: Ordered implementation plan, file contracts, dependency DAG, verification gates, assumptions, and downstream handoff notes.
- Evidence:

### Decision on Deliverable Surface

Implement **both** a native slash command and project-local workflow guidance, plus supporting manifest/routing/validation updates:

- Add `.opencode/commands/implement-feature.md` so users can invoke `/implement-feature`.
- Add `.opencode/workflows/implement-feature-workflow.md` as plain Markdown process guidance; it is project-local documentation, not a native OpenCode workflow schema.
- Update `.opencode/harness.manifest.json` because it enumerates harness-owned commands/workflows.
- Update `.opencode/routing/harness-model-routing.json` because the new command is orchestrator-owned and should be listed under `orchestratorCommands`, not `commandOverrides`.
- Update `.opencode/scripts/validate-harness.mjs` because current hardcoded expected command/manifest/routing lists only special-case `/delegate-orchestration`; validation will otherwise fail.
- Update `.opencode/workflows/validation-workflow.md` and `.opencode/skills/delegation-orchestrator/references/validation-checklist.md` so docs describe role-specific commands separately from orchestrator-owned commands.
- Do **not** add role agents, new role names, `model` frontmatter, local plugin config, or runtime references to `.agents/`/`.codex/`.

### Ordered Plan

1. **Implement command entry point** (`root-implementer-003-command`).
   - Create `.opencode/commands/implement-feature.md`.
   - Frontmatter contract: `description` and `subtask: false` only; omit `agent`; omit `model`.
   - Body contract: describe `/implement-feature` as orchestrator-owned; require goal/scope/acceptance/path intake; require connector-source requirements/documentation research before planning; require succinct planner outputs; require repeatable scoped `implementer` instances for parallel-safe edits; require `integrator`; require `validator` before acceptance; require trace artifacts and index updates; preserve supplied routing labels exactly when present and state `routingMetadataStatus: absent` when absent.

2. **Implement workflow guidance** (`root-implementer-004-workflow-doc`).
   - Create `.opencode/workflows/implement-feature-workflow.md` with no frontmatter.
   - Document purpose, boundaries, connector-source research inputs, narrow-context packet shape, phase gates, DAG/parallelization rules, role artifact requirements, remediation limit, integration and validation standards, and local-model/context-economy practices.
   - State explicitly that `.opencode/workflows/*.md` is project-local guidance, not native OpenCode schema.

3. **Update manifest and routing** (`root-implementer-005-manifest-routing`).
   - Add `{ "path": ".opencode/commands/implement-feature.md", "kind": "opencode-orchestration-command", "owner": "harness-owned" }` to `.opencode/harness.manifest.json`.
   - Add `{ "path": ".opencode/workflows/implement-feature-workflow.md", "kind": "opencode-workflow", "owner": "harness-owned" }` to `.opencode/harness.manifest.json`.
   - Add `/implement-feature` to `.opencode/routing/harness-model-routing.json` under `harnessModelRouting.orchestratorCommands` with `owner: "orchestrator"`, a local-model-friendly variant such as `"feature-implementation"`, and `agent: null`.
   - Do not add `/implement-feature` to `commandOverrides`.

4. **Update validation assets** (`root-implementer-006-validation-assets`).
   - In `.opencode/scripts/validate-harness.mjs`, extend `ORCHESTRATOR_COMMANDS` to include `implement-feature`; ensure manifest expected paths include the new workflow doc; ensure `assertRouting` verifies every orchestrator command has an entry, `owner: "orchestrator"`, and `agent === null` rather than only checking `/delegate-orchestration`; retain role command checks unchanged.
   - In `.opencode/workflows/validation-workflow.md`, change command frontmatter check to distinguish role-specific commands (`description` + `agent`) from orchestrator-owned commands (`description`, `subtask: false`, no `agent`, no `model`).
   - In `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`, generalize the `/delegate-orchestration` no-agent check to orchestrator-owned command files including `.opencode/commands/implement-feature.md`.

5. **Integrate cross-file consistency** (`root-integrator-007-cross-file`).
   - Confirm command name, manifest paths/kinds, routing key `/implement-feature`, validation script constants, and validation docs agree.
   - Confirm all fixed role names are exact and no new roles/types are introduced.
   - Confirm routing preservation labels are present in the new command/workflow or otherwise covered by validation label haystack.
   - Confirm references to connector sources are described as task-supplied connector/documentation sources, not invented concrete host formats.

6. **Validate acceptance** (`root-validator-008-final`).
   - Run command-backed checks listed below.
   - Acceptance requires all required checks passing or explicit task-specific skipped-check rationale in validator trace.

### Dependency DAG and Parallelization Strategy

- `root-researcher-001-workflow-context` → `root-planner-002-implementation-plan` → implementation branch.
- Parallel implementation branch after this plan:
  - `root-implementer-003-command` (independent content creation).
  - `root-implementer-004-workflow-doc` (independent content creation).
  - `root-implementer-005-manifest-routing` (depends on planned paths; can run in parallel with content creation but must know exact filenames).
  - `root-implementer-006-validation-assets` (depends on planned command/workflow decision; can run in parallel with content creation, but final script checks depend on files existing).
- Join: all implementers → `root-integrator-007-cross-file` → `root-validator-008-final` → optional reviewer/synthesizer only if defects, tradeoffs, or unresolved blockers remain.

### File Contracts

- `.opencode/commands/implement-feature.md`: native OpenCode command file; frontmatter `description`, `subtask: false`; no `agent`, no `model`; body is orchestrator prompt using only fixed roles and memory contracts.
- `.opencode/workflows/implement-feature-workflow.md`: project-local Markdown guidance; no frontmatter; documents phased workflow and local-model context economy.
- `.opencode/harness.manifest.json`: valid JSON; artifacts array includes exactly the new command/workflow entries in addition to existing entries; owner remains `harness-owned`; no `.agents/` or `.codex/` paths.
- `.opencode/routing/harness-model-routing.json`: valid JSON; `/implement-feature` appears only under `orchestratorCommands`; entry has `owner: "orchestrator"`, `agent: null`, and no concrete model unless already configured elsewhere.
- `.opencode/scripts/validate-harness.mjs`: deterministic validator remains dependency-free; supports multiple orchestrator commands; expected manifest paths include the new workflow; role-specific command checks still require agents; orchestrator checks require no agent and `subtask: false`.
- `.opencode/workflows/validation-workflow.md`: validation guidance accurately reflects role command versus orchestrator command frontmatter.
- `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`: checklist accurately reflects multiple orchestrator-owned no-agent commands.
- Memory artifacts: implementer/integrator/validator traces under `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/<role>/<artifact-id>.md`; update orchestration `INDEX.md` and `.memory/INDEX.md` for retained artifacts.

### Verification Gates

Run by implementers as self-checks where applicable and by validator before acceptance:

1. `node .opencode/scripts/validate-harness.mjs`
2. `node .opencode/routing/resolve-model-routing.mjs --command /implement-feature` and confirm output has `source: "orchestratorCommand"`, `agent: null`, and expected variant.
3. JSON parse checks for `opencode.json`, `.opencode/harness.manifest.json`, `.opencode/routing/harness-model-routing.json`, and `.opencode/contracts/role-io-contracts.json`.
4. Frontmatter/content inspection for `.opencode/commands/implement-feature.md`: has `description`, `subtask: false`; omits `agent` and `model`; mentions research-before-planning, validation-before-acceptance, fixed roles, routing metadata absent behavior, and trace path requirements.
5. Manifest/routing consistency check: new command and workflow listed in manifest; `/implement-feature` in `orchestratorCommands`; not in `commandOverrides`.
6. Prior-projection/runtime dependency scan over `.opencode/` and `opencode.json`: no runtime dependency on `.agents/` or `.codex/`.
7. Secret/auth scan over changed files: no provider tokens, auth paths, or machine-local private paths.

### Assumptions

- `/implement-feature` is intended as a top-level orchestrator command analogous to `/delegate-orchestration`, not a role-specific subagent command.
- Connector sources are supplied per feature request through OpenCode references/MCP/user-provided paths; this plan does not invent connector host formats or add connector configuration.
- Validation script updates are in scope because adding a command/workflow without updating hardcoded validation expectations would break required acceptance.

### Handoff Notes

- Next roles: parallel `implementer` instances for command, workflow doc, manifest/routing, and validation assets; then `integrator`; then `validator`.
- Implementers must edit only their assigned paths and report trace artifacts.
- Integrator should request remediation rather than silently broadening scope if cross-file contracts conflict.
- Validator evidence is mandatory before accepting the workflow; lifecycle hooks/plugins are guardrails only.

- Artifact links:
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/researcher/root-researcher-001-workflow-context.md`
  - `.memory/orchestrations/2026-07-05-implement-feature-workflow/roles/planner/root-planner-002-implementation-plan.md`

## Handoff

- Next role: `implementer`
- Limitations: Planning only; did not edit command, workflow, manifest, routing, validation script, or validation documentation assets; did not run final harness validation.
- Risks: Validator must confirm the updated validation script passes after implementation; connector-source details remain task-supplied at `/implement-feature` invocation time.
