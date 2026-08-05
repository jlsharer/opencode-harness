# Source Release-QA Implementer Trace

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `implementer`
- artifactId: `source-implementer-008-release-qa`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved I5 plan; completed I1-I4 worktree changes; exact source manifest, source validator, source guidance, design, and trace paths; source-versus-portable boundaries; routing, seed, trace, inventory, and verification requirements.
- Required context present: Orchestration ID, approved plan, target paths, allowed edit scope, schema and preservation requirements, verification commands, source-history requirements, and handoff expectations were supplied.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing values were invented. The ignored invalid custom routing override was not used as acceptance input.

## Work Performed

- Summary: Reconciled the complete source/release manifest with all I1-I4 deliverables and previously omitted source-only command, workflow, and meta-skills. Updated source QA to assert exact source inventory with explicit generated/private exclusions, neutral and explicit local fixture behavior, canonical seed equality, trace contract/schema/template alignment, retained indexed source history, plugin behavior, and an explicit portable-validator pass. Updated source-only guidance and design to distinguish source/release ownership from the closed portable-core installation boundary.
- Files read: Approved planner artifact; role contract and trace schema; current source manifest/validator/docs; portable manifest, bootstrap validator, E2E test, routing fixtures, memory templates/seeds; completed I1-I4 traces and source inventory.
- Files changed: `.opencode/harness.manifest.json`; `.opencode/scripts/validate-harness.mjs`; `AGENTS.md`; `opencode-harness.design.md`; this trace artifact.
- Commands/checks: `node --check .opencode/scripts/validate-harness.mjs` passed; source validator passed; portable validator passed; portable E2E passed 6/6; routing policy tests passed 36/36; explicit neutral and local resolver probes passed; `git diff --check` passed; `git status --short` showed only the coordinated I1-I5 worktree and orchestration artifacts.

## Output Contract

- Outputs: `changedFiles` are the four assigned source/release files and this trace. `rationale`: source QA needs a complete superset inventory and repository-only checks, while portable installation must remain governed solely by the portable manifest and installed validator. `schemaOrBoundaryChoices`: source inventory excludes only private custom routing, generated package metadata/dependencies, and `.opencode/.gitignore`; source validation names committed neutral/local fixtures explicitly; canonical protocol/templates must equal portable seeds while the fresh-memory index may intentionally differ; current in-progress history need not be globally indexed until integration, but retained source history and its indexed orchestration roots remain required.
- Evidence: Source validation printed `OpenCode harness validation passed`; portable validation printed `Portable OpenCode harness validation passed`; E2E reported 6 tests passed with 0 failures; routing reported 36 tests passed with 0 failures. The neutral resolver returned implementer with null model/local metadata and no network calls; the explicit local fixture returned advisory `qwen-coder` metadata with enforcement/network calls false. Diff checking returned exit 0. Node emitted only the expected typeless-package ESM warning caused by intentionally excluded generated package metadata. No private custom routing file was read, edited, packaged, or selected.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/implementer/source-implementer-008-release-qa.md`; `.opencode/harness.manifest.json`; `.opencode/scripts/validate-harness.mjs`; `AGENTS.md`; `opencode-harness.design.md`.
- handoffNotes: Integrator should add this orchestration and all retained role artifacts to the appropriate indexes, compare source and portable manifests as superset/subset contracts, and confirm only planned paths changed. Validator should rerun source, portable, routing, E2E, explicit resolver, and diff gates. Fully quit and restart OpenCode because earlier I2-I3 routing/plugin changes remain loaded only at process startup.

## Handoff

- Next role: Integrator, then reviewer, validator, and artifact-verifier per the approved DAG.
- Limitations: This is implementer self-check evidence, not final acceptance. No live provider, routing service, network, or OpenCode restart was exercised. The ignored custom routing override remains operator-owned and invalid, so implicit source routing was deliberately not a success gate.
- Risks: Source and portable inventories can drift if future deliverables are added to only one manifest; exact source inventory and portable self-validation now fail that class of release defect. The integrator still owns orchestration index updates, and validator/artifact-verifier evidence remains required before acceptance.
