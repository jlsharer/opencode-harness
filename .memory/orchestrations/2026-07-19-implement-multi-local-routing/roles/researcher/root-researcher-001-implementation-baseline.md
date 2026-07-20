# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-implement-multi-local-routing`
- role: `researcher`
- artifactId: `root-researcher-001-implementation-baseline`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Current-worktree baseline research for accepted multi-local routing and config-validation/Compose designs; exact relevant paths, external read-only source, freshness, downstream needs, orchestration ID, artifact ID, and trace path.
- Required context present: Yes. The scoped question, source constraints, freshness, downstream needs, routing status, memory root, role contract, and trace schema were supplied.
- Routing metadata status: absent. Caller-supplied enriched routing labels were absent and no values were invented. Resolved context was recorded separately as researcher, model unresolved/inherited, variant research, source commandOverride.

## Work Performed

- Summary: Reconciled current staged, unstaged, and untracked state with both accepted prior orchestrations; inspected routing config/resolver/helper/enforcement/plugin/validator/manifest/docs, the config-derived validator correction, external Compose, repository path conventions, current OpenCode schema/docs/package types, and current command baseline.
- Files read: Current files under `.opencode/routing/`, `.opencode/plugin-modules/`, `.opencode/plugins/index.js`, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, delegation/validation docs, `opencode-harness.design.md`, `opencode.json`, `.gitignore`, `.opencode/package.json`, plugin type declarations, both prior orchestration indexes/traces, current orchestration index, root memory index, and `/home/joshl/docker/llama-server/compose.yaml`.
- Files changed: This trace artifact only. No implementation or external Compose file was edited.
- Commands/checks: `git status --short`; staged/unstaged diffs and diff stats; recent log; Node syntax checks for validator/resolver/helper/enforcement/plugin; resolver `/delegate-implement` probe; full harness validator; staged and unstaged `git diff --check`; `docker compose -f /home/joshl/docker/llama-server/compose.yaml config -q`; external Compose SHA-256; `npm ls ajv --depth=0`; authoritative OpenCode schema/config/provider/agent/plugin documentation retrieval.

## Output Contract

- Outputs: Cited findings, preservation constraints, recommended exact paths, current command baseline, implementation implications/sequencing, risks, unresolved blockers, source list, and recommended next role.
- Evidence: Direct findings are labeled separately from recommendations/inferences and cite current repository or prior-artifact paths and lines; authoritative rolling docs were inspected on 2026-07-19.
- Artifact links: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/researcher/root-researcher-001-implementation-baseline.md`

## Cited Findings

### Current implementation baseline

1. **Legacy v1 routing is still active.** [Direct] Current routing has no schema version, one singular `localModel`, all role `model` values null, and advisory endpoint/fallback metadata enabled but not preferred. `.opencode/routing/harness-model-routing.json:2-40,84-89`. The resolver selects explicit/command/role/complexity/single/default model candidates independently from singular local metadata; local fallback never becomes the top-level model. `.opencode/routing/resolve-model-routing.mjs:59-134`.
2. **The helper and hook are split.** [Direct] The helper spawns the CLI and returns JSON. `.opencode/routing/model-routing-helper.mjs:1-28`. The config hook separately reads routing JSON and applies only non-null `roleOverrides.<role>.model`; it does not use resolver decisions, single/default models, or local metadata. `.opencode/plugin-modules/role-model-routing-enforcement.js:99-128`. The lifecycle module only logs delegation observation. `.opencode/plugin-modules/harness-lifecycle.js:1-27`.
3. **The adapter boundary is already established and should be retained.** [Direct] `.opencode/plugins/index.js` is the sole adapter and composes lifecycle plus role-model hooks. `.opencode/plugins/index.js:1-9`; validator auto-load check `.opencode/scripts/validate-harness.mjs:590-631`. Existing manifest entries already cover the helper and enforcement module. `.opencode/harness.manifest.json:39-46`.
4. **The config-derived validator correction is present in the unstaged layer and works.** [Direct] The function receives parsed routing, derives only `roleOverrides.implementer.model`, requires absence for nullish values with `Object.hasOwn`, strict equality otherwise, and receives `routing` from `main`. `.opencode/scripts/validate-harness.mjs:413-432,452-472,673-676`. This exactly matches the accepted minimal fix and must not be lost. Prior implementation and final validation record the same contract and PASS. `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/implementer/validator-implementer-005-config-derived.md:20-29`; `roles/validator/root-validator-008-final.md:194-216`.
5. **Legacy validator expectations remain and must be replaced, not layered around.** [Direct] Resolver tests still assert singular fallback and legacy precedence. `.opencode/scripts/validate-harness.mjs:259-325`. Hook tests still assert roleOverrides-only and single/default non-enforcement. `.opencode/scripts/validate-harness.mjs:413-537`. The new v2 implementation therefore needs a deliberate rewrite of these cases while preserving the config-derived principle.
6. **Documentation currently overstates runtime binding.** [Direct] The orchestration command says lifecycle automatically enforces routing for every delegate command, but lifecycle performs no injection and the config hook is static role config. `.opencode/commands/delegate-orchestration.md:31-51`; `.opencode/plugin-modules/harness-lifecycle.js:13-20`. The accepted design already requires correcting this wording. `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md:122-140`.

### Dirty-worktree preservation

7. **All relevant routing/enforcement surfaces are pre-existing uncommitted work.** [Direct] Scoped status is: staged modifications to command, manifest, lifecycle, adapter, skill, validation workflow, and design; staged additions of enforcement/helper/llama guide; `MM` routing JSON and validator; untracked prior/current orchestration directories; and `MM .memory/INDEX.md`. No relevant change may be reset or reconstructed from `HEAD`.
8. **Routing JSON has conflicting index/worktree layers.** [Direct] The staged version changes implementer to `llamacpp/qwen-local` and enables the singular local endpoint/fallback; the unstaged version changes implementer back to null. Current worktree lines 18-20 are authoritative for this implementation baseline. Preserve the unstaged null correction while replacing the whole legacy shape with approved v2.
9. **Validator also has two provenance layers.** [Direct] Its staged layer adds broad resolver/hook/plugin tests; its unstaged layer is the accepted config-derived correction. Future edits must preserve the semantic correction at current lines 413, 432, 463-468, and 676 even if v2 refactoring moves or generalizes it.
10. **Memory is concurrently dirty.** [Direct] `.memory/INDEX.md` currently indexes both prior orchestrations through line 130 but not the current implementation orchestration. `.memory/INDEX.md:22-35,119-130`. Current `INDEX.md` marks research pending. `.memory/orchestrations/2026-07-19-implement-multi-local-routing/INDEX.md:21-31,42-57`. Index updates must append/merge rather than replace existing entries.

### Accepted design and Compose reconciliation

11. **The accepted v2 design is explicit.** [Direct] It requires exact schema version `2.0.0`, named local catalog, fixed-eight force scope, locked command targets, rejection of force-with-disabled routing, fail-closed explicit-model conflicts, shared pure policy, atomic provider coherence preflight, hard legacy rejection, focused tests, and three new routing/schema/test paths. `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md:27-28,86-123,125-158,160-185`. Proposal validation ultimately passed these semantics. `roles/validator/root-validator-004-proposal-evidence.md:112-142`.
12. **The external Compose is a source, not a target.** [Direct] It has one fixed service/container, mutable CUDA image, all-interface port 8080, one private host model mount, all GPUs, and hard-coded model/context/cache/GPU arguments. `/home/joshl/docker/llama-server/compose.yaml:1-44`. Read-only render passes and its observed SHA-256 remains `05d664779c2b0f6574335638d3f07eca84217b69d40017956f9bf828eebf1b6e`.
13. **Accepted Compose baseline is a reusable static service invoked as separate projects.** [Direct] It removes fixed `container_name` and command, uses required interpolation plus `LLAMA_ARG_*`, loopback publication, existing read-only binds, and sanitized env examples while private `instances/*.env` remain ignored. `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/compose-planner-004-dynamic-routing.md:27-73,72-127,167-185`.
14. **No repository path was accepted for localized Compose assets.** [Direct] Prior Compose plan names paths as if rooted in the external project (`compose.yaml`, `instances/...`) and explicitly made no harness implementation. Same artifact lines 179-185,230-233. Current harness root has no deployment/compose convention; harness-owned deliverables otherwise live under `.opencode/` and are enumerated by the manifest. `AGENTS.md:1-17`; `.opencode/harness.manifest.json:5-46`. [Recommendation] Localize at `.opencode/deployments/llama-server/` to keep deployment assets harness-owned but outside OpenCode auto-loaded native directories.

### Current native OpenCode constraints

15. **Native config remains strict and transport belongs in providers.** [Direct] The live schema has top-level `additionalProperties:false`, native `provider`, `agent`, and `model` fields; provider options include `baseURL` and `models`; agent `model` is a provider/model string. `https://opencode.ai/config.json` (retrieved 2026-07-19). Current `opencode.json` contains only schema, instructions, and permissions. `opencode.json:1-9`. Harness-only routing must remain outside it.
16. **Local llama.cpp transport is natively supported through custom providers.** [Direct] Current provider docs prescribe `npm: @ai-sdk/openai-compatible`, `options.baseURL`, and a provider `models` map for llama.cpp. `https://opencode.ai/docs/providers/#llamacpp` (updated 2026-07-19). Distinct endpoint URLs therefore map cleanly to distinct provider IDs, as the accepted design assumes.
17. **Static agent model assignment is the supported activation path.** [Direct] Current agent docs state subagents inherit the invoking primary model only when their own model is omitted; `agent.model` overrides it and uses `provider/model-id`. `https://opencode.ai/docs/agents/#model` (updated 2026-07-19). Pinned OpenCode task source selects `next.model` before parent provider/model. `https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/tool/task.ts#L136-L213`.
18. **A native config hook exists, but its package contract is async.** [Direct] Installed `@opencode-ai/plugin` 1.18.3 declares `config?: (input: Config) => Promise<void>`. `.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts:173-179`. Current hook returns a synchronous callback. `.opencode/plugin-modules/role-model-routing-enforcement.js:125-129`. Runtime currently accepts it in harness tests, but the v2 rewrite should use `async (cfg) =>` to match the declared API.
19. **Config precedence needs wording correction.** [Direct] Current docs load global, then `OPENCODE_CONFIG`, then project config, `.opencode` directories, and finally inline config; configs merge rather than replace. `https://opencode.ai/docs/config/#precedence-order` (updated 2026-07-19). Thus `OPENCODE_CONFIG` is not a final override over project config. It remains usable for non-conflicting provider definitions here, but docs must not call it a highest-priority override; `OPENCODE_CONFIG_CONTENT` is later, while secrets should remain outside committed files.
20. **No JSON Schema validator dependency exists.** [Direct] `.opencode/package.json:1-5` contains only `@opencode-ai/plugin`; `npm ls ajv --depth=0` is empty. The accepted requirement that both JSON Schema and core reject invalid fixtures cannot be fulfilled by merely parsing the schema. Planner must explicitly choose a validator dependency (for example Ajv plus format support) or narrow the gate with a justified dependency-free mechanism.

## Preservation Constraints

- Never use checkout/reset or regenerate from `HEAD`; preserve all staged and unstaged work.
- Preserve the config-derived validator principle and null-as-no-mutation behavior even when v2 enforcement supersedes roleOverrides-only behavior.
- Preserve synthetic fixture intent separately from committed-config expectation; do not turn current committed values into hard-coded test truth.
- Preserve `.opencode/plugins/index.js` as the only auto-loaded local plugin and keep segmented logic under `.opencode/plugin-modules/`.
- Preserve model-free agent and command frontmatter, fixed eight role names, routing-label absence semantics, and `.agents/`/`.codex/` as reference-only.
- Keep provider credentials, private model paths, real env files, and machine-specific native provider transport out of committed `opencode.json` and trace memory.
- Do not edit `/home/joshl/docker/llama-server/compose.yaml`; copy/adapt its parameter set only into the approved repository-local location.
- Merge additions into `.memory/INDEX.md`, current orchestration `INDEX.md`, manifest, and validator static lists without removing prior concurrent entries.

## Recommended Exact Path Set

### Existing implementation paths safe to edit, preserving current content

1. `.opencode/routing/harness-model-routing.json`
2. `.opencode/routing/resolve-model-routing.mjs`
3. `.opencode/routing/model-routing-helper.mjs`
4. `.opencode/plugin-modules/role-model-routing-enforcement.js`
5. `.opencode/scripts/validate-harness.mjs`
6. `.opencode/harness.manifest.json`
7. `.opencode/commands/delegate-orchestration.md`
8. `.opencode/skills/delegation-orchestrator/SKILL.md`
9. `.opencode/workflows/delegation-workflow.md`
10. `.opencode/workflows/validation-workflow.md`
11. `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
12. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`
13. `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
14. `opencode-harness.design.md`
15. `.gitignore`
16. `.memory/INDEX.md` and current orchestration `INDEX.md` only for required indexing/status updates.

### New routing paths from the accepted design

- `.opencode/routing/routing-policy.mjs`
- `.opencode/schemas/harness-model-routing.schema.json`
- `.opencode/routing/routing-policy.test.mjs`

### Recommended localized Compose paths

- `.opencode/deployments/llama-server/compose.yaml`
- `.opencode/deployments/llama-server/instances/research.env.example`
- `.opencode/deployments/llama-server/instances/coder.env.example`
- Optional concise operations doc only if the existing llama guide becomes unwieldy: `.opencode/deployments/llama-server/README.md`
- Ignore private copies with `.gitignore` entry `.opencode/deployments/llama-server/instances/*.env`; examples remain tracked because they end in `.env.example`.

Add every new harness-owned routing/schema/test/deployment/document path to both `.opencode/harness.manifest.json` and `STATIC_MANIFEST_PATHS` in the validator. Do not add private env files or generated resolved Compose output.

### Conditional dependency paths

- `.opencode/package.json`
- `.opencode/package-lock.json`

Edit these only if the planner selects Ajv/format validation. They are currently clean relative to Git and are not listed in the harness manifest baseline; the planner must state whether dependency metadata remains intentionally outside the static artifact manifest or changes that convention.

### Paths normally unchanged

- `opencode.json`
- `.opencode/plugins/index.js`
- `.opencode/plugin-modules/harness-lifecycle.js` except correcting telemetry wording only if required
- Eight agent files and six role command files/frontmatter
- Role I/O contracts and memory trace schemas
- Any `.agents/` or `.codex/` path
- External `/home/joshl/docker/llama-server/compose.yaml`

## Implementation Implications and Sequence

1. First update memory indexes enough to make the baseline validator executable, without changing implementation semantics.
2. Freeze the v2 config and schema-validation dependency decision. Also freeze whether committed force mode is enabled or merely supported.
3. Implement the pure policy and focused tests before adapters; validate the complete config before request precedence.
4. Migrate routing JSON and refactor CLI/helper to direct shared-core usage.
5. Refactor the hook to async declared shape, full native provider/agent preflight, exact shared assignments, and atomic mutation.
6. Rewrite legacy validator cases around v2 while retaining the config-derived/no-hard-coded-committed-value principle.
7. In parallel after names freeze, add Compose assets and update docs; keep aliases equal to native model suffixes and endpoints coherent with provider IDs.
8. Update manifest/static lists, integrate all paths, then run focused tests, full harness validation, Compose renders with temporary non-secret fixture env values, prior-projection scans, and diff checks.
9. Restart OpenCode after config/plugin changes. Live endpoint/model/tool-use and capacity proof remain optional only with approved operator infrastructure.

## Current Command Baseline

- PASS: Node syntax for validator, resolver, helper, enforcement, and plugin adapter.
- PASS: `/delegate-implement` resolver exits 0 and resolves `agent: implementer`, `source: commandOverride`, no model, singular local metadata, and `networkCalls:false`.
- FAIL: `node .opencode/scripts/validate-harness.mjs` now stops at `.memory/INDEX.md must index orchestration memory path: orchestrations/2026-07-19-implement-multi-local-routing/INDEX.md`. This is a current-orchestration indexing blocker, not the old hard-coded implementer assertion; that assertion was fixed.
- PASS: `git diff --check` and `git diff --cached --check`.
- PASS: external `docker compose ... config -q`; observed external hash unchanged from prior validation.
- NOT PRESENT: dedicated routing-policy test and routing JSON Schema.
- NOT AVAILABLE: Ajv dependency (`npm ls ajv --depth=0` empty).
- Expected non-fatal warning after indexing: Node may report `MODULE_TYPELESS_PACKAGE_JSON` for the JavaScript enforcement module, as recorded in prior final validation.

## Design Assumptions Requiring Adjustment or Explicit Planner Decision

1. **Committed activation versus safe startup (blocking decision).** The accepted sample sets force true and requires matching merged providers, but committed `opencode.json` has no providers and concrete sample Qwen2.5 identities do not match the external Qwen3.6 server. Enabling that sample unconditionally can make OpenCode startup fail for users without matching global config. Decide whether committed v2 defaults are disabled/safe while tests prove force mode, or whether this implementation intentionally requires operator provider setup before restart. Do not silently claim both portable startup and force-enabled startup.
2. **Concrete identities (blocking for production-like examples).** No second GGUF, approved aliases, image digest, GPU assignment, or measured budgets were supplied. Use clearly sanitized examples and synthetic routing fixtures unless the owner approves concrete values. Do not present `maxInFlight:2/1` as measured capacity.
3. **Schema execution.** Choose and scope a JSON Schema validator dependency; parsing a schema is not schema validation.
4. **Config override wording.** Correct prior docs that treat `OPENCODE_CONFIG` as a final override; project config loads later. Provider additions still merge when non-conflicting.
5. **Async hook shape.** Match the installed plugin type by making the v2 config callback async.
6. **Admission semantics.** `maxInFlight` can be declarative/cooperative prompt policy only in this scope; no repository runtime semaphore exists. Do not claim process-wide enforcement.
7. **Provider visibility.** Package types establish that the hook receives native `Config`, and current docs establish merged config, but no live environment proved that every intended global/custom provider is visible at the hook in this exact deployment. Keep a fixture gate offline and an optional `opencode debug config`/live child-task gate after restart.
8. **Endpoint trust.** HTTP(S) catalog entries are expected endpoints, not proof of physical locality. Loopback examples are safe defaults; remote endpoints require explicit auth/TLS/trust guidance.

## Risks

- Losing unstaged validator/routing corrections while replacing heavily dirty files.
- Force-local bypass or startup lockout from target conflicts, invalid enable/force state, or absent providers.
- Resolver/hook drift and partial mutation if shared preflight is not truly atomic.
- Model suffix/API alias/baseURL mismatch between routing, native providers, and Compose.
- Adding schema files without executing schema validation.
- Treating cooperative `maxInFlight` or llama slots as measured/global admission control.
- Committing private model paths, secrets, mutable production assumptions, or broadly exposed ports.
- Root/current memory indexing can repeatedly turn otherwise green validation red after each new trace.
- Node module packaging warning and dependency churn if package strategy is not explicit.

## Unresolved Blockers

- Planner decision on safe committed force-mode activation.
- Planner/owner decision on concrete model/provider/alias identities versus placeholders.
- Planner decision on Ajv (or equivalent) and package/manifest treatment.
- No live proof of merged provider visibility, endpoint reachability, tool calling, GPU ordering, or safe concurrency; these are not offline implementation blockers if accurately deferred.

## Source List

- Current implementation: `.opencode/routing/harness-model-routing.json:2-91`; `resolve-model-routing.mjs:1-163`; `model-routing-helper.mjs:1-28`; `.opencode/plugin-modules/role-model-routing-enforcement.js:1-129`; `harness-lifecycle.js:1-28`; `.opencode/plugins/index.js:1-9`.
- Validator/manifest/config: `.opencode/scripts/validate-harness.mjs:1-180,196-325,352-537,590-736`; `.opencode/harness.manifest.json:1-49`; `opencode.json:1-9`; `.gitignore:1-2`; `.opencode/package.json:1-5`.
- Docs: `.opencode/commands/delegate-orchestration.md:31-51`; `.opencode/workflows/delegation-workflow.md:24-40`; `.opencode/workflows/validation-workflow.md:5-22`; `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md:38-50`; `opencode-harness.design.md:117-182`.
- Accepted multi-local design: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md:27-28,86-158,160-233`; validator `root-validator-004-proposal-evidence.md:112-161`.
- Accepted validator/Compose work: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/validator-researcher-001-config-derived.md:31-82`; `compose-researcher-002-runtime-parameters.md:40-145,146-308`; planner `compose-planner-004-dynamic-routing.md:27-185`; validator `root-validator-008-final.md:192-272`.
- External source: `/home/joshl/docker/llama-server/compose.yaml:1-44`.
- Native compatibility: `https://opencode.ai/config.json`; `https://opencode.ai/docs/config/`; `https://opencode.ai/docs/providers/#llamacpp`; `https://opencode.ai/docs/agents/#model`; `https://opencode.ai/docs/plugins/` (retrieved 2026-07-19); installed `.opencode/node_modules/@opencode-ai/plugin/dist/index.d.ts:173-179`; pinned OpenCode task source at commit `67caf894e0843ee370e72839e8265e483233479b`.

## Handoff

- Next role: `planner`.
- Limitations: Research did not edit implementation, choose unresolved activation/dependency/identity policy, run future v2 tests, launch servers, prove native dispatch, or benchmark RAM/VRAM/concurrency. Full harness validation is currently blocked at current-orchestration indexing.
- Risks: The planner must freeze safe activation, schema tooling, exact localized paths, and placeholder/concrete identity policy before parallel implementers touch overlapping dirty files.
