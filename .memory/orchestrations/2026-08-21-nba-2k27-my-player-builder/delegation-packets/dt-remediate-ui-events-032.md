# Delegation Packet: dt-remediate-ui-events-032

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-remediate-ui-events-032`
- scopeKey: `standalone-ui-event-remediation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Authorization: User-approved completion task 1 of 4; UI remediation cycle 2.
- Goal: Prevent arbitrary and credential-shaped caller strings from entering structured event details.
- Scope: UI redaction/events modules and UI tests plus assigned trace only.
- Required behavior: Define field-specific closed scalar vocabularies or trusted registered IDs; reject unknown/free-form detail values before event construction; detect/redact bare secrets and common password/token/API-key/access-key shapes; preserve safe reason/transition identifiers; add regressions for `SECRET`, `password`, `sk_live_123456789`, `AKIAIOSFODNN7EXAMPLE`, paths, emails, and authorization headers.
- Verification: UI suite, full suite, and original credential-like adversarial probe.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-030-ui-events.md`
- Non-goals: No other UI behavior, live/network/process, shared contracts, integration, dependency/Git/harness changes, or delegation.
