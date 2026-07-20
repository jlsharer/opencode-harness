# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-config-validation-compose-routing`
- role: `planner`
- artifactId: `validator-planner-003-minimal-fix`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved validator-only goal; minimal scope boundaries; cited researcher evidence; exact implementation and trace paths; acceptance criteria; routing metadata status; and resolved execution context.
- Required context present: Yes. All required planner inputs from `.opencode/contracts/role-io-contracts.json` were supplied.
- Routing metadata status: absent. Caller-supplied enriched routing labels were absent and no values were invented. Resolved context was preserved separately as agent `planner`, model `unresolved/inherited`, variant `planning`, source `commandOverride`.

## Work Performed

- Summary: Reviewed the approved research, current validator function and call site, planner contract, trace schema, trace template, and orchestration index; converted the evidence into a bounded implementation plan without editing implementation files or performing final validation.
- Files read: `.opencode/scripts/validate-harness.mjs`; `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/validator-researcher-001-config-derived.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `.memory/orchestrations/2026-07-19-config-validation-compose-routing/INDEX.md`.
- Files changed: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/validator-planner-003-minimal-fix.md` only; no implementation files.
- Commands/checks: No implementation or acceptance commands run; planning was based on direct source inspection and supplied research evidence.

## Output Contract

- Outputs: Ordered plan, exact file contract, dependencies, executable verification gates, assumptions, risks, and implementer/validator handoff notes.
- Evidence: The stale committed-config literal is at `.opencode/scripts/validate-harness.mjs:462`; the function and call are at lines 413 and 671; synthetic fixture literals that must remain unchanged are at lines 435, 437, and 447; resolver-only protection is at lines 510-517. The researcher trace establishes that current null override semantics require absence of an own `model` property.
- Artifact links: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/validator-planner-003-minimal-fix.md`; `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/validator-researcher-001-config-derived.md`.

## Ordered Plan

1. In `.opencode/scripts/validate-harness.mjs`, change the function signature exactly from `async function assertRoleModelRoutingEnforcement()` to `async function assertRoleModelRoutingEnforcement(routingConfig)`.
2. In that function, derive the committed implementer override only from the supplied routing document, supporting its existing wrapped or unwrapped shape: `const committedImplementerModel = (routingConfig.harnessModelRouting ?? routingConfig).roleOverrides?.implementer?.model;`. Do not consult `singleModel`, `defaultModel`, or local fallback metadata.
3. In the module-default-path test block, retain `defaultCfg = cfgWithAgents()` and `applyHarnessRoleModelOverrides(defaultCfg)` so the exercised hook still reads the committed file through its default path.
4. Replace only the stale default-path model assertion with two config-derived branches:
   - When `committedImplementerModel == null` (covering both `null` and `undefined`), fail if `Object.hasOwn(defaultCfg.agent.implementer, 'model')` is true.
   - Otherwise, fail unless `defaultCfg.agent.implementer.model === committedImplementerModel`.
   Use failure text that states the default-path hook result must match the committed implementer role override.
5. Change the `main()` call exactly from `await assertRoleModelRoutingEnforcement();` to `await assertRoleModelRoutingEnforcement(routing);`, reusing the already parsed committed routing object.
6. Preserve all synthetic literal expectations and fixture setup unchanged, especially `'llamacpp/qwen-local'` at the synthetic assignment/comparisons, and preserve the resolver-only no-agent-model assertion.
7. Hand the scoped change to validation. Do not accept it based on hook behavior alone; require all verification gates below and inspect the scoped diff for unrelated edits.

## Exact File Contract

### `.opencode/scripts/validate-harness.mjs`

- Allowed edits: the `assertRoleModelRoutingEnforcement` parameter list; one committed implementer override derivation inside that function; the stale assertion at the default-path block; the single call in `main()`.
- Required behavior:
  - The expected committed value comes exclusively from `(routingConfig.harnessModelRouting ?? routingConfig).roleOverrides?.implementer?.model`.
  - A nullish committed override means the hook must leave `defaultCfg.agent.implementer` without an own `model` property, tested with `Object.hasOwn`.
  - A non-null committed override means strict equality with the configured role override.
  - The hook invocation under test remains argument-free so default routing-path resolution is still exercised from an external cwd.
  - Wrapped and unwrapped routing document shapes remain supported for the expectation.
- Preservation requirements: Do not alter routing semantics, plugin code, routing JSON, path-resolution assertion, synthetic fixture literals, malformed-input cases, resolver cases, or roleOverrides-only plugin coverage.
- Prohibited edits: Any implementation file other than `.opencode/scripts/validate-harness.mjs`; any attempt to source the expected model from `singleModel`, `defaultModel`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback`.
- Exact assertion shape:

```js
const defaultImplementerModelMatches =
  committedImplementerModel == null
    ? !Object.hasOwn(defaultCfg.agent.implementer, 'model')
    : defaultCfg.agent.implementer.model === committedImplementerModel;
if (!defaultImplementerModelMatches) {
  fail('Plugin default routing path must match the committed implementer role override');
}
```

### Trace artifact

- Path: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/validator-planner-003-minimal-fix.md`.
- Contract: Record the bounded plan and handoff in the role-trace format; it is the only planner-authored file.

## Dependencies and Ordering

- Completed prerequisite: researcher artifact `validator-researcher-001-config-derived` supplies direct evidence and the minimal recommendation.
- Implementation dependency: the implementer must receive this plan and edit only `.opencode/scripts/validate-harness.mjs` plus its own required trace.
- Verification dependency: validator runs after implementation and before acceptance; integration/review may inspect preservation but cannot replace validator evidence.
- No new code, package, runtime, schema, manifest, plugin, or routing-config dependency is introduced.

## Verification Gates

1. **Executable syntax:** `node --check .opencode/scripts/validate-harness.mjs` must exit 0.
2. **Full harness validator:** `node .opencode/scripts/validate-harness.mjs` must exit 0 and print `OpenCode harness validation passed`.
3. **Whitespace/error check:** `git diff --check` must exit 0; if unrelated worktree changes produce output, isolate and report whether the planned files are clean rather than modifying unrelated files.
4. **Scoped diff:** `git diff -- .opencode/scripts/validate-harness.mjs` must show only the signature, committed-role-override derivation, nullish/non-null assertion, failure text, and call-site changes described above.
5. **Exact source checks:** Inspect the scoped diff/source to confirm `assertRoleModelRoutingEnforcement(routingConfig)`, `await assertRoleModelRoutingEnforcement(routing)`, nullish handling with `Object.hasOwn`, and non-null strict equality to `committedImplementerModel`.
6. **Preservation check:** Confirm synthetic `'llamacpp/qwen-local'` assignment/comparisons remain unchanged and the `singleModel/defaultModel` resolver-only test still rejects any own agent `model` properties.
7. **Scope check:** `git status --short` plus scoped diffs must distinguish this correction and required memory artifacts from pre-existing unrelated worktree changes; no routing semantic file may be attributed to this implementation.

## Assumptions

- `routing` in `main()` is the parsed committed `.opencode/routing/harness-model-routing.json` document and is the correct expectation source for the default-path hook test.
- The routing document may be wrapped under `harnessModelRouting` or already be the routing object, matching existing validator conventions.
- Null and missing implementer override values both mean no mutation; the default fixture starts without an own `model` property.
- Current line numbers may shift after the minimal edit; named functions and statements are the durable anchors.

## Risks

- A value-only comparison against `undefined` could pass when `model` exists as an own property with value `undefined`; the nullish branch must use `Object.hasOwn`.
- Falling back to single/default/local metadata would broaden plugin semantics and violate the approved roleOverrides-only boundary.
- Passing `routingConfig` into `applyHarnessRoleModelOverrides` in the default-path test would stop testing module-default path resolution; only use it to derive the expectation.
- The dirty worktree can obscure unrelated changes; acceptance requires a scoped diff and clear attribution.

## Handoff

- Next role: `implementer`, then `validator` before acceptance.
- Implementer handoff: Apply only the exact `.opencode/scripts/validate-harness.mjs` contract above, preserve all synthetic literal cases, run assigned self-checks, and write the required implementer trace.
- Validator handoff: Run every verification gate, report command-backed evidence and preservation checks, and treat any unrelated failure separately without implementing fixes.
- Limitations: This is a plan-only artifact. No implementation edit, post-change execution, final validation, or acceptance decision was performed.
- Risks: Preserve config-derived expectation scope, nullish own-property semantics, default-path exercise, and roleOverrides-only behavior.
