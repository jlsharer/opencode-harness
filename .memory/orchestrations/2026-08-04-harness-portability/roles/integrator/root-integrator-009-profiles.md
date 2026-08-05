# Portable and Source Profile Integration

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `integrator`
- artifactId: `root-integrator-009-profiles`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Completed I1-I5 artifacts and traces; approved plan; path, manifest, bootstrap, routing, memory, contract/template, documentation, role/command, test, index, and portability consistency requirements; approved integration edit scope.
- Required context present: `orchestrationId`, changed artifacts, expected path relationships, source and portable manifest expectations, workflow and command contracts, schema contracts, known routing and activation risks, required checks, and handoff requirements were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent, so no routing labels or values were invented. Routing preflight is unavailable because the ignored custom override is invalid.

## Work Performed

- Summary: Read the approved plan and every retained researcher, planner, and I1-I5 implementer trace; reconciled the portable inventory with bootstrap mappings and installed validation; compared source inventory coverage; checked routing fixtures/schema/policy/tests, memory seeds, trace contracts/templates, portable docs/runtime references, and fixed roles/commands; created the required orchestration index and linked it from project memory. No implementation correction beyond required index integration was needed.
- Files read: Approved plan and all eight predecessor traces; source and portable manifests; bootstrap, source validator, portable validator, and E2E scripts; routing fixtures, schema, policy, loader-adjacent tests, resolver, and plugin modules; memory seeds/canonical files; role contracts and trace schema/template; agents, commands, workflows, skill references, `AGENTS.md`, and the source design.
- Files changed: `.memory/orchestrations/2026-08-04-harness-portability/INDEX.md`; `.memory/INDEX.md`; this trace artifact.
- Commands/checks:
  - `node .opencode/scripts/validate-harness.mjs`
  - `node .opencode/scripts/validate-portable-harness.mjs --root .`
  - `node --test .opencode/routing/routing-policy.test.mjs`
  - `node --test .opencode/scripts/portable-harness.test.mjs`
  - Explicit neutral and enabled-local resolver probes.
  - Node manifest/source-inventory, portable subset, memory-seed mapping/equality, fixed role/command, and forbidden-reference consistency checks.
  - `git diff --check`, changed-path/status inspection, and ignored-custom exclusion check.

## Output Contract

- Outputs: Path consistency notes, manifest coverage notes, cross-file issue disposition, fixes applied, residual risks, command-backed integration evidence, and handoff notes.
- Evidence: Source QA printed `OpenCode harness validation passed`; installed-profile validation printed `Portable OpenCode harness validation passed`; routing tests passed 36/36; portable foreign-repository E2E tests passed 6/6. Explicit neutral resolution returned the fixed implementer target with null model/local metadata and no enforcement/network calls; explicit local resolution returned coherent advisory local metadata without enforcement/network calls. Manifest/reference/seed/role-command checks and diff whitespace checks passed.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/integrator/root-integrator-009-profiles.md`; `.memory/orchestrations/2026-08-04-harness-portability/INDEX.md`; `.memory/INDEX.md`.

### Path Consistency Notes

- The portable manifest's 43 managed `.opencode` paths are the paths consumed by bootstrap and checked by installed validation. Its four seed sources map one-to-one to the minimal `.memory` targets.
- Portable runtime references remain within managed `.opencode` assets and generic seeded/generated `.memory` paths. Installed validation does not require destination `AGENTS.md`, the source design, `opencode.json`, root `.gitignore`, source reference inventory, deployments, optional source workflows/meta-skills, or source orchestration history.
- The eight fixed roles and six delegated role command mappings agree across agents, commands, routing fixtures, contracts, schemas, policy, and both validators. `/delegate-orchestration` remains orchestrator-owned, omits `agent`, and sets `subtask: false`.

### Manifest Coverage Notes

- `.opencode/portable.manifest.json` matches the approved closed `portable-core` inventory, includes itself and all bootstrap/validation assets, excludes the ignored custom routing file and every source-only root/optional asset, and declares the four memory mappings.
- `.opencode/harness.manifest.json` covers the complete source/release inventory, including the portable profile artifacts and source-only command/workflow/meta-skills/deployment/reference assets. The source validator enforces exact inventory equality and explicitly excludes only generated/private `.opencode` state.
- Canonical protocol and template seeds match active source memory byte-for-byte; the fresh seed index intentionally contains no retained source history.

### Cross-File Issues

- No blocking I1-I5 inconsistency was found. Neutral routing, explicit local routing, conditional catalog semantics, disabled-local inertness, plugin no-op behavior, docs, schema, policy, and tests agree.
- The source/global orchestration index did not yet link this retained orchestration because predecessor role permissions reserved index ownership for integration. This was the only integration correction applied.
- The ignored custom routing override remains internally invalid. This is operator-owned state, was not read as acceptance input, and was not edited or packaged.

### Fixes Applied or Requested

- Added `.memory/orchestrations/2026-08-04-harness-portability/INDEX.md` from the required template structure, including full retained predecessor/integrator links and DAG/status.
- Added the orchestration index link to `.memory/INDEX.md`.
- No product/runtime/manifests correction was necessary. Reviewer, validator, and artifact-verifier work remains requested by the approved DAG; this integration evidence does not replace their acceptance evidence.

### Residual Risks

- Acceptance remains pending independent reviewer, validator, and artifact-verifier artifacts.
- No live OpenCode process restart, native provider, routing service, network call, endpoint health, model identity, tool-use, quality, concurrency, or GPU/VRAM behavior was exercised.
- Node emits the expected typeless-package ESM warning; generated package metadata remains intentionally outside both profiles.
- Whole-install transactionality is not claimed; bootstrap performs complete semantic preflight and per-file atomic writes. Destination VCS/backups remain the rollback boundary.
- The invalid ignored custom override continues to make implicit routing fail closed until the operator repairs or removes it. A full OpenCode quit/restart is required after config-time/plugin changes.

## Handoff

- Next role: `reviewer`, then `validator` and `artifact-verifier` before acceptance.
- Limitations: Integration checks are command-backed but are not independent acceptance evidence. No ignored custom routing content, external provider configuration, secrets, or live runtime was modified or validated.
- Risks: Future changes can drift source and portable inventories; retain exact source inventory checks, portable self-validation, explicit committed routing fixtures, and foreign-repository E2E coverage.
