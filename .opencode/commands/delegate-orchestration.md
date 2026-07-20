---
description: Coordinate recursive delegation across OpenCode harness roles
subtask: false
---

Use this command as the parent orchestrator for any workflow that needs delegated research, planning, implementation, integration, validation, review, synthesis, or artifact proof.

This command belongs to the orchestrator. It must not be routed to a fixed subagent role. OpenCode defaults commands without `agent` frontmatter to the current agent, so this command intentionally omits `agent` and coordinates subagent instances through the delegation protocol.

## Required Context

Collect or confirm:

- `orchestration-id`, or create a stable date-prefixed slug.
- User goal, scope boundaries, non-goals, acceptance criteria, allowed paths, and write permissions.
- Memory root `.memory/orchestrations/<orchestration-id>/`.
- Role contract catalog `.opencode/contracts/role-io-contracts.json`.
- Trace schema `.opencode/schemas/memory-trace-artifact.schema.json`.
- Delegation skill `.opencode/skills/delegation-orchestrator/SKILL.md`.
- Workflows `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.
- Any caller-supplied routing metadata.

Preserve these routing labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

If the caller did not provide enriched routing metadata, record `routingMetadataStatus: absent` and do not invent values.

## Clarifying Questions

Ask questions before delegation only when required context is missing or ambiguous. At minimum, clarify missing goal, scope, constraints, acceptance criteria, or write permissions. Otherwise proceed with decomposition.

## Recursive Delegation Protocol

1. Create or update `.memory/orchestrations/<orchestration-id>/INDEX.md`.
2. Decompose the workflow into a dependency graph of scoped work units and sub-workflows.
3. Use a DAG for dependencies. Run independent role instances in parallel whenever their inputs do not conflict.
4. Resolve model routing for each role before delegation. Run `node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-<role>"}'` and include the resolved decision in delegation context. With the committed force-local setting false, local catalog selections are advisory and are not native agent configuration. Lifecycle hooks provide telemetry only.
5. Require research before planning so plans are grounded in accurate and sourced information.
6. Require planning for non-trivial workflows and validation before acceptance.
7. Spawn as many role instances as the DAG requires. Role names stay fixed, but instances are repeatable:
   - `researcher`
   - `planner`
   - `implementer`
   - `integrator`
   - `validator`
   - `reviewer`
   - `synthesizer`
   - `artifact-verifier`
8. Give each role instance a unique scoped artifact ID, such as `root-researcher-001-docs`, `api-planner-002-contracts`, or `ui-validator-003-regression`.
9. Store or reference every role instance trace at `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
10. For each scoped work unit, use at most 3 remediation loops. After the third failed loop, delegate synthesis of the blocker and ask the user for direction.
11. Treat lifecycle hooks and plugins as guardrails and telemetry only. They cannot replace validator or artifact-verifier evidence.

## Local Routing Boundary

- Native provider transport is external merged OpenCode configuration. Do not add provider transport or harness policy to repository `opencode.json`.
- The committed routing catalog is illustrative and force-local activation is false. Provider ids, aliases, URLs, model identities, and capacities do not claim installed infrastructure.
- Force-local activation is a startup-time static assignment for exactly the eight harness subagents. It atomically checks every selected agent, provider, model, and baseURL before mutation and may deliberately fail startup on incoherence rather than fall back.
- Routing `maxInFlight` values are cooperative budgets grouped by canonical endpoint URL, not runtime semaphores.
- OpenCode loads config and plugin changes at startup; quit and restart after changes. `OPENCODE_CONFIG` merges before project config and is not a final override. `OPENCODE_CONFIG_CONTENT` is later, but must not be used to commit or expose secrets.

## Mandatory Role Gates

- `researcher`: required for every workflow before planning.
- `planner`: required for every non-trivial workflow and for every sub-workflow that changes scope, files, dependencies, or acceptance gates.
- `validator`: required before any orchestration or sub-workflow is accepted.

Conditional roles:

- `implementer`: only for file creation or modification.
- `integrator`: for cross-file, manifest, workflow, schema, routing, or generated artifact consistency.
- `reviewer`: for defect-focused review where regressions, security, or behavioral risk matter.
- `synthesizer`: for conflict resolution, tradeoff decisions, blocker summaries, or final consolidation inputs.
- `artifact-verifier`: for generated artifacts, temp-directory proof, render/parse checks, or externally inspectable outputs.

## Output Evidence

The orchestrator must produce or reference:

- DAG summary of work units and dependencies.
- Role instance table with role, scope, artifact ID, inputs, outputs, and status.
- Memory index updates.
- Validator evidence and skipped-check rationale if any check is skipped.
- Final synthesis of accepted outcomes, residual risks, and next steps.

Completion requires concrete validation evidence. Do not accept hook/plugin output as proof.
