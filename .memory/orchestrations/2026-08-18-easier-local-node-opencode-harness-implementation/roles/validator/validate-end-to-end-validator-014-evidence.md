```json
{
  "orchestrationId": "2026-08-18-easier-local-node-opencode-harness-implementation",
  "role": "validator",
  "artifactId": "validate-end-to-end-validator-014-evidence",
  "createdAt": "2026-08-19T04:59:50Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh validation packet for the five ai-infrastructure integration files, pinned harness commit, approved simplified setup plan, command matrix, schemas, security boundaries, skip policy, and fail-only acceptance standard.",
    "requiredContextPresent": "yes; taskMode validation, changed files, verification criteria, commands, schema contracts, expected warnings, acceptance standard, roots, and artifact expectation were supplied",
    "routingMetadataStatus": "absent",
    "workspaceRoot": "/home/joshl/ai-infrastructure",
    "traceRoot": "/home/joshl/projects/opencode-harness/.memory"
  },
  "workPerformed": {
    "summary": "Independently ran the authorized offline ai-infrastructure, harness runtime, portable, routing, package, syntax, diff, identity, schema, trace, and hostile fixture gates. Reviewed the wrapper, schema, tests, documentation, worktree separation, and exact harness commit. Added two disposable adversarial fixture variants under /tmp and removed them after execution. Validation is FAIL because plan accepts a profile rejected by the closed harness profile schema, and idempotent bind accepts/reuses an existing mode-0644 binding. No implementation fix, staging, commit, cache preparation, live service/tunnel/provider/OpenCode action, credential access, or global mutation was performed.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md",
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/schemas/opencode-harness-binding.schema.json",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/README.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/validate-end-to-end-validator-014-evidence.md"
    ],
    "commands": [
      "bash llama-server/tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness",
      "/bin/bash -p llama-server/tests/{opencode-projection,tunnel,safety,context-worker-install,context}-validation.sh",
      "/bin/bash -n integration wrapper, integration test, and every llama-server script/test shell file",
      "node .opencode/scripts/validate-harness.mjs",
      "node .opencode/scripts/runtime-harness.test.mjs",
      "node --test .opencode/scripts/runtime-foreign-repo.test.mjs",
      "node .opencode/routing/routing-policy.test.mjs",
      "node .opencode/scripts/validate-portable-harness.mjs --root .",
      "node .opencode/scripts/portable-harness.test.mjs",
      "npm pack --dry-run --json",
      "git status/diff --check/identity/path-scope checks in both repositories",
      "Python Draft202012 trace and role-output validation across 15 retained pre-existing traces",
      "Disposable adversarial fixture: mode-0644 existing binding followed by bind",
      "Disposable adversarial fixture: closed-schema-invalid nested profile field followed by plan"
    ]
  },
  "outputContract": {
    "outputs": "FAIL. The immutable harness pin and broad regression suites pass, but two approved acceptance boundaries fail with reproducible command evidence. Remediation and a fresh independent validation are required.",
    "evidence": "The stock integration fixture printed 'OpenCode harness integration validation fixtures: PASS'. The two validator-owned negative variants printed respectively 'DEFECT: bind accepted and reused an existing mode-0644 binding' and 'DEFECT: plan accepted a routing profile that violates the closed harness profile schema'. These are direct failures of the plan's mode-0600 immutable binding and plan-time full profile/schema compatibility gates.",
    "passFailMatrixOrFindings": [
      {"item": "Pinned harness identity and exact commit scope", "result": "PASS", "evidence": "HEAD c1c16cc55ca2c4787f000d01ff05ffe05734a3d3; parent 7844244131674cd763d994453c1888f50ae3d688; package/runtime 0.1.10; launcher SHA-256 c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156; git show reported exactly eight committed paths."},
      {"item": "Harness source/runtime/portable/routing/package regression", "result": "PASS", "evidence": "validate-harness passed; runtime-harness 34/34 passed; foreign-repo 8 passed and one optional bundle case skipped; routing 39/39 passed; portable validation passed; portable tests 18 passed with four Darwin skips; npm dry-run emitted package 0.1.10 with 40 files."},
      {"item": "Shell syntax and existing ai-infrastructure offline regression", "result": "PASS", "evidence": "All shell syntax checks exited 0. Projection, tunnel, safety, context-worker, context, and stock integration fixtures printed PASS; documented unprivileged ownership cases skipped."},
      {"item": "plan: no write, ordering, full profile/catalog validation, deterministic next action", "result": "FAIL", "evidence": "No-write/arbitrary-CWD stock cases pass, but an otherwise valid profile with an additional nested planner field was accepted by plan. The closed harness profile schema rejects that field. Wrapper lines 161-175 perform only a partial custom policy check; validate-inputs is not called by plan."},
      {"item": "prepare-harness: separate approval and exact exit propagation", "result": "PASS", "evidence": "Stock fixture rejects missing --yes, forwards cache root, and preserves fake exit 23. Real prepare was not authorized."},
      {"item": "bind: publication, concrete same-generation leaves, strict validate-inputs, immutable atomic owner-only binding", "result": "FAIL", "evidence": "Normal binding, schema, stable ID, concrete leaves, and exact validation JSON pass. After chmod 0644 of the existing content-addressed binding, repeating bind succeeded and reused it. Wrapper lines 305-307 read an existing path without no-follow/owner/mode enforcement and lines 315-317 report success."},
      {"item": "activate: explicit approval, registry tunnel composition, local/remote health, no server lifecycle", "result": "PASS_OFFLINE", "evidence": "Fake tunnel and curl fixture passes, including health failure and separately authorized ai.sh guidance. Source review found no server start invocation. Real live activation remains skipped."},
      {"item": "run: restart acknowledgment, input/hash checks, forwarding, workspace evidence, child exit", "result": "PASS_OFFLINE", "evidence": "Stock fixtures prove models/run closure, argument preservation, dirty-workspace gate, post-failure evidence marker, hash rejection, and fake exit 29 propagation. Real OpenCode/provider execution remains skipped."},
      {"item": "deactivate: separate approval and expected inactive semantics", "result": "PASS_OFFLINE", "evidence": "Fake inactive tunnel status is accepted and output disclaims unmanaged listeners. Real tunnel mutation remains skipped."},
      {"item": "No implicit lifecycle, credentials, mutable pin resolution, global install, or secret payload handling", "result": "PASS_STATIC_OFFLINE", "evidence": "Source and fixture review found no server/provider/credential/global-install action; pins are constants; private canaries did not enter fixture logs. Live behavior was not authorized."},
      {"item": "Worktree and authorized path separation", "result": "PASS_WITH_LIMITATION", "evidence": "Harness has no tracked diff and only orchestration memory is untracked. ai-infrastructure reports the five target paths plus extensive unrelated pre-existing changes; target status is README modified and four new files. No baseline exists to independently prove chronology of every unrelated uncommitted byte."},
      {"item": "Retained trace schema and direct role output contracts", "result": "PASS", "evidence": "Draft 2020-12 plus role-required-output script validated all 15 retained pre-existing role traces across both supplied orchestrations."}
    ],
    "commandOutputs": [
      {"command": "stock integration fixture", "status": 0, "output": "projection valid for 1 selected node(s); no files written; OpenCode harness integration validation fixtures: PASS"},
      {"command": "existing mode-0644 binding adversarial fixture", "status": 41, "output": "DEFECT: bind accepted and reused an existing mode-0644 binding"},
      {"command": "closed-schema-invalid profile plan adversarial fixture", "status": 42, "output": "DEFECT: plan accepted a routing profile that violates the closed harness profile schema"},
      {"command": "validate-harness", "status": 0, "output": "Darwin native activation/build checks not run on this non-Darwin host; OpenCode harness validation passed"},
      {"command": "runtime-harness", "status": 0, "output": "tests 34; pass 34; fail 0"},
      {"command": "trace validation", "status": 0, "output": "TRACE_COUNT 15; ALL_TRACE_SCHEMA_AND_OUTPUT_CONTRACTS_PASS"},
      {"command": "commit identity", "status": 0, "output": "commit path count: 8; package/runtime version relationship: PASS (0.1.10)"},
      {"command": "git diff --check in both repositories", "status": 0, "output": "no whitespace errors"}
    ],
    "schemaResults": [
      "Generated normal binding validated against llama-server/schemas/opencode-harness-binding.schema.json.",
      "All 15 retained pre-existing traces validated against memory-trace-artifact.schema.json and their role output required fields.",
      "Harness validate-inputs exact all-three-file JSON passed in the stock fixture and harness runtime tests.",
      "Plan-time profile schema enforcement failed: a nested additional property was accepted before publication."
    ],
    "securityAndActivationFindings": [
      "BLOCKING: idempotent bind can bless an existing binding with mode 0644 instead of failing closed; this violates the owner-only immutable binding acceptance gate.",
      "BLOCKING: plan does not consume the strict machine-readable harness validator and can report satisfied for a profile the pinned harness rejects; checkpoint ordering therefore permits false readiness before the separately approved bind publication.",
      "No evidence of implicit server/service/provider lifecycle, credential handling, mutable pin lookup, global installation, or secret canary logging was found in authorized offline scope.",
      "Real endpoint, SSH/systemd tunnel, provider, OpenCode, service, credential, cache, and rollback activation remain unknown rather than accepted."
    ],
    "remediationList": [
      "Make plan run the pinned harness validate-inputs contract against the rendered provider/catalog and supplied profile, strictly consume the exact JSON, and add a negative fixture proving every profile schema/policy/cross-document rejection occurs before any write or approval transition.",
      "On an existing content-addressed binding, reject symlinks and enforce current UID, regular-file type, exact mode 0600, trusted ancestry, closed content, and identity before reporting idempotent success. Add wrong-mode, symlink, owner-when-available, collision, and unchanged-existing-file fixtures.",
      "Rerun every offline gate and both adversarial reproductions in a fresh independent validator task after remediation."
    ],
    "skippedChecks": [
      "Real harness prepare: unauthorized version-cache write. Fake prepare and exact exit propagation substitute only for wrapper behavior; real cache integration remains unknown.",
      "Real activate/deactivate, SSH, systemd tunnel, service, Docker, provider, credentials, OpenCode run, global state, publication outside disposable fixtures, and rollback: unauthorized live or mutating operations. Static and fake fixtures substitute only for command composition; live readiness remains unknown.",
      "Ownership-changing fixtures: skipped by projection/context/harness suites because unprivileged chown/lchown was unavailable. Mode, symlink, ancestry, and same-UID fixtures provide partial substitution; other-UID behavior retains low residual environment risk.",
      "Darwin-only harness/portable checks: skipped on Linux. Linux source/runtime acceptance passes; Darwin activation remains unverified here.",
      "Optional external foreign-repository fixture bundle: skipped because no bundle was supplied; ordinary foreign-repository fixtures passed.",
      "llama-server/scripts/validate.sh: not run because it invokes Docker/private node validation outside authorization. Existing offline safety/projection/tunnel/context suites passed."
    ],
    "residualRisk": "Acceptance is blocked regardless of live skips. Additional residual risk includes same-UID shell TOCTOU limitations documented by the design, unavailable other-UID and Darwin coverage, unproven real SSH/systemd/provider/OpenCode behavior, and inability to independently reconstruct the chronology of extensive pre-existing ai-infrastructure uncommitted changes.",
    "traceArtifactPath": ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/validate-end-to-end-validator-014-evidence.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/validate-end-to-end-validator-014-evidence.md",
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md"
    ]
  },
  "handoff": {
    "nextRole": "implementer",
    "limitations": "Validation mode only. No fixes were implemented. Live and privileged operations were not authorized, and ai-infrastructure had extensive pre-existing uncommitted state.",
    "risks": "Do not accept or activate this integration until both blocking fail-closed defects are remediated and independently revalidated. Offline PASS results do not establish live readiness."
  }
}
```
