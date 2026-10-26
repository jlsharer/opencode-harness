# 2026-10-24-qa-execution-boundary

## Scope

- Goal: investigate and repair harness-owned obstacles to user-authorized external QA, without silently widening the managed shell boundary.
- [Validated normalized specification](normalized-spec.json); routing metadata status: absent.
- Preserve existing WebFetch and staged V2 edits. No global config, Git mutation, publication or live provider activation.

## Workflow

- `qa-boundary`: serial researcher → planner → conditional implementer → independent validator.
- Assigned managed read-only gates: `git diff --name-only`, `git diff --check`, `node --check .opencode/plugins/index.js`.
- Prior evidence: [managed validation](../2026-10-24-opencode2-fresh-validation/INDEX.md), [binary provenance](../2026-10-24-v2-artifact-provenance/INDEX.md), [failed nested fixture attempt](../2026-10-24-webfetch-fixture-repair/INDEX.md).
- Status: [researcher](roles/researcher/qa-boundary-researcher-001-execution-map.md) identified intentional managed-shell refusal and prior nested-sandbox failures. [Planner](roles/planner/qa-boundary-planner-001-operator-qa-plan.md) approved an operator-only external QA receipt tool. [Implementer](roles/implementer/qa-boundary-implementer-001-external-qa.md) created the runner, tests, source-only manifest entries and docs. [Independent validator](roles/validator/qa-boundary-validator-001-readonly-gates.md) observed all three declared read-only gate exits zero and no managed guard widening in review.
- External follow-up: [operator verification record](validation/operator-external-qa-20261024.md) reports a passing six-command external receipt on one unchanged bound tree, a passing `npm test`, and an archive whose SHA-512 equals the official npm registry metadata. This is external handoff evidence, not managed-gate acceptance. The source-only runner files remain untracked and do not appear in tracked-only diff inventory.
- Next safe action: plan and test a V2 plugin/launcher port against pinned native contracts, including replacement of the obsolete `agent list` activation probe and independent Task-guard proof, before any V2 managed dispatch. Do not replay this ID.
- Retain `dispatch-started.json`; no ID replay or managed-gate proof from external receipts.
