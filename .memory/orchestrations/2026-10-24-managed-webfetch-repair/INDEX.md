# 2026-10-24-managed-webfetch-repair

## Scope

- Request: diagnose and repair unavailable WebFetch for delegated managed research.
- Allowed source edits: `.opencode/`, `bin/`, `package.json`, `README.md`; assigned targets must be narrower.
- Non-goals: live providers, global config, Git mutation, publication.
- Preserve existing unrelated worktree modifications.
- Routing metadata status: absent.

## Current status and next safe action

- [Normalized specification](normalized-spec.json) validated before dispatch. Research traced WebFetch rejection to the managed tool allowlist; scoped implementation and independent managed validation completed.
- Next: externally execute focused paired tests and required full source/runtime/package QA against a recorded exact tree, and verify native WebFetch approval after a full OpenCode restart. Managed attempts [without private temp](../2026-10-24-webfetch-focused-tests/INDEX.md), [with private temp](../2026-10-24-webfetch-private-tmp-tests/INDEX.md), and [with temporary fixture relocation](../2026-10-24-webfetch-fixture-repair/INDEX.md) could not pass the full suites. The test fixture relocation was [reverted](../2026-10-24-webfetch-fixture-revert/INDEX.md). Live native WebFetch is not yet proven.
- Retain [dispatch-started.json](dispatch-started.json); never replay this ID.

## DAG, tasks and gates

- `webfetch`: researcher → planner → implementer → validator; no other dependencies.
- `webfetch-research-001`: [cause and evidence](roles/researcher/webfetch-researcher-001-denial.md).
- `webfetch-plan-001`: [approved narrow file contract](roles/planner/webfetch-planner-001-pass-through.md).
- `webfetch-implement-001`: [four-file change and paired tests](roles/implementer/webfetch-implementer-001-pass-through.md).
- `webfetch-validate-001`: [independent managed gates and review](roles/validator/webfetch-validator-001-policy-review.md).
- Managed gates: `git diff --check`, `node --check .opencode/plugins/index.js`; full source/runtime QA is external verification, not managed-gate evidence.

## Validation and decisions

- Independent managed validator observed exit zero for both declared read-only gates. Static review passed researcher-only allowance and TS/JS parity. The added policy cases ran during the temporary-fixture attempt (4/6 passing in each suite), but the two nested-bubblewrap cases failed in this verifier. After reverting fixture relocation, full suites and live native network access remain unverified; full source/runtime/package QA remains pending.
