# Validator Trace Artifact: Final UI Event Review

## Findings

1. **BLOCKING — generic key-assignment values can self-register and be emitted unchanged.** The independent scalar probe showed that `key:example123` is reported non-prohibited, survives `redactStructured`, is accepted as a `runId`, transition registry ID, and evidence registry ID, and is then retained unchanged in emitted `runId`, `details.transitionId`, and `evidenceIds`. This violates the explicit key-assignment rejection and no-self-registration acceptance gates. The event factory's static error messages did not leak source content for values that were rejected.

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-031-ui-acceptance`
- createdAt: `2026-08-21`
- taskMode: `review`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Fresh packet `dt-revalidate-ui-events-033`; three changed files; four verification criteria; four required offline checks; schema contracts; no-skip policy; four risk areas; acceptance standard; and artifact expectation.
- Required context present: Yes. Work was bounded to `/tmp/opencode/nba2k27-myplayer` and this trace artifact.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Independently read the changed event/redaction implementation and UI tests, reviewed the prior failed validation, ran the UI and complete project suites, syntax-checked all source and test modules, scanned all modules for prohibited authority/imports, and probed credential-like values across every event scalar position plus safe canonical controls and self-registration paths.
- Files read: `src/nba2k27-myplayer/security/redaction.mjs`; `src/nba2k27-myplayer/observability/events.mjs`; `test/nba2k27-myplayer/ui-adapter.test.mjs`; `package.json`; prior validator trace `implementation-validator-029-ui-recheck.md`; validator role contract; trace schema; memory protocol.
- Files changed: This trace artifact only. No implementation, test, runtime, host, emulator, network, or account surface was modified.
- Commands:
  - `node --test test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 14 passed, 0 failed/skipped.
  - `node --test test/nba2k27-myplayer/*.test.mjs`: exit 0; 63 passed, 0 failed/skipped.
  - `for f in src/nba2k27-myplayer/**/*.mjs test/nba2k27-myplayer/*.test.mjs; do node --check "$f" || exit 1; done`: exit 0; no syntax errors.
  - Dependency-free Node authority/import scan over all 30 source/test modules: exit 0; zero prohibited hits.
  - Independent 19-value by 17-position scalar probe with one complete safe canonical event: exit 1 as an acceptance probe; safe canonical control accepted, but five generic-key-assignment checks failed (recursive scan, redaction, run-ID registration, transition-ID registration, and evidence-ID registration).
  - Focused self-registration/emission reproduction: exit 2 by design on exploit reproduction; `prohibited: false`, `redactedAway: false`, and source retention was true for emitted run, transition, and evidence positions.

## Output Contract

- Outputs: **FAIL — do not pass `gate-ui-adapter`.**
- Evidence: All regression, syntax, and fake-only authority checks pass. The command-backed generic key-assignment probe demonstrates unchanged source retention through caller-controlled registration and emission, so the scalar leak-closure gate is not met.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-031-ui-acceptance.md`

### Pass/Fail Matrix

| Verification criterion | Result | Command-backed evidence |
| --- | --- | --- |
| Secret/password/passwd, bearer/basic, Stripe, AWS, JWT-like, token/key assignment, email, path, header, control, and arbitrary free-text values are rejected/redacted in every scalar position | **FAIL** | The broad probe rejected the previously named forms but accepted generic `key:example123` for recursive scanning, redaction, and three registration positions; the focused probe proved unchanged emission. |
| Safe registered canonical values remain accepted and unsafe values cannot be self-registered | **FAIL** | A complete canonical event using registered `open-path`/`screen-a`, canonical outcome/reason/state/mutation/mismatch values, valid counters, and confidence was accepted. However, the generic key assignment self-registered as run, transition, and evidence IDs and was emitted. |
| Recursive prohibited-data inspection and post-redaction validation retain no source content | **FAIL** | Recursive detection and replacement safety passed for the other 18 adversarial values. For the generic key assignment, `containsProhibitedData` returned false, redaction retained it, and resulting events retained the exact source. |
| Prior preflight, ledger, canary, cue, checkpoint, forbidden-action, fake-only authority, and no-live/network gates remain passing | PASS | UI suite: 14/14. Full suite: 63/63. Syntax passed. The 30-file authority/import scan found zero process, ADB, shell, ambient process, network, WebSocket, or live-host authority hits. |

### Schema Results

- Event key/type and closed canonical vocabularies: PASS for type, outcome, reason, state, mutation class, mismatch, counters, confidence, and unknown-field rejection.
- Registered identifier boundary: **FAIL.** Registry construction relies on the same permissive safe-ID/value heuristic and permits a caller to establish a generic key assignment as trusted provenance.
- Redaction/prohibited-data recursion: **FAIL for generic key assignments.** Recursive traversal is present, but its scalar predicate classifies this assignment as safe and therefore neither removes nor rejects it.
- Regression contracts: PASS. Existing preflight, checkpoint, approval-ledger, canary, cue independence, and fake-host behavior remain green.

### Security and Activation Findings

- Data exposure: **FAIL.** A caller-controlled generic key assignment can cross run, transition, and evidence event boundaries unchanged.
- Replacement leakage: PASS for rejected probes because thrown errors were static and did not include source content; it does not mitigate the accepted-value blocker.
- Fake-only authority: PASS. No prohibited authority/import was found in 30 scanned source/test modules.
- Input and approval safety: PASS under the complete offline suite, including preflight, shared-ledger, retry, canary, checkpoint, cue, and forbidden-action tests.
- Activation: No live host, emulator, network, account, credential, or provider activation was attempted. Live checks remained prohibited and are not acceptance evidence.

### Remediation List

1. Close the generic key-assignment gap in scalar classification and add regressions proving such values cannot be used as run IDs or registered transition/evidence IDs.
2. Revalidate every event scalar and self-registration path independently after remediation; acceptance requires no source retention and all existing canonical controls/regressions to remain green.

### Skipped Checks, Warnings, and Residual Risk

- Required offline checks skipped: none.
- Live checks: intentionally prohibited by the packet.
- Expected warnings: none supplied; none observed.
- Residual risk: Pattern enumeration remains weaker than trusted, closed provenance. Caller-supplied identifier registries can create future bypasses for credential forms not represented in the prohibited scalar grammar.

## Handoff

- Next role: Parent orchestration for a failed `gate-ui-adapter` decision. Any remediation and revalidation require fresh scoped tasks.
- Limitations: Review was offline and bounded to the supplied work unit. No fixes were implemented and no live authority was exercised.
- Risks: Existing fake UI controls remain green, but emitted observability data still has a command-proven scalar exfiltration path through self-registration.
