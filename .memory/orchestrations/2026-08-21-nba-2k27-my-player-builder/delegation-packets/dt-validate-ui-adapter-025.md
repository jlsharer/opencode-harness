# Delegation Packet: dt-validate-ui-adapter-025

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-validate-ui-adapter-025`
- scopeKey: `standalone-ui-adapter-validation`
- role: `validator`
- taskMode: `review`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Changed paths: State, recognizer, abstract/fake host, UI oracle, security, observability, and tests.
- Verification: Syntax/tests plus prohibited imports, ambient authority, approval binding/expiry/budgets, state/checkpoint guards, retries, canary, redaction, fail-closed preflight, and no-live/no-network behavior.
- Acceptance: Pass `gate-ui-adapter` only if every action is fake-host-only, bounded, approved, semantic, and stops on ambiguity.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-023-ui-adapter.md`
- Non-goals: No fixes, live operation, integration, network/Git, or delegation.
