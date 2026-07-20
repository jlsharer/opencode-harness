# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-config-validation-compose-routing`
- role: `researcher`
- artifactId: `validator-researcher-001-config-derived`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Repository-only research request to locate and reproduce the stale implementer-model assertion, derive the committed-config expectation, and recommend the smallest test correction.
- Required context present: Yes. IDs, scope, sources, freshness, downstream needs, contract, schema, and trace path were supplied.
- Routing metadata status: absent. No caller routing values were invented. Resolved harness context (researcher, unresolved/inherited model, research variant, commandOverride source) was treated as context only.

## Work Performed

- Summary: Read the current validator, routing config, resolver, enforcement hook, and prior routing traces; inspected worktree diffs; reproduced the validator failure; and ran focused resolver and hook probes.
- Files read: `.opencode/scripts/validate-harness.mjs`; `.opencode/routing/harness-model-routing.json`; `.opencode/routing/resolve-model-routing.mjs`; `.opencode/plugin-modules/role-model-routing-enforcement.js`; relevant traces under `.memory/orchestrations/2026-07-19-multi-local-model-routing/`; role contract, trace schema, and trace template.
- Files changed: Only this required trace artifact; no implementation files.
- Commands/checks: `node .opencode/scripts/validate-harness.mjs` (exit 1, reproduced failure); focused Node config-hook probe (null committed role model remained absent); resolver CLI probe for `/delegate-implement` (model unresolved); `git status --short`; scoped staged/unstaged `git diff`; recent scoped `git log`.

## Output Contract

- Outputs: Cited findings, source list, implementation implications, risks, exact minimal recommendation, verification checks, and next role.
- Evidence: Direct evidence and inference are explicitly distinguished below and cite current repository paths/lines.
- Artifact links: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/validator-researcher-001-config-derived.md`

## Cited Findings

1. **Exact stale assertion.** [Direct] In the default-routing-path branch, the validator creates `defaultCfg`, invokes `applyHarnessRoleModelOverrides(defaultCfg)` without a fixture path, and then requires `defaultCfg.agent.implementer.model === 'llamacpp/qwen-local'`. The stale comparison is `.opencode/scripts/validate-harness.mjs:460-463`, specifically line 462. The emitted message mentions default-path/cwd behavior, although the failing condition is the model-value comparison at line 462.
2. **Failure reproduced.** [Direct] `node .opencode/scripts/validate-harness.mjs` exited 1 with `Plugin default routing path must work without cfg.provider when process.cwd() is a subdirectory outside the project`. Prior evidence records the same baseline failure and attribution: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/routing-researcher-001-current-harness.md:51` and `roles/validator/root-validator-004-proposal-evidence.md:52-59,129-135`.
3. **Committed-config expectation is now unset.** [Direct] The current routing surface has `roleOverrides.implementer.model: null`; `singleModel.enabled` is false with a null model, and `defaultModel` is null. `.opencode/routing/harness-model-routing.json:4-8,18-20`. A focused default-hook probe reported `configuredRoleModel:null` and `hasAppliedModel:false`.
4. **Null means preserve/unset, not assign null.** [Direct] Enforcement returns false for `model == null`, skips that role, and only writes `cfg.agent[role].model` for a valid non-null provider-prefixed string. `.opencode/plugin-modules/role-model-routing-enforcement.js:85-97,99-123`. Because `cfgWithAgents()` creates role entries with only `mode`, the expected result for the current null implementer override is absence of an own `model` property, not an own property whose value is `null`. `.opencode/scripts/validate-harness.mjs:429-431`.
5. **Fixture expectation versus committed expectation.** [Direct] Lines 433-448 deliberately build a synthetic routing fixture and set its implementer model to `llamacpp/qwen-local`; assertions at lines 437-439 and 447-449 correctly test that fixture and should remain literal. Lines 451-464 instead test module-default path resolution against the repository routing file; its expected model must come from that file rather than from the earlier fixture. `.opencode/scripts/validate-harness.mjs:433-464`.
6. **Single/default values must not feed this plugin assertion.** [Direct] The hook explicitly documents and implements `roleOverrides`-only scope; `singleModel/defaultModel` remain resolver-only. `.opencode/plugin-modules/role-model-routing-enforcement.js:99-106`. The nearby synthetic regression test requires those fields not to write any agent model. `.opencode/scripts/validate-harness.mjs:510-517`. Therefore the default-path plugin test must derive only `roleOverrides.implementer.model`, even if single/default values later become non-null.
7. **Resolver semantics are separate.** [Direct] Resolver precedence considers enabled single and default entries after role/complexity candidates and returns the first present model. `.opencode/routing/resolve-model-routing.mjs:67-90,116-125`. Existing resolver cases independently test single and default models. `.opencode/scripts/validate-harness.mjs:292-301`. The `/delegate-implement` probe resolved the agent from `commandOverride` with `sources.model:null`; this is consistent with current all-null selection policy, but it is not the plugin expectation API.
8. **Path-resolution assertion itself is not stale.** [Direct] The independent check at lines 456-459 compares `resolveHarnessRoutingPath()` with the repository path. The enforcement module resolves its module-relative default at `.opencode/plugin-modules/role-model-routing-enforcement.js:16-18,45-56`. Only the subsequent hard-coded model assertion needs correction for this scoped defect.
9. **Worktree provenance.** [Direct] Scoped diff shows the routing file's staged version assigned `llamacpp/qwen-local`, while the current unstaged worktree changes it to null; the validator retained the staged fixture-era literal. This explains staleness but does not change the required current-worktree expectation.

## Exact Minimal Recommendation

[Recommendation inferred from the direct API behavior above]

Change only `.opencode/scripts/validate-harness.mjs`:

1. Pass the already parsed `routing` object from `main()` into `assertRoleModelRoutingEnforcement` (current definition line 413; call line 671).
2. Inside that function derive `const committedImplementerModel = (routingConfig.harnessModelRouting ?? routingConfig).roleOverrides?.implementer?.model;`.
3. Replace only the line-462 literal comparison with a null-aware assertion: if `committedImplementerModel == null`, require `!Object.hasOwn(defaultCfg.agent.implementer, 'model')`; otherwise require `defaultCfg.agent.implementer.model === committedImplementerModel`.
4. Make the failure text state that the default-path hook result must match the committed implementer role override; retain the separate path equality check.

Do **not** replace the synthetic fixture literals at lines 435, 437, or 447. Do **not** derive from `singleModel`, `defaultModel`, or `localModel.localModelFallback`; those are outside the current plugin's roleOverrides-only enforcement contract.

## Regression Cases / Implementation Implications

- Current committed null override: default-path application leaves implementer model absent.
- Synthetic non-null role override: existing lines 433-449 continue proving exact provider/model assignment, including no-provider config.
- Synthetic non-null single/default with null role overrides: existing lines 510-517 continue proving no plugin assignment.
- If a pre-existing agent model is later used as a fixture, remember that null override means “do not mutate,” not “clear”; this minimal default fixture starts without a model.
- Consume the already parsed config object so test expectation and exercised module-default file describe the same current worktree without another hard-coded model.

## Risks

- Comparing `actual` to `committedModel ?? undefined` alone would not distinguish an absent property from an explicitly present `model: undefined`; `Object.hasOwn` is the stronger null-case check.
- Falling back to single/default/local fallback would silently broaden plugin scope and contradict both implementation comments and the nearby regression test.
- Generalizing this assertion to all roles could improve coverage but is not the smallest scoped correction and may obscure the default-path behavior being tested.
- The worktree is heavily dirty; final validation must inspect the scoped diff and avoid attributing unrelated changes to this correction.

## Checks

After the edit, run:

```sh
node --check .opencode/scripts/validate-harness.mjs
node .opencode/scripts/validate-harness.mjs
git diff --check
git diff -- .opencode/scripts/validate-harness.mjs
```

Expected focused result: both the null committed-config branch and existing synthetic non-null/resolver-only cases pass. Full validation should print `OpenCode harness validation passed`; report any later unrelated failure separately.

## Source List

- `.opencode/scripts/validate-harness.mjs:259-325,413-517,655-723`
- `.opencode/routing/harness-model-routing.json:2-20,41-61,84-89`
- `.opencode/routing/resolve-model-routing.mjs:16-18,29-37,59-134`
- `.opencode/plugin-modules/role-model-routing-enforcement.js:16-18,45-56,79-123`
- `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/routing-researcher-001-current-harness.md:42-51,71-79`
- `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md:127-146,184-185`
- `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/validator/root-validator-004-proposal-evidence.md:50-59,129-135`
- `.opencode/contracts/role-io-contracts.json:8-22`
- `.opencode/schemas/memory-trace-artifact.schema.json:1-60`

## Handoff

- Next role: `planner`, then a narrowly scoped `implementer` for the validator-only edit.
- Limitations: Research and reproduction only; no implementation correction or post-change acceptance validation was performed. Exact post-edit line numbers may shift.
- Risks: Preserve fixture/committed-config separation, null-as-no-mutation behavior, and current roleOverrides-only plugin scope.
