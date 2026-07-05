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
3. Delegate research before planning, then delegate each remaining category to the matching OpenCode subagent instance.
4. Pass full context, constraints, allowed paths, artifact expectations, verification commands, orchestration memory paths, role I/O contracts, trace schema, and caller-supplied routing metadata.
5. Inspect returned evidence for completeness.
6. Request remediation from the responsible role instance when evidence is incomplete, up to the loop limit.
7. Consolidate only after required validation evidence is present.

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
