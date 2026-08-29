# Delegation Packet: dt-impl-ui-adapter-022

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-impl-ui-adapter-022`
- scopeKey: `standalone-ui-adapter`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Implement a fake-tested semantic Builder state machine, recognition, approvals, redaction, observability, abstract/fake host transport, preflight, and bounded BlueStacks UI oracle.
- Scope: Assigned state, recognizer, host/UI oracle, security, observability files, focused test, and assigned trace only.
- Required behavior: No real process execution; capability-bound/expiring run approvals; replay/manual defaults; two-cue recognition; checkpoint guards; semantic allowlisted actions; bounded retries; fail-closed auth/modal/version/geometry ambiguity; fake host canary; redacted structured events.
- Verification: `node --test test/nba2k27-myplayer/ui-adapter.test.mjs` plus syntax and prohibited-import checks.
- Non-goals: No live BlueStacks/ADB/app, real host command adapter, network, credentials, optimizer/report, external dependency, Git, or delegation.
