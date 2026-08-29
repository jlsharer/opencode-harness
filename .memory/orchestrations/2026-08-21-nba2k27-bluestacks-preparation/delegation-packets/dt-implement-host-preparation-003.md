# Delegation Packet: dt-implement-host-preparation-003

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-implement-host-preparation-003`
- scopeKey: `durable-host-preparation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Plan: `roles/planner/root-planner-002-host-preparation.md`.
- Source: `/tmp/opencode/nba2k27-myplayer` read-only baseline.
- Destination: `/home/joshl/projects/nba2k27-myplayer` durable standalone project.
- Required: Migrate baseline, implement exact approved host protocol/config/capability/launcher/fake companion/evidence vault/CLI-preparation/tests/docs/Windows companion source and build assets, preserve existing behavior, and package only intended source/docs/fixtures.
- Prohibited: Any Windows executable invocation, host probe/change, live capture/input, BlueStacks/app/account operation, ADB/network/credentials, external dependencies, Git/global config/publication, or harness edit beyond assigned trace.
- Deliverable: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/implementer/root-implementer-003-host-preparation.md`.
