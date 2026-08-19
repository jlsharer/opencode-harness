# Planner Trace: Minimal Delegation Diagnostic Isolation Plan

## Metadata

- orchestrationId: `2026-08-18-delegation-tui-log-isolation`
- role: `planner`
- artifactId: `fix-planner-001-minimal-plan`
- createdAt: `2026-08-18`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete `plan` packet `delegation-plan-001` with an approved diagnostic-isolation goal, exact edit boundaries, authoritative researcher artifact, deliverable paths, acceptance criteria, dependency, and assumptions.
- Required context present: Yes. Task mode is `plan`; all planner-required fields are present. Dependency `emitters-researcher-002-diagnosis` is complete.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Converted the supplied emitter diagnosis into a two-file implementation and regression-test plan. Selected structured `client.app.log` diagnostics with synchronous rejection containment, while leaving the task-policy state machine and thrown guardrails unchanged.
- Files read:
  - `.memory/orchestrations/2026-08-18-delegation-tui-log-isolation/roles/researcher/emitters-researcher-002-diagnosis.md`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/plugin-modules/task-thread-policy.js`
  - `.opencode/plugin-modules/task-thread-policy.test.mjs`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/protocols/memory-management.md`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/orchestrations/2026-08-18-delegation-tui-log-isolation/INDEX.md`
  - Local SDK/plugin declaration excerpts for `client.app.log`
  - Supplied authoritative OpenCode plugin logging documentation
- Files changed: Only this planner trace artifact; no implementation file was edited.
- Commands/checks: Read and content-search inspection only. No implementation, test execution, final validation, live TUI, or provider activation was performed.

## Output Contract

### Ordered Plan

1. **Replace the lifecycle adapter's console sink, without changing task policy.** In `.opencode/plugin-modules/harness-lifecycle.js`, change `HarnessLifecyclePlugin` to consume the existing plugin context's `client`. Add one small private diagnostic helper that invokes `client.app.log({ body: { service, level, message, extra } })` using:
   - stable service: `opencode-harness`;
   - level: `debug` for all routine lifecycle/progress records;
   - fixed, bounded messages rather than raw command, prompt, output, or metadata text;
   - only bounded task fields already emitted by `createTaskThreadPolicy` (`event`, sanitized `delegationTaskId`, sanitized `scopeKey`, and enumerated `reason`) as structured `extra` data.
2. **Make diagnostic delivery best-effort and non-interfering.** The helper must attach rejection handling synchronously to the returned value, for example by wrapping the call with `Promise.resolve(...).catch(() => {})`, and must also contain a synchronous throw from the logger. It must never call any `console` method as a fallback and must not throw into a hook. This keeps the synchronous task-policy telemetry seam intact and avoids an unhandled rejection from fire-and-forget logging.
3. **Redirect all three routine emitter categories through that helper.** Preserve the existing trigger conditions but replace their `console.error` effects:
   - task telemetry becomes one fixed task-state message plus the bounded structured fields;
   - `session.created` becomes one fixed harness-loaded record;
   - a matching Bash delegation/routing observation becomes one fixed observation record, without storing the command text.
   Do not call `client.tui.appendPrompt`, `client.tui.showToast`, or any other visible TUI API.
4. **Preserve enforcement exactly.** Leave `.opencode/plugin-modules/task-thread-policy.js` unchanged. Do not catch, translate, or log-and-suppress exceptions from `taskThreadPolicy.beforeTask`, `taskThreadPolicy.afterTask`, blocked direct-role commands, or destructive-deletion checks. The helper catches only failures produced while attempting routine structured logging.
5. **Strengthen the focused lifecycle regression in `.opencode/plugin-modules/task-thread-policy.test.mjs`.** Extend or split the existing lifecycle-adapter test to install spies for routine console methods, a recording `client.app.log`, and throwing TUI stubs. Drive all routine paths in one plugin instance: `session.created`, a valid fresh Task before/ordinary after pair, and a matching non-destructive Bash command. Assert:
   - zero calls to `console.error`, `console.log`, `console.warn`, and `console.info` (restoring each in `finally`);
   - zero calls to `client.tui.appendPrompt` and `client.tui.showToast`;
   - exact structured records for loaded, `fresh-in-flight`, terminal `ordinary-or-invalid-result`, and Bash observation paths;
   - stable `opencode-harness` service, `debug` level, fixed messages, and no raw prompt/output/command data in any record.
6. **Add the rejected-logger regression at the same test path.** Use a mock `client.app.log` that returns `Promise.reject(...)`; invoke representative routine hooks, then advance one event-loop turn so a leaked rejection is observable to `node:test`. Assert hooks still resolve, console/TUI fallbacks remain unused, and logging failure does not alter Task enforcement. Retain the current `assert.rejects` checks for direct-role and destructive-deletion guardrails; keep existing policy rejection tests unchanged.
7. **Stop at the two-file correction boundary.** Do not edit manifests or validators: supplied research shows these files are already inventoried and validators do not require the removed console strings. Do not change package/config surfaces.

### File Contracts and Decisions

- `.opencode/plugin-modules/harness-lifecycle.js`
  - Contract: routine diagnostics produce zero direct console writes and zero prompt/toast calls.
  - Contract: useful diagnostics remain as bounded structured server-log records through `client.app.log`.
  - Contract: logger synchronous throws and Promise rejections are absorbed locally, with no console fallback or hook failure.
  - Preservation: hook names, command recognition, Task before/after ordering, task-policy invocation, and all thrown guardrail failures remain behaviorally unchanged.
- `.opencode/plugin-modules/task-thread-policy.test.mjs`
  - Contract: executable regression covers every former lifecycle console category, exact structured logging, no console/TUI writes, rejected logging, and preserved guardrail rejection.
  - Preservation: pure task-policy state-machine tests and raw-data non-disclosure assertions remain intact.
- `.opencode/plugin-modules/task-thread-policy.js`: explicit no-edit decision; the existing injected telemetry seam is sufficient.
- Manifest/script paths: explicit no-edit decision; no new asset or validation marker is required by supplied evidence.

### Dependencies

- Completed evidence dependency: `.memory/orchestrations/2026-08-18-delegation-tui-log-isolation/roles/researcher/emitters-researcher-002-diagnosis.md`.
- Implementation sequence: lifecycle helper/redirect and focused tests are one bounded implementer work unit; tests depend on the chosen fixed messages and record shape.
- Acceptance sequence: independent validator work follows implementation; planner inspection is not acceptance evidence.

### Verification Gates

1. Focused executable gate:
   - `node --test .opencode/plugin-modules/task-thread-policy.test.mjs`
   - Pass condition: all policy tests and new lifecycle assertions pass, including the event-loop-turn rejected-logger case with no unhandled rejection.
2. Repository harness gate:
   - `node .opencode/scripts/validate-harness.mjs`
   - Pass condition: exits zero and confirms source plus portable-profile-equivalent harness validity.
3. Independent diff/review gate:
   - Changed implementation/test paths are exactly `.opencode/plugin-modules/harness-lifecycle.js` and `.opencode/plugin-modules/task-thread-policy.test.mjs` (plus required orchestration artifacts owned by their roles).
   - No `console.*`, `client.tui.appendPrompt`, or `client.tui.showToast` call remains in the lifecycle adapter.
   - Thrown task-policy and lifecycle guardrail paths are not wrapped by the diagnostic failure handler.

### Assumptions and Tradeoffs

- The committed neutral routing profile applies; routing metadata was absent.
- No live TUI reproduction is authorized, so source-backed capture isolation plus focused tests is the bounded acceptance target.
- Retaining all three routine categories at `debug` level favors durable diagnostics over deleting them. This is slightly larger than dropping loaded/Bash observations but directly satisfies the approved observability goal without a new surface.
- `OPENCODE_PRINT_LOGS=1` can intentionally mirror server logs to stderr. This operator-controlled upstream behavior is a residual risk and cannot be eliminated while retaining `client.app.log`; the adapter itself must still make zero console writes.

- Outputs: Ordered two-file plan, exact behavioral/file contracts, dependency and no-edit decisions, executable verification gates, assumptions, tradeoffs, and implementer handoff.
- Evidence: The supplied researcher artifact identifies the three console sites, supported structured logger, async rejection risk, test seams, existing inventory coverage, and guardrails that must remain thrown. Current file inspection confirms the exact hooks and focused test location.
- Artifact links: `.memory/orchestrations/2026-08-18-delegation-tui-log-isolation/roles/planner/fix-planner-001-minimal-plan.md`

## Handoff

- Next role: `implementer` in `implementation` mode, limited to `.opencode/plugin-modules/harness-lifecycle.js` and `.opencode/plugin-modules/task-thread-policy.test.mjs`.
- Handoff notes: Implement the structured diagnostic helper and focused tests as one minimal change. Use the documented `{ body: { service, level, message, extra } }` call shape. Attach rejection handling immediately; do not make the task-policy callback async and do not broaden exception handling around enforcement. Run the focused Node test before returning. Independent validator must then run both declared gates.
- Limitations: This artifact is a plan, not implementation or acceptance. No tests, full validator, live TUI, provider, or `OPENCODE_PRINT_LOGS` execution was run.
- Risks: Logger rejection must not escape; broad catch placement could accidentally suppress guardrails; console spies must be restored reliably; `OPENCODE_PRINT_LOGS=1` remains an operator-controlled stderr re-entry path.
