# Delegation Packet: dt-remediate-ui-key-assignment-034

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-remediate-ui-key-assignment-034`
- scopeKey: `standalone-ui-key-assignment-remediation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Close generic key/value assignment and caller self-registration across run, transition, and evidence identifiers.
- Scope: UI redaction/events modules and UI tests plus assigned trace only.
- Required behavior: Classify generic assignment-like strings case-insensitively, including key/name/id/token/secret/password/api/access variants with `:`, `=`, or whitespace separators; registration APIs must accept only trusted startup declarations from a closed registry object, not arbitrary per-event caller values; event fields must require pre-registered canonical IDs and reject registration/emission of assignment-like IDs.
- Required regressions: `key:example123`, `key=example123`, `api_key value`, mixed case, and nested arrays/objects across runId, transitionId, evidenceIds, and every allowed string detail; safe canonical registered controls remain accepted.
- Verification: UI and full suites plus original self-registration probe.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-032-ui-key-assignment.md`
- Non-goals: No other UI behavior, integration, live/network/process, dependency/Git/harness changes, or delegation.
