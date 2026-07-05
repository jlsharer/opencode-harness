# 2026-07-05-opencode-memory-contracts

## Scope

- Request: establish `.memory` protocol, OpenCode references, role I/O contracts, trace artifacts, plugin adapter, and validation coverage.
- Allowed edit scope: `.memory/`, `.opencode/`, `AGENTS.md`, `opencode-harness.design.md`, and `opencode.json` native instruction wiring.
- Non-goals: no prior projection edits, no native OpenCode schema invention, no local plugin file paths in `opencode.json`.

## Routing Metadata

- routingMetadataStatus: absent
- No `### Delegation Parameters`, `**Provider Model**`, or `**Routing Config**` block was supplied in the original request.
- No values were invented for `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback`.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- OpenCode references: `.memory/references/opencode-refs.md`

## Role Trace Artifacts

- `researcher`: `roles/researcher/handoff-summary.md`
- `planner`: `roles/planner/handoff-summary.md`
- `synthesizer`: `roles/synthesizer/handoff-summary.md`
- `implementer`: `roles/implementer/handoff-summary.md`
- `implementer`: `roles/implementer/plugin-autoload-adjustment.md`
- `implementer`: `roles/implementer/delegate-orchestration-command.md`
- `integrator`: `roles/integrator/handoff-summary.md`

## Validation Evidence

- Implementer self-checks: `validation/implementer-self-checks.md`
- Integrator checks: `validation/integrator-checks.md`
- Plugin autoload adjustment checks: `validation/plugin-autoload-adjustment-checks.md`
- Delegate orchestration command checks: `validation/delegate-orchestration-command-checks.md`
- Validator evidence should add or update artifacts under `validation/` if this orchestration is continued by the validator role.

## Decisions

- `.memory` is project-owned memory, exposed through instructions.
- `.opencode/plugins/index.js` is the only auto-loaded local plugin file. Segmented hook modules live under `.opencode/plugin-modules/` and are imported by the adapter.
- `opencode.json` does not list local plugin file paths.
- `/delegate-orchestration` is orchestrator-owned, omits command `agent`, uses a DAG, requires research before planning, requires validation before acceptance, and supports repeatable scoped role instances.
- Hooks are guardrails and telemetry only; acceptance requires command-backed validation evidence.
