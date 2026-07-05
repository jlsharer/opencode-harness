# OpenCode Harness Validation Checklist

Use this checklist before accepting delegated OpenCode harness work.

## File and Schema Checks

- [ ] `opencode.json`, `AGENTS.md`, and `.opencode/harness.manifest.json` exist.
- [ ] Every expected role file exists under `.opencode/agents/`.
- [ ] Role frontmatter includes non-empty `description`, `mode: subagent`, and `permission`.
- [ ] Role-specific command files under `.opencode/commands/` have `description` and `agent` frontmatter.
- [ ] `.opencode/commands/delegate-orchestration.md` has `description`, omits `agent`, and sets `subtask: false`.
- [ ] Command files do not set `model`.
- [ ] `opencode.json` parses as JSON and does not contain harness-owned routing keys.
- [ ] `.opencode/routing/harness-model-routing.json` parses as JSON.
- [ ] `.opencode/harness.manifest.json` lists only OpenCode-owned artifacts and included root OpenCode project files.
- [ ] Static memory files exist: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`.
- [ ] `.opencode/contracts/role-io-contracts.json` parses and includes all eight roles.
- [ ] `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- [ ] Each role references the memory protocol, role contract catalog, trace schema, and `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` path.
- [ ] `.opencode/plugins/index.js` exists as the only auto-loaded local plugin file and default-export adapter.
- [ ] Segmented plugin logic lives outside the auto-loaded plugin directory, for example `.opencode/plugin-modules/harness-lifecycle.js`, and is imported by the adapter.
- [ ] `opencode.json` does not list local plugin paths.

## Delegation Checks

- [ ] Parent-thread role-work is prohibited.
- [ ] Research, planning, implementation, integration, validation, review, synthesis, and artifact verification have explicit routing.
- [ ] `/delegate-orchestration` is documented as orchestrator-owned and recursive, not a fixed subagent command.
- [ ] Research is required before planning and validation is required before acceptance.
- [ ] Recursive work uses a DAG, parallelizes independent role instances, and permits repeatable role instances with scoped artifact IDs.
- [ ] Remediation is limited to 3 loops per scoped work unit before synthesizing blockers and asking the user.
- [ ] Every delegated role receives an `orchestration-id`, memory root, role contract catalog, trace schema, and trace artifact requirement.
- [ ] Acceptance requires validator or artifact-verifier evidence.
- [ ] Routing labels are preserved when supplied by the caller.
- [ ] Missing routing labels are not invented.

## Safety Checks

- [ ] No provider tokens, auth secrets, user home auth paths, or machine-local private paths are stored in repo-managed harness files.
- [ ] Lifecycle plugins are described as guardrails only.
- [ ] Reference-only prior projection directories are not listed as OpenCode runtime dependencies.

## Acceptance Decision

Accept only when required checks pass or every skipped check has a concrete task-specific rationale.
