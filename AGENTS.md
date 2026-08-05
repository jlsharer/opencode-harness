# OpenCode Harness Instructions

This project is the source and release-QA repository for a standalone OpenCode harness projection. Its source surface is inventoried by `.opencode/harness.manifest.json` and includes source-only roots, optional assets, and release tooling.

The installable `portable-core` profile is a narrower boundary defined only by `.opencode/portable.manifest.json`. Bootstrap does not copy or require destination `AGENTS.md`, `opencode-harness.design.md`, `opencode.json`, root `.gitignore`, source reference inventory, deployments, optional workflows/meta-skills, or orchestration history. Those source files may document and test the portable profile, but installed portable runtime and validation must not depend on them.

`.agents/` and `.codex/` are reference-only prior projection examples. They may inform wording or compatibility checks, but OpenCode commands, agents, workflows, manifests, plugins, scripts, and runtime guidance must not depend on those paths.

## Harness Conventions

- Use delegation-only orchestration for multi-step harness work.
- Preserve the eight role names exactly: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier`.
- Use `/delegate-orchestration` for recursive parent orchestration. It is orchestrator-owned, omits command `agent` frontmatter, builds a DAG of scoped work units, requires research before planning, requires validation before acceptance, and may spawn as many scoped instances of each role as the workflow requires.
- Keep role agents under `.opencode/agents/` as Markdown files with `description`, `mode: subagent`, and conservative `permission` frontmatter.
- Keep role-specific command prompts under `.opencode/commands/` with `description` and `agent` frontmatter only; do not set `model` in command files. The central `/delegate-orchestration` command is the exception: it omits `agent` and sets `subtask: false`.
- Keep the committed neutral routing default in `.opencode/routing/harness-model-routing.example.json`; local routing is disabled with no catalog or selectors. `.opencode/routing/harness-model-routing.local.example.json` is an explicit opt-in example/test fixture and is never an implicit default. An operator may create the ignored `.opencode/routing/harness-model-routing.json` override. Implicit loads choose a present custom file first, otherwise the neutral example, never merge, and fail rather than falling back when a present custom file is unreadable, malformed, or invalid. Explicit config paths are exact. If both implicit files are absent, restore/copy the neutral example. Routing fixtures do not configure native provider transport, and force-local remains false by default.
- Use `.memory/protocols/memory-management.md` for project-owned memory. Store static references/templates under `.memory/` and generated orchestration memory under `.memory/orchestrations/<orchestration-id>/`.
- Require every delegated role to follow `.opencode/contracts/role-io-contracts.json`, shape trace artifacts according to `.opencode/schemas/memory-trace-artifact.schema.json`, and write or reference `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Give every separately scoped delegated task a new `delegationTaskId` and fresh child thread; fresh Task calls omit `task_id`. Reuse is allowed only once to answer a child-originated clarification while that exact task remains unresolved. Retry, remediation, correction, follow-up, changed scope/role/deliverable, and terminal work always start fresh child threads; direct unverified child-dispatch surfaces are prohibited for managed orchestration.
- Treat `.opencode/plugins/index.js` as the only auto-loaded local plugin entry point. Keep segmented guardrail/telemetry modules under `.opencode/plugin-modules/`, such as `.opencode/plugin-modules/harness-lifecycle.js`, so OpenCode does not auto-load them separately. Do not add local plugin file paths to `opencode.json`.
- Treat lifecycle hooks as guardrails and telemetry only. Validation evidence still comes from validator or artifact-verifier work.

## Delegation Boundaries

Parent orchestration may classify work, create delegation prompts, pass complete context, review returned evidence, request remediation, and produce final summaries. It must not conduct substantive research, draft implementation plans, edit files, integrate artifacts, or validate acceptance in place of the specialized role evidence.

When caller-supplied routing metadata is present, preserve these labels exactly: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`. When the original request does not include enriched routing metadata, do not invent values.

## Validation

For this source repository, run `node .opencode/scripts/validate-harness.mjs` and task-specific checks. Source QA requires the source roots, static reference inventory, and indexed orchestration history; it validates only committed routing fixtures and never consumes the private custom override. It also invokes the installed-profile-equivalent portable validator.

For a bootstrapped installation, run `node .opencode/scripts/validate-portable-harness.mjs --root .`. Portable acceptance requires only portable-manifest managed files and minimal seeded memory, not this file or other source-only roots/history.

Validation uses the committed routing example explicitly so an optional private override cannot change acceptance. After changing either routing file or plugin code, fully quit and restart OpenCode; running sessions retain loaded configuration.
