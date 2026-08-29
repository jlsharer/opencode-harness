# Implementer Trace Artifact: UI Key-Assignment Remediation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-032-ui-key-assignment`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Fresh task `dt-remediate-ui-key-assignment-034`; validator finding `implementation-validator-031-ui-acceptance.md`; three implementation/test targets; this trace target; assignment-pattern, recursive inspection, immutable registry, closed-vocabulary, preservation, style, verification, and handoff requirements.
- Required context present: Yes. The packet supplied the exact implementation scope, approved finding, contracts, acceptance requirements, and executable checks.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Added bounded case-insensitive assignment detection for all required labels and separators; applied safe-string checks to nested object keys during redaction; introduced a branded, frozen startup event registry backed by private copied sets; required registered run, transition, and evidence IDs during event creation; recursively rejected prohibited event fields before redaction or emission; and added assignment, nesting, identifier-position, immutability, forged-registry, late-mutation, and safe-control regressions.
- Files read: Validator finding; `src/nba2k27-myplayer/security/redaction.mjs`; `src/nba2k27-myplayer/observability/events.mjs`; `test/nba2k27-myplayer/ui-adapter.test.mjs`; role contract; trace schema; trace template.
- Files changed: `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/security/redaction.mjs`; `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/observability/events.mjs`; `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/ui-adapter.test.mjs`; this trace artifact.
- Commands/checks:
  - `node --check src/nba2k27-myplayer/security/redaction.mjs`: exit 0; no output.
  - `node --check src/nba2k27-myplayer/observability/events.mjs`: exit 0; no output.
  - `node --test test/nba2k27-myplayer/ui-adapter.test.mjs`: exit 0; 17 passed, 0 failed/skipped.
  - `node --test test/nba2k27-myplayer/*.test.mjs`: exit 0; 66 passed, 0 failed/skipped.

## Output Contract

- Outputs: Changed files are the two assigned modules and assigned UI test. `createEventRegistry({ runIds, transitionIds, evidenceIds })` is now the sole trusted registry-construction API; `createEventFactory({ runId, monotonicNow, registry })` accepts only a registry produced by that API and requires `runId` membership. Event calls can reference but cannot register identifiers.
- Evidence: All four required commands pass. Named regressions cover colon, equals, and whitespace separators; mixed case; all required assignment labels; recursive string and object-key positions; each registry identifier category; post-construction declaration mutation; forged registries; late event identifiers; and a complete safe event control.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-032-ui-key-assignment.md`
- Rationale: Closed registry provenance removes event-time self-registration, while recursive assignment detection closes the command-proven `key:example123` leak without widening event vocabularies or exposing rejected source values in errors.
- Schema or boundary choices: Registry declarations are copied into closure-private `Set` instances and exposed only through frozen membership methods; a private `WeakSet` brand rejects lookalike registries. Declaration keys are closed to `runIds`, `transitionIds`, and `evidenceIds`. Existing outcome, reason, state, mutation, mismatch, counter, and confidence checks remain closed. Every new rejection uses a static error message.

## Handoff

- Next role: Independent validator to rerun scalar-position, registry-construction, self-registration, no-source-retention, and complete regression checks.
- Limitations: This was bounded offline implementation self-checking, not independent acceptance validation. No live, network, process, dependency, Git, harness, or integration work was performed.
- Risks: Integrators must construct one startup registry with all declared run/transition/evidence IDs and pass that registry to each event factory; the former inline `registeredIds` option is intentionally rejected. The current scoped codebase had no non-test event-factory call sites requiring migration.
