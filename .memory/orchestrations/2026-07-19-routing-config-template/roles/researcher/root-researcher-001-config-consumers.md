# Researcher Trace: routing config consumers and example/runtime split

## Metadata
- orchestrationId: `2026-07-19-routing-config-template`
- role: `researcher`
- artifactId: `root-researcher-001-config-consumers`
- createdAt: `2026-07-19T20:33:15-05:00`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Repository-only research covering every routing-config consumer, Git state, example naming, absent/custom loader behavior, plugin startup, validator/manifest/docs/setup migration, v2 preservation, and baseline commands.
- Required context present: Yes; all researcher-required inputs, memory root, contract, schema, and trace path were supplied.
- Routing metadata status: absent. No routing labels or values were invented.

## Work Performed
- Summary: Inspected runtime/config code, tests, validator, plugin adapter, manifest, ignore rules, docs, prior evidence, and staged/unstaged/untracked Git state. Ran read-only tests, validator, resolver probes, and Git tracking/ignore/diff checks.
- Files read: `.opencode/routing/*`, `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/plugins/index.js`, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, `.gitignore`, `AGENTS.md`, `opencode-harness.design.md`, routing-related workflows/skills/deployment docs, contract/schema/template, and cited orchestration evidence.
- Files changed: Only this required trace artifact.
- Commands: `git status`, `git diff`, `git diff --cached`, `git ls-files`, `git check-ignore`, `git log`, hash/numstat checks; `node --test .opencode/routing/routing-policy.test.mjs`; `node .opencode/scripts/validate-harness.mjs`; default and explicit-config resolver probes.

## Output Contract
- Outputs: Cited findings, exact consumer matrix, recommended behavior, migration implications, preservation risks, checks, source list, uncertainties, and planner handoff.
- Evidence: Direct repository evidence is labeled **Direct**; proposed behavior is labeled **Recommendation/Inference**. Git evidence is from the 2026-07-19 worktree at `d4258c6`.
- Artifact links: `.memory/orchestrations/2026-07-19-routing-config-template/roles/researcher/root-researcher-001-config-consumers.md`

### Cited findings

1. **Current v2 semantics should be preserved in the example. [Direct]** The worktree document has `schemaVersion:2.0.0`, null default/single/native model selections, an enabled illustrative two-entry local catalog, `forceLocalForHarnessSubagents:false`, all eight role selectors, fixed commands, and complexity variants (`.opencode/routing/harness-model-routing.json:2-58`). The validator codifies exact v2, enabled/advisory force-false, all roles/commands, null native role models, and coder advisory resolution (`.opencode/scripts/validate-harness.mjs:273-329`). Prior validation accepted these semantics and the 21-test suite (`.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/validator/root-validator-008-final.md:35-57,70-82`).

2. **Every loader currently hard-codes the runtime filename. [Direct]** CLI default is module-relative `harness-model-routing.json` (`resolve-model-routing.mjs:8-19,25-44`); helper uses the same default unless given in-memory config (`model-routing-helper.mjs:7-13,15-33`); enforcement uses that module default and walks project context only for that name (`role-model-routing-enforcement.js:12-36,39-60`). No loader knows an example path.

3. **Absent custom currently fails; explicit paths already fail closed. [Direct]** CLI/helper wrap read failures (`resolve-model-routing.mjs:11-18`; `model-routing-helper.mjs:9-12`). Plugin read failures become startup-facing unreadable-routing errors (`role-model-routing-enforcement.js:39-60`). `--config` resolves and loads exactly its supplied path (`resolve-model-routing.mjs:25-44`). Tests assert explicit unreadable/malformed enforcement and malformed/missing CLI arguments (`routing-policy.test.mjs:297-301,358-364`).

4. **Plugin startup is directly coupled to file availability. [Direct]** The sole auto-loaded adapter always composes enforcement (`.opencode/plugins/index.js:1-8`), whose config hook always invokes it (`role-model-routing-enforcement.js:74-77`). Merely untracking the runtime file would make a clean checkout reject startup. A valid force-false v2 document produces null assignments and no model mutation (`role-model-routing-enforcement.js:49-71`; `routing-policy.test.mjs:331-340`).

5. **Tests/validator treat runtime as committed defaults. [Direct]** Unit tests parse `harness-model-routing.json` as `COMMITTED_PATH` and use it for normalization, CLI/helper parity, and plugin assertions (`routing-policy.test.mjs:19-24,56-66,288-295,331-340`). Validator lists it as required, parses it in `main`, and passes it through routing/resolver/enforcement checks (`validate-harness.mjs:37-71,626-648`); default path assertions require that exact path (`validate-harness.mjs:443-460`).

6. **Manifest/static ownership requires runtime. [Direct]** Manifest lists runtime as `harness-owned` (`.opencode/harness.manifest.json:39-44`). Validator computes exact manifest equality and requires every entry to exist (`validate-harness.mjs:205-239`). An ignored operator file cannot remain there without breaking clean-checkout validation.

7. **Docs need two-path vocabulary. [Direct]** One committed/harness-owned path is named by `AGENTS.md:14`; `opencode-harness.design.md:22-35,118-132,158-180`; validation workflow `:7-20`; checklist `:7-16,39-52`; llama guide `:20-24,31-75`; skill `:36-43`; and deployment README `:47-76`. The deployment convention already copies tracked `*.env.example` files to ignored private files (`.opencode/deployments/llama-server/README.md:5-21`).

8. **Naming recommendation:** use `.opencode/routing/harness-model-routing.example.json` for tracked defaults and retain `.opencode/routing/harness-model-routing.json` for operator runtime. This mirrors the repository’s `.env.example` convention while preserving the established runtime name. Ignore only the exact runtime path so the example remains trackable.

9. **Validation recommendation:** consume the example directly. It is the repository contract; private runtime may be absent or intentionally differ. Change static paths, manifest, semantic checks, resolver parity, and default fixtures to the example. Deterministic plugin tests should pass the example document/path, with isolated tests for runtime selection. Full validation should neither require nor constrain private runtime.

10. **Loader recommendation/inference:** only implicit loading should prefer existing runtime, else use colocated/project example. Never merge. If runtime exists but is unreadable, malformed, or semantically invalid, fail rather than fall back, because fallback could silently disable intended force policy. If neither exists, fail with both paths and an optional `cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json` instruction. Explicit CLI `--config`, helper `configPath`, and plugin `routingPath` must remain exact/no-fallback.

11. **Plugin recommendation/inference:** project-context lookup should resolve a same-root pair, custom first then example; module fallback should do likewise. Clean checkout should start from force-false example with no agent-model mutation. Present-invalid custom, explicit missing path, force/native incoherence, or absent-both should reject startup. This preserves atomic force behavior (`opencode-harness.design.md:122-132,140-150`; `role-model-routing-enforcement.js:49-71`).

12. **Git state is high-risk. [Direct Git evidence]** `main` at `d4258c65...` is `+0/-0` versus origin. Runtime is tracked `MM`: HEAD blob `fb942067...`, index blob `17660849...`, and different worktree SHA-256 `d5896277...`; staged delta is 4/4, then unstaged v2 migration 38/70. Index contains prior operator-specific v1 values; worktree contains v2. `.gitignore` is unstaged modified only for private Compose envs and ignores neither routing name. Example is absent/untracked. Routing policy/test are untracked; helper/plugin/validator/manifest/docs have mixed staged/unstaged work; many unrelated changes exist. Evidence: session `git status --porcelain=v2`, `ls-files --stage`, `check-ignore`, diffs, hashes, and numstats.

13. **Safe migration recommendation:** first copy current worktree v2 bytes to the example and verify equality/hash; leave current runtime physically in place as initial private copy. Add exact ignore rule. Remove only runtime from index, then stage only intended paths. Adding ignore alone does not untrack it. Avoid broad `reset`, `checkout`, `clean`, `stash`, or `git add -A`. Whether using `git rm --cached -f -- <path>` or `git update-index --force-remove -- <path>`, first preserve worktree and prove staged result is runtime deletion plus v2 example—not staged v1 content.

### Exact consumer matrix

| Consumer/surface | Current behavior | Required change |
|---|---|---|
| `resolve-model-routing.mjs:8-44` | Implicit runtime; explicit `--config` exact | Implicit custom→example; explicit exact/no fallback; absent-both setup error |
| `model-routing-helper.mjs:7-33` | Runtime default; in-memory bypass | Same implicit selection; explicit `configPath` exact; retain bypass |
| `role-model-routing-enforcement.js:12-77` | Project/module runtime only; missing rejects startup | Implicit custom-first/example fallback; present-bad and explicit fail; clean example startup no-op outside force |
| `.opencode/plugins/index.js:1-8` | Always activates hook | No path logic; prove clean startup/restart behavior |
| `routing-policy.test.mjs:19-364` | “Committed” fixture is runtime | Fixture becomes example; add custom preference/absence, explicit no-fallback, malformed custom, absent-both, plugin startup tests |
| `validate-harness.mjs:37-71,205-329,417-503,626-658` | Requires/parses/default-reads runtime | Require/parse example; deterministic tests bypass private runtime; test split/loader scenarios |
| `harness.manifest.json:39-44` | Runtime harness-owned | Replace with example; do not list private runtime |
| `.gitignore:1-3` | No routing ignore | Add exact runtime path; example remains trackable |
| `AGENTS.md:14` | One harness-owned runtime | Tracked example vs ignored operator override; both remain outside `opencode.json` |
| `opencode-harness.design.md:22-35,118-180` | One committed document | Two paths, precedence/no merge, explicit rules, fail-fast cases, copy/restart, validation source |
| `validation-workflow.md:7-20` | Parses runtime | Parse/normalize example; test absent/custom/explicit scenarios |
| `validation-checklist.md:7-16,39-52` | Runtime parse gate | Example gate plus exact ignore/trackability and plugin-loader gates |
| `llama-cpp-integration-guide.md:20-75` | Runtime called committed | Explain example/private copy and optional setup; retain force/provider/restart cautions |
| `SKILL.md:36-43`, `role-routing-matrix.md:52-59` | “Committed catalog” semantics | Clarify example semantics unless runtime overrides |
| deployment `README.md:47-76` | Generic committed routing | Cross-reference example/private customization; retain illustrative/restart cautions |
| routing schema/pure policy | Path-neutral v2 semantics | No semantic change; validate both files identically |
| memory indexes | New orchestration currently unindexed | Link trace/later artifacts; historical evidence need not be rewritten |

### Committed default content semantics

Seed example from exact current worktree v2 (`harness-model-routing.json:1-59`), not HEAD/index v1. Preserve v2, eight roles, fixed commands/variants, null default/single/native role models, enabled illustrative catalog, and force false. Keep identities explicitly illustrative (`opencode-harness.design.md:124-132`; deployment `README.md:47-76`). Do not weaken schema/normalizer or revert to v1. Operators optionally copy example to ignored runtime, customize, validate, and restart.

### Baseline checks

- `node --test .opencode/routing/routing-policy.test.mjs`: **PASS**, 21/21; only known module-type warning.
- Default resolver and explicit current-runtime `--config` probes: **PASS and identical**; implementer/coder, `enforced:false`, `networkCalls:false`.
- `node .opencode/scripts/validate-harness.mjs`: **FAIL** only because `.memory/INDEX.md` does not index current orchestration `INDEX.md`; required trace adds another expected indexing gap. This is not a routing semantic failure.
- Git: synchronized branch but heavily dirty index/worktree; runtime tracked `MM`; example absent; neither routing filename ignored.

### Downstream verification commands

1. `node --test .opencode/routing/routing-policy.test.mjs`
2. `node .opencode/scripts/validate-harness.mjs`
3. Default resolver plus `--config .opencode/routing/harness-model-routing.example.json` parity.
4. Temp fixtures proving runtime absent→example; runtime present→runtime; malformed runtime→failure/no fallback; explicit missing→failure; absent both→actionable failure; plugin example startup→no model mutation.
5. `git check-ignore -v` must match runtime only; `git ls-files --error-unmatch` must succeed only for example.
6. `git diff --check`; scoped status, cached diff, and worktree diff before commit.

### Source list

- Runtime: `.opencode/routing/harness-model-routing.json:1-59`; resolver `:8-49`; helper `:7-34`; tests `:19-364`; path-neutral `routing-policy.mjs`.
- Plugin: enforcement `:12-78`; adapter `:1-9`.
- Validation/ownership: validator `:37-95,205-329,417-503,556-598,626-703`; manifest `:39-53`; `.gitignore:1-3`.
- Guidance: `AGENTS.md:7-18,26-28`; design `:20-35,118-150,158-183`; validation workflow `:5-25`; cited skill/reference/deployment docs.
- Existing evidence: implementation final validator `:30-94`; config-validation final validator `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/validator/root-validator-008-final.md:35-84`.
- Current Git command evidence summarized in finding 12.

### Risks and unresolved uncertainty

- Dirty-work loss/mixing is highest risk: runtime has distinct HEAD/index/worktree states amid unrelated staged work.
- Fallback after present-invalid custom could silently disable force; fallback must be absence-only.
- Default-read validator assertions could consume developer private config; use explicit example fixtures.
- Current upward search only locates existing runtime. Define nested/outside-project example lookup; recommended same-root pair then module pair.
- Unresolved: no shared path-selection helper exists. Planner should choose centralization (safer against drift) without creating policy/plugin import cycles.
- Unresolved: choose the path-scoped untracking command only after contemporaneous status inspection and prove private content is not staged.

## Handoff
- Next role: `planner`
- Limitations: Repository-only research; no implementation files edited; no acceptance validation; live provider/server checks out of scope. Full validator is red from memory indexing.
- Risks: Preserve current v2 bytes and unrelated dirty work; never fallback from present-invalid custom; keep explicit paths fail-closed; make clean-checkout plugin startup/validation deterministic from example.
- Recommended planner focus: shared path-selection contract, v2 example content, path-scoped untracking/staging, manifest/static/docs changes, complete loader/plugin test matrix, setup/restart instructions, and final Git/validator proof.
