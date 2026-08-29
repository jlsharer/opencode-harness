# Validator Trace Artifact: Standalone UI Adapter Recheck

## Findings

1. **BLOCKING — closed events still emit recognizable credential-like scalar values.** The remediation rejects paths, headers, email addresses, assignment-form credentials, and free text, but the independent probe showed that `SECRET`, `password`, `sk_live_123456789`, and `AKIAIOSFODNN7EXAMPLE` all survive `redactStructured`, are reported safe by `containsProhibitedData`, and are emitted unchanged in allowlisted event `details.transitionId`. This violates the supplied gate that scalar-sensitive data be rejected or redacted before closed event emission. The five exact prior exploit forms otherwise passed.

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-029-ui-recheck`
- createdAt: `2026-08-21`
- taskMode: `review`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-revalidate-ui-adapter-031`, scoped changed paths, six verification criteria, commands, schema boundaries, five risk areas, no-skip policy, acceptance standard, and artifact expectation.
- Required context present: Yes. Review was bounded to `/tmp/opencode/nba2k27-myplayer` and the requested trace artifact.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Independently reread the eight scoped modules and UI test; ran the assigned UI suite, all project tests, syntax checks, a dependency-free authority scan, the six focused remediation regressions, explicit cue-alias probes, exact prior scalar probes, and an additional credential-like scalar adversarial probe.
- Files read: The eight scoped implementation modules; `test/nba2k27-myplayer/ui-adapter.test.mjs`; `package.json`; prior validator and remediation traces; validator contract, trace schema, and memory protocol.
- Files changed: This trace artifact only. No implementation, test, configuration, emulator, host, or account surface was modified.
- Commands:
  - `node --test test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 13 passed, 0 failed/skipped.
  - `node --test test/nba2k27-myplayer/*.test.mjs`: exit 0; 62 passed, 0 failed/skipped.
  - `node --test --test-name-pattern='preflight requires a closed capability report|non-dry-run requires one shared approval ledger|shared approval ledger aggregates query attempts|canary charges retry attempts|redaction and closed events|two independent cues' test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 6 passed, 0 failed/skipped.
  - `node --check` over the eight scoped modules and UI test: exit 0, no output.
  - Independent Node cue-alias probe: exit 0; duplicate cue ID, source class, matcher ID, and matcher function were each rejected.
  - Independent Node exact scalar probe: exit 0; path, Bearer header, email, assignment-form credential, and free-text values were removed; unsafe top-level free text was rejected.
  - Independent Node credential-like scalar probe: exit 0 and reproduced the blocker; all four values were emitted unchanged and reported non-prohibited.
  - Dependency-free Node authority/import scan over eight scoped modules: exit 0; no process, shell, ADB, network, WebSocket, ambient-environment, or live-host authority found.
  - Initial `rg` authority scan could not execute because `rg` is unavailable; it was replaced by the successful dependency-free Node scan.

## Output Contract

- Outputs: **FAIL — do not pass `gate-ui-adapter`.**
- Evidence: Preflight, aggregate shared-ledger budgets, per-attempt action/canary accounting, and cue identity remediation pass. The command-backed credential-like scalar probe still violates the explicit leak-resistance criterion, so the all-gates acceptance standard is not met.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-029-ui-recheck.md`

### Pass/Fail Matrix

| Verification criterion | Result | Command-backed evidence |
| --- | --- | --- |
| Preflight fails on connectivity/capability/checkpoint ambiguity and requires two independent cues without input | PASS | Focused preflight regression passed; connectivity false, missing capture capability, wrong control channel, undeclared context data, and one-cue capture all failed before input. |
| One injected run ledger aggregates approval budgets across adapters and cannot be reset/replayed | PASS | Shared action ledger allowed one input for `maxActions: 1` and blocked the second adapter before input; shared query ledger blocked the second preflight before its sixth host query. Missing non-dry-run ledger was rejected before host access. |
| Every input attempt, including retries, is charged before host call against canary and approval limits | PASS | Retry/canary regression recorded two inputs and blocked the next plan with `CANARY_ACTION_BUDGET_EXHAUSTED`; source and approval regressions passed. |
| Scalar-sensitive data is rejected/redacted before closed event emission | **FAIL** | `SECRET`, `password`, Stripe-style `sk_live_...`, and AWS-style `AKIA...` strings survived redaction and event creation unchanged. |
| Duplicate cue IDs/source classes/matcher identities/functions cannot satisfy recognition | PASS | Four independent adversarial constructions each threw the required independence error. |
| Prior safety tests and fake-only/no-live/no-network authority remain passing | PASS | All 62 project tests passed; syntax passed; scoped authority scan found no prohibited authority. |

### Schema Results

- State/checkpoint and host-context schemas: PASS for the scoped gate. Closed context/capability shape, compatibility, checkpoint hash, and recognized Builder-home preflight are enforced.
- Approval schema/lifecycle: PASS for the injected-ledger contract. Exact approval shape/binding/expiry/capabilities and aggregate action/query counters are enforced before host calls.
- Recognizer schema: PASS. Cue ID, source class, matcher ID, and function identity uniqueness are enforced at construction.
- Event/redaction schema: **FAIL on scalar value semantics.** Event keys and types are closed, but the allowlisted details value grammar admits recognizable credential-like values and `containsProhibitedData` labels them safe.

### Security and Activation Findings

- Fake-only authority: PASS. `HostAdapter` remains abstract and `FakeHostAdapter` is the only executable host implementation in scope.
- Process/network/credential authority: PASS. No child-process, shell, ADB, network, WebSocket, ambient-environment, or live transport authority was found or exercised.
- Input safety: PASS for the supplied fake-host preflight, shared ledger, retry, canary, checkpoint, allowlist, and ambiguity boundaries.
- Data exposure: **FAIL** for credential-like scalar values in allowlisted event details.
- Activation: No live emulator, host transport, network, account, credential, or provider activation was attempted; live checks remain prohibited and are not acceptance evidence.

### Remediation List

1. Replace heuristic acceptance of arbitrary allowlisted detail strings with a value boundary that cannot carry caller-supplied credential material—for example, derive closed identifiers from trusted registered objects or use field-specific closed vocabularies—and add regressions for bare secret markers and common credential-shaped values.

### Skipped Checks and Residual Risk

- Required fake/offline checks skipped: none.
- Live checks: intentionally prohibited by the packet.
- Expected warnings: none supplied. The unavailable optional `rg` executable did not skip the required authority check because the equivalent Node scanner completed successfully.
- Residual risk: Regex-only secret detection cannot enumerate every opaque credential. Acceptance should depend on provenance/closed vocabularies rather than attempting to recognize all secret formats.

## Handoff

- Next role: Parent orchestration for a failed-gate decision; any correction requires a fresh scoped remediation task and fresh independent validation.
- Limitations: Review was offline and bounded to supplied paths/contracts. No fix was implemented and no live authority was exercised.
- Risks: The current UI control boundary is input-safe in fake tests, but event consumers may receive credential-like scalar content; therefore final acceptance remains blocked.
