# Planner Trace: example/custom routing contract

## Metadata
- orchestrationId: `2026-07-19-routing-config-template`
- role: `planner`
- artifactId: `root-planner-002-example-custom-contract`
- createdAt: `2026-07-19T20:38:14-05:00`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Approved example/runtime split; dirty-work preservation, loader, plugin, test, manifest, documentation, Git migration, and acceptance requirements; cited research; exact memory contract/schema/trace paths.
- Required context present: Yes. Exact deliverable paths were derived only from supplied research and confirmed repository consumers, and are frozen below.
- Routing metadata status: absent. Advisory local routing is force false; no routing labels or values were invented.

## Work Performed
- Summary: Converted approved behavior and evidence into a bounded implementation DAG, file contracts, path-scoped Git migration, executable gates, risks, and role handoffs. No implementation file was edited and no final validation was performed.
- Files read: Research trace and orchestration index; memory protocol/template; role contract and trace schema; current routing JSON, CLI, helper, tests, enforcement module, manifest, and `.gitignore`.
- Files changed: `.memory/orchestrations/2026-07-19-routing-config-template/roles/planner/root-planner-002-example-custom-contract.md` only.
- Commands/checks: Read-only Git status/diff/index/ignore inspection. No implementation or acceptance commands.

## Output Contract
- Outputs: Ordered plan, file contracts, dependencies, exact Git/index operations, verification gates, assumptions, risks, and handoff notes.
- Evidence: Research findings 1-13 and the consumer matrix establish current v2 bytes, all hard-coded consumers, plugin startup coupling, manifest/docs references, deterministic-validation needs, and the three-state Git risk. Direct inspection confirmed current APIs and paths. This plan does not claim validator evidence.
- Artifact links: `.memory/orchestrations/2026-07-19-routing-config-template/roles/planner/root-planner-002-example-custom-contract.md`; `.memory/orchestrations/2026-07-19-routing-config-template/roles/researcher/root-researcher-001-config-consumers.md`

### Exact paths and ownership

**Implementer-owned routing/static paths**
1. `.opencode/routing/harness-model-routing.example.json` — new tracked harness default.
2. `.opencode/routing/harness-model-routing.json` — operator-owned ignored runtime; preserve current worktree bytes, remove only from index.
3. `.opencode/routing/routing-config-loader.mjs` — new shared selection/read implementation.
4. `.opencode/routing/resolve-model-routing.mjs`.
5. `.opencode/routing/model-routing-helper.mjs`.
6. `.opencode/plugin-modules/role-model-routing-enforcement.js`.
7. `.opencode/routing/routing-policy.test.mjs`.
8. `.opencode/scripts/validate-harness.mjs`.
9. `.opencode/harness.manifest.json`.
10. `.gitignore`.

**Implementer-owned documentation; integration-reviewed**
11. `AGENTS.md`.
12. `opencode-harness.design.md`.
13. `.opencode/workflows/validation-workflow.md`.
14. `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`.
15. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`.
16. `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`.
17. `.opencode/deployments/llama-server/README.md`.

**Memory/index ownership**
18. This planner trace.
19. `.memory/orchestrations/2026-07-19-routing-config-template/INDEX.md` — integrator updates role links/DAG states.
20. `.memory/INDEX.md` — integrator adds orchestration link required by validator.
21. Later contract-shaped traces/evidence under the current orchestration root.

No planned change: `opencode.json`, `.opencode/plugins/index.js`, path-neutral `.opencode/routing/routing-policy.mjs`, `.opencode/schemas/harness-model-routing.schema.json`, external files, historical evidence, `.agents/`, or `.codex/`. The adapter receives test coverage but no edit unless integration demonstrates a composition defect.

### File contracts

#### Shared loader
- `.opencode/routing/routing-config-loader.mjs` owns both canonical basenames and all implicit selection. For one candidate pair: choose custom when it exists; choose example only when custom is absent; never merge.
- Select before reading. Unreadable, malformed, or semantically invalid selected custom fails; no catch may retry the example.
- Explicit paths resolve/read that exact path only. They never inspect siblings.
- Absent-both errors include both resolved paths and `cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json`.
- Plugin discovery walks upward from project/directory context to the first ancestor containing either pair member, then applies custom-first within that root. If no project pair exists, use the module-colocated pair. No context also uses the module pair.
- Expose selected absolute path and source (`custom`/`example`) for tests without adding routing fields to decisions or `opencode.json`. Preserve path-specific read/JSON diagnostics; semantic validation remains in `routing-policy.mjs`.

#### Example and runtime
- Create the example by byte-for-byte copying the current worktree runtime before any index operation; prove equality/hash. Never source HEAD or index.
- Preserve exact approved v2 semantics: wrapper, `schemaVersion:2.0.0`, null default/single/native models, disabled single model, enabled illustrative two-model loopback catalog, current limits/default/selectors, all eight roles, fixed commands, orchestrator command, complexity variants, and `forceLocalForHarnessSubagents:false`.
- Add no credential, secret, user path, non-loopback machine endpoint, or operator identity. The clean example normalizes and causes no plugin model mutation.
- Runtime remains optional implicit override, uses the same schema/normalizer, stays physically present with its pre-migration bytes, becomes untracked/ignored, leaves the manifest, and is excluded from acceptance inputs.

#### CLI/helper/plugin
- CLI omitted `--config` uses shared implicit selection; supplied `--config` is exact. `parseArgs` must preserve omission. Preserve metadata parsing, output, exit behavior, and `resolveModelRouting`. If `loadRoutingConfig` stays exported, no argument means implicit and a pathname means exact.
- Helper in-memory `config` bypasses files. An explicitly supplied `configPath` is exact; omission is implicit. Remove the default parameter that obscures caller intent. Preserve request mapping and Promise API.
- Plugin `routingDocument` bypasses files; `routingPath` is exact. Otherwise use shared project/module discovery, then existing normalization, all-role coherence preflight, and atomic mutation. Preserve contextual startup errors. Example-only startup is non-force/no mutation; bad custom, bad explicit path, force/provider incoherence, and absent-both fail.
- Keep `.opencode/plugins/index.js` as sole auto-loaded adapter; add no local plugin path to `opencode.json`.

#### Tests/validator/manifest/docs
- Rename committed fixture semantics to `EXAMPLE_PATH`; baseline normalization, CLI/helper parity, plugin no-op checks, and validator routing input explicitly use example so private runtime cannot affect acceptance.
- Temp-fixture tests cover: example fallback; custom preference; malformed custom plus valid example (fail); semantically invalid custom plus valid example (fail); neither exists/error text; explicit valid/missing/malformed exactness despite siblings; helper omission/path; CLI omission/flag; plugin nested discovery/module fallback/document bypass/path exactness; clean example no mutation. Cleanup temp fixtures and never alter real runtime.
- Validator required/static lists use example, not runtime; assert exact ignore rule, example/loader manifest ownership, runtime non-ownership, and no duplicated/hard-coded consumer precedence. Repository acceptance must be identical with private runtime absent, valid, malformed, or customized; implicit cases use temp pairs.
- Manifest replaces runtime with example as `kind: "harness-routing-config"`, `owner: "harness-owned"`, and adds the loader as harness-owned. Never list runtime.
- `.gitignore` adds exactly `/.opencode/routing/harness-model-routing.json`.
- Every listed doc distinguishes committed example from optional ignored override; states custom-first/no merge, present-invalid fail-closed, explicit exactness, absent-both setup, deterministic example validation, optional copy/customize/explicit-validate steps, and full OpenCode quit/restart. Force-false defaults do not configure provider transport or mutate agents.

### Ordered plan
1. **Preservation preflight — implementer.** Record `git status --short`, scoped cached/worktree diffs, runtime index blob, and runtime SHA-256. Confirm example absent and runtime tracked. Abort on unexpected runtime change. Never reset, restore, checkout, clean, stash, or broadly stage.
2. **Create example — implementer.** Copy current runtime bytes; require `cmp` and matching hashes; parse/normalize the copy before untracking.
3. **Shared loader — implementer.** Add loader and path-selection tests; keep policy path-neutral.
4. **Consumers — implementer, after 3.** Adapt CLI/helper/enforcement without changing routing decision semantics or plugin atomicity.
5. **Deterministic acceptance — implementer, after 2-4.** Switch unit/validator baselines to explicit example and add the full isolated scenario matrix.
6. **Static/docs — implementer.** Update manifest, exact ignore rule, and frozen docs after API names are stable.
7. **Index migration — implementer, after equality proof.** Execute only the commands below; immediately re-prove runtime hash/existence. Do not commit.
8. **Integration and review — parallel after 7.** Integrator checks path/API/manifest/docs consistency and memory indexes. Reviewer checks fail-open, explicit path, nested root, clean plugin startup, leakage, and dirty-index hazards. Remediation returns to implementer.
9. **Validation — validator after integration/review.** Run all gates and capture a pass/fail matrix. Hooks are guardrails/telemetry, not evidence.
10. **Commit handoff — orchestrator-designated committer only after validator PASS.** Do not run plain commit or broad add in the dirty repository. Use an approved path-limited strategy that cannot consume unrelated index entries; if isolation cannot be proven, stop and ask the user.

### Exact Git/index operations
Run from repository root and stop on a failed assertion:

```sh
git status --short
git diff --cached -- .opencode/routing/harness-model-routing.json .gitignore
git diff -- .opencode/routing/harness-model-routing.json .gitignore
git ls-files --stage -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json
sha256sum .opencode/routing/harness-model-routing.json

cp -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json
cmp -s -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json
sha256sum .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json

# After adding exactly '/.opencode/routing/harness-model-routing.json' to .gitignore:
git add -- .opencode/routing/harness-model-routing.example.json .gitignore
git rm --cached -f -- .opencode/routing/harness-model-routing.json

test -f .opencode/routing/harness-model-routing.json
cmp -s -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json
git check-ignore -v -- .opencode/routing/harness-model-routing.json
if git check-ignore -q -- .opencode/routing/harness-model-routing.example.json; then exit 1; fi
git ls-files --error-unmatch .opencode/routing/harness-model-routing.example.json
if git ls-files --error-unmatch .opencode/routing/harness-model-routing.json; then exit 1; fi
git diff --cached --name-status -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json .gitignore
git status --short
```

`-f` is narrowly limited to the approved cached removal because runtime currently has distinct HEAD/index/worktree states; hashes prove the worktree file survives. Forbidden: `git reset`, `checkout`, `restore`, `clean`, `stash`, `add -A`, `add .`, or broad `rm`. Before later staging any already-dirty implementation path, inspect all three states and never overwrite pre-existing work.

### Dependencies
- Completed research is prerequisite.
- Preflight → byte copy → shared loader → consumers → tests/validator → manifest/docs → index migration.
- Tests may develop alongside consumers after API freeze; docs may proceed after behavior freeze. Manifest waits for exact new paths.
- Integration/review may parallelize; validator waits for both and remediation. Validator evidence precedes acceptance/commit. Maximum three remediation loops.

### Verification gates

**A. Content/parse**
```sh
cmp -s -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json
node -e "const fs=require('node:fs'); for (const p of ['.opencode/routing/harness-model-routing.example.json','.opencode/harness.manifest.json']) JSON.parse(fs.readFileSync(p,'utf8')); console.log('json-ok')"
node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.example.json --metadata-json '{"command":"/delegate-implement"}'
```
Equality is migration proof only; later operator customization must not be constrained by acceptance.

**B. Behavior/full checks**
```sh
node --test .opencode/routing/routing-policy.test.mjs
node .opencode/scripts/validate-harness.mjs
node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-implement"}'
node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.example.json --metadata-json '{"command":"/delegate-implement"}'
```
Initially identical custom/example decisions match. Isolated tests—not destructive real-file manipulation—prove all fallback/failure cases.

**C. Git ownership/preservation**
```sh
test -f .opencode/routing/harness-model-routing.json
git check-ignore -v -- .opencode/routing/harness-model-routing.json
if git check-ignore -q -- .opencode/routing/harness-model-routing.example.json; then exit 1; fi
git ls-files --error-unmatch .opencode/routing/harness-model-routing.example.json
if git ls-files --error-unmatch .opencode/routing/harness-model-routing.json; then exit 1; fi
git diff --cached --name-status -- .opencode/routing/harness-model-routing.json .opencode/routing/harness-model-routing.example.json .gitignore
git status --short
```
Expected scoped index: runtime deletion, example addition, exact ignore change; unrelated status remains untouched.

**D. Manifest/static/leak checks**
```sh
git diff --check
node -e "const fs=require('node:fs');const m=JSON.parse(fs.readFileSync('.opencode/harness.manifest.json','utf8'));const p=m.artifacts.map(x=>x.path);if(!p.includes('.opencode/routing/harness-model-routing.example.json')||!p.includes('.opencode/routing/routing-config-loader.mjs')||p.includes('.opencode/routing/harness-model-routing.json'))process.exit(1);console.log('manifest-routing-ok')"
git diff -- . ':!/.memory/orchestrations/2026-07-19-routing-config-template/**'
git diff --cached -- . ':!/.memory/orchestrations/2026-07-19-routing-config-template/**'
```
Search non-historical runtime/docs for both basenames and verify vocabulary/no duplicated precedence. Confirm no secrets, private paths, credentials, non-loopback machine assumptions, or runtime dependencies on `.agents/`/`.codex/`.

**E. External non-interference**
- If validation receives an external path, record read-only pre/post metadata/hash. Do not edit it.
- If none is supplied, report external paths outside scope and prove repository-only changed paths; do not invent or probe a private location.

### Assumptions
- The cited current 59-line worktree v2 runtime is approved source; HEAD/index are not.
- Illustrative loopback catalog is safe because force is false and native model fields are null; it does not configure transport.
- Shared loader is the minimal no-drift design and creates no policy/plugin cycle.
- “Commit” is downstream acceptance work, not permission to consume unrelated staged entries.

### Risks
1. Three-state runtime loss: hashes, copy-before-untrack, exact cached removal, forbidden broad Git commands.
2. Silent fail-open: selection and read/normalize remain separate; test malformed and semantically invalid custom.
3. Omission/explicit ambiguity: retain `undefined` intent; test both APIs.
4. Search drift: one shared implementation and nested-project tests.
5. Private runtime contaminating acceptance: explicit example baselines and temp pairs.
6. Clean checkout plugin regression: example-only no-mutation startup test.
7. Manifest/doc mismatch: integrator and static gates.
8. Dirty index accidental commit: no broad staging/commit; escalate if path isolation cannot be proven.
9. Restart omission: mandatory full quit/restart guidance.

## Handoff
- Next role: `implementer`, then parallel `integrator`/`reviewer`, then `validator` before acceptance.
- Limitations: Planning only. No implementation/index/external files changed and no final checks run. Current full validator was reported red from missing memory indexing; integration must resolve it.
- Risks: Preserve runtime bytes and unrelated dirty/staged work; never fallback from present bad custom; exclude private runtime from acceptance; do not commit before validator evidence/index isolation.
- Implementer handoff: Start with preservation evidence; use frozen paths/shared-loader contract; report all changed paths and checks.
- Integrator/reviewer handoff: Verify single-source path semantics, ownership, docs, fail-closed behavior, and dirty-index safety; do not replace validation.
- Validator handoff: Run gates with isolated fixtures, prove runtime physical/tracking state, and report external non-interference without inventing a path.
