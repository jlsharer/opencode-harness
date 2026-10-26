# 2026-10-24-webfetch-focused-tests

- Goal: independent read-only paired policy tests for the [managed WebFetch repair](../2026-10-24-managed-webfetch-repair/INDEX.md).
- Scope: `.opencode/`; no source edits, native WebFetch requests, or Git mutation.
- Routing metadata status: absent.
- [Validated normalized specification](normalized-spec.json); work unit `focused-tests` has one validator and two serial read-only gates.
- Next safe action: fresh `webfetch-focused-validate-001` validator task; retain `dispatch-started.json` afterward.
- Acceptance evidence: [validator result](roles/validator/focused-tests-validator-001-gates.md) blocked; both suites failed during fixture setup on read-only `/var/tmp` (0/6 each).
