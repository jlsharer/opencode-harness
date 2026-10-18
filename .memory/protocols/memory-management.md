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

The only permissible `task_id` reuse is `dispatchKind: clarification-response`: an in-progress child must first return the version-1 machine-readable `clarification-request` envelope for its exact unresolved task, including the matching `delegationTaskId`, a fresh request nonce, and its concise question. The parent may answer once in that same child thread with the matching version-1 `clarification-response` envelope. The response contains only the answer and necessary context; role, scope, goal, allowed paths, deliverable, and acceptance criteria remain unchanged. Authorization is consumed before execution. Another answer requires another child request, and process restart loses authorization and denies reuse.

| Parent intent | `task_id` rule |
| --- | --- |
| New task or deliverable, changed scope, role reassignment, follow-up, retry, remediation, post-result correction, or completed/failed/cancelled work | Start a fresh child task and omit `task_id`. |
| One answer to a recorded child-originated clarification while the exact task is unresolved | Reuse that child's `task_id` once with the matching clarification response. |
| Missing, malformed, stale, mismatched, replayed, or post-restart authorization | Deny reuse; do not fall back to fresh creation with a supplied `task_id`. |

The policy envelope is the entire Task `prompt`: `<<<HARNESS_TASK_THREAD_POLICY_V1>>>`, newline, one compact JSON object, newline, `<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>`. Fresh JSON has exactly `kind`, `version`, `role`, and `packet`. The `packet` has exactly the required fields plus any documented optional fields for that role's `inputContract` in `.opencode/contracts/role-io-contracts.json`; it therefore includes `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, explicit `taskMode`, `routingMetadataStatus`, and the complete role-specific context. Unknown packet fields, missing required fields, excessive nesting/count/size, and ambiguous generic free-text extensions are rejected.

A child clarification text is an exact envelope whose JSON has exactly `kind`, `version`, `delegationTaskId`, `requestNonce`, and `question`; a response replaces `question` with `answer`. The guard accepts a request only when that envelope is the sole text inside OpenCode's exact completed foreground `<task ...><task_result>...</task_result></task>` wrapper and the wrapper/metadata child IDs agree. Incidental, multiple, malformed, summarized, running/background, or mismatched wrappers fail closed as terminal results. The guard rejects every own `task_id` property on fresh dispatch, stores only bounded digests and sanitized identifiers (never full packets, prompts, answers, outputs, nonces, or paths), evicts terminal child state, denies reused nonces, caps clarification turns, and rejects new work when bounded process-local ledgers are full.

Each remediation remains charged to the original scoped work unit's declared loop budget, but each remediation receives a new `delegationTaskId`, artifact ID, and fresh child thread linked to its predecessor.

## Required Indexing

Every orchestration directory must include `INDEX.md` using `.memory/templates/orchestration-index.md`. The index should link to each retained delegated task, role trace artifact, delegation packet, validation artifact, decision artifact, DAG node, and sub-workflow.

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


## Enforced ephemeral dispatch (refinement)

Managed Task calls now require an immutable `orchestrations/<orchestrationId>/normalized-spec.json` beneath the trace root before the first dispatch. `scopeKey` is exactly the work-unit ID. The controller validates references, cycles, scope containment and declared role/mode order; the adapter executes serially, including read-only tasks. All attempts count against total/per-role and remediation budgets, including failed launches. Only one layer owns retries. The default deadline is five minutes; missing completion, cancellation, session interruption, or a late result quarantines the attempt and stops further work. Do not attempt to resume a stopped run: use a fresh reviewed orchestration ID after independently reconciling workspace effects. Markdown traces and the temporary OpenCode database are not recovery checkpoints.

All substantive packet fields are nonempty strings or bounded nonempty lists according to the typed role contract. Null values and arbitrary nested JSON are rejected. Leaves return one JSON object (inside the native Task result wrapper), with `version: 1`, exact `orchestrationId`, `delegationTaskId`, `scopeKey`, `role`, `taskMode`, `outcome`, `summary`, `evidence`, and `artifacts`. Outcomes are `success`, `blocked`, `failed`, or `clarification`. Success additionally requires `outputContract` with the role's existing required output fields, at least one evidence item, and at least one artifact. Blocked/failed require a nonempty `reason`; clarification requires `requestNonce` and `question`. Existing exact clarification-request/response policy envelopes remain supported, with consumed nonce and deadline checks. Never treat unstructured prose or missing proof as success.

Evidence/artifact items contain `reference`, optionally `sha256`, `command`, and `exitCode`; no extra keys. The managed adapter computes and seals artifact digests (rejecting any supplied mismatch) and limits artifact references to `orchestrations/<id>/roles/<role>/<file>.md` relative to the trace root. `outputContract.traceArtifactPath` must name an artifact reference. Artifact proof digest is SHA-256 of the UTF-8 string `relativePath + NUL + decimalStatMode + NUL + SHA256(fileBytes)`, matching `captureArtifacts`; it binds bytes, relative path and mode rather than merely content. Use immutable artifact names. Report blockers honestly if proof cannot be produced.

The parent writes the spec before dispatch, then cannot edit or run tools concurrently with a child. A native child-created event must bind the child session to the current parent; absent/ambiguous binding fails closed. Leaves may use read/grep/glob/list. Only implementers may edit/write assigned workspace paths; all roles may edit/write their exact Markdown trace directory. Patch, nested Task, arbitrary plugins and unknown tool surfaces are disabled during managed execution. These tool checks and post-diff allowlists are not shell isolation.

Managed shell commands require exact declared verification commands and the already-installed trusted `/usr/bin/bwrap`. They run with read-only host/workspace mounts, isolated networking, and private temporary storage. There is no unrestricted fallback. Commands that need to write the workspace, workspaces beneath `/tmp`, unsupported platforms or unavailable user namespaces are unsupported in this path. Run write-producing builds in separately authorized external verification; they cannot be passed off as managed gate evidence. This feature does not install or change isolation tools or host security settings. Read access and malicious same-UID races remain outside this boundary.

Validator acceptance requires independently observed command exit status zero for every assigned gate, the unchanged exact Git HEAD/index and working-tree hash, unchanged scope, and exact trace artifact hashes. Worker claims about commands are not observations. Missing native command exit metadata blocks acceptance. A later declared implementation stage may run after dependency gates pass. Reserving that writer invalidates prior gates and successful validator completions; rerun those validators on the new exact tree before dependent acceptance. Revalidation consumes agent attempts but not an extra remediation cycle. Accepted artifact hashes are retained and checked before subsequent dispatch until their gate is invalidated. Parallel writers and automatic merges are unsupported. Native provider activation and live quality benchmarks remain separate gates.

Optional context is supplied in trace-root `orchestrations/<id>/context-index.json` as `{"index":{"reference-id":{"path":"relative/workspace/file","sha256":"<content-sha256>"}},"tasks":{"delegation-task-id":["reference-id"]}}`. Only explicitly requested indexed references expand, with at most eight entries, 8 KiB per reference, and 32 KiB total, also subject to packet limits. No symlink or traversal expansion is permitted. Existing role packet fields carry the expanded evidence. Bytes are not tokens: absent normalized native usage remains unknown; only reported `inputTokens`, `outputTokens`, and `costUsd` measurements are recorded. No cost or model-quality improvement is claimed by offline fixture evaluation.

The first dispatch atomically creates `dispatch-started.json` in its orchestration trace directory. This immutable refusal marker prevents a different plugin process from reusing an already-started ID; it stores no approval or resumable task state. Retain it with the evidence. Never delete it to retry uncertain work.


Validation proof covers tracked and nonignored workspace files plus optional normalized-spec `validationInputs`: at most 64 explicit relative regular-file paths. Declare validation-relevant ignored files before dispatch; their bytes and mode are bound into every tree snapshot with identity checks during capture. Ordinary ignored node_modules, generated directories, and secrets do not block role dispatch or get hashed. For managed shell verification, ignored file paths are masked and ignored directories are replaced with empty private mounts; only declared nested files are exposed read-only. This makes undeclared ignored input unavailable to those commands, while read-only checks using the tracked tree and declared inputs remain usable. Commands requiring ignored dependency trees need separately authorized verification outside this managed path. Secret candidates, dependency-tree declarations, symlinks, and directory declarations are rejected. This is a bounded workspace-input guarantee, not hermetic execution: installed tools, environment, host files, and malicious same-UID races remain outside the proof. Do not claim acceptance for commands relying on unbound external inputs.

Full Task envelope and role correlation are preflighted without changing the policy ledger, attempts, budgets or acceptance evidence. The ledger is rechecked immediately before atomic controller reservation. Actual reserved launch failures still consume attempts.
