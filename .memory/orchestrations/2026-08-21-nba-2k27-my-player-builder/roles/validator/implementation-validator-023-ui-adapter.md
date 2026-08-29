# Validator Trace Artifact: Standalone UI Adapter Review

## Findings

1. **BLOCKING — preflight accepts unresolved connectivity and capability state.** `BlueStacksUiOracle.preflight()` accepted a fake context with `connectivity: false` and no declared capture, hierarchy, or control-channel capabilities: `DEFECT incomplete-capability/connectivity preflight { ok: true, ... }`. It also does not capture and recognize a two-cue Builder checkpoint. This violates the fail-closed preflight gate before input.
2. **BLOCKING — an approval's action budget is replayable across adapter instances.** Two adapters accepted the same approval ID/run with `maxActions: 1`; both passed preflight and each performed input, producing `totalInputs 2 approvedMaxActions 1`. Budgets are process-object-local and approval IDs are not consumed or shared, so the exact run-bound budget can be reset.
3. **BLOCKING — the canary limit counts plans, not actual input attempts.** With two accepted plans and `maxActions: 2`, one bounded retry caused three calls to `performInput`; the canary still returned `ok: true` and `actionLimit: 2`. This breaches the canary boundary even though the larger approval budget allowed the calls.
4. **BLOCKING — sensitive scalar values survive redaction and enter events.** An allowlisted `transitionId` containing `/home/alice Authorization: Bearer SECRET account@example.com` was returned unchanged by `redactStructured`, was reported safe by `containsProhibitedData`, and was emitted unchanged in event `details`. Key-only filtering does not satisfy the no-host-path, no-header, no-account-identifier, no-free-text event gate.
5. **BLOCKING — “two independent cues” is not structurally enforced.** A recognizer with two cues sharing the same ID and matcher was accepted and returned `status: known` with `matchedCues: ["same", "same"]`. Duplicate cues can therefore satisfy the two-cue checkpoint boundary.

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-023-ui-adapter`
- createdAt: `2026-08-21`
- taskMode: `review`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-validate-ui-adapter-025` for the standalone UI adapter, with changed paths, six verification criteria, required syntax/test/scan/fake-host probes, schema contracts, risk areas, skipped-check policy, and acceptance standard.
- Required context present: Yes. Workspace operations were bounded to `/tmp/opencode/nba2k27-myplayer`; project-relative trace rules were used.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Independently reviewed the scoped state, recognition, fake host, UI oracle, approval, redaction, and event boundaries; ran syntax checks and the assigned tests; inventoried imports/live authority; and executed adversarial fake-host probes for all requested safety cases plus capability ambiguity, approval replay, scalar leakage, duplicate cues, and actual canary attempts.
- Files read: All eight scoped implementation modules; `test/nba2k27-myplayer/ui-adapter.test.mjs`; `package.json`; the supplied planner contract; validator role contract; trace schema; and memory protocol.
- Files changed: This trace artifact only; no implementation, test, host, emulator, account, or configuration file was modified.
- Commands:
  - `node --check` for all eight scoped modules and the assigned test: exit 0, no output.
  - `node --test test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 9 passed, 0 failed/skipped.
  - Python scoped authority/import scanner over eight modules: exit 0; imports were local modules plus `node:crypto`; no child process, shell, ADB, network, ambient environment, credential, or live host implementation token was found.
  - Independent Node fake-host probe suite: dry-run, duplicate-instance, expired/wrong-run approval, budget exhaustion, forbidden action, checkpoint mismatch, retry, auth/modal, and key-redaction probes completed; adversarial outputs reproduced findings 1, 4, and 5.
  - Focused non-dry-run retry/canary probe: retry stopped at two attempts; canary accepted three actual inputs under an advertised limit of two.
  - Focused approval replay probe: the same `maxActions: 1` approval performed two total inputs through two adapter instances.

## Output Contract

- Outputs: **FAIL — do not pass `gate-ui-adapter`.**
- Evidence: Five command-backed blockers violate explicit preflight, approval budget/nonreplay, canary, redaction/event, and two-cue acceptance boundaries. Passing syntax and assigned tests do not override these adversarial failures.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-023-ui-adapter.md`

### Pass/Fail Matrix

| Verification criterion | Result | Command-backed evidence |
| --- | --- | --- |
| Fake/injected host only; no child process, shell, ADB, network, dynamic command, ambient credential, or real host implementation | PASS | Scoped scanner found only local imports and `node:crypto`; `HostAdapter` is abstract and `FakeHostAdapter` is the only executable host implementation in scope. |
| Preflight uniquely identifies fake context and fails closed on auth/modal/version/geometry/capability ambiguity without input | FAIL | Duplicate instance, auth, and modal probes blocked with zero input. However, `connectivity: false` plus absent capability declarations returned `ok: true`; no Builder landing capture/two-cue recognition occurs in preflight. |
| Approvals are exact run/capability bound, expiring, budgeted, nonreplayable as applicable, and required before input | FAIL | Expiry, wrong-run, ordinary budget exhaustion, and preflight-before-input checks passed. The same approval with `maxActions: 1` was accepted by two adapters and performed two inputs, resetting the budget. |
| FSM uses semantic states, two cues, checkpoints, bounded retries, allowlisted non-destructive actions, and stops input after mismatch | FAIL | Semantic plan/checkpoint/allowlist and one-retry probes passed. Duplicate cue IDs/matchers nevertheless produced a known state, so independent two-cue recognition is not enforced. |
| Canary/action limits and prohibited finalize/upload/share/account/purchase/delete operations are enforced | FAIL | Forbidden action probe produced `PLAN_GUARD_MISMATCH` with no input and approval action exhaustion worked. A canary configured for two actions executed three actual input attempts and returned success. |
| Redaction/events cannot emit sensitive content or unclosed event fields | FAIL | Unknown event keys are rejected and forbidden keys are dropped, but sensitive raw scalar content in an allowed field survived redaction, evaded `containsProhibitedData`, and was emitted by the event factory. |

### Schema Results

- State/transition contract: semantic states, closed retry bound (`0|1`), mutation classes, checkpoint hashes, and source-state checks pass. **Fail:** recognizer cue identity/independence is not closed or unique.
- Host profile contract: profile and selectors use closed shapes and exact context/geometry comparison. **Fail at preflight composition:** required operational capabilities/connectivity and a recognized Builder checkpoint are absent from the accepted context boundary.
- Approval contract: closed keys, mode/run binding, expiry, and integer limits pass per object. **Fail at lifecycle semantics:** approval identity and counters are not nonreplayable/shared for a run.
- Event contract: top-level field names and event types are closed. **Fail at value semantics:** allowed scalar fields are unconstrained and can carry prohibited path/header/account/free-text content.

### Security and Activation Findings

- Live/network authority: PASS for scoped inventory. There is no real BlueStacks transport, process launch, shell, ADB, network client, ambient credential/environment read, or dynamic command execution.
- Input safety: FAIL because approval replay and canary retry accounting can exceed declared boundaries; preflight can authorize control despite unresolved connectivity/capabilities.
- Data exposure: FAIL because key-only redaction permits sensitive content in allowlisted string values and event identifiers/details.
- Activation: No live BlueStacks, network, ADB, credentials, account, provider, or host activation was attempted. Such activation is prohibited and is not acceptance evidence.

### Remediation List

1. Make preflight validate a closed capability/context report, including connectivity policy, capture/control availability, auth/modal/version/geometry ambiguity, and a two-cue recognized Builder checkpoint before setting `preflightPassed`.
2. Enforce approval identity consumption and run-wide shared counters so constructing another adapter cannot reset action/query budgets; add a regression proving one approval cannot exceed its aggregate budget.
3. Count every `performInput` attempt against the canary's own action ceiling, including retries, and stop before an attempt that would exceed the canary limit.
4. Validate/redact scalar values, not only keys; constrain identifiers and reason fields to closed safe grammars and reject or replace path-, header-, credential-, account-, and free-text-like values before event creation.
5. Reject duplicate cue IDs and require declared distinct cue classes/sources sufficient to enforce the independence contract; add duplicate-ID/source regression tests.

### Skipped Checks and Residual Risk

- Required fake/offline checks skipped: none.
- Initial `rg` scan attempt could not run because `rg` is unavailable; the required scan was rerun successfully with a dependency-free Python scanner and dedicated content search.
- Live BlueStacks/network checks: intentionally prohibited and not run.
- Residual risk: the abstract adapter remains fake-only, so actual host transport security is outside this gate. Current fake control still demonstrates budget bypass and sensitive event leakage and cannot be accepted.

## Handoff

- Next role: Parent orchestration for fresh implementer remediation, followed by a fresh independent validator task.
- Limitations: Review was bounded to supplied paths/contracts and offline fake-host behavior. No fixes were implemented and no live authority was exercised.
- Risks: Ambient/live authority is currently absent, but future transport activation must remain separately approved. Acceptance is presently blocked by fail-open preflight, replayable budgets, canary overrun, scalar leakage, and non-independent cues.
