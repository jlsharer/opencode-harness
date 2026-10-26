# 2026-10-24-webfetch-fixture-revert

- Goal: restore original `/var/tmp` fixture prefixes after [managed validator](../2026-10-24-webfetch-fixture-repair/roles/validator/fixture-validator-001-managed-gates.md) found nested bubblewrap unavailable; keep production WebFetch fix and positive/negative policy tests.
- Routing metadata status: absent; [validated spec](normalized-spec.json) assigns two exact test files only.
- Roles: [implementer](roles/implementer/revert-implementer-001-fixture-prefix.md) and [independent validator](roles/validator/revert-validator-001-fixture-gates.md). Retain `dispatch-started.json`.
- Acceptance: both assigned diff/syntax gates passed; static review confirms restored `/var/tmp` fixture prefixes and WebFetch cases retained. Full suites remain unverified.
