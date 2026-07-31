# Researcher Trace Artifact: Agentic Protocol Hooks

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks`
- role: `researcher`
- artifactId: `root-researcher-001-hooks`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research existing repository and external documentation evidence for an agentic harness hook implementation usable by OpenCode and Claude hooks for conditional protocol injection before/after tool events.
- Required context present: orchestration id, scoped questions, source constraints, freshness requirements, downstream planning needs, trace artifact path, resolved routing decision.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Read harness contract/schema, existing OpenCode plugin modules, validation/manifest/design/workflow files, project OpenCode references, and current OpenCode/Claude hook documentation. No runtime implementation files edited.
- Files read:
  - `AGENTS.md`
  - `opencode.json`
  - `opencode-harness.design.md`
  - `.memory/protocols/memory-management.md`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/references/opencode-refs.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.opencode/plugins/index.js`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/plugin-modules/role-model-routing-enforcement.js`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/commands/delegate-research.md`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/harness.manifest.json`
- External docs read:
  - OpenCode plugins: `https://opencode.ai/docs/plugins` (last updated 2026-07-27 in fetched page)
  - Claude Code hooks reference: `https://docs.anthropic.com/en/docs/claude-code/hooks`
  - Claude Code settings: `https://docs.anthropic.com/en/docs/claude-code/settings`
- Commands/checks:
  - `ls ".memory/orchestrations"`
  - `mkdir -p .../roles/researcher && python3 ...` to write this artifact
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`

## Output Contract

### Cited findings / evidence

1. Direct repo evidence: existing OpenCode plugin surface is via `.opencode/plugins/index.js`, which imports `HarnessLifecyclePlugin` and `HarnessRoleModelRoutingEnforcementPlugin` and merges their hook objects (`.opencode/plugins/index.js:1-8`). Existing lifecycle hooks include `event`, `tool.execute.before`, and `message.after` (`.opencode/plugin-modules/harness-lifecycle.js:6-27`); routing enforcement uses the OpenCode `config` hook (`.opencode/plugin-modules/role-model-routing-enforcement.js:51-54`).
2. Direct external evidence: OpenCode plugin docs say local project plugins are JavaScript/TypeScript files in `.opencode/plugins/` and are auto-loaded at startup; hooks run in sequence; plugin functions receive context and return hooks; documented event/hook surfaces include `tool.execute.before`, `tool.execute.after`, `shell.env`, `command.executed`, many file/message/session events, and examples mutate `output.args` in `tool.execute.before` and inject env via `shell.env` (`https://opencode.ai/docs/plugins`, sections “From local files”, “Load order”, “Basic structure”, “Events”, “Inject environment variables”). Skill context additionally lists hook callbacks `config`, `chat.message`, `chat.params`, `chat.headers`, `tool.definition`, `command.execute.before`, `permission.ask`, and experimental chat/system/message/compaction hooks.
3. Direct repo evidence: harness constraints require `.opencode/plugins/index.js` as the only auto-loaded plugin entry point, segmented modules under `.opencode/plugin-modules/`, no local plugin file paths in `opencode.json`, hooks as guardrails/telemetry only, and validator/artifact-verifier evidence for acceptance (`AGENTS.md:17-18`, `opencode-harness.design.md:142-152`). Validation script enforces the adapter import/default-export shape and rejects inline hook logic in the adapter (`.opencode/scripts/validate-harness.mjs:577-619`).
4. Direct repo evidence: validation boundaries include deterministic example routing, no optional private routing override as acceptance input, plugin adapter as only auto-loaded plugin, no local plugin paths in `opencode.json`, restart caveats, and secret/prior-projection scans (`.opencode/workflows/validation-workflow.md:7-21`; `AGENTS.md:28-30`).
5. Direct repo evidence: future implementation likely touches `.opencode/plugin-modules/` for segmented logic, `.opencode/plugins/index.js` only to import/merge a new module, possibly `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, `opencode-harness.design.md`, `.opencode/workflows/validation-workflow.md`, `.memory/references/opencode-refs.md`, role/workflow guidance, and schemas/contracts if new trace/protocol artifacts are introduced. Owned artifact classes are enumerated in `opencode-harness.design.md:22-33` and `.opencode/harness.manifest.json:6-54`.
6. Direct external evidence: Claude hooks fire at `PreToolUse` and `PostToolUse` for every tool call in the agentic loop, with `PreToolUse` able to block; hook config nests event -> matcher group -> handler; matchers filter by tool name, `if` can filter by tool arguments such as `Bash(git *)` or `Edit(*.ts)`, and hook input provides JSON with `tool_name` and `tool_input` (`https://docs.anthropic.com/en/docs/claude-code/hooks`, “Hook lifecycle”, “Configuration”, “Matcher patterns”).
7. Direct external evidence: Claude hook locations include user, project `.claude/settings.json`, local `.claude/settings.local.json`, managed policy, plugin `hooks/hooks.json`, and skill/agent frontmatter; project `.claude/settings.json` is shareable but this repo forbids depending on `.claude`, `.agents`, or `.codex` runtime paths for the OpenCode surface (`Claude hooks reference “Hook locations”; `AGENTS.md:5`; `opencode-harness.design.md:45-49`).
8. Direct external evidence: Claude settings docs say hooks and most settings reload in a running session, while OpenCode repo guidance says OpenCode config/plugin changes require fully quitting and restarting (`Claude settings “When edits take effect”; `AGENTS.md:30`; `opencode-harness.design.md:134`).
9. Direct/inference: classification by path, tool event, file kind, and language is supported because OpenCode hooks receive tool names/args and can mutate or block before/after execution; Claude matchers/`if` support tool and file-pattern filters like `Edit(*.ts)` and hook JSON exposes `tool_input.file_path` in examples; the harness manifest classifies owned files by `path` and `kind` (`.opencode/harness.manifest.json:6-54`). Language inference would likely come from path extension/content, not a native language field found in repo evidence.

### Source list

- Repo: `AGENTS.md`, `opencode.json`, `opencode-harness.design.md`, `.opencode/plugins/index.js`, `.opencode/plugin-modules/harness-lifecycle.js`, `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/scripts/validate-harness.mjs`, `.opencode/workflows/validation-workflow.md`, `.opencode/harness.manifest.json`, `.memory/references/opencode-refs.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`.
- External: `https://opencode.ai/docs/plugins`; `https://docs.anthropic.com/en/docs/claude-code/hooks`; `https://docs.anthropic.com/en/docs/claude-code/settings`.

### Implementation implications

- Implement OpenCode side as a new segmented module under `.opencode/plugin-modules/` and keep `.opencode/plugins/index.js` as a thin adapter only.
- Model protocol injection as guardrail/context transformation, not acceptance proof. Validation must still run `node .opencode/scripts/validate-harness.mjs` and task-specific checks.
- Use host-neutral classification logic (path, tool/event, file kind, inferred language) that can be reused by OpenCode plugin hooks and by separately documented Claude hook adapters without adding `.claude` runtime dependencies to this repo.
- If introducing schemas/rules, make them closed, deterministic, secret-free, and listed in manifest/validation if harness-owned.

### Risks / unresolved questions

- Exact OpenCode availability of `chat.*`, `command.execute.before`, and experimental transform hooks should be confirmed against the current installed OpenCode/plugin package; repository currently uses only `event`, `tool.execute.before`, `message.after`, and `config`.
- OpenCode docs fetched list broad event names but less detailed input/output schemas than Claude hooks; implementation may need runtime/type inspection or package docs before mutating chat/system messages.
- Claude project hooks are naturally `.claude/settings.json`, but this repo must not depend on `.claude` runtime paths. Compatibility should be documented/generator-oriented unless a separate non-OpenCode deliverable is approved.
- Language classification by extension is inferential and may be wrong for extensionless/generated/polyglot files; validators should include representative fixture cases.

## Handoff

- Next role: `planner`
- Limitations: Research only; no implementation plan finalized, no runtime files edited, no validation acceptance performed.
- Risks: OpenCode hook schema uncertainty for chat/system transforms; possible host semantic drift between OpenCode plugin hooks and Claude hook JSON/decision model; need careful no-secret/no-runtime-prior-projection validation.
