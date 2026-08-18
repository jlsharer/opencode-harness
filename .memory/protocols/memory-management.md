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

Use a DAG for sub-workflow dependencies and run independent role instances in parallel whenever possible. Every workflow and sub-workflow must use `researcher` before `planner`, and research must precede planning. Every workflow and sub-workflow must use `validator` before acceptance.

Role names are fixed, but role instances are repeatable. Use scoped artifact IDs:

`<scope>-<role>-<sequence>-<slug>`

Examples:

- `root-researcher-001-docs`
- `api-planner-002-contracts`
- `ui-implementer-003-form-state`
- `root-validator-004-final`

Use at most 3 remediation loops per scoped work unit. After the third failed loop, write or request a `synthesizer` blocker artifact and ask the user for direction.

## Delegated Task and Child Thread Policy

Managed orchestration has a strict 1:1 boundary: one separately scoped delegated task uses one fresh child session/thread. Every new role task has a nonempty `delegationTaskId` and stable `scopeKey`; its Task call uses `dispatchKind: fresh` and omits the `task_id` property entirely. `/delegate-orchestration` is the managed dispatch surface. Direct `@subagent` dispatch is prohibited, and the lifecycle guard rejects the direct subagent-targeted `/delegate-*` role commands because neither surface is proven to traverse the Task guard.

The only permissible `task_id` reuse is `dispatchKind: clarification-response`: an in-progress child must first return the version-1 machine-readable `clarification-request` envelope for its exact unresolved task, including the matching `delegationTaskId`, a fresh request nonce, and its concise question. The parent may answer once in that same child thread with the matching version-1 `clarification-response` envelope. The response contains only the answer and necessary context; role, scope, goal, allowed paths, deliverable, and acceptance criteria remain unchanged. Authorization is consumed before execution. Another answer requires another child request, and process restart loses authorization and denies reuse.

| Parent intent | `task_id` rule |
| --- | --- |
| New task or deliverable, changed scope, role reassignment, follow-up, retry, remediation, post-result correction, or completed/failed/cancelled work | Start a fresh child task and omit `task_id`. |
| One answer to a recorded child-originated clarification while the exact task is unresolved | Reuse that child's `task_id` once with the matching clarification response. |
| Missing, malformed, stale, mismatched, replayed, or post-restart authorization | Deny reuse; do not fall back to fresh creation with a supplied `task_id`. |

The policy envelope is the entire Task `prompt`: `<<<HARNESS_TASK_THREAD_POLICY_V1>>>`, newline, one compact JSON object, newline, `<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>`. Fresh JSON has exactly `kind`, `version`, `role`, and `packet`. The `packet` has exactly the required fields plus any documented optional fields for that role's `inputContract` in `.opencode/contracts/role-io-contracts.json`; it therefore includes `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, `routingMetadataStatus`, and the complete role-specific context. Unknown packet fields, missing required fields, excessive nesting/count/size, and ambiguous generic free-text extensions are rejected.

A child clarification text is an exact envelope whose JSON has exactly `kind`, `version`, `delegationTaskId`, `requestNonce`, and `question`; a response replaces `question` with `answer`. The guard accepts a request only when that envelope is the sole text inside OpenCode's exact completed foreground `<task ...><task_result>...</task_result></task>` wrapper and the wrapper/metadata child IDs agree. Incidental, multiple, malformed, summarized, running/background, or mismatched wrappers fail closed as terminal results. The guard rejects every own `task_id` property on fresh dispatch, stores only bounded digests and sanitized identifiers (never full packets, prompts, answers, outputs, nonces, or paths), evicts terminal child state, denies reused nonces, caps clarification turns, and rejects new work when bounded process-local ledgers are full.

Each remediation remains charged to the original scoped work unit's maximum of 3 loops, but each remediation receives a new `delegationTaskId`, artifact ID, and fresh child thread linked to its predecessor.

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

`<role>` must be one of: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, or `artifact-verifier`.

## Content Rules

- Keep artifacts concise and evidence-oriented.
- Preserve caller-supplied routing labels exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`.
- When routing labels are absent, state that they were absent and do not add placeholder values.
- Do not store provider tokens, secrets, user auth paths, or machine-local private paths.
- Treat hooks and plugins as guardrails and telemetry only. Acceptance evidence must come from validator or artifact-verifier work.
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

Validator or artifact-verifier evidence is required before orchestration acceptance.
