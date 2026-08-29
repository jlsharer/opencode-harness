# Delegation Packet: dt-remediate-bootstrap-014

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-remediate-bootstrap-014`
- scopeKey: `standalone-bootstrap-contracts-remediation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Predecessor: `roles/validator/implementation-validator-011-bootstrap-proof.md`.
- Goal: Resolve B1-B4 completely within bootstrap paths so downstream branches can rely on executable contracts.
- Required fixes: Typed fact schemas for every resource and activation threshold; complete threshold evaluation; exact schema/game/context and unit checks; canonical allowed-discipline order; exact tolerance coverage/order/uniqueness; report hard-set and downstream-membership semantic validation; dependency-free executable schema-instance validation for the used schema subset; comprehensive adversarial fixtures/tests.
- Scope: Existing package/schema/domain/synthetic fixture/contract test paths plus a minimal shared schema-validation domain module if required and the assigned trace.
- Verification: All syntax checks; expanded contract tests; direct valid/invalid schema fixture checks; hard vectors; malformed threshold; context/unit mismatch; duplicate/extra/missing tolerance; noncanonical discipline order; report overlap/count/eligibility; prohibited component inventory.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-012-bootstrap-remediation.md`
- Non-goals: No optimizer, oracle, renderer, UI/network adapter, live operation, harness edit, external install, Git mutation, or delegation.
