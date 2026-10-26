# Validator trace: native fixture

## Metadata
- orchestrationId: 2026-10-24-v2-native-fixture
- delegationTaskId: fixture-validate-001
- scopeKey: native-fixture
- role: validator
- taskMode: validation
- artifactId: native-fixture-validator-001-gates
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Six changed paths, two exact managed commands, source-only fixture scope and refusal criteria.
- Required context present: Yes; local project-relative workspace/trace paths.
- Routing metadata status: absent; no caller-supplied labels.

## Work Performed
- Summary: Independent static scope/refusal review and two read-only assigned gates; no source edits.
- Files read: `.opencode/scripts/native-v2-plugin-fixture.mts`, `.opencode/scripts/native-v2-plugin-fixture.test.mts`, `.opencode/harness.manifest.json`, `.opencode/scripts/validate-harness.mts`, `.opencode/scripts/operator-external-qa.mts`, `.opencode/portable.manifest.json`, `.opencode/runtime.manifest.json`, `README.md`, `opencode-harness.design.md`, role contract/schema/template.
- Files changed: none.
- Commands/checks: `harness_verify("git diff --check")` observed exit 0, empty stdout/stderr; `harness_verify("node --check .opencode/scripts/operator-external-qa.mts")` observed exit 0, empty stdout/stderr. Managed adapter owns tree/HEAD/index proof; neither gate output prints hashes.

## Output Contract
- Outputs: Both assigned gates pass; static review finds source-only fixture correctly excluded from portable/runtime manifests, inventoried in source manifest and validator path list. No blocking command-backed defect found in scoped gates. Native activation/refusal remains unproved.
- Evidence: Manifest lines 134-135 and source validator lines 268-269 enumerate both fixture paths. Portable managedFiles and runtime files do not enumerate either. Fixture lines 77-100 check ambient environment, private scratch and binary digest, return `acceptanceProof:false`, `nativeSpawn:false`, `setupActivation:false`, `hookFiring:false`; CLI lines 103-110 exits 2. FIXTURE_SOURCE lines 9-19 is a string, not registered. Offline test lines 24-54 uses temporary fake data, but that test was not executed in this managed run. README lines 400-427 and design lines 332-348 expressly disavow native acceptance.
- Artifact links: `orchestrations/2026-10-24-v2-native-fixture/roles/validator/native-fixture-validator-001-gates.md`.

## Handoff
- Next role: parent for acceptance synthesis restricted to these two managed gates and static source scope.
- Limitations: Offline fixture test, full source validator, portable validator, npm pack and live native V2 setup/before-subagent refusal not executed here; syntax check targets the unrelated operator external QA script, not fixture. No claim of native plugin compatibility or no-child effect. Neither lifecycle/progress artifact nor static template proves activation.
- Risks: Static source review cannot establish all runtime environmental exposures, native plugin loading, fresh server binding, provider isolation, or unchanged tree outside adapter proof. Separate authorized external offline/full QA and source-backed native Stage A/B needed before V2 promotion.
