---
name: delegation-orchestrator
description: Coordinate OpenCode harness delegation, preserve caller routing metadata, and require validation evidence before acceptance.
---

# Delegation Orchestrator

Use this skill when OpenCode harness work spans research, planning, implementation, integration, validation, review, synthesis, or artifact verification.

## Non-Negotiable Constraints

- Parent orchestration is delegation-only.
- Do not perform role work directly in the parent thread.
- Use `/delegate-orchestration` for recursive parent orchestration across full workflows.
- Decompose workflows into a DAG of scoped work units and run independent role instances in parallel whenever dependencies allow.
- Treat role names as fixed but role instances as repeatable; use as many scoped instances as the DAG requires.
- Require research before planning and validation before acceptance for every workflow or sub-workflow.
- Limit remediation to 3 loops per scoped work unit before synthesizing blockers and asking the user.
- Preserve caller-supplied routing labels exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`.
- Do not invent routing metadata values when the original request does not include them.
- Require concrete validator evidence before accepting any delegated task as complete.
- Treat lifecycle hooks and plugins as guardrails and telemetry, not acceptance proof.
- Require an `orchestration-id`, `.memory/orchestrations/<orchestration-id>/` index, role I/O contract reference `.opencode/contracts/role-io-contracts.json`, trace schema reference `.opencode/schemas/memory-trace-artifact.schema.json`, and role trace artifact path `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` for every delegated role output.

## Required Flow

1. Classify the request into scoped work units and sub-workflows.
2. Build a DAG of dependencies, parallelizable branches, required role instances, and acceptance gates.
3. Resolve model routing for each role instance before delegation. Run `node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-<role>"}'` to get the deterministic decision. Include the resolved role/model/variant/source in delegation context. Outside force mode, local catalog choices are advisory rather than native agent assignments.
4. Delegate research before planning, then delegate each remaining category to the matching OpenCode subagent instance.
5. Pass full context, constraints, allowed paths, artifact expectations, verification commands, orchestration memory paths, role I/O contracts, trace schema, resolved model metadata, and caller-supplied routing metadata.
6. Inspect returned evidence for completeness.
7. Request remediation from the responsible role instance when evidence is incomplete, up to the loop limit.
8. Consolidate only after required validation evidence is present.

## Local Model Routing Boundary

- The committed routing example is neutral: local routing and force mode are disabled, so it makes no local-model selection or native agent mutation.
- The explicit enabled-local example is an operator starting point only. Implicit loading still selects a present custom file first, otherwise the neutral example, never merges files, and fails closed when a present custom file is unreadable, malformed, or invalid.
- Outside force mode, enabled local catalog choices are advisory. Provider ids, model aliases, endpoints, and capacities are illustrative, not installed-model claims.
- Native OpenCode provider transport remains in approved external merged config. Harness policy never creates providers, baseURLs, credentials, or model maps and must not be copied into `opencode.json`.
- When deliberately enabled, force mode statically configures exactly the eight fixed harness subagents during startup. Complete native coherence is checked atomically; any missing or mismatched agent/provider/model/baseURL rejects startup without partial mutation or cloud fallback.
- Endpoint `maxInFlight` values are cooperative dispatch budgets grouped by canonical URL, not enforced runtime semaphores. Measure backend slots before raising them.
- Lifecycle hooks are telemetry/guardrails only. The pure resolver performs no network calls, and resolver output does not prove endpoint health, model identity, tool use, or capacity.
- `OPENCODE_CONFIG` is merged before project config and is not a final override. `OPENCODE_CONFIG_CONTENT` is later, but secrets must remain outside committed or inline configuration. Quit and restart OpenCode after config or plugin changes.

## Role Routing Quick Map

- Research facts and compatibility evidence -> `researcher`.
- Task sequencing and file contracts -> `planner`.
- File creation or modification -> `implementer`.
- Cross-artifact consistency -> `integrator`.
- Acceptance checks -> `validator`.
- Defect-focused review -> `reviewer`.
- Conflict resolution -> `synthesizer`.
- Generated artifact proof -> `artifact-verifier`.

## References

- `references/role-routing-matrix.md`
- `references/validation-checklist.md`
- `references/trust-and-restart-guide.md`
