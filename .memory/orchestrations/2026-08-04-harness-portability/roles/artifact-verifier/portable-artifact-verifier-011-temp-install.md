# Portable Artifact Verifier Trace

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `artifact-verifier`
- artifactId: `portable-artifact-verifier-011-temp-install`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `artifactPaths` were the source portable manifest, bootstrap, installed validator, routing resolver and fixtures, and their generated foreign-repository trees. `expectedGeneratedTree` was 43 manifest-managed `.opencode` files plus exactly four base `.memory` seed files in a fresh target, with no source roots/history. `parseOrRenderChecks` were installed validation from root and nested cwd plus resolver JSON behavior. `tempDirectoryRequirements` required isolated foreign Git repositories under `/tmp`. `cleanupDecisionCriteria` required removal after evidence capture. The partial-memory target had to preserve pre-existing memory and history.
- Required context present: All artifact-verifier contract fields were supplied, including orchestration ID, expected tree, checks, cleanup criteria, and routing metadata status. The caller explicitly stated that the source implicit invalid custom routing override was not a gate.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing values were invented.

## Work Performed

- Summary: Created two isolated foreign Git repositories at `/tmp/opencode/harness-portability-av-QRHlfI/{fresh,partial-memory}`, bootstrapped the source portable profile into both, enumerated installed files, compared source/destination hashes, ran the installed validator from root and nested cwd, reran bootstrap for idempotence, exercised collision refusal and explicit managed overwrite, proved memory non-overwrite, exercised implicit neutral and explicit local routing resolution, then removed the entire temporary root and proved absence. No implementation file was edited.
- Files read: `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/routing/resolve-model-routing.mjs`; `.opencode/routing/routing-config-loader.mjs`; both committed routing examples; role contract; trace schema; memory protocol; orchestration index.
- Files changed: This trace artifact only. The attempted non-clobbering orchestration index update was not permitted by the role's edit boundary and was not applied.
- Commands/checks: `mktemp -d`; `git init`; source bootstrap into fresh and partial-memory targets; Python 3 tree/hash/content probes; installed portable validator from root, nested cwd, and partial-memory root; repeated bootstrap; collision and overwrite probes; installed routing resolver with implicit and explicit configs; final `rm -rf` and absence check. An initial `python` probe failed because only `python3` is installed; it made no changes and was immediately rerun successfully with `python3`.

## Pass/Fail Matrix

| Check | Result | Reproducible evidence |
| --- | --- | --- |
| Fresh foreign install | PASS | `created/updated=43, memory-created=4, unchanged=0, collisions=0` |
| Partial-memory install | PASS | `created/updated=43, memory-created=3, unchanged=1, collisions=0`; caller index retained |
| Exact fresh file profile | PASS | 47 installed files: 43 `.opencode` and four `.memory`; all 43 managed hashes matched source and all four fresh seeds matched source |
| Destination exclusions | PASS | `AGENTS.md`, `opencode-harness.design.md`, `opencode.json`, root `.gitignore`, and `.memory/orchestrations` all reported absent in fresh target |
| Installed validator, root cwd | PASS | `Portable OpenCode harness validation passed` |
| Installed validator, nested cwd | PASS | From `fresh/nested/deeper` with `--root ../..`: `Portable OpenCode harness validation passed` |
| Partial-memory validator | PASS | `Portable OpenCode harness validation passed` with retained caller memory/history |
| Idempotence | PASS | Second bootstrap: `created/updated=0, memory-created=0, unchanged=47`; before/after digest identical |
| Collision refusal | PASS | Exit 1: `managed collisions (1): .opencode/agents/researcher.md`; managed collision and memory hashes remained unchanged |
| Explicit managed overwrite | PASS | `--overwrite-managed`: `created/updated=1, memory-created=0, unchanged=46`; managed file restored byte-for-byte from source |
| Memory non-overwrite | PASS | `.memory/INDEX.md` retained `MEMORY MUST NEVER OVERWRITE` before and after explicit managed overwrite |
| Neutral implicit resolver | PASS | Implementer decision had `model: null`, `local.enforced: false`, null catalog/URL/concurrency, and `networkCalls: false` |
| Explicit valid local example resolver | PASS | Implementer resolved `llamacpp-coder/qwen2.5-coder-7b`, catalog `qwen-coder`, URL `http://127.0.0.1:8081/v1`, `maxInFlight: 1`, `networkCalls: false` |
| Cleanup | PASS | `/tmp/opencode/harness-portability-av-QRHlfI` reported `exists=false` after removal |

## Exact Tree and Count Evidence

Fresh target file tree, excluding the foreign repository's own `.git` internals and empty pre-existing `nested/deeper` test directories:

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

- Fresh exact counts: `files=47`, `opencode_files=43`, `memory_files=4`; 22 directories when including `.memory`, `.opencode` hierarchy, and the pre-created `nested/deeper` directories.
- Partial-memory exact counts: 49 files excluding `.git`: the same 43 `.opencode` files, four base `.memory` files, retained `.memory/orchestrations/1999-retained/evidence.md`, and foreign `README.md`.
- Partial retained content: `.memory/INDEX.md` = `CALLER INDEX RETAIN`; `.memory/orchestrations/1999-retained/evidence.md` = `CALLER HISTORY RETAIN`.

## Hash and Content Evidence

- All managed source/destination comparisons: `43/43`, mismatches `[]`.
- All fresh memory source/seed comparisons: `4/4`, mismatches `[]`.
- Ordered 47-entry content inventory SHA-256: `818dfa9ef905ead1828603fdf2ac1168a4d8b9a3b3c71a164bd6510ae4c2a35b`.
- Idempotence digest: before = after = `57dfbef66c6cff6e01729f0d9563539a130a1f9c13859c9a253a799f20583111`.
- Portable manifest: `8562c5a202f7a012769b22937914e04088d295e8321ecd34850e2d461c47fc1b`.
- Bootstrap: `a46c2679917c0ef30d711680594b4a776c5acb56c6cc30c2acb675c0df9f473c`.
- Installed validator: `4381ba9729317d909d8a3ff0795cb94089d205ecca66e539fade019123367055`.
- Neutral example: `f7d898cdc561a5cae4648ae745086d5b8cd5614a0599dfb04abcc64b0a65dd54`.
- Local example: `d5896277f04c25eead2ad4d4f484a8099f1d8b8e63a72f083fe1c038e1d6853b`.
- Four fresh memory hashes: `b1637bd5091c902974e424bba75f15add86ea880210e83f3b23dd47541637748`, `4e9eb33c3a0a916aab71cd7385f302758d566ada4055fc7356e9a6920e1395f8`, `d9236410e19db145a816410dad78aaf9bdb3843d30a6fd2c92287ed9b80ca0ed`, `53ac6a59c52e7443462deb144b4aa8be4d53841e4fb9a75f968c758272655ce5` in tree order.
- Partial caller index hash: `13539792a9f60f750470b6fe909c04e5ac7576ed7bce13c66de2e25e3391d595`; retained history hash: `d898880a3e9d0f664ae1c0e3515918066850df6cd782b8fb9258cf9b4505240c`.
- Collision hash stayed `f5ba91a9eb083b656cff2e8c947d9defd7a4f7df9b5cf0ee9247801f67af766b` through refusal. Memory marker stayed `71129e007b8b577c9d0c5b19317839f801191eca2d115f7702e3b837431233e7` through refusal and explicit managed overwrite.

## Output Contract

- Outputs: `tempPath` was `/tmp/opencode/harness-portability-av-QRHlfI`; `fileListing` and exact counts are above; `commandOutputsOrRenderEvidence` are the matrix, validator outputs, resolver fields, hashes, and retained content above; `cleanupDecision` was to delete after all evidence was captured; `limitations` are below; `traceArtifactPath` is this file.
- Evidence: Every acceptance row has command-backed evidence. The final cleanup command first listed the temporary root, removed it, asserted non-existence, and printed `CLEANUP path=/tmp/opencode/harness-portability-av-QRHlfI exists=false result=pass`.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/artifact-verifier/portable-artifact-verifier-011-temp-install.md`; `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`.

## Handoff

- Next role: Orchestrator, reviewer, and validator may use this as independent generated-tree evidence; final acceptance still requires the DAG's validator evidence.
- Limitations: No live provider, routing-service endpoint, network request, model execution, or OpenCode restart was exercised. Resolver verification proves deterministic decision content only. Foreign `.git` internal files were intentionally excluded from portable tree counts because they belong to the test repositories, not the generated artifact. The source implicit routing path was intentionally not invoked because its ignored custom override is invalid and the caller declared it non-gating; the installed foreign target had no custom override and selected its bundled neutral example. The initial `python` command was unavailable; all successful filesystem probes used `python3`.
- Risks: No artifact defect was found. Per-file atomicity was exercised indirectly, but concurrent race behavior and process interruption were not fault-injected.
