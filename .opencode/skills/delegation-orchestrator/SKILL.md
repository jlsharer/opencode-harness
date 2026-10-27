---
name: delegation-orchestrator
description: Use when a natural-language request or prefilled specification requires bounded delegation across the four OpenCode harness roles with independent validation.
---

# Delegation Orchestrator

This skill is the sole authoritative harness delegation protocol. When this skill or `/delegate-orchestration` is invoked, the parent performs delegation and evidence synthesis only: it does not research, plan, edit, integrate, review, artifact-check, or validate directly. Explicit invocation, not an ordinary mention, triggers the parent to read this skill, the immutable `.memory/protocols/memory-management.md`, and `.opencode/contracts/role-io-contracts.json` before Task dispatch. In external mode read the protocol at `OPENCODE_HARNESS_RUNTIME_ROOT/bootstrap/memory/protocols/memory-management.md` and the contract beneath `OPENCODE_HARNESS_RUNTIME_ROOT`. Send typed bounded packets to leaves, never this parent skill; do not assume automatic skill loading.

Bounded **external operator actions** are separate from delegated work and never count as managed gates. The primary may use the exact download/install/recovery tools under their declared scope and native permission. For OpenCourt, use the read-only Win64 plan or existing-snapshot verification tools first; a new nonoverwriting build and a later nine-case run are separate approved actions. An old snapshot may be relaunched only under its exact launcher opt-in. These tools are unavailable to leaves and cannot prove PIE. The managed acceptance shell stays read-only; there is no general external shell escape.

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
5. Use one fresh child thread per scoped task. The exact Task envelope and clarification grammar are normative in `.memory/protocols/memory-management.md`. Fresh tasks omit `task_id`; reuse is limited to authorized matching clarification and the bounded active-background context updates below.
   On native V2, the exposed `subagent` tool is the managed Task route when the `opencode-harness.v2` plugin has activated its `execute.before` guard. Before the first dispatch, use the direct `harness_dispatch_status` tool or its read-only Code Mode alias `harness_dispatch_status_code` to check `status: ready`, `managedSubagent: true`, `nativeTool: subagent`, and all four roles. The Code Mode alias returns the same live plugin diagnostic, not a file inspection or shell probe; it grants no Task authorization. Do not infer activation merely from a visible `subagent` tool or a loaded skill; if neither status tool is callable or the result is not ready, fail closed. On V2, pass the exact policy envelope as the entire `prompt`, the role as `agent`, a bounded `description`, and omit `sessionID` for fresh calls. The V2 bridge maps native `sessionID` continuation to the policy's `task_id` only for authorized reuse.
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
- A factual status or handoff correction after completed validation may cite the validator's immutable trace and observed command exit directly. It does not reopen that completed task or claim the corrected documentation tree was independently accepted. Use a fresh scoped task only if new substantive work or a new acceptance claim needs validation.

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

The bound V2 native primary may use exact, separately approved external download and install actions during active managed work. Its shell commands also receive exact approval and write only to a private external directory, with networking isolated. External actions never count as managed acceptance evidence.

Before Task dispatch, write the normalized specification to the selected trace root's `orchestrations/<orchestrationId>/normalized-spec.json`. It is immutable after registration. Use the exact work-unit ID as `scopeKey`; order each work unit's role/mode mapping as intended execution order. Dependencies and assigned gates must be ready. The native adapter is serial, with a five-minute task deadline and no parallel writers. Follow the enforced ephemeral dispatch and structured-result protocol in the immutable memory-management source. Any interruption is non-resumable; do not retry uncertain side effects or restore clarification authorization.

If the process guard stops, any primary session may call read-only `harness_recovery_status` to request a bounded reason, native termination proof and current tree hash. If termination is uncertain, only the exact bound parent may call `harness_recovery_resolve` to retry aborting the exact launch-confirmed background child and checking its bound parent and idle state; then call status again. A pending/unacknowledged native launch must first yield its correlated Task callback; idle or an early abort alone cannot prove it will not launch later. Any primary session may use read/grep/glob/list for bounded workspace diagnosis while stopped; a `ready` status includes bounded effect proof. Reconcile the old refusal marker, role outcome and changed-file list; after review, supply that exact hash to `harness_recovery_release`. A successful release allows only a NEW spec and fresh Task threads under a NEW orchestration ID in the same process; no old work, authorization, gate or child thread resumes. When native launch or termination cannot be proven, retain the old stop and marker. Continue actions in the same OpenCode session with an authenticated primary recovery shell. Its only writable host bind is a persistent owner-only external directory; old workspace, trace and runtime are read-only, and networking is isolated. Prepare reviewed source work there. This shell cannot accept the old run or its managed gates, and a new managed Task still requires native termination and scope proof. Never delete the old marker or clear the guard by hand. The immutable memory-management protocol defines the complete recovery boundary.

In V2, request native permission for each bounded HTTPS download, inert SHA-pinned archive install, offline recovery build or stopped-run shell command unless a matching project-scoped `Allow always` policy already applies. Use `harness_external_artifact_download`, `harness_external_archive_install`, or `harness_external_recovery_build` for the dedicated actions. Each request still carries exact source/integrity/destination/write scope/script policy/limits as applicable; the saved policy covers only matching pinned inputs, write parent, script policy and limits. During an unresolved run these actions write only in the recovery directory and provide no managed acceptance evidence.

Give leaves the full structured JSON result shape and artifact-proof convention. Check exact tree-bound validator command evidence; unstructured outputs are failed tasks. Managed shell uses existing bubblewrap read-only isolation and has no unrestricted fallback. Unsupported write-producing verification is an explicit blocker, not an implicit permission to bypass the controller. Context expansion uses only an explicitly hashed index, and usage stays unknown unless native measurements exist.

Before freezing a specification, assign only reviewed read-only commands to managed acceptance gates: their inputs must be tracked or explicitly declared safe `validationInputs`, their dependencies must remain available after ignored-path masking, and all writes must fit private temporary storage. Do not assign full source/portable validators, `npm pack`, npm builds/tests, or other commands that need host caches or ignored dependency trees. The controller rejects known incompatible gate commands before the first dispatch; it cannot classify arbitrary scripts. Arrange required full source/runtime/package QA as a separately authorized external verification step with recorded exit codes and the exact tested tree; external output is never managed gate proof. A failed managed gate still blocks acceptance and requires a fresh reviewed workflow after exhausted remediation.


For OpenCourt Win64 native checks, the primary may request read-only `harness_win64_build_plan`, `harness_win64_snapshot_verify`, `harness_win64_cases_plan`, or `harness_win64_cases_verify`, then separately request approval for `harness_external_win64_build` or `harness_external_win64_cases`. The build creates one named nonoverwriting snapshot; the case action runs the fixed nine-case command only on a manifest-verified snapshot and reports every case separately. If its PowerShell caller returns before the native process, treat the result as pending and use read-only `harness_win64_cases_verify` on the existing log; do not repeat the occupied case action. Both actions remain outside managed acceptance. A successful process exit without nine individual successes is a failed case result. OpenCode's `Allow always` choice may save a project-scoped bounded policy for future matching external actions. Recheck the current plan, source, destination, limits and run state on every use; a changed policy asks again, and configured denials remain final.

## Optional background execution

Blocking delegation remains the default. The harness-owned environment variable `OPENCODE_HARNESS_DELEGATION` accepts a JSON object with exactly `mode` (`blocking`, `background`, or `auto`), `resources`, `providerResources`, `maxQueuedUpdates`, and `maxUpdateBytes`. Native background execution also requires `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` and working native session message/status/abort APIs. These are launch-time settings; restart after changes. `auto` falls back to blocking when background capacity/capabilities are unavailable; explicit background requests fail closed.

Example policy (replace provider IDs with actual configured providers):
```json
{"mode":"background","resources":{"gpu":{"maxConcurrentRequests":2,"orchestratorHeadroom":1}},"providerResources":{"my-provider":"gpu"},"maxQueuedUpdates":2,"maxUpdateBytes":4096}
```
Provider aliases sharing one backend must map to the same physical resource. Capacity declarations are operator evidence, not a global semaphore across native auxiliary requests, other processes, or clients. One managed worker is admitted at a time, including independent readers; writers remain serial. Actual acknowledgement model identity must match admission. Reserve headroom for the parent and auxiliary requests; a single-slot backend cannot support this mode with reserved headroom.

A native `state="running"` acknowledgement is a start, never task success. The reservation remains held until native child identity, idle state, completed messages and structured task evidence reconcile. The parent may converse and use question/todo tools while a worker runs, but cannot use workspace tools or dispatch conflicting work. Native queued followups wait for the current child turn; they do not interrupt live tokens. A long-lived OpenCode TUI or server is required; a one-shot CLI run may exit before its background child completes.

The sole additional thread-reuse exception is a bounded context update to the exact active background task. Send Task with the same role and `task_id`, using the existing envelope delimiters around JSON: `{"version":1,"kind":"queued-update","delegationTaskId":"existing-task","requestId":"unique-update","context":"bounded additional context"}`. It cannot change scope, role, contract or deliverable. Every update consumes total/per-role attempt budget; update IDs and call IDs cannot repeat. Prior command proof is invalidated and terminal acceptance waits for all acknowledged updates. This is distinct from the existing one-time child-originated clarification protocol. Changed tasks and remediation still use fresh threads.

Cancellation uses the same active task/role and `task_id` with envelope `{"version":1,"kind":"cancel","delegationTaskId":"existing-task","requestId":"unique-cancel"}`. The guard consumes this control operation and deliberately refuses a new native Task call. Capacity remains reserved until abort and idle identity checks reconcile. Failed abort remains uncertain; do not reuse the capacity. Deadlines cover clarification and queued updates without resetting. Repeated idle/status/chat events cannot consume the same clarification again; reconciliation waits for the authorized continuation acknowledgement. Managed interruption initiates native abort, coalesces concurrent cancellation requests, and retains capacity until termination is confirmed. An idle session observed before native launch is not termination proof: the adapter tracks every pending initial, clarification-continuation and queued-update call, keeps the reservation until all their launches are acknowledged, and then aborts again. An earlier completed turn never proves termination of a pending continuation. Cancellation/interruption never resumes its task; use verified fresh-only recovery above or restart OpenCode after reconciling effects. No durable restart, automatic replay, or concurrent worktree merge is promised.
