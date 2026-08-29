# Delegation Packet: dt-validate-integration-037

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-validate-integration-037`
- scopeKey: `standalone-integration-check`
- role: `validator`
- taskMode: `integration-check`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Changed paths: Entire standalone package integration plus one optimizer stitching fix.
- Verification: Full test suite; syntax; all CLI commands and invalid modes/inputs; deterministic replay/report; package exports/bin/files/scripts; dry-run pack contents; all component gate regressions; prohibited network/live/process/credential/dependency/Git/harness authority; docs accuracy.
- Acceptance: Pass `gate-integration` and `gate-no-live-scope` only if package is coherent, deterministic, offline-only, and no accepted branch regressed.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-035-integration.md`
- Non-goals: No fixes, publication, live/network operation, Git/harness mutation, or delegation.
