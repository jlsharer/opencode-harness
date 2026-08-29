# Delegation Packet: dt-integrate-standalone-036

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-integrate-standalone-036`
- scopeKey: `standalone-integration`
- role: `implementer`
- taskMode: `integration`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Integrate accepted component branches into a coherent standalone offline package.
- Scope: Entire `/tmp/opencode/nba2k27-myplayer` target and assigned trace; preserve accepted component behavior and make only necessary stitching changes.
- Required deliverables: Public side-effect-free `index.mjs`; CLI defaulting to replay/manual and dry-run; validate-request, validate-observation, optimize replay, deterministic replay assertion, and manual worksheet/import flows; integration fixtures/tests; package bin/exports/files/scripts; operator safety, data-contract, and optimization docs.
- Safety: No network module, real host command, live BlueStacks/ADB/app operation, credential handling, publication, lifecycle scripts, Git, or harness changes. UI adapter exports remain fake/injected and cannot be activated by default CLI.
- Verification: All syntax, full test suite, representative CLI commands, deterministic replay, prohibited inventory/import scan, `npm pack --dry-run --json`.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-034-integration.md`
