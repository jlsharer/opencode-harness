# 2026-10-24-webfetch-private-tmp-tests

- Goal: retry [paired policy tests](../2026-10-24-webfetch-focused-tests/INDEX.md) after fixture setup failed under read-only `/var/tmp`.
- Routing metadata status: absent. No source edits or live network requests.
- [Validated specification](normalized-spec.json) selects `env TMPDIR=/tmp` for two exact managed read-only test gates.
- Next safe action: dispatch fresh validator `webfetch-tmp-validate-001`; retain `dispatch-started.json` after dispatch.
- Acceptance evidence: [validator result](roles/validator/private-tmp-tests-validator-001-gates.md) blocked; hardcoded `/var/tmp` still caused fixture setup failure (0/6 each).
