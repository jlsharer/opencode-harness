# Integrator Trace: routing configuration template consistency

## Metadata

- orchestrationId: `2026-07-19-routing-config-template`
- role: `integrator`
- artifactId: `root-integrator-004-config-template`
- createdAt: `2026-07-19T20:57:00-05:00`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: All planner-owned implementation paths, the scoped Git index migration, orchestration memory, expected example/custom/loader relationships, manifest and static-validator expectations, workflow preservation contracts, and known dirty-index/runtime-selection risks.
- Required context present: Yes. The supplied input satisfies the integrator contract. Review was limited to cross-artifact consistency and read-only checks; implementation files and Git index entries were not changed.
- Routing metadata status: absent. No caller routing labels or values were added.

## Work Performed

- Summary: Reviewed the planner, implementer, and orchestration traces; inspected all planner-owned routing, consumer, test, validator, manifest, ignore, and documentation paths; compared manifest/static-validator coverage; inspected HEAD/index/worktree routing migration state; and ran integration checks without treating them as validator acceptance.
- Files read: `.memory/orchestrations/2026-07-19-routing-config-template/INDEX.md`; researcher/planner/implementer traces; `.memory/INDEX.md`; `.gitignore`; routing example, loader, policy tests, CLI, helper, and plugin enforcement; harness validator and manifest; `AGENTS.md`; `opencode-harness.design.md`; validation workflow/checklist; routing matrix; llama.cpp guide; deployment README; role contract; trace schema.
- Files changed: This trace artifact only.
- Commands/checks: `git status --short` and porcelain-v2 inspection; cached/unstaged name-status, stat, and diff inspection; scoped `git ls-files`, `git show`, and `git check-ignore`; routing basename/reference searches; `cmp` and `sha256sum`; `git diff --check`; `git diff --cached --check`; `node --test .opencode/routing/routing-policy.test.mjs`; `node .opencode/scripts/validate-harness.mjs` before and after writing this trace.

## Output Contract

- Outputs: Path consistency notes, manifest coverage notes, cross-file issues with ownership, preservation findings, requested remediation, residual risks, and follow-up checks.
- Evidence: Routing tests passed 26/26; the pre-trace harness validator printed `OpenCode harness validation passed`; both diff checks exited zero; custom/example hashes both equal `d5896277f04c25eead2ad4d4f484a8099f1d8b8e63a72f083fe1c038e1d6853b`; the physical custom exists and matches the example; the custom is ignored and absent from the index; the example is index-visible; scoped cached migration is `.gitignore` M, example A, custom D. The post-trace validator failed only with `.memory/INDEX.md must index orchestration memory path: orchestrations/2026-07-19-routing-config-template/roles/integrator/root-integrator-004-config-template.md`, confirming the requested remediation.
- Artifact links: `.memory/orchestrations/2026-07-19-routing-config-template/roles/integrator/root-integrator-004-config-template.md`; `.memory/orchestrations/2026-07-19-routing-config-template/roles/implementer/root-implementer-003-config-template.md`; `.memory/orchestrations/2026-07-19-routing-config-template/roles/planner/root-planner-002-example-custom-contract.md`

### Path consistency notes

- `routing-config-loader.mjs` is the sole production owner of the custom and example basenames. CLI, helper, and plugin enforcement import the shared loader and do not duplicate either literal basename.
- Implicit consumers consistently select custom first and example only when custom is absent. Selection precedes reading, so unreadable or malformed selected custom input cannot retry the example; semantic validation remains in the shared policy and likewise fails without fallback.
- CLI `--config`, helper `configPath`, and plugin `routingPath` retain exact-path behavior. In-memory helper `config` and plugin `routingDocument` retain file-bypass behavior.
- The clean committed example remains strict v2 with `forceLocalForHarnessSubagents:false`, null native role models, no provider transport, and no startup agent mutation. The plugin remains behind the sole `.opencode/plugins/index.js` adapter and does not create or mutate provider configuration.
- Tests, validator, manifest, ignore rule, and reviewed guidance consistently use `.opencode/routing/harness-model-routing.example.json` for tracked defaults and `.opencode/routing/harness-model-routing.json` for the optional ignored runtime override. Guidance consistently covers copy/setup, custom-first/no-merge, fail-closed invalid custom, exact explicit paths, deterministic example acceptance, and full quit/restart.

### Manifest coverage notes

- `.opencode/harness.manifest.json` owns the example and shared loader and excludes the runtime custom file.
- `STATIC_MANIFEST_PATHS` contains the same example and loader paths and excludes the custom file. Exact manifest equality was exercised by the passing harness validator.
- The example remains classified as `harness-routing-config`; all manifest entries remain harness-owned. No provider transport or private runtime file was added to the manifest.

### Cross-file issues and owner

1. **Memory indexing/state remediation required — orchestration memory owner.** Creating this required trace makes `.memory/INDEX.md` incomplete until it links this artifact. The orchestration `INDEX.md` also still says integration is pending and lists the integrator as pending. This role was expressly limited to writing only its trace/request, so those two index files were not edited. The next harness validation will correctly fail memory indexing until remediation.
2. **No routing implementation defect found.** The reviewed implementation paths agree on names, precedence, exactness, force-false behavior, provider boundary, adapter boundary, manifest ownership, deterministic acceptance, and restart/migration wording.

### Fixes applied or requested

- Applied: none to implementation, index, manifest, documentation, or Git state; only this trace was written.
- Requested: assign the orchestration memory owner to add this exact trace path to `.memory/INDEX.md`, link it under `integrator` in the orchestration `INDEX.md`, and mark the integration-review node completed without changing validation from pending. Do not broadly stage either index in the dirty repository.

### Preservation findings

- The custom runtime file remains physically present, ignored by the exact rooted rule, absent from `git ls-files`, and byte-identical to the staged example migration source.
- The scoped cached migration is limited to the intended routing deletion/example addition plus the routing ignore hunk. The pre-existing deployment env ignore line remains unstaged.
- The repository still has substantial unrelated staged, unstaged, and untracked work. This review did not reset, restore, stash, clean, stage, remove, or commit any of it.
- Acceptance checks are explicitly example-based; the physical private custom did not determine the validator baseline. Temp fixtures cover custom selection and failure modes.

### Residual risks

- A broad commit or staging command could consume unrelated pre-existing index/worktree changes; downstream commit work must remain path-limited and inspect all three Git states.
- A present bad custom intentionally blocks implicit runtime/startup. Operators must repair or remove it rather than expecting example fallback.
- The current successful harness-validator output predates this newly written, not-yet-indexed trace; it is integration evidence only and must not be reused as final validator acceptance.
- OpenCode must be fully quit and restarted after routing or plugin changes. Live provider/model identity, tool use, quality, and capacity remain operator-dependent and outside this packaging review.

### Follow-up checks

1. After memory-index remediation, rerun `node .opencode/scripts/validate-harness.mjs`.
2. Have the assigned validator rerun the 26-test routing suite, scoped index/tracking/ignore checks, example-based harness validation, and acceptance matrix.
3. Before any commit, inspect scoped cached and unstaged diffs and use a strategy proven not to include unrelated staged entries.

### Remediation recheck loop 1 — FINAL FAIL

- Rechecked at: `2026-07-19T21:16:52-05:00`.
- **Dangling custom fail-closed: PASS.** The staged loader uses `lstatSync` to detect a custom directory entry before reading it, so a dangling symlink or directory at the custom basename is selected rather than treated as absent. The staged test `dangling symlink and directory custom entries are selected and fail closed` proves both cases reject with the custom path instead of falling back to the valid example.
- **Worktree test coverage: PASS.** `node --test .opencode/routing/routing-policy.test.mjs` reported 27 tests, 27 pass, 0 fail. `node .opencode/scripts/validate-harness.mjs` also passed in the full worktree. These results include untracked files and therefore do not prove the staged snapshot.
- **Staged loader/plugin/example/docs/runtime migration: PASS as individual artifacts.** The index contains the remediated shared loader, enforcement plugin, example, CLI/helper/tests, manifest, validator, ignore rule, and all planner-owned guidance paths. The runtime deletion is staged; the physical runtime remains present, ignored by the exact rooted rule, absent from `git ls-files`, byte-identical to the example, and has SHA-256 `d5896277f04c25eead2ad4d4f484a8099f1d8b8e63a72f083fe1c038e1d6853b`. Within the reviewed feature scope, unstaged tracked differences are limited to pre-existing `.gitignore` and `.memory/INDEX.md` work and were not consumed by this recheck.
- **Exact staged snapshot path completeness and clean-checkout safety: FAIL.** The staged manifest has 49 entries but five manifest-owned files are absent from the index: `.opencode/schemas/harness-model-routing.schema.json`, `.opencode/routing/routing-policy.mjs`, `.opencode/deployments/llama-server/compose.yaml`, `.opencode/deployments/llama-server/instances/research.env.example`, and `.opencode/deployments/llama-server/instances/coder.env.example`. The first two are direct dependencies of the staged validator/routing modules; all five are required by the staged manifest.
- **Clean index-only proof: FAIL.** An index-only tree was materialized with `git checkout-index --all` at `/tmp/opencode/routing-config-template-index.OEFRvX`. Its custom runtime was absent and example present as expected, but the resolver, 27-test suite, and harness validator all failed immediately because `.opencode/routing/routing-policy.mjs` was missing. This directly proves the current staged snapshot is not clean-checkout safe. The temporary proof tree was retained for validator inspection; it contains only index materialization.
- **Requested remediation and owner:** The implementer or designated path-limited index owner must reconcile the five missing manifest-owned paths. Stage only approved required dependencies, or remove staged manifest/static references that are not intended for this snapshot; do not use broad add/reset/restore commands and do not consume unrelated unstaged work. Then rerun manifest-versus-index closure and the resolver/tests/validator from a fresh `git checkout-index` tree.
- **Final integration result: FAIL.** Runtime preservation and 27-test behavior pass, but acceptance cannot proceed because the exact staged snapshot is incomplete and fails in a clean index-only checkout.

### Remediation recheck loop 2 — FINAL IMPLEMENTATION PASS

- Rechecked at: `2026-07-19T21:21:28-05:00`.
- **Five prerequisite paths in the exact index: PASS.** `git ls-files --stage` now reports index blobs for `.opencode/schemas/harness-model-routing.schema.json`, `.opencode/routing/routing-policy.mjs`, `.opencode/deployments/llama-server/compose.yaml`, `.opencode/deployments/llama-server/instances/research.env.example`, and `.opencode/deployments/llama-server/instances/coder.env.example`.
- **Manifest/index closure: PASS.** The staged manifest has 49 entries and every entry is present in the index; the operator runtime custom remains excluded. `git diff --cached --check` and `git diff --check` both exited zero.
- **Index-only proof root:** `/tmp/opencode/routing-config-template-index-loop2.xDrRZl`, freshly materialized with `git checkout-index --all`. The custom runtime is absent from this clean snapshot and the committed example is present.
- **Index-only resolver: PASS.** The implicit resolver loaded the example and returned the implementer/coder advisory decision with `schemaVersion:2.0.0`, `local.enforced:false`, and `networkCalls:false`.
- **Index-only tests: PASS.** The staged routing suite reported 27 tests, 27 pass, 0 fail, including malformed/semantic custom failure and dangling-symlink/directory custom fail-closed coverage.
- **Index-only manifest: PASS.** A direct staged-tree check parsed `.opencode/harness.manifest.json`, found all 49 paths physically present, and confirmed the runtime custom is not manifest-owned.
- **Index-only plugin clean startup: PASS.** The sole staged adapter exposed its config hook, loaded the example from the clean tree, and completed with no model property added to any of the eight fixed agents under force-false defaults.
- **Runtime preservation: PASS.** In the working repository, `.opencode/routing/harness-model-routing.json` remains physically present, ignored by the exact rooted rule, absent from the index, and hash-identical to the example at `d5896277f04c25eead2ad4d4f484a8099f1d8b8e63a72f083fe1c038e1d6853b`.
- **No additional unrelated staging in this remediation: PASS.** Comparison with loop 1's recorded cached snapshot shows exactly the five requested prerequisite paths moved from untracked/missing to staged. Other untracked orchestration trees remain untracked, and pre-existing unstaged tracked differences remain unstaged; this recheck changed neither files nor index entries.
- **Pre-existing staged memory-index inconsistency: separately FAILING, non-runtime.** Running the full harness validator inside the index-only tree reaches memory indexing and reports that staged `.memory/INDEX.md` does not index the already-staged historical artifact `orchestrations/2026-07-18-subagent-model-routing-guarantee/roles/reviewer/root-reviewer-009-final-blank-model-fix-review.md`. The full worktree validator passes because the unstaged `.memory/INDEX.md` contains later memory updates. This inconsistency predates and is outside the routing-template runtime/config closure; it does not affect resolver imports, routing tests, manifest closure, or plugin startup, but it remains a repository-wide commit/acceptance issue for the memory-index owner.
- **Final implementation integration result: PASS.** Loop 1's staged-runtime incompleteness is remediated. The exact staged routing/config implementation is path-complete and clean-checkout safe for resolver, tests, manifest, and plugin startup. Repository-wide acceptance must still keep the separate staged memory-index inconsistency visible to the validator.

## Handoff

- Next role: `validator` for implementation acceptance; separately, the memory-index owner must reconcile the pre-existing staged memory snapshot before repository-wide commit acceptance.
- Limitations: This was an integration recheck, not final acceptance. No live OpenCode restart, provider connection, model identity, delegated tool-use, or capacity check was performed.
- Risks: Routing/config staged dependency closure now passes. Dirty three-state Git state, the separate staged memory-index mismatch, and broad-commit contamination remain repository risks; runtime invalid-custom failure and restart requirements are deliberate operational constraints.
