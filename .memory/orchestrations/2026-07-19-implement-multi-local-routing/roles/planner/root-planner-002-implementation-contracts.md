# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-implement-multi-local-routing`
- role: `planner`
- artifactId: `root-planner-002-implementation-contracts`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved v2 multi-local-routing goal; repository/external-source boundaries; accepted research and prior planner evidence; required activation, dependency, identity, deployment, testing, migration, and parallel-ownership decisions; acceptance criteria; orchestration, artifact, memory, contract, schema, and trace paths.
- Required context present: Yes. The caller supplied the approved goal, scope boundaries, research evidence, deliverable root and exact trace path, constraints, acceptance criteria, required decisions, routing status, and resolved planner context.
- Routing metadata status: absent. Caller-supplied enriched routing labels were absent and no values were invented. Resolved context was preserved separately as role `planner`, model `unresolved/inherited`, variant `planning`, source `commandOverride`.

## Work Performed

- Summary: Converted the accepted research and two prior accepted designs into a bounded executable implementation plan. Froze the v2 policy API and decision shape, safe committed activation state, dependency-free schema strategy, command-target precedence, atomic native coherence, two disjoint implementer path sets, localized Compose contracts, migration steps, and command-backed integration/validation/artifact-proof gates.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; supplied researcher trace; prior planner traces `root-planner-003-multi-local-design.md`, `validator-planner-003-minimal-fix.md`, and `compose-planner-004-dynamic-routing.md`; current routing JSON, resolver, enforcement module, manifest, and `.gitignore`.
- Files changed: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/planner/root-planner-002-implementation-contracts.md` only. No implementation file was edited.
- Commands/checks: Read-only inspection only; no implementation checks or final validation were performed.

## Output Contract

- Outputs: Ordered plan; exact non-overlapping file contracts for two parallel implementers; pure policy API and output contract; dependency DAG; precedence, conflict, atomicity, migration, activation, deployment, integration, artifact-proof, and final verification gates; assumptions and role handoffs.
- Evidence: The implementation baseline is grounded in `roles/researcher/root-researcher-001-implementation-baseline.md`; routing semantics in the accepted `2026-07-19-multi-local-model-routing` planner artifact; config-derived validator preservation and Compose behavior in the accepted `2026-07-19-config-validation-compose-routing` planner artifacts. No unverified host format was introduced.
- Artifact links: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/planner/root-planner-002-implementation-contracts.md`

## Frozen Decisions

1. The routing document is a hard-break v2 contract with exact `schemaVersion: "2.0.0"`. There is no compatibility parser or automatic migration.
2. `.opencode/schemas/harness-model-routing.schema.json` is a draft 2020-12 structural/interoperability schema. Runtime validation is dependency-free manual JavaScript in the pure policy module; tests use `node:test`. Do not add Ajv, any package, or edit `.opencode/package.json`/`.opencode/package-lock.json`.
3. The committed config keeps `localRouting.enabled: true` and `localRouting.forceLocalForHarnessSubagents: false`, with two explicitly illustrative catalog entries, a valid catalog default, and useful role local selectors. This is safe without operator-native providers because non-force local selections are advisory and are not written into native agent config.
4. Force mode covers exactly `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier`. Outside force mode, the hook enforces only non-null `roleOverrides.<role>.model`; `localModel`, single, default, command, and complexity choices remain resolver advice.
5. Native provider transport remains external merged OpenCode config. Do not add provider transport or harness policy to `opencode.json`, do not add `model` to agent/command frontmatter, and do not edit `.opencode/plugins/index.js` or `.opencode/plugin-modules/harness-lifecycle.js` unless integration proves an unavoidable adapter defect and a remediation plan is approved.
6. `.opencode/deployments/llama-server/` is the localized deployment root. The external `/home/joshl/docker/llama-server/` remains read-only. No private `.env`, resolved Compose output, real model path, credential, or claimed installed model is committed.
7. Catalog names `qwen-research`/`qwen-coder`, providers `llamacpp-research`/`llamacpp-coder`, suffixes `qwen2.5-7b-instruct`/`qwen2.5-coder-7b`, ports 8080/8081, and capacities 2/1 are illustrative cross-file examples only. Docs and env templates must say operators must replace model paths, aliases as needed, approved image digest, topology, and unmeasured capacity values.

## Pure Policy API and File Contract

Create `.opencode/routing/routing-policy.mjs` as a side-effect-free module with no filesystem, process, network, or OpenCode-plugin access and these named exports:

- `FIXED_HARNESS_ROLES`: frozen ordered array of the exact eight roles above.
- `normalizeAndValidateRoutingConfig(document)`: accepts wrapped `{ harnessModelRouting: ... }` or unwrapped routing data; returns a newly allocated normalized v2 object; never mutates input. It validates the complete document before request precedence.
- `resolveRoutingDecision({ config, request = {} })`: normalizes/validates config and returns the exact decision shape below without mutation or network calls.
- `resolveAllHarnessRoleAssignments(config)`: returns an atomic assignment plan for the hook. In force mode all eight roles have catalog-backed assignments. Outside force mode only non-null native `roleOverrides.<role>.model` values become assignments; all local selectors remain advisory.
- `validateNativeProviderCoherence(nativeConfig, assignmentPlan)`: validates the complete plan against merged native config and returns normalized provider evidence; it never mutates either argument.

Decision output contract:

```js
{
  schemaVersion: '2.0.0',
  agent: string | null,
  model: string | null,
  variant: string | null,
  source: string,
  sources: {
    agent: string | null,
    model: string | null,
    variant: string | null
  },
  local: {
    enforced: boolean,
    catalogName: string | null,
    routingServiceUrl: string | null,
    maxInFlight: number | null,
    networkCalls: false
  }
}
```

Assignment-plan contract:

```js
{
  schemaVersion: '2.0.0',
  mode: 'force-local' | 'role-overrides',
  assignments: {
    researcher: null | { model, catalogName, routingServiceUrl, maxInFlight },
    planner: null | { model, catalogName, routingServiceUrl, maxInFlight },
    implementer: null | { model, catalogName, routingServiceUrl, maxInFlight },
    integrator: null | { model, catalogName, routingServiceUrl, maxInFlight },
    validator: null | { model, catalogName, routingServiceUrl, maxInFlight },
    reviewer: null | { model, catalogName, routingServiceUrl, maxInFlight },
    synthesizer: null | { model, catalogName, routingServiceUrl, maxInFlight },
    'artifact-verifier': null | { model, catalogName, routingServiceUrl, maxInFlight }
  }
}
```

For non-catalog native role overrides, `catalogName`, `routingServiceUrl`, and `maxInFlight` are `null`. Every output contains all eight assignment keys in fixed order. Return data must be fresh and deterministic; tests deep-freeze inputs and compare repeated results.

`normalizeAndValidateRoutingConfig` must enforce strict object/string/boolean/integer types, exact and complete eight-role set, unknown-key rejection matching the structural schema, provider-prefixed nonblank models, valid catalog references/defaults, mutual exclusion of a role's non-null `model` and `localModel`, and `forceLocalForHarnessSubagents:true => enabled:true`. Catalog names match `^[a-z0-9][a-z0-9-]*$`; models are unique. URLs are absolute HTTP(S), reject credentials/query/fragment, and canonicalize only one or more trailing slashes for comparison/output. A provider may map to only one canonical URL. Catalog entries sharing a canonical URL must use equal `maxInFlight`; integers are at least one. `maxInFlight` remains cooperative metadata, not a runtime semaphore.

Reject the root legacy singular `localModel` object and misplaced legacy keys `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback` with an actionable message naming v2 `localRouting.models`, `defaultLocalModel`, explicit enabled/force choices, external native providers, and restart. Do not reject valid per-role `roleOverrides.<role>.localModel` selectors.

## Resolution, Conflict, and Enforcement Contract

1. Normalize command names and validate the entire config first. Invalid force-disabled state or any config defect fails before target/model resolution.
2. A `commandOverrides[command].agent` naming one of the eight roles locks the command target. Every present explicit request `agent` and `role` must independently equal it. Reject fixed-role, `build`, `general`, and arbitrary custom mismatches before force-scope/model evaluation.
3. Without a locked fixed target, reject differing simultaneously present explicit `agent` and `role`; otherwise target precedence is request `agent`, command agent, request `role`.
4. Variant precedence is explicit request, orchestrator command, command, role, complexity, unresolved, and runs only after target-conflict checks.
5. Force applies only when local routing is enabled, force is true, and the resolved/locked target is one of the eight roles. Local choice precedence is role `localModel`, then `defaultLocalModel`; missing choice/reference fails closed. An explicit request model is only an exact-match constraint: exact selected model passes; cloud, unknown, or another local model fails. No inherited/cloud/default fallback is allowed.
6. Outside force mode model precedence remains advisory in this order: explicit request, orchestrator, command, role local selector resolved through the catalog, role native model, complexity, enabled single model, default model. The decision sets `local.enforced:false`; catalog metadata may still identify an advisory local selection. Remove `effectiveFallbackModel` and the legacy `localModel` output object.
7. `.opencode/routing/resolve-model-routing.mjs` is only strict argument/file/JSON/stdout/stderr handling around the pure API. Reject unknown flags, missing values, malformed metadata JSON, and non-object metadata. `.opencode/routing/model-routing-helper.mjs` imports the pure API directly; it must not spawn Node, make network calls, or drift in output/errors, and retains an optional test config path/document seam.
8. `.opencode/plugin-modules/role-model-routing-enforcement.js` retains project/default path discovery and actionable read/parse diagnostics, imports the shared policy, and exposes an async config callback matching installed plugin types. It computes the whole assignment plan, validates all eight target agents and all selected provider relationships, and only then mutates.
9. Native coherence for every assignment requires an existing merged `cfg.agent[role]` and `mode` compatible with `subagent`, an existing provider matching the model prefix, and model declaration when that provider has a native `models` map. A catalog-backed assignment additionally requires canonical equality of `provider.options.baseURL` and `routingServiceUrl`. Never create or mutate providers, options, baseURLs, credentials, or models.
10. Atomicity is mandatory: on any missing/mismatched agent, provider, baseURL, or declared model, no agent or provider object changes. After successful preflight, write only assigned agents' exact `model` and `mode: 'subagent'`. Force mode writes all eight; non-force mode writes only non-null role native overrides. Deep snapshots prove provider maps never change and failure causes no partial agent mutation.

## Non-overlapping File Contracts

### Parallel implementer A — routing/runtime/tests/validator

Exclusive implementation ownership:

1. `.opencode/routing/harness-model-routing.json`
2. `.opencode/routing/routing-policy.mjs` (new)
3. `.opencode/schemas/harness-model-routing.schema.json` (new)
4. `.opencode/routing/routing-policy.test.mjs` (new)
5. `.opencode/routing/resolve-model-routing.mjs`
6. `.opencode/routing/model-routing-helper.mjs`
7. `.opencode/plugin-modules/role-model-routing-enforcement.js`
8. `.opencode/scripts/validate-harness.mjs`

A migrates the committed config to v2 with force false, enabled true, two illustrative entries/default, and useful selectors. Keep native `roleOverrides.*.model` null unless an existing non-null override must be preserved intentionally. A implements the pure contracts and fixtures, rewrites stale v1 validator cases, preserves the accepted config-derived/no-own-property principle for non-force null overrides, and adds all new A paths to `STATIC_MANIFEST_PATHS` without editing the manifest itself. Schema validation is not falsely claimed executable through an absent schema engine: parse and statically inspect the schema, while the manual normalizer is the executable runtime authority and tests every structural and semantic rejection.

Required A tests include: all eight roles under role selector/default force assignment; all fixed command mappings and matching/conflicting request target permutations; built-in/custom escape attempts; unlocked agent/role conflict; force exact/absent/cloud/unknown/other-local explicit model; disabled+force rejection; enabled false+force false validity; malformed/missing/extra fields and strict types; missing/unknown roles/defaults/references; both selectors; malformed models/URLs; credentials/query/fragment/trailing slash; duplicate model; provider-at-two-URLs; shared URL equal/unequal budgets; advisory precedence; legacy rejection/migration text; determinism/non-mutation; helper/CLI parity; all-eight successful enforcement; non-force roleOverrides-only enforcement; missing agent/provider/baseURL/model-map entry; provider/baseURL/model coherence; and no partial mutation/provider mutation on every failure position including the eighth role.

### Parallel implementer B — deployment/docs/manifest

Exclusive implementation ownership:

1. `.opencode/deployments/llama-server/compose.yaml` (new)
2. `.opencode/deployments/llama-server/instances/research.env.example` (new)
3. `.opencode/deployments/llama-server/instances/coder.env.example` (new)
4. `.opencode/deployments/llama-server/README.md` (new, required)
5. `.gitignore`
6. `.opencode/harness.manifest.json`
7. `.opencode/commands/delegate-orchestration.md`
8. `.opencode/skills/delegation-orchestrator/SKILL.md`
9. `.opencode/workflows/delegation-workflow.md`
10. `.opencode/workflows/validation-workflow.md`
11. `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
12. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`
13. `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
14. `opencode-harness.design.md`

B adds `.opencode/deployments/llama-server/instances/*.env` to `.gitignore`; `.env.example` files remain trackable. Manifest entries cover the policy, schema, test, all four deployment artifacts, and all existing/new harness paths, while preserving concurrent entries and no private env/generated output. B consumes A's frozen names/contracts from this plan and must not edit A paths.

Compose is one reusable `llama-server` service used as two named projects, with no `container_name`, no overriding `command`, no secrets, loopback host publication, required unique `HOST_PORT`, required existing absolute `MODEL_DIR`, required `MODEL_FILE`, required `MODEL_ALIAS`, and required `LLAMA_IMAGE` so operators must choose an approved digest rather than inherit a mutable production image. Mount `/models` read-only with `bind.create_host_path:false`. Set internal host/port and parameterized `LLAMA_ARG_*`; safe illustrative defaults are `CTX_SIZE=8192`, `PARALLEL=1`, `CACHE_TYPE_K=f16`, `CACHE_TYPE_V=f16`, `FLASH_ATTN=auto`, `GPU_LAYERS=all`, `SPLIT_MODE=layer`, `TENSOR_SPLIT=1`, `MAIN_GPU=0`, and `METRICS=true`. Reserve NVIDIA GPU capability without claiming isolation. Env examples align aliases/ports with the illustrative routing catalog but contain obvious required placeholders for digest and absolute private model paths. README supplies private-copy commands, customization warnings, two-project `config`/`up`/`down` commands, identity mapping, loopback/security, model suffix/alias coherence, capacity caveat, and optional GPU override guidance.

Docs must state: resolver output outside force is advisory; lifecycle is telemetry only; force mode statically configures exactly eight agents at startup; endpoint budgets are cooperative and grouped by canonical URL; native provider transport is external; `OPENCODE_CONFIG` merges before project config and is not a final override; `OPENCODE_CONFIG_CONTENT` is later but secrets should not be committed; force activation can deliberately fail startup; config/plugin changes require quit/restart; provider/model aliases are examples, not installed claims; health alone is not model/tool-use proof; live/benchmark gates are operator-dependent.

### Paths forbidden to both implementers

`opencode.json`, `.opencode/plugins/index.js`, `.opencode/plugin-modules/harness-lifecycle.js`, every `.opencode/agents/*.md`, role command files other than `delegate-orchestration.md`, contracts/schemas other than the new routing schema, `.agents/**`, `.codex/**`, external `/home/joshl/docker/llama-server/**`, prior orchestration artifacts, and any other path not assigned above. Each implementer writes only its own required role trace outside these implementation sets. No implementer edits `.memory/INDEX.md` or the current orchestration `INDEX.md`; orchestration indexing is an orchestrator/integrator bookkeeping handoff so parallel implementation paths remain disjoint.

## Ordered Plan and Dependency DAG

1. **Orchestrator baseline/bookkeeping:** capture `git status --short`, staged and unstaged scoped diffs, and the current validator output without resetting/reconstructing files. Merge the current orchestration and this planner trace into `.memory/INDEX.md` and the orchestration `INDEX.md` so the known indexing blocker does not mask implementation results. Preserve all dirty/staged provenance.
2. **Contract freeze (complete in this artifact):** both implementers acknowledge v2 names, force-false committed state, API/output shapes, illustrative identity matrix, deployment root, forbidden paths, and no-dependency strategy.
3. **Parallel A and B:** launch exactly two scoped implementers with the exclusive path sets above. A may order work policy/schema/tests -> committed config -> CLI/helper -> async enforcer -> validator. B may order work Compose/examples/ignore/README -> docs -> manifest. They may read each other's paths but not edit them.
4. **Implementer self-checks:** A runs syntax, unit tests, representative CLI/helper checks, and full validator if available. B parses JSON, renders both Compose instances using temporary non-secret env files, checks docs/static paths, and runs full validator if A has landed. Each reports pre-existing versus introduced failures and its exact diff; neither repairs the other's paths.
5. **Integrator join:** after both branches/work units finish, compare exact catalog/provider/alias/URL/role/path names across config, policy, Compose, docs, validator static paths, and manifest. Verify only the adapter auto-loads and no forbidden path changed. Integrator may edit only explicitly assigned integration/bookkeeping paths or request owner-specific remediation; it must not silently cross ownership.
6. **Reviewer:** review the integrated diff, emphasizing target escape, force-false behavior, manual/schema drift, provider coherence, eighth-role atomic failure, secrets/private paths, mutable image claims, stale v1 docs/tests, and dirty-worktree loss. Findings return to the owning implementer; maximum three scoped remediation loops.
7. **Artifact verifier:** create temporary env files outside the repository, render both named Compose projects, inspect resolved JSON/YAML for identity/security/defaults, record commands/temp path/listing, and clean up only after evidence capture. It does not start servers or modify deliverables.
8. **Validator:** only after integration/review/remediation, run every offline gate below and issue a pass/fail matrix. Hook telemetry and implementer self-tests are not acceptance evidence. Any implementation failure returns to the owning implementer; after a third failed loop request a synthesizer blocker.
9. **Acceptance/activation:** accept only with validator plus artifact-verifier evidence. Operator activation and live model/tool-use/benchmark proof occur separately after approved provider/server configuration and restart.

Dependencies: research and accepted designs precede this plan; step 1 precedes implementation; contract freeze precedes both parallel branches; A's frozen identity/API enables B but no file dependency exists during editing; both branches precede integration; integration precedes review/artifact proof/final validation; validator evidence precedes acceptance. Live checks depend on operator infrastructure and are not offline acceptance prerequisites.

## Verification Gates

### Implementer/integrator static and unit gates

Run from repository root; commands must exit zero unless explicitly marked inspection-only:

```sh
git status --short
node -e "for (const p of ['opencode.json','.opencode/routing/harness-model-routing.json','.opencode/schemas/harness-model-routing.schema.json','.opencode/harness.manifest.json']) JSON.parse(require('node:fs').readFileSync(p,'utf8')); console.log('json-ok')"
node --check .opencode/routing/routing-policy.mjs
node --check .opencode/routing/resolve-model-routing.mjs
node --check .opencode/routing/model-routing-helper.mjs
node --check .opencode/plugin-modules/role-model-routing-enforcement.js
node --check .opencode/plugins/index.js
node --check .opencode/scripts/validate-harness.mjs
node --test .opencode/routing/routing-policy.test.mjs
node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-implement"}'
node .opencode/scripts/validate-harness.mjs
git diff --check
git diff --cached --check
```

Representative resolver output for committed force-false config must identify `implementer`, remain `local.enforced:false`, make zero network calls, and not claim native enforcement. Synthetic tests—not committed startup—must prove force mode and all eight exact assignments.

Static inspection must prove: exact v2 and no root legacy keys; schema draft 2020-12 and `additionalProperties:false` boundaries; no new dependency/package edits; `opencode.json` has no harness routing/provider transport; agent and command frontmatter contain no `model`; only `.opencode/plugins/index.js` is auto-loaded; manifest and validator static lists include every new path; no runtime dependency on `.agents/`/`.codex/`; no private `.env`, credential, real private model path, generated Compose output, or external-file edit; and complete staged plus unstaged diffs preserve prior work.

### Reproducible Compose artifact-proof gate

The artifact verifier must use a temporary directory and files, not tracked private env files. From `.opencode/deployments/llama-server/`, create two temporary env files with a synthetic approved-format digest, `/tmp` model directory, illustrative files/aliases, and distinct ports; then run:

```sh
TMPDIR="$(mktemp -d)"
export TMPDIR
node - <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const digest = 'sha256:' + '1'.repeat(64);
const common = `LLAMA_IMAGE=ghcr.io/ggml-org/llama.cpp@${digest}\nMODEL_DIR=/tmp\nCTX_SIZE=8192\nPARALLEL=1\nCACHE_TYPE_K=f16\nCACHE_TYPE_V=f16\nFLASH_ATTN=auto\nGPU_LAYERS=all\nSPLIT_MODE=layer\nTENSOR_SPLIT=1\nMAIN_GPU=0\nMETRICS=true\n`;
fs.writeFileSync(path.join(process.env.TMPDIR, 'research.env'), common + 'HOST_PORT=8080\nMODEL_FILE=research.gguf\nMODEL_ALIAS=qwen2.5-7b-instruct\n');
fs.writeFileSync(path.join(process.env.TMPDIR, 'coder.env'), common + 'HOST_PORT=8081\nMODEL_FILE=coder.gguf\nMODEL_ALIAS=qwen2.5-coder-7b\n');
NODE
docker compose -p llama-research --env-file "$TMPDIR/research.env" -f compose.yaml config -q
docker compose -p llama-research --env-file "$TMPDIR/research.env" -f compose.yaml config --format json > "$TMPDIR/research.json"
docker compose -p llama-coder --env-file "$TMPDIR/coder.env" -f compose.yaml config -q
docker compose -p llama-coder --env-file "$TMPDIR/coder.env" -f compose.yaml config --format json > "$TMPDIR/coder.json"
```

Use Node to parse both rendered JSON files and assert: one service; no `container_name` or custom `command`; host IP `127.0.0.1`; distinct published ports 8080/8081; target 8080; `/models` bind is read-only and does not auto-create; image contains the supplied digest placeholder value; exact model file and alias; expected internal host/port; documented default context/parallel/cache/flash/GPU/split/main-GPU/metrics values; and no credential/private host value. Record temp path and listing in the artifact-verifier trace, then remove the temp directory. Do not run `config --environment`, commit rendered files, or start containers for offline proof.

### Final validator acceptance matrix

The validator must separately report PASS/FAIL for: JSON parse/schema-document shape; dependency-free semantic validation; all unit matrix categories; CLI/helper/core parity; all-eight force assignment; non-force roleOverrides-only mutation; async hook shape; provider/baseURL/model coherence; full preflight and no partial/provider mutation; fixed-command conflict rejection before force; strict v2 migration errors; manifest/static coverage; docs/activation/restart consistency; Compose two-instance artifact proof; secret/private-path scan; forbidden-path/runtime-dependency checks; `node .opencode/scripts/validate-harness.mjs`; both diff checks; and preservation of prior dirty/staged work. Exact command outputs belong in validator/artifact-verifier traces.

Optional only after operator approval and restart: `opencode debug config`, both backend health/models/props/slots checks, an exact-alias request, one delegated tool-using task per selected target, and concurrency/VRAM benchmarks. Health alone is insufficient and optional gates cannot convert an offline failure into acceptance.

## Migration and Activation Behavior

### Hard v1-to-v2 migration

On encountering the old root `localModel` block or misplaced singular fields, fail with migration guidance; never infer force from `preferLocal`. Operators must: create named `localRouting.models` entries from old model/URL data; choose `enabled` and `forceLocalForHarnessSubagents` explicitly; select a valid `defaultLocalModel`; convert role selectors to catalog names; retain intentional native role models only as `roleOverrides.<role>.model`; configure matching native providers externally; remove legacy fields; validate; quit and restart OpenCode.

### Safe committed behavior

The repository ships enabled catalog discovery/advice but force false. No local provider is claimed installed, no local selector is injected into agents, and absent/null native role model overrides cause no own `model` mutation. Resolver decisions may describe illustrative local choices as advisory. Existing sessions continue using their loaded configuration until restart.

### Operator force-local activation

1. Copy both `instances/*.env.example` files to ignored `instances/*.env`; replace digest, absolute model directory/file, aliases, topology, and measured settings.
2. Render, inspect, then launch distinct projects with the README's `docker compose -p llama-research ...` and `-p llama-coder ...` commands.
3. In approved user/global config or a non-conflicting `OPENCODE_CONFIG`, define `llamacpp-research` and `llamacpp-coder` as native OpenAI-compatible providers with model maps whose suffixes equal server aliases and baseURLs exactly equal the routing catalog after trailing-slash canonicalization. Do not put this transport in repository `opencode.json`; do not describe `OPENCODE_CONFIG` as final precedence.
4. Customize the committed example catalog/selectors if identities differ. Validate while force remains false.
5. Set only `localRouting.forceLocalForHarnessSubagents` to true after all eight agents and selected providers are coherent; run offline validation; quit and restart OpenCode.
6. Startup must fail before any agent mutation if any selected agent/provider/baseURL/model is absent or mismatched. Use `OPENCODE_DISABLE_PROJECT_CONFIG=1` only as the documented recovery escape hatch for a broken project startup, correct config, then restart normally.
7. Prove exact model and tool use live, then benchmark before raising cooperative `maxInFlight`; group dispatch by canonical endpoint and keep limits at or below measured backend slots with headroom.

## Assumptions and Risks

- Assumes the installed OpenCode plugin config hook receives merged native provider/agent config and static agent models govern delegated child selection; offline fixtures prove contract logic, while a live operator gate confirms the environment.
- The structural JSON Schema is deliberately not executed by a third-party engine in this dependency-free scope. Drift is controlled by schema-document assertions, shared manual normalization, exhaustive fixtures, validator checks, and integrator comparison; docs must not claim Ajv-equivalent execution.
- Illustrative aliases, digest placeholder, capacities, GPU settings, and model IDs are not deployable claims. Production values require operator approval and measurement.
- Primary risks are losing concurrent dirty layers, core/hook drift, target escape, partial mutation, startup lockout after force activation, provider/alias/baseURL mismatch, private-path leakage, and overclaiming cooperative admission or Compose GPU isolation.
- If a supposedly forbidden adapter/lifecycle/native-config edit becomes necessary, stop and return to planning rather than broadening scope silently.

## Handoff Notes

- Next roles: two parallel `implementer` instances using exactly the disjoint A/B path sets, then `integrator`, `reviewer`, `artifact-verifier`, and `validator` before acceptance.
- Implementer A handoff: preserve dirty/staged layers and the config-derived null/no-own-property correction; implement pure/manual validation and atomic async enforcement; do not edit B or forbidden paths.
- Implementer B handoff: consume frozen identities/API semantics, label every deployment identity as illustrative, require customization, preserve manifest/docs concurrency, and do not edit A or forbidden paths.
- Integrator handoff: reconcile cross-file names and indexes without replacing implementer work; request owner remediation for defects; verify manifest/static-list symmetry and sole-adapter boundary.
- Artifact-verifier handoff: use temporary env/render files only, capture reproducible evidence, and clean up; do not start or edit deliverables.
- Validator handoff: execute the complete matrix, preserve unrelated failures verbatim, and do not implement fixes. Acceptance requires validator and artifact-verifier evidence.
- Limitations: This artifact is a plan only. It does not implement, integrate, render Compose, run final validation, inspect live providers, start models, prove tool use, or benchmark capacity.
- Risks: The two branches share names but no files; contract drift must be caught at integration. Force activation intentionally converts missing native coherence into startup failure.

## Handoff

- Next role: `implementer` (two parallel scoped instances), followed by `integrator`, `reviewer`, `artifact-verifier`, and `validator`.
- Limitations: Planner trace only; no implementation file edits or acceptance validation were performed.
- Risks: Dirty-worktree loss, schema/manual drift, cross-branch identity mismatch, force startup lockout, partial mutation, and deployment examples being mistaken for installed or measured production values.
