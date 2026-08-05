# Final Post-Remediation Portable Artifact Proof

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `artifact-verifier`
- artifactId: `portable-artifact-verifier-021-final-temp-install`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `artifactPaths` were the final portable manifest, bootstrap, installed validator, routing fixtures/resolver/policy, plugin entry, and generated foreign-target trees. `expectedGeneratedTree` was exactly 43 managed `.opencode` files plus four minimal `.memory` outputs in a fresh target, with no source-only roots or orchestration history. `parseOrRenderChecks` covered fresh/partial bootstrap, source/destination hashes, installed validation from root and nested cwd, idempotence, collision/non-overwrite/overwrite behavior, descriptor capability reporting and fail-closed behavior, and neutral/local resolver and plugin behavior. `tempDirectoryRequirements` required isolated foreign targets under `/tmp`. `cleanupDecisionCriteria` required evidence capture followed by complete removal and an absence assertion.
- Required context present: All required artifact-verifier inputs were supplied: `orchestrationId`, artifact paths, expected tree, checks, temporary-directory requirements, cleanup criteria, and routing status. The private source custom routing override was explicitly non-gating.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented.

## Work Performed

- Summary: Created five isolated foreign targets under `/tmp/opencode/harness-portability-av-final-iXpV8Y`, performed final loop-3 bootstrap and failure proofs without editing implementation, enumerated and hashed the fresh tree, validated root/nested/partial installs, tested repeat installation, proved collision refusal and memory preservation, explicitly restored a managed collision, exercised successful and intentionally unavailable descriptor capability paths, checked all-parent preflight failure before publication, verified installed neutral/local resolver and plugin behavior, ran the complete portable and routing suites, and removed the temporary root.
- Files read: `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/routing/resolve-model-routing.mjs`; `.opencode/routing/routing-config-loader.mjs`; `.opencode/routing/routing-policy.mjs`; both committed routing fixtures; `.opencode/plugins/index.js`; `.opencode/plugin-modules/role-model-routing-enforcement.js`; role contract; trace schema; memory protocol; orchestration index; loop-3 implementer and final integrator traces.
- Files changed: This trace artifact only. No implementation or generated deliverable was modified.
- Commands: Source bootstrap into `fresh`, `partial`, and `collision`; installed validator from target root, nested cwd, and partial target; Node filesystem/tree/SHA-256 probes; repeat bootstrap; collision and `--overwrite-managed` probes; forced descriptor-unavailable and forced later-parent probe-failure invocations; installed resolver and plugin imports with explicit committed fixtures; `node --test .opencode/routing/routing-policy.test.mjs` in the foreign install; `node --test .opencode/scripts/portable-harness.test.mjs` in source; pre-cleanup listing/count; recursive cleanup and absence assertion.

## Pass/Fail Matrix

| Check | Result | Reproducible evidence |
| --- | --- | --- |
| Fresh foreign bootstrap | PASS | `created/updated=43, memory-created=4, unchanged=0, collisions=0, write-safety=descriptor-anchored-hard-link:/proc/self/fd` |
| Partial foreign bootstrap | PASS | `created/updated=43, memory-created=3, unchanged=1, collisions=0`; destination index and history retained |
| Exact managed and memory outputs | PASS | Fresh target had `files=47`, `.opencode=43`, `.memory=4`; managed hash matches `43/43`, seed hash matches `4/4`, with no mismatches |
| No source roots/history | PASS | `AGENTS.md`, `opencode-harness.design.md`, `opencode.json`, root `.gitignore`, `.opencode/harness.manifest.json`, and `.memory/orchestrations` were all absent from fresh target |
| Installed validator from root | PASS | `Portable OpenCode harness validation passed` |
| Installed validator from nested cwd | PASS | From `fresh/work/nested`, `--root ../..` printed `Portable OpenCode harness validation passed` |
| Partial target validation | PASS | Installed validator printed `Portable OpenCode harness validation passed` while destination-owned memory/history remained present |
| Idempotence | PASS | Repeat bootstrap: `created/updated=0, memory-created=0, unchanged=47`; before/after digest identical |
| Managed collision refusal | PASS | Exit 1 with `managed collisions (1): .opencode/agents/researcher.md`; target still contained only the two pre-existing marker files |
| Memory non-overwrite | PASS | `.memory/INDEX.md` remained `PRIVATE MEMORY` with SHA-256 `f928800aa79f721c926ba5bfb7a87020652b8b61623c40ecd0c65edcf12fc322` through refusal and explicit overwrite |
| Explicit managed overwrite | PASS | `--overwrite-managed` reported `created/updated=43, memory-created=3, unchanged=1`; installed researcher hash equaled source hash `49379a200e11b7db2cab8d0dc2b582f1c052268b7a740d8a3dc1b93faee53755` |
| Descriptor capability output | PASS | Successful fresh, partial, repeat, and overwrite runs selected and reported `/proc/self/fd` under `descriptor-anchored-hard-link` |
| Capability unavailable before publication | PASS | Forced unavailable exit 1: `no usable descriptor-directory alias; tried /proc/self/fd, /dev/fd`; target entries remained `[]` |
| All parents probed before publication | PASS | Forced `.memory` probe failure exited 1 with `before publication`; target entries remained `[]` after cleanup |
| Neutral no-local resolver | PASS | Implicit foreign selection resolved implementer with `model:null`, no local catalog/URL/concurrency, `enforced:false`, `networkCalls:false` |
| Explicit valid local resolver | PASS | Local fixture resolved `llamacpp-coder/qwen2.5-coder-7b`, catalog `qwen-coder`, URL `http://127.0.0.1:8081/v1`, `maxInFlight:1`, `enforced:false`, `networkCalls:false` |
| Neutral/local plugin behavior | PASS | Installed plugin default and config hook were functions; both fixture invocations left native config `{}` and reported `mutated:false` |
| Routing suite | PASS | Installed suite: 36 tests, 36 pass, 0 fail/skipped/cancelled/todo |
| Portable E2E suite | PASS | Final source suite: 15 tests, 15 pass, 0 fail/skipped/cancelled/todo |
| Cleanup | PASS | Temporary root changed from `exists:true`, 69 descendant directories and 143 files to `exists:false`, result `pass` |

## Exact Fresh Tree

```text
.memory/INDEX.md
.memory/protocols/memory-management.md
.memory/templates/orchestration-index.md
.memory/templates/role-trace-artifact.md
.opencode/agents/artifact-verifier.md
.opencode/agents/implementer.md
.opencode/agents/integrator.md
.opencode/agents/planner.md
.opencode/agents/researcher.md
.opencode/agents/reviewer.md
.opencode/agents/synthesizer.md
.opencode/agents/validator.md
.opencode/bootstrap/memory/INDEX.md
.opencode/bootstrap/memory/protocols/memory-management.md
.opencode/bootstrap/memory/templates/orchestration-index.md
.opencode/bootstrap/memory/templates/role-trace-artifact.md
.opencode/commands/delegate-artifact-verify.md
.opencode/commands/delegate-implement.md
.opencode/commands/delegate-integrate.md
.opencode/commands/delegate-orchestration.md
.opencode/commands/delegate-plan.md
.opencode/commands/delegate-research.md
.opencode/commands/delegate-validate.md
.opencode/contracts/role-io-contracts.json
.opencode/plugin-modules/harness-lifecycle.js
.opencode/plugin-modules/role-model-routing-enforcement.js
.opencode/plugins/index.js
.opencode/portable.manifest.json
.opencode/routing/harness-model-routing.example.json
.opencode/routing/harness-model-routing.local.example.json
.opencode/routing/model-routing-helper.mjs
.opencode/routing/resolve-model-routing.mjs
.opencode/routing/routing-config-loader.mjs
.opencode/routing/routing-policy.mjs
.opencode/routing/routing-policy.test.mjs
.opencode/schemas/harness-model-routing.schema.json
.opencode/schemas/memory-trace-artifact.schema.json
.opencode/schemas/role-io-contracts.schema.json
.opencode/scripts/bootstrap-portable-harness.mjs
.opencode/scripts/portable-harness.test.mjs
.opencode/scripts/validate-portable-harness.mjs
.opencode/skills/delegation-orchestrator/SKILL.md
.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md
.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md
.opencode/skills/delegation-orchestrator/references/validation-checklist.md
.opencode/workflows/delegation-workflow.md
.opencode/workflows/validation-workflow.md
```

## Count, Digest, and Retention Evidence

- Fresh exact count: 47 files = 43 managed `.opencode` files + four `.memory` seed outputs.
- Ordered path-and-content SHA-256 digest: `95a8deecab9f9d6a8b41b958da01ab37bd608335625ab61ac42df1bce2066bcf`.
- Idempotence before/after digest: `95a8deecab9f9d6a8b41b958da01ab37bd608335625ab61ac42df1bce2066bcf` / `95a8deecab9f9d6a8b41b958da01ab37bd608335625ab61ac42df1bce2066bcf`.
- Current key hashes: manifest `113ebad3386defb368c2d52c45cc0b3416992cc75caaa65a8ce0b79cdb6207ad`; bootstrap `c1d5430989081e42c2244c61067f9830b8a166be370d78bf6ec22bd62264a5ff`; installed validator `0e2f04ccb96b41518c115cb94e9173b64e57c6b3af7d0122717f14ef3152e3ac`.
- Fresh memory hashes in manifest order: `b1637bd5091c902974e424bba75f15add86ea880210e83f3b23dd47541637748`, `4e9eb33c3a0a916aab71cd7385f302758d566ada4055fc7356e9a6920e1395f8`, `d9236410e19db145a816410dad78aaf9bdb3843d30a6fd2c92287ed9b80ca0ed`, `53ac6a59c52e7443462deb144b4aa8be4d53841e4fb9a75f968c758272655ce5`.
- Partial target count: 49 files = 43 `.opencode`, five `.memory` files including retained history, and destination `README.md`. Retained index content/hash: `# FOREIGN MEMORY DO NOT OVERWRITE` / `fd482ecfc4cacbbc38af315417c8f9b049ffa4d84e97399a7d1fc457022e8d45`. Retained history content/hash: `FOREIGN HISTORY KEEP` / `3f6f07b6129174a675f7ca3f29d778ad263a501f4cec25646f2a547cb5a410c0`.

## Output Contract

- Outputs: `tempPath` was `/tmp/opencode/harness-portability-av-final-iXpV8Y`; `fileListing` is the exact 47-file fresh tree above; `commandOutputsOrRenderEvidence` are the matrix, suite totals, resolver/plugin fields, counts, hashes, and failure outputs; `cleanupDecision` was removal after evidence capture; `limitations` are below; `traceArtifactPath` is this file.
- Evidence: All requested acceptance checks have direct command-backed proof. Pre-cleanup evidence was `{"path":"/tmp/opencode/harness-portability-av-final-iXpV8Y","exists":true,"d":69,"f":143}`. Post-cleanup evidence was `{"path":"/tmp/opencode/harness-portability-av-final-iXpV8Y","exists":false,"result":"pass"}`.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/artifact-verifier/portable-artifact-verifier-021-final-temp-install.md`; `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/routing/routing-policy.test.mjs`.

## Handoff

- Next role: Orchestrator and validator may use this as current post-remediation-loop3 generated-artifact evidence for the `AV2` gate.
- Limitations: No live OpenCode restart, provider transport, routing-service endpoint, network request, or model execution was exercised. Resolver/plugin checks establish deterministic configuration behavior only. `/proc/self/fd` was selected; `/dev/fd` was listed in the fail-closed diagnostic but was not independently selected. Whole-install transactionality and process interruption after successful capability preflight remain outside scope. The private source custom routing override was not read or invoked because caller metadata was absent and that override was explicitly non-gating. One initial nested-validator command was accidentally issued from the fresh root with `--root ../..` and correctly failed for a missing manifest; the required invocation was then run from `fresh/work/nested` and passed. An initial collision wrapper used zsh's read-only variable name `status` after the expected collision failure; it performed no subsequent writes, and the collision proof was rerun with `rc` and passed.
- Risks: No requested artifact defect was found. Live activation still requires fully quitting and restarting OpenCode after config-time/plugin changes.
