# OpenCode Harness Instructions

This project contains a standalone OpenCode harness projection. The deliverable surface is rooted in `.opencode/` plus `opencode.json`, `AGENTS.md`, and `opencode-harness.design.md`.

`.agents/` and `.codex/` are reference-only prior projection examples. They may inform wording or compatibility checks, but OpenCode commands, agents, workflows, manifests, plugins, scripts, and runtime guidance must not depend on those paths.

## Harness Conventions

- Use delegation-only orchestration for multi-step harness work.
- Preserve the eight role names exactly: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier`.
- Use `/delegate-orchestration` for recursive parent orchestration. It is orchestrator-owned, omits command `agent` frontmatter, builds a DAG of scoped work units, requires research before planning, requires validation before acceptance, and may spawn as many scoped instances of each role as the workflow requires.
- Keep role agents under `.opencode/agents/` as Markdown files with `description`, `mode: subagent`, and conservative `permission` frontmatter.
- Keep role-specific command prompts under `.opencode/commands/` with `description` and `agent` frontmatter only; do not set `model` in command files. The central `/delegate-orchestration` command is the exception: it omits `agent` and sets `subtask: false`.
- Keep the committed harness routing default in `.opencode/routing/harness-model-routing.example.json`. An operator may copy it to the ignored `.opencode/routing/harness-model-routing.json` override. Implicit loads choose a present custom file first, otherwise the example, never merge, and fail rather than falling back when a present custom file is unreadable, malformed, or invalid. Explicit config paths are exact. If both implicit files are absent, restore/copy the example. Neither file configures native provider transport, and the force-local default remains false.
- Use `.memory/protocols/memory-management.md` for project-owned memory. Store static references/templates under `.memory/` and generated orchestration memory under `.memory/orchestrations/<orchestration-id>/`.
- Require every delegated role to follow `.opencode/contracts/role-io-contracts.json`, shape trace artifacts according to `.opencode/schemas/memory-trace-artifact.schema.json`, and write or reference `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Treat `.opencode/plugins/index.js` as the only auto-loaded local plugin entry point. Keep segmented guardrail/telemetry modules under `.opencode/plugin-modules/`, such as `.opencode/plugin-modules/harness-lifecycle.js`, so OpenCode does not auto-load them separately. Do not add local plugin file paths to `opencode.json`.
- Treat lifecycle hooks as guardrails and telemetry only. Validation evidence still comes from validator or artifact-verifier work.

## Delegation Boundaries

Parent orchestration may classify work, create delegation prompts, pass complete context, review returned evidence, request remediation, and produce final summaries. It must not conduct substantive research, draft implementation plans, edit files, integrate artifacts, or validate acceptance in place of the specialized role evidence.

When caller-supplied routing metadata is present, preserve these labels exactly: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`. When the original request does not include enriched routing metadata, do not invent values.

## Validation

Before accepting changes, run `node .opencode/scripts/validate-harness.mjs` and any task-specific checks. Confirm references to `.agents/` or `.codex/` are reference-material notes only and not runtime dependencies.

Validation uses the committed routing example explicitly so an optional private override cannot change acceptance. After changing either routing file or plugin code, fully quit and restart OpenCode; running sessions retain loaded configuration.
