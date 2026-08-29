# Delegation Packet: dt-validate-oracles-reports-024

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-validate-oracles-reports-024`
- scopeKey: `standalone-oracles-reports-validation`
- role: `validator`
- taskMode: `validation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Changed paths: Replay/manual oracle, normalization, reports, fixtures, and tests.
- Verification: Syntax/tests plus context hash/replay ordering, immutable supersession, unknown/provenance, schema/report semantics, deterministic Markdown, adverse data disclosure, and prohibited host/network/process checks.
- Acceptance: Pass `gate-oracles-reports` only if outputs are deterministic, schema-valid, provenance-preserving, and offline-only.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-022-oracles-reports.md`
- Non-goals: No fixes, optimizer/UI integration, live/network/Git, or delegation.
