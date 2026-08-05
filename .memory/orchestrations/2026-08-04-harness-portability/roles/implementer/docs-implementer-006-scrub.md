# Portable Docs and Runtime Scrub

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `implementer`
- artifactId: `docs-implementer-006-scrub`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved I3 plan, exact five implementation paths, preservation requirements for guardrail/telemetry behavior and routing/restart safety, focused check requirements, and the required trace path.
- Required context present: Orchestration ID, approved plan, target paths, allowed edit scope, portable-boundary requirements, preservation requirements, verification expectations, and handoff requirements were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing values or labels were invented.

## Work Performed

- Summary: Scrubbed installed-profile guidance of destination-root and source/release-only requirements, redirected installed acceptance to the planned portable validator and manifest, reduced required memory to the portable seed set, removed the advertised deployment-specific reference, and narrowed lifecycle deletion protection to `.opencode` and `.memory` while retaining telemetry-only behavior and fail-closed routing/restart guidance.
- Files read: `.memory/orchestrations/2026-08-04-harness-portability/roles/planner/root-planner-003-portability-plan.md`; `.memory/protocols/memory-management.md`; `.memory/templates/role-trace-artifact.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; and all five assigned implementation files.
- Files changed: `.opencode/plugin-modules/harness-lifecycle.js`; `.opencode/workflows/validation-workflow.md`; `.opencode/skills/delegation-orchestrator/SKILL.md`; `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`; `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md`; and this trace artifact.
- Commands/checks: `node --check .opencode/plugin-modules/harness-lifecycle.js && git diff --check` exited 0; a focused module invocation confirmed `.opencode` and `.memory` deletion attempts are blocked while destination-owned root files are not blocked (exit 0 with Node's existing typeless-package warning); focused forbidden-reference searches returned no matches in the five assigned implementation files; positive searches found the portable manifest/validator, minimal-memory, telemetry/guardrail, fail-closed routing, and full-restart guidance. Two attempted `rg` searches exited 127 because `rg` is unavailable and were replaced by the dedicated search tool.

## Output Contract

- Outputs: Five bounded implementation edits plus this trace. Changed-files, rationale, boundary choices, checks, and limitations are recorded here for integration and validation.
- Evidence: The lifecycle module now names only `.opencode` and `.memory` in its destructive-deletion guard. Installed workflow/checklist guidance names `.opencode/portable.manifest.json`, the minimal four-file memory surface, and `node .opencode/scripts/validate-portable-harness.mjs --root .`. The skill no longer advertises the deployment-specific guide and documents neutral default, explicit local opt-in, custom-first/no-merge/fail-closed behavior. Restart guidance requires a full quit/restart and portable validation. Diff whitespace and JavaScript syntax checks passed.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/implementer/docs-implementer-006-scrub.md`.
- changedFiles: The five caller-approved implementation paths and this required role trace only.
- rationale: Make the portable profile independent of destination-owned roots and release-only checks without weakening delegation, routing, restart, or evidence boundaries.
- schemaOrBoundaryChoices: No schema was edited. Portable ownership is limited to managed `.opencode/` content and seeded/generated `.memory/` content; lifecycle hooks remain guardrails/telemetry and validator evidence remains authoritative.
- commandsRun: Focused JavaScript syntax, deletion-guard behavior, forbidden-reference, retained-safety, and diff-whitespace checks were run as listed above.
- handoffNotes: Integrator should keep the unadvertised deployment guide outside the portable manifest, confirm I4 supplies the referenced portable manifest/validator, and reconcile the concurrently landed I2 neutral and enabled-local routing artifacts with this wording.

## Handoff

- Next role: I4 implementer after I1/I2 dependencies, then integrator and validator per the approved DAG.
- Limitations: The planned portable manifest and portable validator did not yet exist, so installed-profile validation could not be executed. I2 routing files landed concurrently after the initial I3 inspection and were not independently validated in this work unit. Full harness acceptance was intentionally not performed. The unchanged unadvertised deployment guide still contains release-specific material and must remain outside the portable inventory.
- Risks: Until I4 lands, installed-manifest and validator references are forward references. OpenCode must be fully quit and restarted after these config-time/plugin changes; restart is not validation proof.
