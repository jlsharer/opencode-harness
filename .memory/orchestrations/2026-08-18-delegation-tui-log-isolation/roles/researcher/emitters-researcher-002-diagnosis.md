# Researcher Trace: Delegation TUI Diagnostic Emitters

## Metadata

- orchestrationId: `2026-08-18-delegation-tui-log-isolation`
- role: `researcher`
- artifactId: `emitters-researcher-002-diagnosis`
- createdAt: `2026-08-18`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete `research` packet `delegation-research-002` scoped to delegation-time emitters, their TUI flow, supported alternatives, correction boundaries, and test seams. Relevant repository paths and OpenCode 1.18.18 were specified.
- Required context present: Yes. The packet supplied the scoped question, source and freshness constraints, downstream needs, relevant paths, and documentation targets.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Inspected the sole plugin entry point, every directly composed plugin module, the task-thread policy and tests, relevant scripts/config/package surfaces, locally installed SDK/plugin declarations, and tag-pinned OpenCode 1.18.18 and OpenTUI 0.4.5 source. Traced each routine diagnostic from hook to console capture and compared it with structured logging, toast, and prompt APIs.
- Files read:
  - `.opencode/plugins/index.js`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/plugin-modules/task-thread-policy.js`
  - `.opencode/plugin-modules/task-thread-policy.test.mjs`
  - `.opencode/plugin-modules/role-model-routing-enforcement.js`
  - `.opencode/plugin-modules/trace-root-permissions.js`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/scripts/validate-portable-harness.mjs`
  - `.opencode/routing/resolve-model-routing.mjs`
  - `.opencode/runtime.manifest.json`, `.opencode/portable.manifest.json`, `.opencode/harness.manifest.json`
  - `.opencode/package.json`, `.opencode/package-lock.json`, `opencode.json`, `package.json`
  - `.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts`
  - `.opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`
  - OpenCode tag `v1.18.18`: `packages/tui/src/app.tsx`, `packages/opencode/src/plugin/index.ts`, `packages/core/src/observability/logging.ts`, and generated SDK types/client
  - OpenTUI tag `v0.4.5`: `packages/core/src/renderer.ts` and `packages/core/src/console.ts`
- Files changed: Only this required trace artifact.
- Commands/checks: Repository content searches; exact-tag source fetches; line-number searches over OpenCode 1.18.18/OpenTUI 0.4.5 raw source. No acceptance validation or live TUI/provider execution was performed.

## Output Contract

### Cited Findings

1. **The active harness has exactly three `console.error` emitter sites, all in the lifecycle adapter.** The sole auto-loaded plugin composes lifecycle, routing, and trace-permission hooks (`.opencode/plugins/index.js:1-16`). Routing and trace-permission modules throw configuration errors but contain no console, toast, prompt, or notice emission (`.opencode/plugin-modules/role-model-routing-enforcement.js:29-60`; `.opencode/plugin-modules/trace-root-permissions.js:13-124`). Direct emitters are:
   - the telemetry adapter, which formats every task-thread notice as `[harness] task-thread ...` (`.opencode/plugin-modules/harness-lifecycle.js:3-7`);
   - the `session.created` loaded reminder (`.opencode/plugin-modules/harness-lifecycle.js:15-19`);
   - the delegation-command observation from `tool.execute.before` (`.opencode/plugin-modules/harness-lifecycle.js:27-35`).
   This inventory is direct repository evidence.

2. **One console site fans out to five task-lifecycle event forms.** `createTaskThreadPolicy` normalizes a notice and calls its injected `telemetry` callback (`.opencode/plugin-modules/task-thread-policy.js:121-127`). It emits `fresh-in-flight` before every valid fresh Task (`:135-152`), `continuation-in-flight` before an authorized clarification response (`:155-164`), terminal with an execution/metadata reason on abnormal completion (`:167-177`), `awaiting-guidance` for a valid clarification (`:185-194`), and terminal with `ordinary-or-invalid-result` for every ordinary completion or invalid clarification (`:195-198`). Consequently, an ordinary successful delegated task emits at least `fresh-in-flight` and `terminal`; this is expected progress, not an error condition. Direct evidence.

3. **The loaded reminder is session-time, not inherently delegation-time, but can coincide with the first delegation.** It fires on every event whose type/name is `session.created` (`.opencode/plugin-modules/harness-lifecycle.js:15-19`). OpenCode 1.18.18 passes server events to plugin `event` hooks (`packages/opencode/src/plugin/index.ts` at tag `v1.18.18`, lines 253-258). It is therefore part of the visible-message inventory but should not be mistaken for a Task transition. Direct evidence.

4. **The command observation has a narrower trigger than its wording suggests.** `isDelegateCommand` recognizes shell text beginning with `/delegate-` or a Node invocation containing `resolve-model-routing`/`model-routing-helper` (`.opencode/plugin-modules/harness-lifecycle.js:9-11`), but it is consulted only when the current tool is `bash` (`:27-35`). A normal native `/delegate-orchestration` command does not directly satisfy this hook unless it causes a matching Bash command. Direct evidence. The routing CLI itself writes JSON to stdout and failures to stderr (`.opencode/routing/resolve-model-routing.mjs:49-53`); those are explicit Bash tool output, not ambient plugin console messages.

5. **Relevant `.opencode/scripts/` console output is not a loaded delegation emitter.** Bootstrap/validator scripts print only when explicitly executed (`.opencode/scripts/bootstrap-portable-harness.mjs:631-635`; `.opencode/scripts/validate-portable-harness.mjs:365-369`; `.opencode/scripts/validate-harness.mjs:1009-1015`). The plugin entry imports none of these (`.opencode/plugins/index.js:1-3`). If run as a Bash tool, their output belongs to the tool result/terminal stream; it does not call a TUI prompt API. Direct evidence.

6. **No harness code semantically appends to the user input field or requests a toast.** The composed plugin receives an SDK client from OpenCode 1.18.18 (`packages/opencode/src/plugin/index.ts` lines 151-164), but `HarnessLifecyclePlugin` discards its context (`.opencode/plugin-modules/harness-lifecycle.js:3`) and no relevant module calls `client.tui.appendPrompt`, `client.tui.showToast`, or `client.app.log`. OpenCode's exact-tag generated client distinguishes `appendPrompt` (“Append prompt to the TUI,” `packages/sdk/js/src/gen/sdk.gen.ts:1028-1034`) from `showToast` (`:1118`) and structured server logging (`:842-851`). Therefore actual mutation of prompt contents by these emitters is not supported by source evidence. Any appearance in the input region is a rendering/capture interaction or terminal repaint symptom, not a prompt-append event. The first sentence is direct evidence; the final diagnosis is inference.

7. **OpenCode 1.18.18 installs a global console capture while the TUI is active.** It creates the renderer with `externalOutputMode: "passthrough"`, `openConsoleOnError: false`, and the built-in console options (`packages/tui/src/app.tsx:195-205`, tag `v1.18.18`). OpenTUI 0.4.5's default `console-overlay` mode activates console capture (`packages/core/src/renderer.ts:1212,1541-1550`, tag `v0.4.5`); capture replaces the global console and overrides `console.error` to append an ERROR entry (`packages/core/src/console.ts:99-147`). Hidden-console entries are cached and only rendered when the console is visible (`:194-199,463-464`). Thus routine harness `console.error` is routed into TUI-owned global console state. `openConsoleOnError: false` prevents automatic opening for uncaught errors; it does not disable `console.error` capture. Direct evidence. Whether a cached write visibly paints over the prompt under a particular terminal/session is unresolved without reproduction.

8. **Structured app logging is the supported non-prompt diagnostic channel.** OpenCode's plugin documentation explicitly says to use `client.app.log()` instead of `console.log` for structured logging and defines `debug|info|warn|error` levels (`https://opencode.ai/docs/plugins/#logging`, fetched 2026-08-18). Exact 1.18.18 SDK source describes `app.log` as writing to server logs (`packages/sdk/js/src/gen/sdk.gen.ts:842-851`) and requires `service`, `level`, and `message`, with optional metadata (`packages/sdk/js/src/gen/types.gen.ts:3268-3293`). The exact runtime logging layer writes to `opencode.log` by default and adds stderr only when `OPENCODE_PRINT_LOGS=1` (`packages/core/src/observability/logging.ts:49-68`). This is direct evidence for a supported default file-backed alternative; the no-visible-output property is conditional on the operator not enabling print-logs.

9. **Toasts are separate from prompt input but are intentionally visible and therefore unsuitable for routine progress.** OpenCode 1.18.18 listens for `tui.toast.show` and renders it through `toast.show` (`packages/tui/src/app.tsx:990-998`), while the SDK exposes `showToast` separately from `appendPrompt` (exact-tag generated client lines cited above). A toast can be appropriate for an actionable user-facing condition, but replacing every task transition with a toast would preserve interference rather than isolate diagnostics. Direct API separation; suitability is an implementation inference.

10. **Guardrail failures should remain failures, not be converted into routine diagnostics.** Direct role dispatch and destructive deletion are blocked by thrown errors (`.opencode/plugin-modules/harness-lifecycle.js:21-31`). Task-policy invalid input also throws (`.opencode/plugin-modules/task-thread-policy.js:25-89` and subsequent guards). These are behaviorally distinct from the informational `console.error` calls and must remain observable through normal OpenCode tool/session error handling. Direct evidence.

### Emitter-to-TUI Flow

- `session.created` -> lifecycle `event` hook -> loaded `console.error` -> OpenTUI global console override -> hidden console cache/optional console overlay; no prompt API.
- fresh/continuation Task `tool.execute.before` -> task policy notice -> lifecycle telemetry formatter -> `console.error` -> same OpenTUI capture path.
- Task `tool.execute.after` -> awaiting/terminal policy notice -> lifecycle telemetry formatter -> `console.error` -> same OpenTUI capture path.
- matching Bash command -> lifecycle observation `console.error` -> same OpenTUI capture path; separately, the invoked script's stdout/stderr appears as Bash tool output.
- thrown guardrail/policy error -> rejected hook/tool execution -> OpenCode error handling; this is not one of the routine console emitters and should stay actionable.

### Implementation Implications

- The minimal correction boundary is `.opencode/plugin-modules/harness-lifecycle.js` plus its focused test in `.opencode/plugin-modules/task-thread-policy.test.mjs`. The policy's state machine and injected telemetry seam can remain unchanged; removing or redirecting the adapter's `console.error` does not require changing task authorization logic.
- Drop the loaded and delegation-command informational messages unless durable diagnostics are required. They carry no acceptance evidence and duplicate policy/config facts.
- If diagnostics must remain, have the lifecycle plugin consume its existing OpenCode context and send bounded, sanitized events through `client.app.log` with a stable service name and low severity. Logging failures should be swallowed or otherwise kept non-blocking without falling back to `console.*`.
- The telemetry callback is currently synchronous while `client.app.log` is asynchronous. A fire-and-forget Promise risks unhandled rejection. The implementation must either safely absorb the Promise or minimally reshape the adapter/policy return boundary so the async hook can await logging; it must not weaken pre/post Task enforcement.
- Do not use `client.tui.appendPrompt`. Do not use routine toasts. Preserve thrown errors for invalid/blocked operations.
- Packaging inventories already include lifecycle/policy assets (`.opencode/runtime.manifest.json:53-54`; `.opencode/portable.manifest.json:63-65`; `.opencode/harness.manifest.json:53-55`), so no new runtime asset is implied by an in-place adapter/test correction.
- Existing validators require lifecycle hook markers but do not require the console messages (`.opencode/scripts/validate-harness.mjs:834-839`; `.opencode/scripts/validate-portable-harness.mjs:302-303`).

### Test Seams

- Extend the existing lifecycle adapter test, which already monkey-patches `console.error` (`.opencode/plugin-modules/task-thread-policy.test.mjs:138-152`), to assert zero routine console writes while driving session creation, fresh Task, ordinary terminal Task, and matching Bash observation.
- Inject a mock `client.app.log` through `HarnessLifecyclePlugin(context)` and assert exact bounded records for retained diagnostics, including safe handling of a rejected logging Promise.
- Keep pure policy telemetry tests independent: capture callback objects and cover `fresh-in-flight`, `continuation-in-flight`, `awaiting-guidance`, both terminal reasons, and the existing no-raw-data guarantee (`.opencode/plugin-modules/task-thread-policy.test.mjs:125-135`).
- Add negative assertions that routine paths never invoke `client.tui.appendPrompt` or `client.tui.showToast`.
- Run the focused Node test and the repository's normal harness validators in later implementer/validator roles; this researcher did not validate acceptance.

### Risks and Unresolved Questions

- No prepared 0.1.9 runtime cache or live TUI reproduction was available, and live activation was outside this packet. Exact tag source proves the capture route but not the terminal-specific visual symptom.
- The workspace development dependency is `@opencode-ai/plugin` 1.18.3 (`.opencode/package.json:1-4`), while generated runtime validation requires 1.18.18 (`bin/opencode-harness.mjs:253-264`). Findings relying on exact behavior therefore cite tag-pinned 1.18.18 source, not the stale local declarations.
- `client.app.log` defaults to the file logger, but `OPENCODE_PRINT_LOGS=1` also sends structured logs to stderr. That operator override can re-enter a terminal/TUI output path and should be documented as residual risk.
- Removing routine progress console output reduces immediate observability. Tests and trace artifacts should remain the durable evidence; logging must not be treated as acceptance proof.
- It remains uncertain whether the reported text is rendered inside the prompt widget, merely over its screen rows, or restored from cached console output after a repaint. A validator with a deterministic pseudo-terminal/TUI fixture is needed to settle that distinction.

### Source List

- Repository files and line ranges cited above, current workspace as of 2026-08-18.
- OpenCode tag `v1.18.18`, commit/tree resolved by GitHub API as `31406ccc51b4bd2a4e1e086b2bcaa5f7f804f26d`: `https://github.com/anomalyco/opencode/tree/v1.18.18`.
- OpenCode exact-tag TUI source: `https://github.com/anomalyco/opencode/blob/v1.18.18/packages/tui/src/app.tsx`.
- OpenCode exact-tag plugin source: `https://github.com/anomalyco/opencode/blob/v1.18.18/packages/opencode/src/plugin/index.ts`.
- OpenCode exact-tag logging source: `https://github.com/anomalyco/opencode/blob/v1.18.18/packages/core/src/observability/logging.ts`.
- OpenCode exact-tag generated SDK client/types: `https://github.com/anomalyco/opencode/tree/v1.18.18/packages/sdk/js/src/gen`.
- OpenTUI tag `v0.4.5` renderer/console source: `https://github.com/anomalyco/opentui/tree/v0.4.5/packages/core/src`.
- Authoritative OpenCode plugin logging documentation, fetched 2026-08-18: `https://opencode.ai/docs/plugins/#logging`.
- Authoritative OpenCode SDK TUI/App documentation, fetched 2026-08-18: `https://opencode.ai/docs/sdk/#app` and `https://opencode.ai/docs/sdk/#tui`.

- Outputs: Complete emitter inventory, exact flow, supported alternatives, minimal correction boundary, test seams, risks, and unresolved uncertainty.
- Evidence: Direct repository and tag-pinned upstream citations are separated above from inference.
- Artifact links: `.memory/orchestrations/2026-08-18-delegation-tui-log-isolation/roles/researcher/emitters-researcher-002-diagnosis.md`

## Handoff

- Next role: `planner` in `plan` mode to select the smallest adapter/test contract without weakening guardrail errors or task-policy enforcement.
- Limitations: Research only; no implementation edits, final plan, integration, live TUI reproduction, or acceptance validation.
- Risks: Async logging rejection, `OPENCODE_PRINT_LOGS=1` stderr re-entry, loss of immediate progress visibility, and unresolved terminal-specific rendering behavior.
