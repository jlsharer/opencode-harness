# OpenCode Delegated Design-to-Implementation Workflow

Use this workflow with `.opencode/skills/delegation-orchestrator/SKILL.md` when work spans design interpretation, implementation, integration, validation, review, synthesis, or artifact proof.

Path contract: external-runtime mode reads harness assets beneath `OPENCODE_HARNESS_RUNTIME_ROOT`, operates on `OPENCODE_HARNESS_WORKSPACE_ROOT`, and writes `.memory` beneath `OPENCODE_HARNESS_TRACE_ROOT`. Portable mode uses the project-relative paths below.

Use `/delegate-orchestration` for parent orchestration across complete workflows. It is orchestrator-owned, omits command `agent` frontmatter, and coordinates repeatable role instances rather than routing to a single subagent.

## Boundaries

- Parent orchestration delegates role work and consolidates evidence.
- Parent orchestration decomposes work into a DAG of scoped work units and sub-workflows. Independent role instances should run in parallel whenever dependencies allow.
- Research is mandatory before planning for every workflow or sub-workflow so plans are grounded in accurate and sourced information.
- Planning is mandatory for non-trivial workflows and for any sub-workflow that changes scope, files, dependencies, or acceptance gates.
- Validation is mandatory before accepting any workflow or sub-workflow.
- Role names are fixed, but role instances are repeatable. Use as many `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier` instances as the DAG requires.
- Every role instance needs a unique scoped artifact ID, such as `root-researcher-001-docs` or `api-validator-003-regression`.
- File creation or modification goes to `implementer`.
- Cross-artifact consistency goes to `integrator`.
- Acceptance checks go to `validator`.
- Generated artifact proof goes to `artifact-verifier`.
- Each delegated packet includes an `orchestration-id`, memory root `.memory/orchestrations/<orchestration-id>/`, role contracts from `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and expected trace path `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Caller-supplied routing labels are preserved exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`.
- Missing routing metadata is not invented.
- Managed orchestration uses one separately scoped delegated task per fresh child session/thread. Each new task has `delegationTaskId`, `scopeKey`, and `dispatchKind: fresh`, and its Task call omits `task_id`.
- `/delegate-orchestration` is the managed dispatch surface. Direct `@subagent` is prohibited, and the lifecycle guard rejects direct subagent-targeted `/delegate-*` role commands.

## Task/Thread Decision Table

| Parent intent | `task_id` rule |
| --- | --- |
| New task or deliverable, changed scope, role reassignment, follow-up, retry, remediation, post-result correction, or completed/failed/cancelled work | Start a fresh child task and omit `task_id`. |
| One answer to a recorded child-originated clarification while the exact task is unresolved | Reuse that child's `task_id` once with `dispatchKind: clarification-response` and the matching version-1 response envelope. |
| Missing, malformed, stale, mismatched, replayed, or post-restart authorization | Deny reuse; do not fall back to fresh creation with a supplied `task_id`. |

The exact contract-complete envelope/role-packet grammar is in `.memory/protocols/memory-management.md`. Clarification authorization is consumed before execution and cannot change the task contract.

## Phase Gates

1. Design intake: extract constraints, target paths, non-goals, and acceptance gates.
2. Memory setup: choose or preserve the `orchestration-id`, create or update `.memory/orchestrations/<orchestration-id>/INDEX.md`, and record routing metadata status.
3. DAG planning: define scoped work units, dependencies, parallelizable branches, required role instances, and remediation limits.
4. Research: run one or more scoped `researcher` instances before planning decisions that depend on facts, docs, APIs, compatibility, or current behavior.
5. Planning: produce file contracts, sequencing, dependencies, verification commands, and one planner trace artifact per scoped plan.
6. Implementation: apply assigned edits only, report self-checks, and write or reference implementer trace artifacts.
7. Integration: confirm role names, command names, paths, manifests, workflows, contracts, schemas, and routing labels agree across each affected scope.
8. Validation: run file, parse, schema, routing, and command checks, then store or reference validation evidence for each accepted workflow or sub-workflow.
9. Remediation: create a fresh task/role instance, `delegationTaskId`, artifact ID, and child thread linked to the predecessor. Charge it to the original scoped work unit and use at most 3 loops before delegating blocker synthesis and asking the user for direction.
10. Artifact proof: capture temp-directory proof when generated artifacts require independent inspection.
11. Final consolidation: summarize validated changes, evidence, risks, trace artifacts, and handoff notes.

## Routing and Activation

- Resolve each role decision before delegation. With committed force-local activation false, local catalog resolution is advisory and does not write native agent models.
- Native provider transport is supplied through approved external merged OpenCode config, never harness keys in `opencode.json`. `OPENCODE_CONFIG` merges before project config and therefore is not a final override; later `OPENCODE_CONFIG_CONTENT` must not become a secret store.
- Deliberate force activation statically assigns exactly the eight fixed harness agents at startup only after atomic agent/provider/model/baseURL preflight. Incoherence fails startup without partial mutation or fallback. Quit and restart after configuration or plugin changes.
- Treat endpoint budgets as cooperative metadata grouped by canonical URL. Health is not proof of exact model identity, tool use, or measured capacity.

## Completion Standard

The workflow is complete only after concrete validation evidence is present. Lifecycle plugin output can be cited as a warning source but cannot replace validation.
