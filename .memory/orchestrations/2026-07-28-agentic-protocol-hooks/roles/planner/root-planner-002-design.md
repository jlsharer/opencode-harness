# Planner Trace Artifact: Agentic Protocol Hooks Design

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks`
- role: `planner`
- artifactId: `root-planner-002-design`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved design-only goal to produce an implementation-ready plan for agentic harness hooks usable by OpenCode and Claude hook surfaces to inject context-specific micro-protocol reminders at correct event timing.
- Required context present: orchestration id, scope boundaries, research evidence, exact deliverable path, role contract catalog, trace schema, acceptance criteria, and resolved routing decision were supplied.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Converted researcher evidence into a bounded, implementation-ready design plan. No runtime implementation files were edited.
- Files read:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.opencode/plugins/index.js`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/harness.manifest.json`
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
- Commands/checks:
  - `ls ".memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles"`
  - `mkdir -p ".memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner" && python3 - <<'PY' ... PY`

## Output Contract

- Outputs: orderedPlan, fileContracts, dependencies, verificationGates, assumptions, acceptanceCriteria, residualRisks, and handoffNotes are specified below.
- Evidence: Plan is grounded in researcher findings that OpenCode exposes plugin hooks including `tool.execute.before`/`tool.execute.after`, Claude exposes `PreToolUse`/`PostToolUse`, this repo requires `.opencode/plugins/index.js` to remain the only auto-loaded local plugin entry point, segmented logic belongs under `.opencode/plugin-modules/`, and hooks are guardrails/telemetry only.
- Artifact links:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`

### Ordered Design Plan

1. **Add a host-neutral protocol core.**
   - Target path: `.opencode/plugin-modules/agentic-protocol-core.js`.
   - Export pure functions only: `normalizeEvent`, `classifyAction`, `classifyFile`, `selectProtocols`, `renderReminder`, `applyNoisePolicy`, `recordLedgerEntry`, and `buildSessionSummary`.
   - Keep this module free of OpenCode-specific context objects and free of `.claude`, `.agents`, or `.codex` path dependencies.

2. **Add an OpenCode delivery module.**
   - Target path: `.opencode/plugin-modules/agentic-protocol-hooks.js`.
   - Export `HarnessAgenticProtocolHooksPlugin(context)` returning OpenCode hooks.
   - Register `tool.execute.before` for pre-tool injection/notice decisions and optional `tool.execute.after` for post-tool notes/verification reminders.
   - Optionally register `event` for session start/end bookkeeping and command boundary observation, and `command.execute.before` only if runtime inspection confirms exact OpenCode support.
   - Do not use chat/system transform hooks for primary delivery until the installed OpenCode plugin API shape is confirmed; if used later, treat them as constraints-only and never as acceptance evidence.

3. **Keep the adapter thin.**
   - Target path: `.opencode/plugins/index.js`.
   - Future implementation should import `HarnessAgenticProtocolHooksPlugin` and merge its hook object with existing modules.
   - Adapter must remain the only auto-loaded plugin file and must not inline hook logic.

4. **Define a Claude adapter/export surface without repo runtime dependency on `.claude`.**
   - Target paths:
     - `.opencode/plugin-modules/claude-protocol-adapter.js` for pure conversion helpers.
     - `.opencode/docs/claude-protocol-hooks.md` or a similarly harness-owned documentation path for instructions/operators to export Claude hook config.
   - The repo must not require `.claude/settings.json` or `.claude/settings.local.json`. Claude support is a spec/export surface that maps the same core decisions to `PreToolUse`/`PostToolUse` handler behavior.

5. **Add protocol registry data.**
   - Target path: `.opencode/protocols/agentic-micro-protocols.json`.
   - Closed JSON contract: `schemaVersion`, `protocols[]`, `id`, `title`, `severity`, `match`, `timing`, `message`, `dedupeKeyTemplate`, `maxPerSession`, `enabledByDefault`.
   - Registry should be deterministic, secret-free, and listed in `.opencode/harness.manifest.json` if implemented.

6. **Add ledger and telemetry behavior.**
   - Runtime ledger path should default to `.memory/agentic-protocol-ledger.jsonl` or `.memory/orchestrations/<active-orchestration-id>/validation/agentic-protocol-ledger.jsonl` when an orchestration id is known.
   - Prefer append-only JSONL with one entry per evaluated/injected/suppressed protocol. Do not write secrets or full prompts; record only path/tool/protocol ids, classifications, result, and reason.
   - Expose session summary at session boundary or command boundary through visible notice text and ledger aggregate metrics.

7. **Add tests for pure logic before wiring hooks.**
   - Target paths:
     - `.opencode/plugin-modules/agentic-protocol-core.test.mjs`
     - `.opencode/plugin-modules/agentic-protocol-hooks.test.mjs`
     - `.opencode/plugin-modules/claude-protocol-adapter.test.mjs`
   - Tests should validate normalization, Playwright classification, dedupe/noise policy, ledger redaction, OpenCode hook invocation behavior, and Claude adapter mapping.

8. **Update harness ownership and validation.**
   - Target paths: `.opencode/harness.manifest.json`, `.opencode/scripts/validate-harness.mjs`, `opencode-harness.design.md`, and `.opencode/workflows/validation-workflow.md`.
   - Validation must continue enforcing only `.opencode/plugins/index.js` under `.opencode/plugins/`, segmented plugin modules under `.opencode/plugin-modules/`, no runtime dependency on `.agents/`, `.codex/`, or `.claude`, and hooks as guardrails/telemetry only.

### Architecture Components

- **Event normalizer:** Converts host events into `{ host, phase, toolName, actionKind, filePath, command, sessionId, callId, rawShapeVersion }`. OpenCode maps `tool.execute.before` to `phase: preTool` and `tool.execute.after` to `phase: postTool`; Claude maps `PreToolUse`/`PostToolUse` similarly.
- **File/action classifier:** Infers action kind (`edit`, `write`, `multiedit`, `bash`, `read`, `unknown`), file kind (`playwright-page-object`, `playwright-spec`, `playwright-fixture`, `source`, `config`, `unknown`), language, and risk tags from tool args/path/extension/content hints.
- **Protocol registry:** Declarative micro-protocol definitions with match predicates over phase, action, file kind, path globs, and risk tags.
- **Injection policy engine:** Selects protocols, applies severity/dedupe/session limits/opt-outs/dry-run, and returns a delivery decision: `inject`, `notice-only`, `suppress`, or `block` only for future critical guardrails explicitly approved.
- **Delivery adapters:** OpenCode adapter emits concise reminders via safe pre-tool mutation or visible stderr/notification depending on supported hook semantics; Claude adapter maps decisions to hook JSON/stdout/stderr behavior without committing `.claude` runtime files.
- **Telemetry/notification ledger:** Append-only JSONL ledger plus session summary of evaluated, injected, suppressed, dry-run, and opted-out reminders.

### Event Timing Rules

- **Pre-tool injection for edits/writes:** Run before `edit`, `write`, and equivalent file mutation tools. This is the primary timing for micro-protocol reminders because it can influence the immediate action before code is changed.
- **Post-tool verification/note:** Run after mutation tools only for non-blocking reminders such as “run related tests” or “page object locator contract changed; update specs if needed.” Do not mark acceptance.
- **Read-only tools:** Do not inject by default; at most log evaluation or show notice when a read reveals an imminent high-risk command boundary, subject to noise limits.
- **Bash/command tools:** Classify commands that run tests, codegen, destructive operations, or delegate commands. Use notices for telemetry and protocol summary; do not interfere with validation commands.
- **Chat/system transforms:** Do not use as the initial delivery mechanism. If later enabled after API confirmation, constrain them to global low-frequency session reminders and never inject file-specific content without a current normalized tool event.
- **Command/session boundaries:** Initialize per-session counters at `session.start`/first observed event; summarize at session end if available, compaction boundary, or command completion. OpenCode plugin changes require restart; Claude settings/hooks may reload during session per docs.

### Playwright Classification and Micro-Protocol Examples

- **Page object classification:** Match paths like `**/pages/**/*.ts`, `**/*.page.ts`, `**/*.po.ts`, classes ending in `Page`, or files exporting locator/action helpers. Example reminder: “Playwright page object protocol: expose stable intent-level methods, keep selectors private, prefer role/test-id locators, avoid assertions except invariant waits, and update affected specs when method contracts change.”
- **Spec classification:** Match `**/*.spec.ts`, `**/*.test.ts`, `tests/e2e/**`, or files importing `test`/`expect` from `@playwright/test`. Example reminder: “Playwright spec protocol: assert user-visible behavior, avoid duplicating page-object selectors, keep setup in fixtures, prefer resilient locators, and verify changed flows with focused Playwright runs.”
- **Fixture classification:** Match `**/fixtures/**/*.ts`, `**/*.fixture.ts`, or files extending Playwright `test`. Example reminder: “Playwright fixture protocol: keep fixtures deterministic and isolated, avoid hidden cross-test state, document worker vs test scope, and preserve teardown for resources created by setup.”
- **Cross-file rule:** When editing page objects and specs in the same session, suppress duplicate generic reminders and prefer the more specific file-kind reminder per tool call.

### Noise Prevention Policy

- Dedupe by `{sessionId, protocolId, fileKind, normalizedPathBucket}` with a default 10-minute window.
- Severity levels: `info` for routine reminders, `warning` for likely convention violation, `critical` only for approved safety guardrails. Initial implementation should inject `info`/`warning` only and not block.
- Limits: default max 1 injected reminder per tool call, max 3 per protocol per session, and max 8 total visible reminders per session.
- Opt-outs: support environment/config flags such as `OPENCODE_HARNESS_PROTOCOL_HOOKS=0`, per-protocol disabled list, path ignore globs, and an inline session opt-out token only if it is not persisted into source files.
- Dry-run: `OPENCODE_HARNESS_PROTOCOL_DRY_RUN=1` records ledger entries and summaries but does not inject visible reminders.
- Suppression reasons must be ledgered: `dedupe-window`, `session-limit`, `tool-limit`, `path-ignore`, `protocol-disabled`, `dry-run`, or `host-unsupported`.

### User Notification and Tracking

- **JSONL ledger entry contract:** `{ timestamp, host, sessionId, callId, phase, toolName, actionKind, filePathHashOrRelativePath, fileKind, protocolId, severity, decision, suppressionReason, dryRun, messageId }`.
- **Visible notice wording:** `[harness protocol] <title>: <one-sentence reminder> (logged; set OPENCODE_HARNESS_PROTOCOL_DRY_RUN=1 for dry-run or OPENCODE_HARNESS_PROTOCOL_HOOKS=0 to disable)`.
- **Session summary wording:** `[harness protocol] session summary: evaluated=<n> injected=<n> suppressed=<n> dryRun=<n> optOut=<n>; ledger=<relative path>`.
- **Metrics:** counts by protocol id, file kind, phase, decision, suppression reason, and host. Metrics are diagnostic only, not validation evidence.

### File Contracts for Future Implementation

| Path | Contract |
| --- | --- |
| `.opencode/plugin-modules/agentic-protocol-core.js` | Pure host-neutral normalization/classification/policy/ledger helpers; no OpenCode client dependency; deterministic exports. |
| `.opencode/plugin-modules/agentic-protocol-hooks.js` | OpenCode plugin module exporting `HarnessAgenticProtocolHooksPlugin(context)`; wires core to supported hooks only. |
| `.opencode/plugin-modules/claude-protocol-adapter.js` | Pure helpers that translate normalized protocol decisions to Claude `PreToolUse`/`PostToolUse` handler contracts or generated config snippets; no `.claude` writes. |
| `.opencode/protocols/agentic-micro-protocols.json` | Declarative registry; closed schema; Playwright protocols included; no secrets. |
| `.opencode/schemas/agentic-micro-protocols.schema.json` | JSON Schema for registry if registry is added. |
| `.opencode/plugin-modules/*.test.mjs` | Node tests for pure core, OpenCode adapter behavior, and Claude adapter mapping. |
| `.opencode/plugins/index.js` | Thin adapter import/merge only; remains sole auto-loaded local plugin file. |
| `.opencode/harness.manifest.json` | Add every new harness-owned file with correct kind/owner. |
| `.opencode/scripts/validate-harness.mjs` | Add structural checks for new module exports, registry schema validation, no `.claude`/`.agents`/`.codex` runtime dependency, ledger redaction rules, and adapter thinness. |
| `opencode-harness.design.md` | Document architecture and guardrail-only status. |
| `.opencode/workflows/validation-workflow.md` | Add validation commands and restart caveat for plugin changes. |

### Dependencies and Ordering

1. Confirm supported OpenCode hook names and input/output mutation semantics in the installed runtime or package docs.
2. Implement and test the host-neutral core before any plugin wiring.
3. Add registry schema and registry entries before adapter integration.
4. Wire OpenCode delivery module and thin adapter after core tests pass.
5. Add Claude adapter/export tests after core decision contracts stabilize.
6. Update manifest/docs/validation after all target file paths are known.
7. Run full validation and restart OpenCode before manual runtime smoke testing.

### Verification Gates

- `node .opencode/scripts/validate-harness.mjs`
- `node --test .opencode/plugin-modules/agentic-protocol-core.test.mjs`
- `node --test .opencode/plugin-modules/agentic-protocol-hooks.test.mjs`
- `node --test .opencode/plugin-modules/claude-protocol-adapter.test.mjs`
- If a registry schema is added: validate `.opencode/protocols/agentic-micro-protocols.json` against `.opencode/schemas/agentic-micro-protocols.schema.json` from the harness validation script.
- Manual smoke gate after restart: perform representative edit/write actions against a Playwright page object, spec, and fixture in a disposable branch or temp fixture and verify one visible reminder plus ledger entry per applicable rule.
- Regression gate: confirm `.opencode/plugins/index.js` is still the only JavaScript/TypeScript file under `.opencode/plugins/` and contains no inline hook event logic.

### Acceptance Criteria

- Implementation uses segmented modules under `.opencode/plugin-modules/` and preserves `.opencode/plugins/index.js` as the only auto-loaded plugin entry point.
- Pre-tool edit/write timing injects relevant Playwright and harness micro-protocol reminders; post-tool timing is optional and non-blocking.
- Classifier distinguishes Playwright page object, spec, and fixture examples with tests.
- Noise controls enforce dedupe windows, severity, per-call/session limits, opt-outs, and dry-run.
- User notification and append-only JSONL ledger are implemented without secrets or full prompt capture.
- Claude support is adapter/spec/export only and does not create a runtime dependency on `.claude`, `.agents`, or `.codex` paths.
- Hooks remain guardrails/telemetry only; validator command evidence remains required for acceptance.
- Validation commands pass and plugin/config restart caveat is documented.

### Assumptions

- A future implementer may add new harness-owned schema/protocol/doc/test files if they are added to `.opencode/harness.manifest.json` and validation.
- OpenCode hook input shapes for `tool.execute.before`/`tool.execute.after` are sufficient to inspect tool name and args; chat/system transforms need confirmation before use.
- Ledger writes under `.memory/` are acceptable as project-owned telemetry artifacts when redacted and append-only.

### Residual Risks

- OpenCode hook API details may differ from docs or current skill summary; runtime inspection may alter adapter wiring.
- Claude hook semantics and OpenCode plugin mutation semantics are not identical, so the common core must avoid host-specific assumptions.
- Classifying Playwright files by path/extension/imports can produce false positives or miss unconventional layouts.
- Excessive reminders can train users to ignore notices; strict defaults and dry-run rollout are necessary.
- Ledger file paths and session ids may be unavailable in some hosts; adapters need graceful fallback.

## Handoff

- Next role: `reviewer` and `synthesizer` may run after this plan; `validator` must run after review/synthesis before acceptance.
- Limitations: Design-only artifact; no runtime implementation files changed; no final validation performed; OpenCode chat/system transform shapes remain unconfirmed.
- Risks: Primary risks are hook API drift, reminder noise, cross-host semantic mismatch, and accidental runtime dependency on `.claude` if future implementers are not careful.
- Reviewer notes: Focus on prompt-injection risk, host compatibility, noise defaults, ledger privacy, and whether pre-tool delivery can reliably influence actions without mutating user code.
- Synthesizer notes: Resolve whether Claude support should remain documentation/export-only for the first iteration and whether post-tool verification should ship in v1 or remain optional.
- Validator notes: Require command-backed evidence; treat ledger/notifications as telemetry only; run `node .opencode/scripts/validate-harness.mjs` and proposed node tests if implementation exists.
