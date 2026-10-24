# Harness Memory Management Protocol

## Purpose

`.memory` is the project-owned memory surface for OpenCode harness orchestration. It records reusable references, orchestration indexes, delegation packets, role trace artifacts, validation evidence, synthesis outputs, and final decisions. It is not an official OpenCode native protocol and must not be treated as an external service or runtime dependency beyond project instructions.

## Memory Levels

Use these levels consistently:

- Project memory: stable protocols, references, schemas, and templates under `.memory/INDEX.md`, `.memory/protocols/`, `.memory/references/`, and `.memory/templates/`.
- Orchestration memory: one directory per orchestration under `.memory/orchestrations/<orchestration-id>/`.
- Delegation memory: delegated packet summaries under `.memory/orchestrations/<orchestration-id>/delegation-packets/`.
- Role memory: trace artifacts under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Validation memory: command evidence, parse results, and acceptance matrices under `.memory/orchestrations/<orchestration-id>/validation/`.
- Decision memory: synthesis conclusions and final accepted decisions under `.memory/orchestrations/<orchestration-id>/decisions/`.

## Orchestration ID

Every delegated task should receive an `orchestration-id`. Prefer a stable, date-prefixed slug such as `2026-07-05-opencode-memory-contracts`. Do not invent caller routing metadata when it was absent; record `routingMetadataStatus: absent` instead.

## Recursive Role Instances

Use one orchestration ID for the overall workflow unless a sub-workflow is explicitly independent. Within that orchestration, create as many scoped role instances as required by the dependency graph.

Use a DAG for sub-workflow dependencies. Local-model execution is serial with no intra-node parallelism by default. Parallel execution requires explicit authorization or recorded distinct-capacity evidence. Research precedes dependent planning, and independent validator evidence precedes acceptance.

Role names are fixed, but role instances are repeatable. Use scoped artifact IDs:

`<scope>-<role>-<sequence>-<slug>`

Examples:

- `root-researcher-001-docs`
- `api-planner-002-contracts`
- `ui-implementer-003-form-state`
- `root-validator-004-final`

Use one remediation cycle per scoped work unit by default and never exceed the normalized orchestration specification's loop budget. After exhaustion, stop and report the blocker or follow the explicit scope-expansion policy.

## Delegated Task and Child Thread Policy

Managed orchestration has a strict 1:1 boundary: one separately scoped delegated task uses one fresh child session/thread. Every new role task has a nonempty `delegationTaskId` and stable `scopeKey`; its Task call uses `dispatchKind: fresh` and omits the `task_id` property entirely. `/delegate-orchestration` is the managed dispatch surface. Direct `@subagent` dispatch is prohibited, and the lifecycle guard rejects the direct subagent-targeted `/delegate-*` role commands because neither surface is proven to traverse the Task guard.

For blocking execution, the only permissible `task_id` reuse is `dispatchKind: clarification-response`: an in-progress child must first return the version-1 machine-readable `clarification-request` envelope for its exact unresolved task, including the matching `delegationTaskId`, a fresh request nonce, and its concise question. The parent may answer once in that same child thread with the matching version-1 `clarification-response` envelope. The response contains only the answer and necessary context; role, scope, goal, allowed paths, deliverable, and acceptance criteria remain unchanged. Authorization is consumed before execution. Another answer requires another child request, and process restart loses authorization and denies reuse.

| Parent intent | `task_id` rule |
| --- | --- |
| New task or deliverable, changed scope, role reassignment, follow-up, retry, remediation, post-result correction, or completed/failed/cancelled work | Start a fresh child task and omit `task_id`. |
| One answer to a recorded child-originated clarification while the exact task is unresolved | Reuse that child's `task_id` once with the matching clarification response. |
| Missing, malformed, stale, mismatched, replayed, or post-restart authorization | Deny reuse; do not fall back to fresh creation with a supplied `task_id`. |

The policy envelope is the entire Task `prompt`: `<<<HARNESS_TASK_THREAD_POLICY_V1>>>`, newline, one compact JSON object, newline, `<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>`. Fresh JSON has exactly `kind`, `version`, `role`, and `packet`. The `packet` has exactly the required fields plus any documented optional fields for that role's `inputContract` in `.opencode/contracts/role-io-contracts.json`; it therefore includes `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, explicit `taskMode`, `routingMetadataStatus`, and the complete role-specific context. Unknown packet fields, missing required fields, excessive nesting/count/size, and ambiguous generic free-text extensions are rejected.

A child clarification text is an exact envelope whose JSON has exactly `kind`, `version`, `delegationTaskId`, `requestNonce`, and `question`; a response replaces `question` with `answer`. The task-thread guard accepts a request only when that envelope is the sole text inside OpenCode's exact completed foreground `<task ...><task_result>...</task_result></task>` wrapper and the wrapper/metadata child IDs agree. Incidental, multiple, malformed, summarized, running/background, or mismatched wrappers fail closed as terminal results. For admitted background execution, the adapter first reconciles native terminal messages and then supplies this same completed-result contract; a running acknowledgement never authorizes clarification. The bounded context-update and cancellation exceptions below are handled by the managed adapter before the task-thread guard. The guard rejects every own `task_id` property on fresh dispatch, stores only bounded digests and sanitized identifiers (never full packets, prompts, answers, outputs, nonces, or paths), evicts terminal child state, denies reused nonces, caps clarification turns, and rejects new work when bounded process-local ledgers are full.

Each remediation remains charged to the original scoped work unit's declared loop budget, but each remediation receives a new `delegationTaskId`, artifact ID, and fresh child thread linked to its predecessor.

## Required Indexing

Every orchestration directory must include `INDEX.md` using `.memory/templates/orchestration-index.md`. The index should link to each retained delegated task, role trace artifact, delegation packet, validation artifact, decision artifact, DAG node, and sub-workflow. For the active orchestration, keep a bounded current goal, status, and next safe action with links to the immutable specification, task packets, role/validator evidence, and `dispatch-started.json`; label unresolved or unknown state explicitly. This coordination pointer is not acceptance evidence or a child-state checkpoint.

Every role output must include or reference a trace artifact matching `.memory/templates/role-trace-artifact.md` and the contract catalog in `.opencode/contracts/role-io-contracts.json`.

## Role Trace Path

Use this path convention:

`.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`

In external-runtime mode, `.memory` above means the absolute directory in
`OPENCODE_HARNESS_TRACE_ROOT`; runtime contracts and schemas are beneath
`OPENCODE_HARNESS_RUNTIME_ROOT`, and workspace operations are rooted at
`OPENCODE_HARNESS_WORKSPACE_ROOT`. Record `workspaceRoot` and `traceRoot` in
trace input context when supplied. When these variables are absent, retain the
project-relative portable paths in this protocol.

The launcher seeds this protocol, `INDEX.md`, and both templates into a fresh
external trace root with owner-only modes and never overwrites a mismatch.
Those seeded files are compatibility copies. External roles read the immutable
protocol source at `OPENCODE_HARNESS_RUNTIME_ROOT/bootstrap/memory/protocols/memory-management.md`
and write generated orchestration artifacts beneath `OPENCODE_HARNESS_TRACE_ROOT`.

`<role>` must be one of: `researcher`, `planner`, `implementer`, or `validator`. New dispatch must use an allowed mode: researcher `research`; planner `plan` or `synthesis`; implementer `implementation` or `integration`; validator `validation`, `review`, `artifact-proof`, or `integration-check`. Historical trace paths using retired roles remain history, not valid new dispatch identities.

## Content Rules

- Keep artifacts concise and evidence-oriented.
- Preserve caller-supplied routing labels exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`.
- When routing labels are absent, state that they were absent and do not add placeholder values.
- Do not store provider tokens, secrets, user auth paths, or machine-local private paths.
- Treat hooks, plugins, and progress artifacts as guardrails or coordination evidence only. Acceptance evidence must come from independent validator work.
- A blocking finding requires command-backed evidence tied to the goal, an acceptance gate, or changed behavior.
- References to prior projections are allowed only as reference-material notes, never as runtime dependencies.

## Handoff Expectations

Each role must report:

- `orchestration-id`
- role name
- input summary
- output summary
- artifact path
- commands/checks run, if any
- limitations and handoff notes

Independent validator evidence is required before orchestration acceptance.

## Progress and compaction recovery

- Keep a concise current-status and next-action pointer in the active orchestration `INDEX.md`; a project may supply its own progress pointer separately. Link the immutable specification, task packets, role traces and validator evidence. Markdown progress is neither acceptance proof nor authorization to reuse a Task thread.
- The `experimental.session.compacting` hook may point to the active `INDEX.md` in native compaction context. This bounded recovery pointer does not approve dispatch, resume child sessions, restore Task-thread authorization, persist tool reservations, or prove acceptance; it is not an exact runtime checkpoint.
- After compaction or restart, reread project instructions, this protocol and the authoritative delegation skill when applicable. Independently reconcile Git HEAD/index/worktree, relevant files and processes, the immutable spec and dispatch-started refusal marker, and role/validator outcomes before new dispatch. Mark unknowns as unknown. Interrupted, cancelled, timed-out, ambiguous or already-started work requires a fresh reviewed orchestration ID; never delete `dispatch-started.json` to enable replay.


## Enforced ephemeral dispatch (refinement)

Managed Task calls now require an immutable `orchestrations/<orchestrationId>/normalized-spec.json` beneath the trace root before the first dispatch. `scopeKey` is exactly the work-unit ID. The controller validates references, cycles, scope containment and declared role/mode order; the adapter executes serially, including read-only tasks. All attempts count against total/per-role and remediation budgets, including failed launches. Only one layer owns retries. The default deadline is five minutes; missing completion, cancellation, session interruption, or a late result quarantines the attempt and stops further work. Never resume a stopped run: use a fresh reviewed orchestration ID after independently reconciling workspace effects. The bounded orchestrator-only recovery tools below may release the stopped adapter for a NEW run in the same OpenCode process only after authoritative native termination and scope proof; they never restore Task authorization. Markdown traces and the temporary OpenCode database are not recovery checkpoints.

All substantive packet fields are nonempty strings or bounded nonempty lists according to the typed role contract. Null values and arbitrary nested JSON are rejected. Leaves return one JSON object (inside the native Task result wrapper), with `version: 1`, exact `orchestrationId`, `delegationTaskId`, `scopeKey`, `role`, `taskMode`, `outcome`, `summary`, `evidence`, and `artifacts`. Outcomes are `success`, `blocked`, `failed`, or `clarification`. Success additionally requires `outputContract` with the role's existing required output fields, at least one evidence item, and at least one artifact. Blocked/failed require a nonempty `reason`; clarification requires `requestNonce` and `question`. Existing exact clarification-request/response policy envelopes remain supported, with consumed nonce and deadline checks. Never treat unstructured prose or missing proof as success.

Evidence/artifact items contain `reference`, optionally `sha256`, `command`, and `exitCode`; no extra keys. The managed adapter computes and seals artifact digests (rejecting any supplied mismatch) and limits artifact references to `orchestrations/<id>/roles/<role>/<file>.md` relative to the trace root. `outputContract.traceArtifactPath` must name an artifact reference. Artifact proof digest is SHA-256 of the UTF-8 string `relativePath + NUL + decimalStatMode + NUL + SHA256(fileBytes)`, matching `captureArtifacts`; it binds bytes, relative path and mode rather than merely content. Use immutable artifact names. Report blockers honestly if proof cannot be produced.

The parent writes the spec before dispatch, then cannot edit or run tools concurrently with a child. A native child-created event must bind the child session to the current parent; absent/ambiguous binding fails closed. Leaves may use read/grep/glob/list. Only implementers may edit/write assigned workspace paths; all roles may edit/write their exact Markdown trace directory. Patch, nested Task, arbitrary plugins and unknown mutation surfaces are disabled during managed execution. These tool checks and post-diff allowlists are not shell isolation.

Managed shell commands require exact declared verification commands and the already-installed trusted `/usr/bin/bwrap`. They run with read-only host/workspace mounts, isolated networking, and private temporary storage. There is no unrestricted fallback. Commands that need to write the workspace, workspaces beneath `/tmp`, unsupported platforms or unavailable user namespaces are unsupported in this path. Run write-producing builds in separately authorized external verification; they cannot be passed off as managed gate evidence. This feature does not install or change isolation tools or host security settings. Read access and malicious same-UID races remain outside this boundary.

Before registering the immutable spec, select managed gate commands that can run with tracked or explicitly declared safe ignored inputs, read-only host/workspace mounts, isolated networking, and private `/tmp`. Known write-producing source/package gates (including full source validation and `npm pack`) are refused by the controller before reservation; this cannot prove arbitrary shell commands are read-only. The source validator invokes `npm pack`: undeclared ignored `.opencode/.gitignore` is masked and inaccessible, while declaring that file only advances to an npm-cache write on a read-only home directory. Use a separately authorized external verification run for full source, portable, build, runtime and package QA; record the exact tree and command exit results, but never count external output as managed gate proof. Managed gates still require independent validator exit-zero evidence on the exact tree.

When native Bash lacks exit metadata, `harness_verify` runs an exact assigned validator gate through the same read-only Bubblewrap wrapper and records its observed exit status and tree proof. When native `write`/`edit` is unavailable, `harness_trace` lets the bound role create an immutable Markdown artifact only in its own role directory. Neither is available to an unbound or terminal worker. Stdout alone never proves success.

For implementers without native `write`/`edit`, `harness_source_edit` creates an exact packet-assigned workspace target exclusively or replaces it only when complete prior UTF-8 contents match the current regular file. It uses the same scope guard and bounded content, rejects stale contents and symlinks, and cannot be used by readers or terminal workers. It does not grant workspace edits outside assigned paths or bypass validator evidence. Same-UID races remain outside this boundary.

For small edits to existing assigned files, `harness_source_replace` replaces one unique exact UTF-8 fragment with another, limited to 8 KiB per fragment and an 8 MiB regular source file. The bound implementer and packet target path are checked again through the same scope guard; missing, duplicate, stale, symlinked or unsafe paths fail. It does not authorize new files, whole-workspace patches or changes by readers. The original file is modified through its no-follow descriptor after identity checks; same-UID races remain outside this boundary.

### Orchestrator-triggered stopped-run recovery

When the process guard stops, only the exact recorded parent may call `harness_recovery_status` (no arguments). It reports a bounded reason, prior orchestration ID and next action. A `ready` result includes a current workspace tree hash and at most 32 changed relative file names; only then may that parent read/grep/glob/list to review effects while the guard remains closed. Read the retained prior `INDEX.md`, task outcome, refusal marker and reported effects; distinguish unknown state from completed work. No Task, source edit, shell write or validator acceptance is authorized during this review.

If status is blocked by uncertain termination, that same parent may call `harness_recovery_resolve` (no arguments). It can retry native abort for the exact bound background child after every native launch has been acknowledged, then recheck parent identity and idle status and mark the interrupted attempt cancelled. A previous failed abort does not permanently prevent a fresh attempt. A completed blocking Task may be reconciled by inspection. Concurrent termination, a missing child identity, or any pending native Task call is not settled by an idle observation: wait for its correlated callback and retry status/resolution if it arrives. Do not invent a callback, resume an old child, or release on an early abort; if the native boundary never yields proof, the stop remains closed.

To request same-process unblocking, the parent supplies the reviewed hash to `harness_recovery_release` as `expectedTreeHash`. Release is capped at four per plugin process and succeeds only after a native blocking Task returned a structured completed result AND its bound child is now idle with the expected parent, or a background child was aborted and its launch, idle status and parent identity were reconciled. The adapter rechecks every old immutable spec/refusal marker, in-scope workspace effects and the exact hash immediately before release. Old controller attempts remain interrupted, old child IDs stay unusable, clarification nonces and gates are not restored, and old IDs cannot pass fresh dispatch. The parent must then validate a new normalized spec and dispatch a NEW child under a NEW orchestration ID; independent validators re-establish acceptance on the new tree. The recovery tools cannot prove semantic goal correctness, so the parent must review the effect report and downstream evidence.

Missing/mismatched native child identity, unacknowledged launch, active or failed abort, busy session, out-of-scope edits, mutated spec/marker, unsafe inventory, changing tree or exhausted recovery capacity returns `blocked` and **does not clear the guard**. Reconcile outside the stopped plugin, fully restart OpenCode and begin a fresh reviewed ID. A late error/deletion event from a previous terminal child is ignored when it is unrelated to the current active task; a current child or parent failure still stops the guard. This is not durable restart recovery or authorization to replay uncertain side effects.

Validator acceptance requires independently observed command exit status zero for every assigned gate, the unchanged exact Git HEAD/index and working-tree hash, unchanged scope, and exact trace artifact hashes. Worker claims about commands are not observations. Missing native command exit metadata blocks acceptance. A later declared implementation stage may run after dependency gates pass. Reserving that writer invalidates prior gates and successful validator completions; rerun those validators on the new exact tree before dependent acceptance. Revalidation consumes agent attempts but not an extra remediation cycle. Accepted artifact hashes are retained and checked before subsequent dispatch until their gate is invalidated. Parallel writers and automatic merges are unsupported. Native provider activation and live quality benchmarks remain separate gates.

Optional context is supplied in trace-root `orchestrations/<id>/context-index.json` as `{"index":{"reference-id":{"path":"relative/workspace/file","sha256":"<content-sha256>"}},"tasks":{"delegation-task-id":["reference-id"]}}`. Only explicitly requested indexed references expand, with at most eight entries, 8 KiB per reference, and 32 KiB total, also subject to packet limits. No symlink or traversal expansion is permitted. Existing role packet fields carry the expanded evidence. Bytes are not tokens: absent normalized native usage remains unknown; only reported `inputTokens`, `outputTokens`, and `costUsd` measurements are recorded. No cost or model-quality improvement is claimed by offline fixture evaluation.

The first dispatch atomically creates `dispatch-started.json` in its orchestration trace directory. This immutable refusal marker prevents a different plugin process from reusing an already-started ID; it stores no approval or resumable task state. Retain it with the evidence. Never delete it to retry uncertain work.


Validation proof covers tracked and nonignored workspace files plus optional normalized-spec `validationInputs`: at most 64 explicit relative regular-file paths. Declare validation-relevant ignored files before dispatch; their bytes and mode are bound into every tree snapshot with identity checks during capture. Ordinary ignored node_modules, generated directories, and secrets do not block role dispatch or get hashed. For managed shell verification, ignored file paths are masked and ignored directories are replaced with empty private mounts; only declared nested files are exposed read-only. This makes undeclared ignored input unavailable to those commands, while read-only checks using the tracked tree and declared inputs remain usable. Commands requiring ignored dependency trees need separately authorized verification outside this managed path. Secret candidates, dependency-tree declarations, symlinks, and directory declarations are rejected. This is a bounded workspace-input guarantee, not hermetic execution: installed tools, environment, host files, and malicious same-UID races remain outside the proof. Do not claim acceptance for commands relying on unbound external inputs.

Full Task envelope and role correlation are preflighted without changing the policy ledger, attempts, budgets or acceptance evidence. The ledger is rechecked immediately before atomic controller reservation. Actual reserved launch failures still consume attempts.


## Optional background execution

Blocking delegation remains the default. The harness-owned environment variable `OPENCODE_HARNESS_DELEGATION` accepts a JSON object with exactly `mode` (`blocking`, `background`, or `auto`), `resources`, `providerResources`, `maxQueuedUpdates`, and `maxUpdateBytes`. Native background execution also requires `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` and working native session message/status/abort APIs. These are launch-time settings; restart after changes. `auto` falls back to blocking when background capacity/capabilities are unavailable; explicit background requests fail closed.

Example policy (replace provider IDs with actual configured providers):
```json
{"mode":"background","resources":{"gpu":{"maxConcurrentRequests":2,"orchestratorHeadroom":1}},"providerResources":{"my-provider":"gpu"},"maxQueuedUpdates":2,"maxUpdateBytes":4096}
```
Provider aliases sharing one backend must map to the same physical resource. Capacity declarations are operator evidence, not a global semaphore across native auxiliary requests, other processes, or clients. One managed worker is admitted at a time, including independent readers; writers remain serial. Actual acknowledgement model identity must match admission. Reserve headroom for the parent and auxiliary requests; a single-slot backend cannot support this mode with reserved headroom.

A native `state="running"` acknowledgement is a start, never task success. The reservation remains held until native child identity, idle state, completed messages and structured task evidence reconcile. The parent may converse and use question/todo tools while a worker runs, but cannot use workspace tools or dispatch conflicting work. Native queued followups wait for the current child turn; they do not interrupt live tokens. A long-lived OpenCode TUI or server is required; a one-shot CLI run may exit before its background child completes.

The sole additional thread-reuse exception is a bounded context update to the exact active background task. Send Task with the same role and `task_id`, using the existing envelope delimiters around JSON: `{"version":1,"kind":"queued-update","delegationTaskId":"existing-task","requestId":"unique-update","context":"bounded additional context"}`. It cannot change scope, role, contract or deliverable. Every update consumes total/per-role attempt budget; update IDs and call IDs cannot repeat. Prior command proof is invalidated and terminal acceptance waits for all acknowledged updates. This is distinct from the existing one-time child-originated clarification protocol. Changed tasks and remediation still use fresh threads.

Cancellation uses the same active task/role and `task_id` with envelope `{"version":1,"kind":"cancel","delegationTaskId":"existing-task","requestId":"unique-cancel"}`. The guard consumes this control operation and deliberately refuses a new native Task call. Capacity remains reserved until abort and idle identity checks reconcile. Failed abort remains uncertain; do not reuse the capacity. Deadlines cover clarification and queued updates without resetting. Repeated idle/status/chat events cannot consume the same clarification again; reconciliation waits for the authorized continuation acknowledgement. Managed interruption initiates native abort, coalesces concurrent cancellation requests, and retains capacity until termination is confirmed. An idle session observed before native launch is not termination proof: the adapter tracks every pending initial, clarification-continuation and queued-update call, keeps the reservation until all their launches are acknowledged, and then aborts again. An earlier completed turn never proves termination of a pending continuation. Cancellation/interruption never resumes its task: the parent may use verified fresh-only recovery above, otherwise restart OpenCode after effect reconciliation. No durable restart, automatic replay, or concurrent worktree merge is promised.
