---
name: delegation-orchestrator
description: Use when an explicit orchestration specification requires bounded delegation across the four OpenCode harness roles with independent validation.
---

# Delegation Orchestrator

This skill is the sole authoritative harness delegation protocol. When this skill or `/delegate-orchestration` is invoked, the parent performs delegation and evidence synthesis only: it does not research, plan, edit, integrate, review, artifact-check, or validate directly.

## Input Gate

1. Require one complete explicit JSON orchestration specification conforming to `.opencode/schemas/orchestration-input.schema.json`.
2. Require explicit goal, deliverables, non-goals, scoped work units, allowed paths, acceptance gates, role/task-mode mapping, DAG dependencies and parallelization decision, loop and agent budgets, scope-expansion policy, live/Git authorization, and routing metadata status.
3. Reject or clarify missing, ambiguous, unknown, or contradictory fields. Never infer an orchestration ID, authorization, scope, mode, budget, route, path, gate, or default work unit.
4. Preserve caller routing labels and values exactly when `routingMetadataStatus` is `present`: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`. When status is `absent`, do not invent values.

## Four Roles and Task Modes

Only these active role/mode pairs may be dispatched:

- `researcher`: `research`
- `planner`: `plan`, `synthesis`
- `implementer`: `implementation`, `integration`
- `validator`: `validation`, `review`, `artifact-proof`, `integration-check`

Every leaf packet must name exactly one `taskMode`, one work-unit ID/scope key, and one bounded deliverable. Former specialties are modes, never role aliases. All leaf agents act only on supplied packets, deny Task delegation, and cannot load this skill.

## Execution Protocol

1. Validate the complete input before creating `.memory/orchestrations/<orchestrationId>/INDEX.md` or dispatching work.
2. Build the declared DAG. Research precedes dependent planning; planning precedes implementation; independent validator evidence precedes acceptance. Planner `synthesis` may resolve supplied pre-implementation conflicts. Implementer `integration` applies assigned stitching fixes. Validator `integration-check` independently checks them.
3. Default local-model execution is serial with no intra-node parallelism. Parallel dispatch requires explicit input authorization or recorded evidence of distinct capacity; otherwise serialize even independent DAG nodes.
4. Resolve routing before each dispatch using the runtime resolver and include the decision as packet context only when the role contract permits it. Routing remains subject to the documented provider boundary.
5. Use one fresh child thread per scoped task. The exact Task envelope and clarification grammar are normative in `.memory/protocols/memory-management.md`. Fresh tasks omit `task_id`; the only reuse is an authorized matching clarification response.
6. Require each packet to match `.opencode/contracts/role-io-contracts.json` exactly, including explicit `taskMode`, `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, and `routingMetadataStatus`.
7. Default to one remediation cycle per scoped work unit. Each remediation is a fresh task charged to that work unit's declared loop budget. When exhausted, stop and report the blocker or follow the explicit scope-expansion policy; do not create an endless loop.
8. Enforce the declared total and per-role agent budgets. Do not spawn extra agents to compensate for incomplete input or weak evidence.
9. Scope expansion requires the input's explicit policy and any required user approval. Live providers, user-global mutation, commit, amend, push, publication, or other Git mutation require matching explicit authorization.
10. Synthesize returned evidence only after checking packet outputs and trace links. Progress artifacts and lifecycle telemetry never independently block or prove acceptance.

## Findings and Acceptance

- A validator remains independent from implementation and may run adversarial `review`, reproducible `artifact-proof`, or `integration-check` modes before final `validation` acceptance.
- A finding blocks only when command-backed evidence ties it to the stated goal, an acceptance gate, or changed behavior. Unsupported preferences and trace/index progress alone do not block.
- Hooks and plugins are guardrails/telemetry, not acceptance evidence.
- Acceptance requires concrete validator evidence for every declared acceptance gate, honest skipped-check rationale, and a parent synthesis of outputs, limitations, and residual risks.

## Routing and Runtime Boundary

- In external mode use `OPENCODE_HARNESS_RUNTIME_ROOT` for immutable assets, `OPENCODE_HARNESS_WORKSPACE_ROOT` for workspace operations, and `OPENCODE_HARNESS_TRACE_ROOT` for generated memory. Otherwise use project-relative paths.
- The committed routing default is neutral. Local selections outside force mode are advisory. Native provider transport and credentials remain operator-owned OpenCode configuration.
- Force-local activation covers exactly the four active roles and must preflight all assignments atomically. Endpoint `maxInFlight` values are cooperative budgets, not semaphores or proof of capacity.
- Fully quit and restart OpenCode after config-time asset changes.

## References

- `references/role-routing-matrix.md`
- `references/validation-checklist.md`
- `references/trust-and-restart-guide.md`
- `references/llama-cpp-integration-guide.md`
