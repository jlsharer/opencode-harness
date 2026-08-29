# Delegation Packet: dt-impl-bootstrap-012

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-impl-bootstrap-012`
- scopeKey: `standalone-bootstrap-contracts`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Approved plan: Create the standalone Node 24 package and shared contracts from the three accepted planner artifacts and final validator PASS.
- Target: `/tmp/opencode/nba2k27-myplayer` plus assigned trace artifact only.
- Required implementation: Dependency-free ESM package metadata; closed Draft 2020-12 observation/request/experiment/report schemas; canonical vocabulary; context/evidence/provenance helpers; tri-state requirement evaluation; semantic desired-request validation; deterministic diagnostics; synthetic valid/invalid fixtures; Node built-in contract tests.
- Contract requirements: Preserve exact known/unknown, evidence variant, conditional resource field, false-before-unknown hard partition, typed progression resources, split hard/soft unknown policy, priority, and no-hidden-formula semantics from the final plan chain.
- Preservation: Do not touch the harness workspace except the assigned trace. Do not create optimizer, oracle, report, live, network, Git, credential, or global-state behavior.
- Verification: `node --check` for modules, schema JSON parsing/meta-shape checks, and `node --test test/nba2k27-myplayer/contracts.test.mjs` from the target root.
- Deliverable trace: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-010-bootstrap-contracts.md`
