# Validator Trace: routing config template final acceptance

## Metadata
- orchestrationId: `2026-07-19-routing-config-template`
- role: `validator`
- artifactId: `root-validator-006-final`
- createdAt: `2026-07-19T21:33:27-05:00`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- finalDecision: **PASS**

## Input Contract
- Inputs received: All planner-owned implementation paths, exact scoped index migration/prerequisites, current orchestration memory/indexes, verification criteria, requested command families, routing/role/trace schema contracts, and the feature acceptance standard.
- Required context present: Yes. Every validator input required by the role contract was supplied. No expected-warning field was supplied; the known module warning and previously reported historical staged memory-index mismatch were treated explicitly.
- Routing metadata status: absent. No caller routing labels or values were invented. The supplied resolved advisory context is local with force false.

## Work Performed
- Summary: Performed final command-backed worktree and exact-Git-index validation. Checked behavior, syntax/JSON, resolver/helper/plugin boundaries, manifest closure, ignore/tracking/hash migration, both diffs, schemas/contracts, docs, security, prior-projection references, and trace/index state. Wrote only validator evidence and required memory index references; no implementation fix was made.
- Files read: Routing example, loader, policy/tests, CLI, helper, plugin adapter/enforcement, validator, manifest, schemas/contracts, `.gitignore`, assigned docs, Git/index state, and orchestration memory.
- Files changed: This trace plus evidence-only links/status in the orchestration index and `.memory/INDEX.md`.
- Commands: 27-test suite; full harness validator; Node syntax/JSON/resolver/manifest/plugin probes; cached/unstaged diff checks; hash/compare/ignore/tracking checks; staged security searches; `git checkout-index` temporary snapshot; staged tests/resolver/plugin/manifest/validator; final trace/index check.

## Output Contract
- Outputs: Pass/fail matrix, exact command/result summaries, schema results, Git/index evidence, security/activation findings, remediation list, skipped checks, residual risk, acceptance decision, and trace path.
- Evidence: Feature behavior, worktree acceptance, and exact staged snapshot gates passed. The current staged validator exits zero, so the historical staged-only memory-index failure does not reproduce and is non-blocking.
- Artifact links: `.memory/orchestrations/2026-07-19-routing-config-template/roles/validator/root-validator-006-final.md`

## Pass/Fail Matrix
| Gate | Result | Evidence |
|---|---|---|
| Safe committed v2 example | PASS | Strict semantic tests pass; v2, null native defaults, disabled single model, force false, loopback-only endpoints, no private values. |
| Custom preservation/migration | PASS | Physical custom exists; custom/example compare equal; SHA-256 `d5896277f04c25eead2ad4d4f484a8099f1d8b8e63a72f083fe1c038e1d6853b`; custom ignored/untracked and cached `D`; example cached `A`. |
| Shared loader semantics | PASS | Tests cover custom-first/example fallback/no merge and fail-closed malformed, semantic-invalid, dangling, directory and read-error paths; explicit exactness; actionable absent-both. |
| CLI/helper/plugin | PASS | Omitted/explicit, in-memory bypass, nested discovery, module fallback, and exact path cases pass. |
| Clean example plugin startup | PASS | Exact staged checkout selected example and added no own role `model` property. |
| Deterministic acceptance | PASS | Tests/validator explicitly consume example; private runtime cannot affect acceptance. |
| Manifest/static/docs | PASS | 49 manifest paths exist; example/loader included, runtime excluded; rooted ignore rule occurs once; docs agree on migration/failure/restart semantics. |
| Worktree acceptance | PASS | Routing 27/27; full harness validator passed; cached and unstaged diff checks passed. |
| Exact staged snapshot | PASS | Manifest 49/49; routing 27/27; resolver/plugin startup/full harness validator passed. |
| Schemas/contracts/trace | PASS | Routing schema, role contracts, trace schema, example and manifest parse; harness contract checks pass; trace uses required path/shape and is indexed. |
| Security/non-interference | PASS | No staged secret/private-path/private-network match; no runtime `.agents`/`.codex` dependency; no external edit or destructive Git command. |

## Command Outputs
1. `node --test .opencode/routing/routing-policy.test.mjs` — exit 0; 27 passed, 0 failed/skipped.
2. `node .opencode/scripts/validate-harness.mjs` — exit 0; `OpenCode harness validation passed`.
3. `git diff --check && git diff --cached --check` — exit 0; no output.
4. `node --check` for loader/CLI/helper/enforcement/adapter and JSON parse for example/routing schema/role contract/trace schema/manifest — exit 0; `syntax-json-ok`.
5. Explicit-example and omitted-config resolver probes for `/delegate-implement` — exit 0; identical advisory v2 decisions: implementer, coder model, `enforced=false`, `networkCalls=false`.
6. Manifest probe — `manifest-routing-ok artifacts=49 missing=0`; exact ignore rerun — `exact-ignore-rule-ok count=1`.
7. Preservation probe — matching hashes above; ignore source `.gitignore:4`; example tracked, custom absent from `git ls-files`; cached scoped states `M .gitignore`, `A example`, `D custom`; custom has no unstaged content diff.
8. Staged scans — no secret/private path match. `.agents/`/`.codex/` matches only in explicit reference-only/non-runtime documentation.
9. `git checkout-index --all --prefix=/tmp/opencode/routing-final-dlWx3w/` snapshot (cleaned afterward) — manifest closure 49, tests 27/27, resolver passed, `staged-plugin-example-startup-ok no-model-mutation`, staged harness validator exit 0/pass.
10. Isolated `chmod 000` custom plus valid example probe — `unreadable-custom-fail-closed-ok`; selected custom failed read without fallback.
11. Both name-status diffs inspected. Extensive unrelated pre-existing staged/unstaged work remains; feature paths and accepted prerequisites are path-complete. No broad staging/commit occurred.

## Schema Results
- Routing schema/example: PASS through parse, validator assertions, and strict semantic normalizer tests.
- Role contract catalog: PASS through parse/full harness checks; required validator inputs/outputs are present.
- Trace schema: PASS by required metadata, input contract, work performed, output contract/evidence, handoff, and allowed routing status `absent`.

## Security and Activation Findings
- Force-false example does not mutate native role models or configure provider transport; resolver probes make no network calls.
- Only illustrative loopback service URLs are committed. No credentials, private keys, operator identity, private machine path, or non-loopback private endpoint was found in staged non-memory files.
- Ignored runtime stays operator-owned and is excluded from manifest and acceptance.
- `.opencode/plugins/index.js` remains the sole auto-loaded adapter; modules stay under `.opencode/plugin-modules/`; `opencode.json` has no local plugin path.
- Docs require fully quitting/restarting OpenCode after routing/plugin changes. This validation does not claim activation in the running session.
- Hooks were treated only as guardrails/telemetry; command and staged-snapshot evidence establishes acceptance.

## Historical Warning Assessment
- Reviewer evidence recorded an earlier staged validator failure because staged `.memory/INDEX.md` omitted `orchestrations/2026-07-18-subagent-model-routing-guarantee/roles/reviewer/root-reviewer-009-final-blank-model-fix-review.md`.
- Final validation attempted to confirm that expected failure, but the current exact staged validator exited 0 and passed; the historical mismatch no longer reproduces. Fresh staged evidence controls.
- Decision: historical mismatch is non-blocking and not a current staged residual failure. It remains provenance that whole-index state changed between reviewer and final validation.

## Remediation List
- None required for feature acceptance.
- Operational follow-up: avoid broad staging/commit because unrelated staged work remains; use a path-scoped strategy if later authorized.

## Skipped Checks
- Live endpoint/model identity, delegated tool use, throughput/concurrency/VRAM benchmarks, Docker/llama-server execution: operator/environment-dependent and outside packaging acceptance.
- No external private path was supplied, so none was probed; repository evidence showed no external edit.
- OpenCode restart was not performed; restart is an operator activation step, not acceptance evidence.

## Residual Risk
- Extensive unrelated staged/unstaged changes make broad commits unsafe.
- A future present bad custom intentionally causes implicit startup/resolution failure.
- Known `MODULE_TYPELESS_PACKAGE_JSON` warning reparses the `.js` plugin module as ESM; no functional failure.

## Handoff
- Next role: Orchestrator/authorized committer for acceptance and any path-scoped commit decision.
- Limitations: Offline configuration/package validation; no live endpoint, container, or post-restart session.
- Risks: Preserve ignored custom bytes, avoid broad staging, and fully quit/restart before relying on activation.
- Acceptance decision: **PASS**. Feature/worktree acceptance and path-complete exact staged proof pass; the historical staged memory-index mismatch does not reproduce.
