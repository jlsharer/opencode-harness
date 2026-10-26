# 2026-10-24-webfetch-fixture-repair

- Goal: repair paired fixture setup after [independent validator](../2026-10-24-webfetch-private-tmp-tests/roles/validator/private-tmp-tests-validator-001-gates.md) observed read-only `/var/tmp` errors.
- Routing metadata status: absent; no production-code or network work.
- [Validated specification](normalized-spec.json); serial planner → implementer → validator for `fixture`, exact test-file edit scope.
- Roles: [planner](roles/planner/fixture-planner-001-path-plan.md), [implementer](roles/implementer/fixture-implementer-001-prefix-repair.md), [validator](roles/validator/fixture-validator-001-managed-gates.md). Retain `dispatch-started.json`.
- Acceptance: blocked; four policy cases passed in each suite, but two nested-bubblewrap cases failed because this managed verifier could not provide trusted bubblewrap with working user namespaces. The experimental `/tmp` fixture edit was subsequently [reverted](../2026-10-24-webfetch-fixture-revert/INDEX.md).
