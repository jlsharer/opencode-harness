# Standalone UI Adapter Implementation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-020-ui-adapter`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-impl-ui-adapter-022`
- scopeKey: `standalone-ui-adapter`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh implementation packet naming the accepted planner chain and bootstrap proof, exact standalone state/capture/oracle/security/observability/test paths, safety and schema requirements, preservation boundaries, style constraints, verification commands, and handoff requirements.
- Required context present: Yes. `dispatchKind` is `fresh`; selected `taskMode` is `implementation`; shared schemas/domain contracts and all nonassigned package files were read-only.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Implemented the dependency-free semantic UI boundary with immutable checkpoint hashes, closed transitions, two-cue recognition, exact versioned host profiles, abstract and deterministic fake hosts, live-mode approval parsing and budgets, structured redaction/events, and an injected-host-only BlueStacks oracle. Added focused fake-only tests for dry-run, preflight uniqueness, approvals, allowlists, checkpoint guards, bounded retry, redaction, and canary limits.
- Files read: Supplied planner artifacts `root-planner-003-agentic-workflow.md`, `root-planner-006-plan-remediation.md`, and `root-planner-008-contract-correction.md`; validator artifact `implementation-validator-017-bootstrap-acceptance.md`; role contract, trace schema/template, memory protocol; standalone `package.json`; existing domain modules and contract tests.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/state/builder-state-machine.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/state/host-profile.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/capture/recognizers.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/host-adapter.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/bluestacks-ui-oracle.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/security/approval.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/security/redaction.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/observability/events.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/ui-adapter.test.mjs`
  - This trace artifact.
- Commands/checks:
  - All eight assigned `node --check` commands: exit 0.
  - `node --test test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 9 passed, 0 failed/skipped.
  - `node --test test/nba2k27-myplayer/contracts.test.mjs test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 34 passed, 0 failed/skipped.
  - Prohibited import/command search over assigned production paths using `grep -R -E 'child_process|node:child_process|exec\(|spawn\(|execFile\(|shell'`: exit 0 with no matches. An initial equivalent `rg` attempt could not run because `rg` is unavailable; the deterministic fallback passed.

## Output Contract

- Outputs: Nine assigned standalone files plus this trace; exported semantic state/checkpoint/transition and recovery contracts; host-profile creation/compatibility/selector resolution; two-cue recognizers; `HostAdapter` and deterministic `FakeHostAdapter`; `BlueStacksUiOracle`; closed approvals and budgets; redaction helpers; and a closed event factory.
- Evidence: Assigned syntax checks and focused tests pass. The combined prior-contract plus UI suite passes 34/34. The prohibited-import proof has no match. Tests establish no input during dry-run, exactly one matching instance, expired/bound/limited approvals, replay/manual no-live-capability behavior, checkpoint mismatch no action, one bounded retry with unchanged precondition, sensitive-field exclusion, and a two-action maximum canary.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-020-ui-adapter.md`; supplied planner and validator artifacts.
- changedFiles: The ten paths listed under Files changed.
- rationale: Keep all authority injected and all UI meaning semantic; require immutable source checkpoints, exact profile/context guards, independent cues, current approval, bounded budgets, successful preflight, and closed allowlists before any fake-host input call.
- schemaOrBoundaryChoices: No shared schema was edited. Live modes are `ui-observe` and `ui-control`; replay/manual need no live approval. Approval objects are exact run/mode/expiry/action/query bindings. Coordinates exist only in exact profile selectors and are returned only after profile and checkpoint guards. `execute` accepts only plans issued by the configured machine/profile and requires a passing unique-instance preflight. Finalize/upload/share/account/purchase/delete/save/launch/restart/debug/dismiss semantics are blocked.
- commandsRun: Listed under Commands/checks with results.
- handoffNotes: Independent validator should rerun the assigned commands and inspect plan provenance/preflight enforcement, approval budgets, fake-only tests, redaction closure, and prohibited-import proof. Shared contract integration or public index exports were not in this implementation scope.

## Handoff

- Next role: Fresh independent `validator` in an appropriate validation mode for the standalone UI-adapter gate.
- Limitations: No real BlueStacks, ADB, app, process, shell, network, account, credential, screenshot persistence, hierarchy persistence, optimizer, report, package manifest, shared contract, Git, or harness operation was performed. The host adapter is intentionally abstract; only the deterministic fake has behavior. Polling is count-bounded and injected-host driven, not elapsed-time based.
- Risks: A future real host implementation and concrete current host profile require separate approval, security review, and independent live acceptance. The current redaction/event vocabulary deliberately drops unrecognized detail rather than preserving free text. Integration must preserve exact object identity/provenance for oracle-issued plans or add a separately reviewed serialization contract.
