# Role Trace Artifact

## Metadata
- orchestrationId: `2026-07-19-multi-local-model-routing`
- role: `planner`
- artifactId: `root-planner-003-multi-local-design`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Approved goal, analysis-only boundaries, non-goals, two researcher artifacts, deliverable path, acceptance criteria, and resolved harness context.
- Required context present: Yes; all planner-required inputs were supplied.
- Routing metadata status: absent. No caller values were invented. Supplied `agent=planner`, unresolved/inherited model, `variant=planning`, and `source=commandOverride` are harness context only.

## Work Performed
- Summary: Produced a bounded implementation design for versioned multi-local routing, fail-closed force policy, shared resolution/enforcement, native provider coherence, migration, tests, documentation, manifest, and concurrency operations. Remediation loop 1 then amended the plan to reject force-with-disabled-local configuration and every explicit target conflict on a fixed-role command before force-scope evaluation.
- Files read: Both supplied researcher traces; memory protocol/template; role contract and trace schema; current routing config/resolver/helper/enforcer/plugin/validator/manifest; `opencode.json`; design; delegation command/skill/workflows/references.
- Files changed: Only this required trace artifact. No implementation files.
- Commands/checks: Read-only inspection and permitted trace creation; no final validation.

## Output Contract
- Outputs: Ordered plan, file contracts, dependencies, verification gates, handoff notes, open questions, recommended config/precedence, migration, tradeoffs, and operational guidance.
- Evidence: Grounded in `routing-researcher-001-current-harness.md` findings 1–14 and `runtime-researcher-002-parallel-context.md` sections A–D. Remediation loop 1 also incorporates the two planning blockers in `roles/validator/root-validator-004-proposal-evidence.md` lines 40–43 and 78–83.
- Artifact links: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md`

## Recommended Design
Adopt a deliberate breaking routing schema `2.0.0`. One pure module must own validation and selection; both CLI resolution and config-hook enforcement consume it. Force-local covers exactly the eight fixed harness roles. Compute and validate all assignments and native-provider relationships before any mutation. Keep endpoint transport out of `opencode.json`.

## Recommended Configuration

```json
{
  "harnessModelRouting": {
    "schemaVersion": "2.0.0",
    "defaultMode": "single-model",
    "defaultModel": null,
    "singleModel": { "enabled": false, "model": null },
    "roleOverrides": {
      "researcher": { "localModel": "qwen-research", "model": null, "variant": "research" },
      "planner": { "localModel": "qwen-research", "model": null, "variant": "planning" },
      "implementer": { "localModel": "qwen-coder", "model": null },
      "integrator": { "localModel": null, "model": null },
      "validator": { "localModel": "qwen-research", "model": null, "variant": "audit" },
      "reviewer": { "localModel": null, "model": null, "variant": "review" },
      "synthesizer": { "localModel": null, "model": null, "variant": "synthesis" },
      "artifact-verifier": { "localModel": null, "model": null, "variant": "artifact-proof" }
    },
    "commandOverrides": {
      "/delegate-research": { "agent": "researcher" },
      "/delegate-plan": { "agent": "planner" },
      "/delegate-implement": { "agent": "implementer" },
      "/delegate-integrate": { "agent": "integrator" },
      "/delegate-validate": { "agent": "validator", "variant": "strict" },
      "/delegate-artifact-verify": { "agent": "artifact-verifier", "variant": "artifact-proof" }
    },
    "orchestratorCommands": {
      "/delegate-orchestration": { "owner": "orchestrator", "variant": "recursive-orchestration", "agent": null }
    },
    "complexityTiers": {
      "simple": { "model": null, "variant": "fast" },
      "standard": { "model": null, "variant": "balanced" },
      "complex": { "model": null, "variant": "deep" }
    },
    "localRouting": {
      "enabled": true,
      "forceLocalForHarnessSubagents": true,
      "defaultLocalModel": "qwen-research",
      "models": {
        "qwen-research": {
          "model": "llamacpp-research/qwen2.5-7b-instruct",
          "routingServiceUrl": "http://127.0.0.1:8080/v1",
          "maxInFlight": 2
        },
        "qwen-coder": {
          "model": "llamacpp-coder/qwen2.5-coder-7b",
          "routingServiceUrl": "http://127.0.0.1:8081/v1",
          "maxInFlight": 1
        }
      }
    }
  }
}
```

### File-level config contract
- Require exact `schemaVersion: "2.0.0"`; reject missing/other versions and legacy singular fields.
- Require strict boolean types. Enforce the implication `forceLocalForHarnessSubagents === true => enabled === true`: the exact combination `enabled: false` and `forceLocalForHarnessSubagents: true` is invalid and must be rejected during schema/core normalization, before any request target or model precedence is evaluated. When enabled, `models` is nonempty; names match `^[a-z0-9][a-z0-9-]*$`.
- Each entry has a unique, nonblank `provider/model`, absolute HTTP(S) URL, and integer `maxInFlight >= 1`. Reject URL credentials, query, and fragment. Strip only trailing slash for comparisons.
- Model IDs are unique. One provider ID may occur in multiple entries only at one canonical URL. Separate URLs require separate provider IDs.
- Entries may share a URL only with equal `maxInFlight`; admission aggregates by canonical URL.
- Default and role local names must exist. Role override cannot set both non-null `localModel` and `model`. Require exactly the eight roles; unknown roles fail.
- `maxInFlight` is cooperative orchestrator policy, not a claimed process-wide/native semaphore.

## Recommended Precedence

### Target and variant
1. Normalize the command and validate the complete routing configuration first, including rejection of `forceLocalForHarnessSubagents: true` with `enabled: false`.
2. Read the command target before resolving request overrides. When `commandOverrides[command].agent` is one of the eight fixed harness roles, that role is a locked target for this request.
3. For a locked fixed-role command, independently inspect every present explicit request `agent` and request `role`. Each must exactly equal the command target. Reject any mismatch before deciding whether force-local applies. This includes another fixed role, an OpenCode built-in such as `build` or `general`, and any custom agent name. An explicit matching agent/role is allowed; neither field may retarget or escape force scope.
4. Only when the command has no fixed-role target, resolve the target from explicit request `agent`, then command agent (if any), then request `role`; if both explicit `agent` and `role` are present and differ, reject rather than selecting one silently.
5. Variant precedence remains explicit caller, orchestrator command, command, role, complexity, unresolved, but variant resolution occurs only after target-conflict validation.

### Force-local model
After configuration validation and command-target conflict validation succeed, force applies when local routing is enabled, force is true, and the locked/resolved target is a fixed role. Neither an invalid enable/force combination nor a conflicting explicit target may fall through to non-force precedence.
1. `roleOverrides.<role>.localModel`.
2. `localRouting.defaultLocalModel`.
3. Resolve catalog entry to exact model, URL, and budget.
4. Any absence/invalidity throws; no inherited/cloud/default fallback.
5. Explicit caller model is a constraint, not an override: absent is allowed; an exact match is allowed; cloud, unknown, or another catalog model is rejected. This avoids claiming unsupported per-call switching of a statically configured native agent.
6. Preserve supplied legacy routing labels verbatim, but do not let them override v2 force policy. A conflict fails. If absent, record absent and invent nothing.

Outside force mode preserve compatibility precedence: explicit model; orchestrator model; command model; role local selector (then role native model); complexity; enabled single model; default. Such CLI output must be marked advisory unless native invocation actually uses it. Recommended production mode for this goal is force enabled.

Decision output includes `schemaVersion`, `agent`, `model`, `variant`, source fields, and `local: { enforced, catalogName, routingServiceUrl, maxInFlight, networkCalls:false }`. Remove legacy `effectiveFallbackModel`.

## Native Provider Boundary
`routingServiceUrl` is declarative expected-endpoint evidence, not transport. Native transport remains merged OpenCode `provider.<provider-id>.options.baseURL` from approved user/global config or `OPENCODE_CONFIG`. Provider ID is the catalog model prefix; the remainder is native model ID.

The config hook must, before mutation: require every selected provider in merged `cfg`; compare canonical `options.baseURL` to catalog URL; require model declaration when a native `models` map exists (otherwise report not applicable for genuinely discovering providers); validate every target agent. It must never create/mutate provider, baseURL, credentials, or models. After full preflight, apply the entire eight-role model map and retain `mode: subagent`. Missing/mismatched provider is a force-mode startup error. Resolver/tests remain offline.

## Shared Architecture
Create `.opencode/routing/routing-policy.mjs`, side-effect-free, exporting `FIXED_HARNESS_ROLES`, `normalizeAndValidateRoutingConfig`, `resolveRoutingDecision`, `resolveAllHarnessRoleAssignments`, and `validateNativeProviderCoherence`. The CLI becomes a file/argument adapter. The helper imports core directly instead of spawning Node. The enforcer retains path/read diagnostics but delegates validation/selection/coherence and mutates only after preflight. Plugin index stays the sole auto-loaded adapter. Resolver decisions explicitly distinguish enforced from advisory.

## File Contracts

### Existing paths to edit
1. `.opencode/routing/harness-model-routing.json`: migrate to exact v2 shape with two entries, default, role selectors, force policy, budgets.
2. `.opencode/routing/resolve-model-routing.mjs`: thin strict CLI adapter; reject unknown/missing options; reject every explicit agent/role mismatch against a fixed-role command target before force evaluation; deterministic offline output.
3. `.opencode/routing/model-routing-helper.mjs`: direct core import, optional test config path, shared errors/shape.
4. `.opencode/plugin-modules/role-model-routing-enforcement.js`: all-role preflight, native coherence, atomic mutation, no fallback/transport.
5. `.opencode/scripts/validate-harness.mjs`: replace legacy fallback/resolver-only tests; add v2, all-eight, parity, invalid disabled-local/force combination, fixed-command conflicts with fixed/built-in/custom targets, coherence, and atomicity; remove stale hard-coded implementer expectation.
6. `opencode-harness.design.md`: document v2, precedence, fixed scope, transport, restart, concurrency.
7. `.opencode/commands/delegate-orchestration.md`: resolver is evidence; hook supplies fixed native models; remove false lifecycle enforcement claim; add conflict/admission preflight.
8. `.opencode/skills/delegation-orchestrator/SKILL.md`: decision object, absent metadata, force conflicts, URL-grouped budgets.
9. `.opencode/workflows/delegation-workflow.md`: routing preflight and endpoint budget before each DAG layer.
10. `.opencode/workflows/validation-workflow.md`: schema/parity/coherence/atomicity and optional live gates.
11. `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`: selectors/default and fixed-eight exclusion.
12. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`: distinguish URL/provider/process/device/residency/slot; unified-KV, observation, benchmark, context ownership.
13. `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`: v2, all-eight, fail-closed, atomicity, no-secret/admission checks.
14. `.opencode/harness.manifest.json`: add new paths below.

### New paths
- `.opencode/routing/routing-policy.mjs`: pure contract and decisions.
- `.opencode/schemas/harness-model-routing.schema.json`: draft 2020-12 structural schema, fixed roles/version, stable `additionalProperties:false`, and an `if`/`then` (or equivalent `not`) constraint rejecting `enabled:false` with `forceLocalForHarnessSubagents:true`; semantic cross-reference/uniqueness remains core code.
- `.opencode/routing/routing-policy.test.mjs`: Node built-in tests, synthetic configs only.

### Normally unchanged
- `opencode.json`: native-only, preserve `$schema`; no routing/provider examples.
- `.opencode/plugins/index.js`: sole adapter. Lifecycle module remains telemetry only.
- Contracts/trace schemas: unchanged unless resolved local fields later become mandatory role I/O.
- Agents and command frontmatter: no model values; hook supplies models.
- `.agents/` and `.codex/`: untouched/reference-only.

## Migration
Use a hard break. Missing version or `localModel`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback` legacy keys produce an actionable error. Silent migration is unsafe because advisory `preferLocal` did not mean force.

Manual steps: create a named entry from old fallback+URL; choose enabled explicitly; choose force explicitly (never infer from preferLocal); set default to cover unspecified roles; convert per-role selectors; configure matching native providers/baseURLs externally; remove legacy keys; restart OpenCode. No automatic migrator in minimal scope.

## Test Matrix

### Unit
- Valid two-entry config; role override/default for every fixed role/command.
- Explicit model absent/exact/cloud/unknown/other-local under force.
- `enabled:false` plus `forceLocalForHarnessSubagents:true` is rejected by both JSON Schema validation and core normalization before request resolution; `enabled:false` plus force false remains valid non-force configuration.
- For every command mapped to a fixed role: matching explicit agent, matching explicit role, both matching, conflicting fixed agent/role, built-in `build` and `general`, and arbitrary custom agent conflicts. Every mismatch must throw before force-scope/model evaluation; assert no cloud/non-force decision is returned.
- Without a locked fixed-role command, differing explicit agent and role are rejected.
- Missing default, bad references, unknown/missing roles, both selector types.
- Bad/blank model, strict types, invalid URL scheme/credentials/query/fragment, trailing-slash equivalence.
- Duplicate model, same provider/different URLs, shared URL matching/mismatching budget.
- Role/agent conflict and variant/command/complexity precedence.
- Determinism/non-mutation; legacy v1 rejection with migration message.

### Integration
- Synthetic merged config with two providers assigns all eight exactly as core reports.
- Missing agent/provider/baseURL, mismatch, undeclared mapped model, invalid disabled-local/force combination, and every fixed-command target conflict throw before any agent mutation; deep-compare snapshots.
- Provider/baseURL/model maps never mutate. Path discovery remains valid. Network calls remain zero.

### Static/validation
- Parse routing/schema/manifest; manifest lists new paths.
- Native `opencode.json` has no harness keys; agent/command frontmatter has no model.
- Only plugin index auto-loads. Docs agree on fixed scope, labels, transport, restart, RAM/VRAM caveat. No secrets/prior-projection runtime dependency.

### Baseline red
Before edits capture `git status --short` and full validator exit/output. Record the stale hard-coded implementer assertion separately; replace it with config-derived expectation, never weaken it. Re-run that scenario and full suite. Final acceptance requires green; unrelated failures are reported exactly and escalated, not hidden.

## Concurrency Guidance
- A fresh task owns a child session/history and delegation prompt; it does not automatically inherit the full parent transcript. `task_id` reuses a child. Host session storage is not inference KV/VRAM allocation.
- Distinct children may overlap HTTP requests; depth limits nesting, not breadth. Session count is not backend slots.
- Backend RAM/VRAM is resident weights + KV/context + buffers/overhead, controlled by backend/model/quant/context/slots/cache/offload/batching/devices. Do not claim OpenCode allocates inference VRAM.
- One URL may share weights/cache but also queue/failure domain. Multiple URLs help only if topology isolates processes/devices/queues; two URLs on one GPU can duplicate residency and reduce capacity. URL, provider, process, device, resident model, and slot are distinct.
- Group ready child work by canonical URL and dispatch no more than entry `maxInFlight` or a lower global cap; queue the rest. Backend queue limits also apply. This is cooperative, not a hard cross-process semaphore.
- Inventory llama.cpp slots, total/per-slot context, unified KV, KV types/offload, batch, GPU split, and continuous batching; observe health/props/slots/opt-in metrics. Inventory Ollama loaded-model, parallel, queue, context, keepalive, Flash Attention/KV settings; observe `ollama ps`, logs, RSS/GPU.
- Use timeout/cancellation, bounded retry/circuit breakers, headroom, and no cross-endpoint retry for write-capable work without idempotency.

Benchmark before raising limits: pin versions/models/flags/topology; record cold/idle residency; test concurrency 1..N with short/long and common/divergent prefixes; capture TTFT, throughput, latency, errors, queue/slots, context high-water, cache, peak RAM/VRAM, eviction/OOM; repeat cold/warm and mixed-model runs; choose a cap below first unacceptable threshold with headroom; keep prompts/secrets/private paths out of artifacts.

## Ordered Plan
1. Capture dirty baseline and current validator failure; confirm path ownership/secrets boundary.
2. Freeze v2 schema and create pure policy module.
3. Add focused tests for schema/semantics before adapters, including schema/core rejection of force with disabled local routing and fixed-command conflict cases for fixed, built-in, and custom explicit targets.
4. Migrate routing JSON.
5. Refactor CLI/helper to shared core.
6. Refactor atomic config-hook enforcement and coherence.
7. Update validator and remove stale assertion.
8. In parallel after semantics freeze, update design/command/skill/workflows/references.
9. Update manifest for new schema/core/test.
10. Integrator checks cross-file names, roles, decisions, labels, provider boundary, and paths.
11. Validator runs all gates; acceptance only on validator evidence.
12. Restart OpenCode; optional caller-supplied live proof/benchmark is separate.

## Dependencies
Baseline precedes edits. Schema/core precede config/adapters/enforcement/validator/docs. Tests depend on core API and precede adapter completion. Enforcement depends on shared assignments and merged native config. Docs parallelize only after names freeze. Manifest follows path decisions. Integration follows all branches; validator follows integration. Live checks depend on caller backend and are not offline acceptance prerequisites.

## Verification Gates

```sh
git status --short
node -e "for (const p of ['opencode.json','.opencode/routing/harness-model-routing.json','.opencode/schemas/harness-model-routing.schema.json','.opencode/harness.manifest.json']) JSON.parse(require('node:fs').readFileSync(p,'utf8')); console.log('json-ok')"
node --check .opencode/routing/routing-policy.mjs
node --check .opencode/routing/resolve-model-routing.mjs
node --check .opencode/routing/model-routing-helper.mjs
node --check .opencode/plugin-modules/role-model-routing-enforcement.js
node --check .opencode/plugins/index.js
node --test .opencode/routing/routing-policy.test.mjs
node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-implement"}'
node .opencode/scripts/validate-harness.mjs
git diff --check
```

Focused tests must cover both endpoints/all roles and intentional failure fixtures while proving no mutation. They must assert schema and core both reject `{ enabled:false, forceLocalForHarnessSubagents:true }`, and assert each fixed-role command rejects conflicting explicit `agent` or `role` values—including `build`, `general`, and a custom name—before any force-scope or model result is produced. Static gates search `opencode.json` for harness keys (none), agent/command frontmatter for model (none), plugin directory for only the adapter, and runtime files/manifest for `.agents/`/`.codex/` dependencies (none). Inspect complete diff.

Optional only with caller-safe environment, after restart: `opencode debug config`, backend-documented health/model call, and one OpenCode child task proving model plus required tool calling. Health alone is insufficient.

## Assumptions and Tradeoffs
- Assumes OpenCode 1.18.3 merged config exposes global/override providers and fixed agent models govern child tasks. Verify in validator fixture.
- Hard v2 migration is work but avoids unsafe semantic conversion.
- Static fixed-role assignments are reliable but do not support per-call switching; that needs a documented native surface or generated aliases, neither invented here.
- Startup failure is less convenient but required for credible force-local.
- Cooperative admission is not a global semaphore.
- Duplicate model IDs are prohibited because native identity otherwise cannot identify intended endpoint.

## Open Questions
1. Commit concrete loopback topology or use an approved deployment overlay?
2. Does target merged plugin config always expose global provider baseURL?
3. Which discovering providers may omit native model maps in force mode?
4. Is cooperative admission sufficient, or is a separately researched cross-process semaphore required?
5. What measured budgets are safe? Sample values are examples, not benchmarks.
6. Retain non-force legacy precedence long-term or remove later?
7. For arbitrary subagents, use explicit allowlist or every merged `mode: subagent` entry?

## Arbitrary Native/Custom Subagents
A later expansion needs a documented allowlist/discovery policy, validation that targets exist and are subagents, conflict/exclusion rules for built-in/hidden/user agents, atomic default assignment, dynamic-agent tests, and ownership docs. Blanket discovery could overwrite user agents. Agents created after config load remain uncovered without a documented runtime interception surface. Do not claim this coverage now.

## Remediation Note — Validator Loop 1

- Evidence reviewed: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/validator/root-validator-004-proposal-evidence.md` (`FAIL`, blockers 1–2).
- Amendment 1: The configuration contract, schema contract, core normalization, unit tests, integration tests, ordered plan, and verification wording now explicitly reject `forceLocalForHarnessSubagents:true` when `localRouting.enabled:false`. The invalid pair cannot disable force by predicate fallthrough.
- Amendment 2: A command mapped to a fixed harness role now locks its target. Any present explicit request `agent` or `role` that is not exactly that command target—including built-in and custom names—is rejected before force-scope evaluation.
- Preservation: All original research evidence, design decisions, file contracts, operational guidance, and limitations remain in this artifact. The validator’s separate orchestration-index blocker is orchestrator-owned and outside this planner-only amendment scope.
- Remediation status: Planner blockers addressed; proposal requires validator re-check before acceptance.

## Handoff Notes
- Next: `validator` re-check of remediation loop 1; after proposal acceptance, implementer, integrator/reviewer, and final validator.
- Freeze semantics before parallel docs; never edit prior projections, commit secrets, or put harness policy/provider transport in `opencode.json`.
- Integrator compares core decisions, hook assignments, schema/config/tests/docs/manifest and exact preserved-label wording.
- Validator owns baseline disposition and final evidence; plugin logs/self-tests are not acceptance.
- Limitations: no implementation, live provider proof, benchmark, or arbitrary-agent interception proof.

## Handoff
- Next role: `validator`
- Limitations: Plan only; no implementation/final validation/live benchmark. Endpoint capacity and merged-provider visibility are environment-dependent.
- Risks: Semantic drift, provider mismatch, partial mutation, red baseline masking regressions, and overstated concurrency/custom-agent coverage.
