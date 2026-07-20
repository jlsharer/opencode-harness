# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-implement-multi-local-routing`
- role: `reviewer`
- artifactId: `root-reviewer-006-defects`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Remediation Recheck Loop 2 — FINAL PASS

### Findings

- **No findings.** The loop-1 target-before-model-alias ordering defect is remediated without a focused regression.

### Recheck Evidence

- **PASS — Target-before-model-alias reproduction:** with force enabled, both `{ command: "/delegate-implement", agent: "build", explicitModel: "cloud/a", providerModel: "cloud/b" }` and the corresponding conflicting `role: "general"` case now fail at `$.request.agent`/`$.request.role` with `conflicts with fixed command target "implementer"`, not with model-alias ambiguity (`.opencode/routing/routing-policy.mjs:213-235`).
- **PASS — Cross-product tests:** `.opencode/routing/routing-policy.test.mjs:103-126` covers every fixed command, conflicting `agent` and `role` forms, built-in/custom/other-fixed-role targets, and the matching-target control where alias ambiguity remains the expected error.
- **PASS — Focused suite:** `node --test .opencode/routing/routing-policy.test.mjs` passed 21/21, including the new ordering cross-product and prior alias/schema/orchestrator regressions.
- **PASS — Harness and static checks:** `node .opencode/scripts/validate-harness.mjs` passed; routing policy/test syntax checks passed; staged and unstaged diff checks passed. The pre-existing Node module-type warning remains non-fatal.

### Open Questions

- None for reviewer remediation scope.

### Residual Risk

- Final acceptance still requires the separately assigned artifact-verifier and validator evidence; this reviewer recheck did not start Compose services or perform live provider/model/tool-use/capacity checks.
- The full harness validator still relies on the separately run routing unit suite for model-alias cross-product behavior.

### Final Recheck Change Summary

- Validation of locked command targets now occurs before model alias parsing, preserving target-escape precedence while retaining fail-closed alias handling for matching targets.
- All original and loop-1 reviewer findings are remediated. Reviewer remediation status is **FINAL PASS**.

## Remediation Recheck Loop 1 — FAIL

### Findings

1. **Medium — Model-alias ambiguity is evaluated before the mandatory fixed-command target-conflict check.** `.opencode/routing/routing-policy.mjs:220-223` calls `requestModelAlias(request)`, which can throw for distinct aliases, before `.opencode/routing/routing-policy.mjs:226-234` resolves and checks the locked command target. Reproduction with force enabled and `{ command: "/delegate-implement", agent: "build", explicitModel: "cloud/a", providerModel: "cloud/b" }` reports `conflicting explicit model aliases` instead of the required fixed-target conflict. The frozen precedence contract requires every command target mismatch to be rejected before force-scope/model evaluation (`roles/planner/root-planner-002-implementation-contracts.md:102-106`). Existing target tests use no conflicting aliases (`.opencode/routing/routing-policy.test.mjs:89-101`), while the new alias tests use no conflicting target (`routing-policy.test.mjs:115-159`), so the cross-product regression passes all 20 tests and the harness validator.

### Prior Finding Recheck

- **PASS — Prior High model-alias suppression:** absence sentinels are now removed per alias, equal aliases are accepted, distinct present aliases fail closed, and sentinel plus conflicting cloud model triggers exact-match rejection (`routing-policy.mjs:190-205,220-223`; `routing-policy.test.mjs:115-159`). The exact prior reproductions pass.
- **PASS — Prior Medium schema force-state drift:** the schema now encodes `forceLocalForHarnessSubagents:true => enabled:true` (`harness-model-routing.schema.json:83-109`), and the validator statically requires that dependency (`validate-harness.mjs:254-261`). Runtime rejection remains intact.
- **PASS — Prior Medium orchestrator-key drift:** the normalizer now rejects non-slash orchestrator command keys (`routing-policy.mjs:153-160`), matching schema `propertyNames` (`harness-model-routing.schema.json:131-134`); unit and validator cases cover it (`routing-policy.test.mjs:201-225`; `validate-harness.mjs:310-314`).
- **PASS — Focused checks:** `node --test .opencode/routing/routing-policy.test.mjs` passed 20/20; `node .opencode/scripts/validate-harness.mjs` passed; targeted prior-case reproduction printed `prior cases pass`; both diff checks passed. Node emitted the pre-existing module-type warning.

### Open Questions

- None for the three original defects. The remaining issue is ordering, not the chosen fail-closed alias policy.

### Residual Risk

- The full harness validator does not exercise model-alias behavior; it relies on the separately invoked unit suite for that regression surface.
- Cross-product cases combining fixed-target escape attempts with malformed or conflicting model aliases remain untested.

### Recheck Change Summary

- Remediation correctly fixes all three original defects and expands the unit suite from 19 to 20 tests plus validator schema/key parity checks.
- Overall recheck is **FAIL** because alias conflict validation now precedes the contractually higher-priority fixed-command target-conflict check.

## Input Contract

- Inputs received: Complete branch A/B implementation paths from `roles/planner/root-planner-002-implementation-contracts.md`; strict v2 routing, advisory and force-local behavior, native coherence, dependency-free validation/tests, localized Compose, documentation, and preservation expectations; specified risk areas and claimed 19-test/full-harness/Compose evidence.
- Required context present: Yes. The request supplied `orchestrationId`, `diffOrChangedPaths`, `intendedBehavior`, `riskAreas`, `testExpectations`, routing status, memory/contract/schema paths, and the exact reviewer artifact path.
- Routing metadata status: absent. Caller-supplied enriched routing labels were absent and no values were invented. Resolved context was recorded separately as agent `reviewer`, advisory model `llamacpp-research/qwen2.5-7b-instruct`, variant `review`, and local enforced `false`.

## Work Performed

- Summary: Reviewed the complete planner-owned branch A/B implementation defect-first, inspected routing policy/schema/config/tests, CLI/helper, async enforcement, validator, manifest, Compose assets, docs, and relevant installed plugin types; exercised unit, harness, diff, resolver edge-case, and Compose render checks. No implementation file was edited.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; planner contracts; all branch A/B paths; `.opencode/plugins/index.js`; `.opencode/plugin-modules/harness-lifecycle.js`; installed `@opencode-ai/plugin` declarations; accepted v2 design evidence.
- Files changed: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/reviewer/root-reviewer-006-defects.md` only.
- Commands/checks: Remediation loop 1 reran the prior high/medium reproductions, added a target-conflict/model-alias cross-product reproduction, and inspected focused remediation diffs; `git status --short`; scoped diff/stat inspection; `node --test .opencode/routing/routing-policy.test.mjs` (19/19 pass, with Node module-type warning); `node .opencode/scripts/validate-harness.mjs` (pass, same warning); `git diff --check && git diff --cached --check` (pass); `docker compose version`; two-project temporary Compose `config -q` and JSON renders (both renders succeeded; the reviewer assertion expecting serialized `bind.create_host_path:false` failed because Compose emitted an empty `bind` object, while source `compose.yaml:12-13` retains the setting); targeted force-model alias reproduction; targeted orchestrator-key normalization reproduction; static secret/stale-key/document scans. Temporary reviewer Compose files were removed.

## Output Contract

- Outputs: Severity-ranked findings, open questions, residual risk, concise change summary, and trace path.
- Evidence: Findings are grounded in executable reproductions and exact implementation/design paths and lines. The original two findings below are retained as historical evidence and are marked remediated by loop 1; the current blocking finding is the precedence regression above.
- Artifact links: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/reviewer/root-reviewer-006-defects.md`

### Original Review Findings (historical; remediated in loop 1)

1. **High — An earlier sentinel model alias suppresses a later explicit provider model, violating force-local exact-match fail-closed behavior.** `.opencode/routing/routing-policy.mjs:179-186` defines values such as `"inherited"` as absent, but `.opencode/routing/routing-policy.mjs:201` applies nullish coalescing to `explicitModel`, `providerModel`, and `model` *before* absence normalization. Therefore `{ explicitModel: "inherited", providerModel: "cloud/model" }` selects the sentinel, normalizes it to null, and silently ignores the conflicting cloud model. With force enabled and `/delegate-implement`, the resolver returned the coder local decision instead of throwing the required exact-model conflict. This contradicts the explicit-model constraint in `root-planner-002-implementation-contracts.md:105-107` and regresses the previous first-present behavior. The 19-test matrix checks one model field at a time (`.opencode/routing/routing-policy.test.mjs:103-113`) and misses alias/sentinel combinations.

2. **Medium — The published v2 schema does not reject the forbidden `enabled:false`/`forceLocalForHarnessSubagents:true` state and drifts from the executable contract.** `.opencode/schemas/harness-model-routing.schema.json:83-97` declares the two booleans independently and has no `if`/`then` or equivalent `not` constraint. The runtime normalizer correctly rejects the pair at `.opencode/routing/routing-policy.mjs:97-100`, but the accepted schema contract explicitly requires both schema and core rejection (`.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md:143-146,160-166`). The static validator only checks draft/closed boundaries (`.opencode/scripts/validate-harness.mjs:242-257`), so the drift passes both claimed test suites. As a second structural drift signal, schema `propertyNames` requires `/` for orchestrator commands (`harness-model-routing.schema.json:119-122`), while the manual normalizer accepts a key such as `bad` (`routing-policy.mjs:153-160`). Consumers using the interoperability schema and consumers using runtime normalization can consequently disagree on whether a v2 document is valid.

### Open Questions

- Are simultaneous `explicitModel`, `providerModel`, and `model` fields officially supported aliases? The previous resolver treated them as ordered aliases and the current API still exposes all three, so the review treats every later present alias as relevant when an earlier value is a recognized absence sentinel. If only one field is now legal, request validation and documentation need to reject ambiguous multi-field input rather than silently discard it.
- Should all structural schema constraints be mirrored by the dependency-free normalizer? The implementation does so for command keys but not orchestrator command keys; the intended parity boundary should be made explicit.

### Residual Risk

- Force activation was tested only with synthetic plain mutable config objects; no live OpenCode startup/provider/model/tool-use proof was performed.
- Compose rendered successfully for both temporary instances, but Compose v2.40.3 omitted `create_host_path:false` from normalized JSON. Source inspection confirms the requested YAML field, but normalized render output alone cannot prove that setting; an artifact verifier should use a proof method that accounts for this serialization behavior.
- The worktree contains substantial staged/unstaged prior work outside this implementation. Review used status and complete scoped paths without resetting; provenance and preservation still require final integrator/validator evidence.
- The Node module-type warning is non-fatal and package edits were explicitly out of scope, but startup behavior should still be confirmed in the actual OpenCode runtime.

### Change Summary

- Introduces strict v2 multi-local routing policy/config/schema/tests, advisory resolution, all-eight force assignment with native provider preflight, thin CLI/helper adapters, validator/manifest coverage, localized two-instance llama-server Compose assets, and updated routing/activation documentation.
- Historical initial review: the committed force switch remained safely false, 19 unit tests passed, and two defects were found. Both defects and the loop-1 precedence regression are now remediated; loop 2 passes 21/21 tests and the harness validator.

## Handoff

- Next role: `artifact-verifier` and `validator` for the remaining independent evidence and acceptance gates.
- Limitations: Defect review only. No implementation was rewritten and no final acceptance determination was made. Compose servers were not started; live providers, exact model identity, tool use, capacity, and GPU behavior were not tested.
- Risks: Reviewer findings are remediated; remaining risks are operator-dependent live behavior, Compose artifact proof, and preservation of pre-existing staged/unstaged work pending final validation.
