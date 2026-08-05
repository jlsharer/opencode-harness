# Neutral and Local Routing Implementation

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `implementer`
- artifactId: `routing-implementer-005-neutral`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved I2 plan, orchestration ID, five allowed routing/schema paths plus one new local fixture, required neutral and disabled-local semantics, routing safety preservation requirements, verification commands, trace path, and handoff requirements.
- Required context present: The approved plan specifies exact paths, schema and resolver behavior, preservation boundaries, routing acceptance cases, and executable checks. The ignored custom configuration and loader were explicitly excluded.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented.

## Work Performed

- Summary: Replaced the implicit committed example with a disabled empty/null neutral default; moved the prior enabled advisory catalog into a separately named explicit fixture; made nonempty catalog validation conditional on local routing being enabled; gated role-local selection and reverse metadata lookup on enabled state; and expanded routing tests for neutral, advisory, disabled dormant, schema, helper, CLI, plugin, force, atomic, and fail-closed behavior.
- Files read: Approved planner and routing researcher artifacts; memory protocol; implementer contract; trace schema; assigned routing/schema files; routing helper, resolver, loader, and plugin enforcement adapter.
- Files changed: `.opencode/routing/harness-model-routing.example.json`; `.opencode/routing/harness-model-routing.local.example.json`; `.opencode/routing/routing-policy.mjs`; `.opencode/routing/routing-policy.test.mjs`; `.opencode/schemas/harness-model-routing.schema.json`; this trace artifact.
- Commands:
  - `node --check .opencode/routing/routing-policy.mjs && node --check .opencode/routing/routing-policy.test.mjs` -> exit 0, no output.
  - `node --test .opencode/routing/routing-policy.test.mjs` -> 36/36 pass; expected unrelated module-type warning only.
  - Explicit neutral resolver probe -> exit 0; implementer target, null model and local metadata, `enforced:false`, `networkCalls:false`.
  - Explicit local resolver probe -> exit 0; advisory coder model/catalog/URL/budget, `enforced:false`, `networkCalls:false`.
  - Implicit resolver probe -> expected exit 1 on operator custom's dangling `defaultLocalModel`; no fallback or repair occurred.
  - `git diff --check` -> exit 0.
  - `git status --short` and assigned-path diff inspection -> assigned changes present; unrelated/concurrent I1 and orchestration files were left untouched.

## Output Contract

- Outputs: Six implementation/trace files changed or added. The neutral fixture preserves schema version, fixed roles, command ownership, null native models, and variants. The local fixture is valid but is not an implicit loader basename. Disabled coherent dormant catalogs remain valid but cannot produce local selection or catalog metadata. Enabled empty catalogs fail. Force-local validation, all-eight assignment, native-provider coherence, atomic mutation, custom-first selection, exact explicit paths, no merge, and fail-closed behavior remain covered and passing.
- Evidence: The routing suite passes all 36 tests, including prior loader and atomic negatives plus new neutral/helper/CLI/plugin and disabled-inert cases. Both required explicit resolver probes returned the planned outputs. The unchanged ignored custom still fails implicit preflight at its original semantic defect.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/implementer/routing-implementer-005-neutral.md`.

## Handoff

- Next role: `integrator`, followed by `reviewer` and command-backed `validator` evidence before acceptance.
- Limitations: No ignored custom configuration or loader was edited. Source-wide harness validation was not run because I2 is an intermediate parallel work unit and source manifest/validator reconciliation belongs to I5. No live provider, network, or OpenCode restart was exercised. Existing unrelated/concurrent working-tree changes were not modified.
- Risks: Integrator must ensure the new local fixture enters the portable and source manifests and that later validators use explicit fixtures rather than the broken operator custom. Fully quit and restart OpenCode after the integrated config-time changes; the current session retains loaded configuration.
