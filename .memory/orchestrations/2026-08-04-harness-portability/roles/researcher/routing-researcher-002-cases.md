# Routing Portability Research

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `researcher`
- artifactId: `routing-researcher-002-cases`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Investigate routing configuration, resolver, schemas, plugins, validation, and tests; reproduce the `defaultLocalModel` error; explain custom/example and force-local behavior; identify portable positive/negative cases; make no implementation changes.
- Required context present: orchestration ID, scoped question, repository paths/source constraints, current-date freshness target, downstream planning need, reported preflight failure, and routing metadata status were present. Research was repository-local and current as of 2026-08-04; no live provider or external documentation claim was required.
- Routing metadata status: `absent`. Caller supplied no enriched routing metadata; no values were invented.

## Work Performed

- Summary: Read the routing documents, loader, pure policy/resolver, schema, plugin adapter/enforcer, validator, routing tests, manifest, design, and project instructions. Reproduced implicit CLI and plugin failures, contrasted them with explicit-example success, probed disabled-local and empty-catalog behavior, and ran the existing test/validation baselines.
- Files read: `.opencode/routing/harness-model-routing.json`, `.opencode/routing/harness-model-routing.example.json`, `.opencode/routing/routing-config-loader.mjs`, `.opencode/routing/routing-policy.mjs`, `.opencode/routing/model-routing-helper.mjs`, `.opencode/routing/resolve-model-routing.mjs`, `.opencode/routing/routing-policy.test.mjs`, `.opencode/schemas/harness-model-routing.schema.json`, `.opencode/plugins/index.js`, `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/plugin-modules/harness-lifecycle.js`, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, `opencode.json`, `.gitignore`, `AGENTS.md`, and relevant routing/design guidance.
- Files changed: This required research trace artifact only; no harness implementation/configuration file was changed. Researcher permissions prevented writing the requested orchestration `INDEX.md`; this is a handoff limitation.
- Commands/checks:
  - Implicit resolver -> exit failure with the reported dangling-default error.
  - Resolver with explicit example -> success; advisory `llamacpp-research/...`, `enforced:false`, `networkCalls:false`.
  - Direct implicit plugin probe -> wrapped startup/preflight failure with the same dangling-default cause.
  - Explicit-example plugin probe with eight agents and no providers -> success, `mode:"role-overrides"`, no agent model properties added.
  - Disabled-local resolver probe -> normalization succeeds but still resolves the role's local catalog model.
  - Disabled-local empty-catalog probe with null selectors/default -> rejected because `models` must contain an entry.
  - Force-local probe without native providers -> rejected at missing `cfg.provider.llamacpp-research`.
  - `node --test .opencode/routing/routing-policy.test.mjs` -> 30/30 pass; one Node module-type warning.
  - `node .opencode/scripts/validate-harness.mjs` -> pass; same module-type warning.
  - `git check-ignore -v` / `git ls-files --error-unmatch` -> custom routing file is ignored and untracked.

## Cited Findings

### Root causes

1. **[Direct] The selected custom override is internally inconsistent.** Its catalog contains only `qwen-research`, while `defaultLocalModel` is `qwen-coder`; implementer, integrator, and artifact-verifier also select missing `qwen-coder` (`.opencode/routing/harness-model-routing.json:13-20,25-26,30`). Normalization checks the default first and emits exactly the reported error (`.opencode/routing/routing-policy.mjs:101-124`). If the default alone were nulled, dangling role selectors would fail later (`.opencode/routing/routing-policy.mjs:133-140`).

2. **[Direct] Implicit custom-first selection makes that ignored file authoritative and intentionally does not recover to the valid example.** The loader selects any present custom entry before the example, then reads only that path (`.opencode/routing/routing-config-loader.mjs:19-32,66-85`). Tests require malformed or semantically invalid custom files never to fall back (`.opencode/routing/routing-policy.test.mjs:318-378`). Project instructions state the same no-merge/fail-closed contract (`AGENTS.md:14`; `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md:54`). The custom is operator-owned and ignored (`.gitignore:4`; `.opencode/harness.manifest.json:40-45`; `.opencode/scripts/validate-harness.mjs:241-247`).

3. **[Direct] Validation is green because acceptance deliberately reads the example, not the implicit/custom selection.** `validate-harness.mjs` loads the example directly (`.opencode/scripts/validate-harness.mjs:647-669`), and the test fixture does the same (`.opencode/routing/routing-policy.test.mjs:21-25`). Thus 30 routing tests and harness validation pass while actual implicit resolution/config startup fails. This is deterministic but does not diagnose a broken private override.

4. **[Direct] A truly neutral “no local model configured” document cannot currently be represented.** Schema and policy require at least one catalog entry even when disabled (`.opencode/schemas/harness-model-routing.schema.json:83-108`; `.opencode/routing/routing-policy.mjs:96-103`). Non-null defaults/role selectors must reference it (`.opencode/routing/routing-policy.mjs:123-140`). The example instead contains enabled illustrative entries/selectors (`.opencode/routing/harness-model-routing.example.json:10-35`).

5. **[Direct] `localRouting.enabled:false` does not disable advisory local resolution.** Outside force mode, the resolver selects `roleEntry.localModel` without consulting `enabled` (`.opencode/routing/routing-policy.mjs:248-281`). A direct probe with `enabled:false` still returned the coder local model. **[Inference]** The switch therefore cannot reliably mean “inherit the foreign repository's normal model.”

6. **[Direct] Force-false startup is safe only after the whole document validates.** The plugin always normalizes the selected document and preflights the plan (`.opencode/plugin-modules/role-model-routing-enforcement.js:21-48`). Outside force, only non-null native role `model` values become assignments; local selectors/default/single-model do not mutate agents (`.opencode/routing/routing-policy.mjs:302-317`; `.opencode/plugin-modules/role-model-routing-enforcement.js:30-33`). The explicit example succeeded without providers or agent model writes; the current custom fails earlier.

7. **[Direct] Force-local is fixed-eight, atomic, provider-coherent, and intentionally has no fallback.** Force is limited to enabled force mode and fixed roles; explicit models must exactly match selection (`.opencode/routing/routing-policy.mjs:248-258`). All roles need catalog-backed selection (`.opencode/routing/routing-policy.mjs:302-317`). Agents/providers/models/baseURLs are checked before mutation (`.opencode/routing/routing-policy.mjs:320-345`; `.opencode/plugin-modules/role-model-routing-enforcement.js:30-47`). Tests cover assignment and atomic failure (`.opencode/routing/routing-policy.test.mjs:549-600`); design rejects cloud/default fallback (`opencode-harness.design.md:128-134`).

8. **[Direct] Schema is structural but not full semantic validation.** It captures closed shapes, formats, catalog minimum, and force-implies-enabled (`.opencode/schemas/harness-model-routing.schema.json:56-110`); reference validity, uniqueness, provider/URL coherence, and shared budgets are policy checks (`.opencode/routing/routing-policy.mjs:101-140`). Harness validation inspects schema shape rather than validating routing instances through a general JSON Schema engine (`.opencode/scripts/validate-harness.mjs:267-296,666-669`).

## Proposed Behavior Matrix (Research Recommendation, Not a Final Plan)

| Situation | Proposed resolver result | Proposed config-hook result | Validation |
|---|---|---|---|
| No custom; neutral example; no provider | Command/variant resolve; model remains null/inherited; local metadata null | Clean startup; no provider checks or agent model writes | Positive foreign baseline |
| Disabled local with empty catalog, null default/selectors | Neutral behavior | No-op | Valid only in coherent disabled state |
| Disabled local retaining a dormant catalog | Do not select local entries; continue native/tier/single/default precedence | No local mutation | Planner must decide whether supported |
| Enabled valid catalog, force false | Advisory model/URL allowed, `enforced:false`, network-free | No agent/provider mutation | Positive advisory case |
| Enabled valid catalog, force true, coherent native providers | Exact catalog-backed models | Atomically set all eight; providers unchanged | Positive configured-local case |
| Force true with missing selection/agent/provider/model/baseURL | No fallback | Fail before mutation | Negative atomic cases |
| Present bad custom beside valid example | No fallback | Fail on custom | Preserve current contract |
| Custom absent; example present | Use example | Use example | Positive precedence |
| Both implicit files absent | No selection | Actionable failure naming both paths | Preserve |
| Explicit path | Use exactly it | Exact-path success/failure | Preserve |

**Inference:** Maximum portability favors a tracked neutral example that claims no installed local resource, with configured-local behavior demonstrated by a separate custom/test fixture. If the illustrative enabled example is retained, resolver output must not accidentally function as an effective model claim for provider-less hosts, or “advisory” must be explicit at every consumer.

## Foreign-Repository Test Cases

### Positive

1. Copy the harness bundle into a temporary foreign repository with eight agents, no provider block, and no custom; initialize the real hook from a nested path. Expect clean startup, no own agent models, neutral resolver model.
2. Repeat with coherent disabled/empty local state; expect policy/schema acceptance and null local metadata.
3. Valid enabled custom, force false, no native provider: expect custom selection and no startup mutation; advisory output only if approved.
4. Coherent native providers plus force-true custom: expect eight exact assignments, canonical URL evidence, unchanged providers, and CLI/helper/core parity.
5. Verify nearest project pair from nested paths and module example fallback when no project pair exists.
6. Verify custom absent/example present, exact explicit paths, copied bundle, and aliased CLI parity.

### Negative

1. Exact current defect: catalog lacks `qwen-coder` while default/selectors reference it; assert exact default path and no fallback.
2. Null default but retain a dangling role selector; assert exact role path.
3. Enabled empty catalog; disabled empty catalog with non-null selector/default; force true while disabled; force with uncovered role.
4. Malformed/unreadable/directory/dangling-symlink custom beside valid example; all fail custom-first.
5. Both files absent; explicit missing/malformed path despite valid sibling.
6. Force failure for each missing agent, wrong mode, provider, model declaration, or baseURL plus duplicate identity/provider URLs/shared budgets; assert zero partial mutation.
7. Disabled routing with valid catalog selector must not resolve local if disabled is defined as off; this currently exposes the inconsistency.
8. Keep deterministic example acceptance separate from an explicit optional-custom preflight so private config is diagnosed without fallback.

## Source List

- Runtime: `.opencode/routing/harness-model-routing.json:10-30`; `.opencode/routing/harness-model-routing.example.json:10-35`; `.opencode/routing/routing-config-loader.mjs:19-85`; `.opencode/routing/routing-policy.mjs:76-177,213-345`; `.opencode/plugin-modules/role-model-routing-enforcement.js:11-55`.
- Validation: `.opencode/schemas/harness-model-routing.schema.json:56-110`; `.opencode/scripts/validate-harness.mjs:241-340,442-524,647-669`; `.opencode/routing/routing-policy.test.mjs:77-108,247-301,318-424,518-610`.
- Intent/ownership: `.gitignore:4`; `.opencode/harness.manifest.json:39-45`; `AGENTS.md:14`; `opencode-harness.design.md:122-140`; role-routing matrix `:54-60`; validation checklist `:14-15,43-45`.
- Contracts: `.opencode/contracts/role-io-contracts.json:8-22`; `.opencode/schemas/memory-trace-artifact.schema.json:1-59`; `.memory/protocols/memory-management.md`.

## Implementation Implications

- Define authoritative `localRouting.enabled` semantics before changing files.
- Neutral portability needs conditional catalog/reference invariants across schema, policy, fixtures, resolver, plugin probes, docs, and validator—not merely repair of this private custom.
- Preserve custom-first/no-merge/fail-closed and exact explicit paths unless requirements explicitly reverse that safety contract.
- Preserve force-local all-eight coherence, atomicity, and no fallback.
- Separate deterministic example acceptance from easy explicit custom preflight.
- Add true foreign-repository fixtures without providers/private custom; current synthetic tests often include providers even for non-force plans (`.opencode/scripts/validate-harness.mjs:452-476`; `.opencode/routing/routing-policy.test.mjs:42-55,576-586`).

## Risks and Unresolved Questions

- A neutral example requires separate advisory/force fixtures and documentation examples.
- Conditional empty-catalog semantics must remain aligned between schema and executable policy.
- Unresolved: whether enabled + force-false selectors should output an advisory model, since the native hook does not consume it.
- Live provider merging, dispatch, model identity, tools, endpoint health, and concurrency were not tested; `networkCalls:false` only describes the resolver.
- The Node module-type warning is reproducible but unrelated.

## Output Contract

- Outputs: Cited root causes, constraints, behavior matrix, foreign-repository cases, sources, implications, risks, and handoff.
- Evidence: Direct findings and inferences are labeled; command-backed checks are listed. This is not acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/researcher/routing-researcher-002-cases.md`.

## Handoff

- Next role: `planner`, then `validator` before any acceptance.
- Limitations: Repository-local/offline research; no implementation files changed; no live OpenCode/provider testing; no acceptance validation. Researcher permissions denied creation/update of `.memory/orchestrations/2026-08-04-harness-portability/INDEX.md`, so the orchestrator or another authorized role must add this artifact without overwriting concurrent entries.
- Risks: Repairing only the private custom fixes this machine but not no-local portability; relaxing fallback or force coherence violates documented safety behavior.
