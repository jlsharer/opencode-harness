---
name: delegation-orchestrator
description: Use when a natural-language request or prefilled specification requires bounded delegation across the four OpenCode harness roles with independent validation.
---

# Delegation Orchestrator

This skill is the sole authoritative harness delegation protocol. When this skill or `/delegate-orchestration` is invoked, the parent performs delegation and evidence synthesis only: it does not research, plan, edit, integrate, review, artifact-check, or validate directly.

## Intake and Normalization

`.opencode/schemas/orchestration-input.schema.json` defines the parent's normalized internal execution specification. It is not a required user prompt format.

1. For `/delegate-orchestration`, take only the content between the exact `<<<ORCHESTRATION_REQUEST>>>` marker lines as the request. Accept ordinary language. Also accept a JSON object as an optional prefilled form, but never require JSON or expose schema completion as the user's task.
2. Extract the goal and every supplied constraint, deliverable, non-goal, path, success condition, authorization, and routing label. Preserve explicit user choices over derived values and surface contradictions for clarification.
3. Build an internal specification using the schema's `x-intake` provenance map:
   - User-sourced fields come from the request or focused follow-up answers.
   - Derived fields are conservative coordination structure inferred from the stated goal, supplied constraints, workspace instructions, and supplied evidence. Derivation is coordination, not substantive role work.
   - Generated fields are mechanical identifiers or safe policy defaults owned by the parent.
4. Generate `schemaVersion`, a date-prefixed slug `orchestrationId`, stable work-unit and gate IDs, role/mode mappings, DAG edges, and bounded budgets. Use serial execution and one remediation cycle per work unit unless explicit authorization permits otherwise.
5. Default privileged or expansive behavior safely without asking: `liveProviders`, `userGlobalMutation`, and every Git mutation are `false`; scope expansion is denied; parallelism is not authorized; and `routingMetadataStatus` is `absent` when the routing labels are not present. These defaults grant no capability and may be changed only by an explicit user statement.
6. Derive the smallest useful deliverables, non-goals, work units, allowed paths, and preliminary acceptance gates supported by the request. Do not invent product requirements or broaden edit scope. A request to determine, investigate, compare, or recommend normally creates research/planning deliverables, not implementation authorization.
7. Ask one concise grouped follow-up only when a required user decision remains genuinely ambiguous and no conservative interpretation can proceed. Ask in ordinary language about the decision, not schema field names. Do not ask users for IDs, role mappings, DAG syntax, budgets, routing status, boolean denial defaults, or a JSON rewrite.
8. Validate the assembled internal object against the schema before creating memory or dispatching. Repair generated or derived structural failures internally. Ask the user only when validation exposes missing or contradictory user-owned intent.
9. Preserve caller routing labels and values exactly when `routingMetadataStatus` is `present`: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`. When status is `absent`, do not invent routing values.

## Four Roles and Task Modes

Only these active role/mode pairs may be dispatched:

- `researcher`: `research`
- `planner`: `plan`, `synthesis`
- `implementer`: `implementation`, `integration`
- `validator`: `validation`, `review`, `artifact-proof`, `integration-check`

Every leaf packet must name exactly one `taskMode`, one work-unit ID/scope key, and one bounded deliverable. Former specialties are modes, never role aliases. All leaf agents act only on supplied packets, deny Task delegation, and cannot load this skill.

## Execution Protocol

1. Complete and validate the normalized internal specification before creating `.memory/orchestrations/<orchestrationId>/INDEX.md` or dispatching work.
2. Build the declared DAG. Research precedes dependent planning; planning precedes implementation; independent validator evidence precedes acceptance. Planner `synthesis` may resolve supplied pre-implementation conflicts. Include routine in-scope coherence fixes and verification in the initial implementation task. Schedule implementer `integration` only for a distinct cross-task stitching deliverable; it is not a mandatory stage. Implementer `integration` applies assigned stitching fixes. Validator `integration-check` independently checks them.
3. Default local-model execution is serial with no intra-node parallelism. Parallel dispatch requires explicit input authorization or recorded evidence of distinct capacity; otherwise serialize even independent DAG nodes.
4. Resolve routing before each dispatch using the runtime resolver and include the decision as packet context only when the role contract permits it. Routing remains subject to the documented provider boundary.
5. Use one fresh child thread per scoped task. The exact Task envelope and clarification grammar are normative in `.memory/protocols/memory-management.md`. Fresh tasks omit `task_id`; the only reuse is an authorized matching clarification response.
6. Require each packet to match `.opencode/contracts/role-io-contracts.json` exactly, including explicit `taskMode`, `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, and `routingMetadataStatus`.
7. Default to one remediation cycle per scoped work unit. Each remediation cycle uses fresh tasks and consumes one work-unit loop allowance; implementation and its revalidation share that cycle, while every agent call consumes an attempt. When exhausted, stop and report the blocker or follow the explicit scope-expansion policy; do not create an endless loop.
8. Enforce the declared total and per-role agent budgets. Do not spawn extra agents to compensate for unresolved intent or weak evidence.
9. Scope expansion requires the normalized specification's policy and any required user approval. Live providers, user-global mutation, commit, amend, push, publication, or other Git mutation require matching explicit authorization.
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


## Runtime enforcement and recovery

Before Task dispatch, write the normalized specification to the selected trace root's `orchestrations/<orchestrationId>/normalized-spec.json`. It is immutable after registration. Use the exact work-unit ID as `scopeKey`; order each work unit's role/mode mapping as intended execution order. Dependencies and assigned gates must be ready. The native adapter is serial, with a five-minute task deadline and no parallel writers. Follow the enforced ephemeral dispatch and structured-result protocol in the immutable memory-management source. Any interruption is non-resumable; do not retry uncertain side effects or restore clarification authorization.

Give leaves the full structured JSON result shape and artifact-proof convention. Check exact tree-bound validator command evidence; unstructured outputs are failed tasks. Managed shell uses existing bubblewrap read-only isolation and has no unrestricted fallback. Unsupported write-producing verification is an explicit blocker, not an implicit permission to bypass the controller. Context expansion uses only an explicitly hashed index, and usage stays unknown unless native measurements exist.
