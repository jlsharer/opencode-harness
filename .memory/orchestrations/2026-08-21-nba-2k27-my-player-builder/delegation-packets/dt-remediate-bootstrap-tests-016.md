# Delegation Packet: dt-remediate-bootstrap-tests-016

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-remediate-bootstrap-tests-016`
- scopeKey: `standalone-bootstrap-test-remediation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Authorization: User-approved bootstrap remediation cycle 2 of 2.
- Goal: Add committed executable regression coverage for evidence-union variants, conditional schema branches, and rejection of legacy `nearTieAbsolute`/`nearTieRelative` fields.
- Scope: Contract tests and synthetic fixtures only, plus assigned trace. Production schema/domain changes are forbidden unless a new test proves a real mismatch, in which case stop and report rather than broadening.
- Verification: Run the full contract suite and demonstrate each missing regression fails when its invariant is deliberately violated and passes for its valid counterpart.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-014-bootstrap-tests.md`
- Non-goals: No downstream components, production redesign, external dependencies, live/network/Git/harness mutation, or delegation.
