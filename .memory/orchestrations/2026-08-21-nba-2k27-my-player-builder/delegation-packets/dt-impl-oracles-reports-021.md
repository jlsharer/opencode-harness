# Delegation Packet: dt-impl-oracles-reports-021

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-impl-oracles-reports-021`
- scopeKey: `standalone-oracles-reports`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Implement offline oracle contracts, deterministic replay/manual capture, observation normalization, and JSON/Markdown reports.
- Scope: Assigned oracle files, `capture/normalize-observation.mjs`, `report/`, replay fixtures, focused test, and assigned trace only.
- Required behavior: Typed capability interface; exact-context replay; deterministic manual worksheet/import; known/unknown provenance normalization; schema-valid report construction; concise comparison with satisfied/missed/unknown desires, resources, assumptions, confidence, and deltas; no live host access.
- Verification: `node --test test/nba2k27-myplayer/oracles-reports.test.mjs` plus syntax checks.
- Non-goals: No optimizer, UI/host adapter, network, credentials, external dependency, Git, or delegation.
