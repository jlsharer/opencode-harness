# Delegation Packet: dt-validate-host-preparation-004

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-validate-host-preparation-004`
- scopeKey: `preparation-validation`
- role: `validator`
- taskMode: `integration-check`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Changed target: `/home/joshl/projects/nba2k27-myplayer`, migrated from `/tmp/opencode/nba2k27-myplayer` plus approved host-preparation surfaces.
- Verify: Migration regressions; protocol/config fail-closure; launcher physical/API/capability isolation; fake CLI only; companion source contract; evidence vault permissions, limits, expiry and attack resistance; package inventory; docs; no live/network/ADB/host operation.
- Acceptance: Independently pass `gate-implementation`, `gate-migration`, `gate-host-safety`, `gate-package`, and `gate-no-live`, or report command-backed blockers without fixes.
- Deliverable: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/validator/root-validator-004-host-preparation.md`.
