# implement-harness-cli-implementer-006

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `implement-harness-cli-implementer-006`
- scopeKey: `implement-harness-cli`
- role/mode: `implementer/implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Implement the exact `validate-inputs` contract in `roles/planner/plan-harness-cli-planner-005-contract.md`.
- Scope: Only the eight implementation paths named by that contract and the implementer trace.
- Preservation: Zero validation-mode writes/spawn/provider activity; preserve launcher security and unrelated changes.
- Verification: Run every focused and full gate in the planner contract, including source, portable, runtime, foreign-repository, pack, and diff checks.
