# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-04-fresh-subagent-threads`
- role: `reviewer`
- artifactId: `root-reviewer-005-enforcement-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Resolved routing decision: agent=`null`, model=`null`, variant=`null`, source=`unresolved`; local enforced=`false`.

## Input Contract

- Inputs received: Uncommitted diff; strict 1:1 task/thread intent; state-machine, hook, fail-closed, isolation, replay, clarification, terminal, privacy, bypass, remediation, and test review areas; required research/plan artifacts; exact reviewer trace path and handoff requirements.
- Required context present: Partially. The caller identified this as a new separately scoped fresh-session review and supplied the orchestration ID, role, behavior, risks, tests, and routing status, but did not supply operational `delegationTaskId`, `scopeKey`, or literal `dispatchKind` values. No values were invented.
- Routing metadata status: absent (`routingMetadataStatus: absent`).

## Work Performed

- Summary: Reviewed the complete uncommitted diff, canonical research and plan, implementation trace, lifecycle adapter, pure policy state machine, focused tests, contracts, and orchestration index. Compared clarification-result handling with the commit-pinned upstream Task output shape cited by research. Ran focused tests and whitespace validation; did not perform final acceptance validation.
- Files read: Uncommitted changed files; `.opencode/plugin-modules/task-thread-policy.js`; `.opencode/plugin-modules/task-thread-policy.test.mjs`; `.opencode/plugin-modules/harness-lifecycle.js`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; this orchestration's `INDEX.md` and researcher/planner/implementer traces; commit-pinned upstream OpenCode `packages/opencode/src/tool/task.ts`.
- Files changed: This reviewer trace artifact only. The orchestration index was not updated because reviewer edit permission allows only `roles/reviewer/*.md`.
- Commands: `node --test .opencode/plugin-modules/task-thread-policy.test.mjs` (9 pass); `git diff --check` (pass). These are review aids, not validator acceptance evidence.

## Output Contract

- Outputs: Five defect findings ordered by severity, test gaps, open questions, residual risk, concise change summary, and remediation/validator handoff.
- Evidence: Exact local line references and the commit-pinned upstream Task output behavior cited in the required research artifact.
- Artifact links: `.memory/orchestrations/2026-08-04-fresh-subagent-threads/roles/reviewer/root-reviewer-005-enforcement-review.md`

## Findings

### High — Clarification authorization cannot be established from real Task output

`afterTask` passes the complete hook `output` directly to `parseEnvelope` and requires that value to start and end with the policy delimiters (`.opencode/plugin-modules/task-thread-policy.js:28-42,162-170`). Current OpenCode wraps foreground child text in `<task ...><task_result>...</task_result></task>` before exposing it to `tool.execute.after`; this is the commit-pinned behavior cited by the research at `root-researcher-001-thread-reuse.md:36` and visible in upstream `task.ts`'s `renderOutput`/foreground return. Therefore even a child whose text is the exact clarification envelope is treated as an ordinary terminal result, and the sole permitted same-thread exception never becomes usable. The tests hide this integration defect by passing a raw envelope as `output` (`task-thread-policy.test.mjs:14-17,40`) and by making the lifecycle fixture return only `done` (`:95-104`).

### High — The exact fresh envelope is incompatible with the role input contracts and drops delegated context

The protocol says the envelope is the entire Task prompt and the parser rejects every field outside nine generic fresh fields (`.memory/protocols/memory-management.md:56`; `.opencode/plugin-modules/task-thread-policy.js:6-10,28-55`). But every role contract requires `orchestrationId`, `routingMetadataStatus`, and role-specific inputs such as researcher source/freshness/downstream needs or implementer plan/schema/verification requirements (`.opencode/contracts/role-io-contracts.json:8-11,38-41`). None can be represented as fields in a valid fresh prompt. Stuffing them into `goal` text does not supply the named contract and undermines deterministic packet checking. As implemented, strict enforcement makes contract-complete role dispatch impossible or forces lossy, unvalidated encoding.

### Medium — Direct subagent command dispatch remains an exposed enforcement bypass

The implementation acknowledges that subagent-targeted commands are unverified and prohibits them in prose, but all `delegate-*` role commands remain directly invocable with `agent:` frontmatter while their bodies claim they dispatch through Task (for example `.opencode/commands/delegate-implement.md:1-8`; the same pattern exists in the other role commands). A host-created subtask from command frontmatter is not proven to invoke the model-facing `tool.execute.before` hook, so neither envelope validation nor `task_id` omission is enforced on this advertised surface. Static phrase checks in the validators do not close the bypass. Either live evidence must establish hook traversal or these commands cannot be represented as guarded managed-dispatch entry points.

### Medium — Clarification request nonces are replayable after a later child turn

The protocol requires a fresh request nonce, but state stores only the current nonce and no consumed/seen nonce set (`task-thread-policy.js:151-166`). After one response is consumed, the same child can return another request using the old nonce; `afterTask` restores `awaiting-guidance`, and the same response tuple is accepted again (`:122-130,162-167`). The replay test uses a new `nonce-2` and never probes reuse of `nonce-1` (`task-thread-policy.test.mjs:34-42`). This violates the fresh-nonce/replay requirement even though concurrent reuse before the next child result is correctly blocked.

### Medium — Process-local ledgers have no memory bound or terminal eviction

`delegationTaskIds` and `tasksByChildId` retain every task for the lifetime of the plugin, including terminal tasks, and `callsByCallId` can remain populated if the host does not emit an after-hook after execution failure (`task-thread-policy.js:87-90,107-118,133-173`). No count, TTL, or terminal compaction exists despite the requested memory bounds. A long-lived process can grow without limit, while retaining parent/child/task/scope identifiers longer than needed. The focused tests contain no high-volume or cleanup assertion.

## Tests and Gaps

- Focused tests pass 9/9, but use a fabricated raw Task output instead of upstream's wrapped foreground output.
- Missing: wrapped foreground result, task error/cancellation where after-hook may not run, background Task result/promotion behavior, repeated old nonce after a later request, ledger eviction/bounds, and a live command-frontmatter traversal test.
- Missing: a contract-complete fresh packet test for each role, proving all required role inputs survive the exact-envelope grammar.
- `git diff --check` passes. Full source/portable validation was not rerun by this reviewer and remains validator-owned.

## Open Questions

- Is the policy intended to support background Task dispatch? Current running output becomes terminal immediately and later synthetic completion does not traverse this Task after-hook path.
- Will direct `/delegate-*` role commands be removed from managed dispatch, or can a restarted live host prove that they traverse the same guard?
- What bounded retention policy preserves duplicate-task/replay guarantees without retaining identifiers indefinitely?

## Residual Risk and Change Summary

- Residual risk: The default fresh path blocks unauthorized own `task_id` properties and isolates parent/child authorization in unit fixtures, but the only continuation path is broken against real host output, alternate dispatch remains unproven, old nonces can be replayed, and state is unbounded. Retry, remediation, correction, follow-up, changed scope/role/deliverable, and terminal continuation are rejected by envelope shape/unit state, but end-to-end fresh replacement is not yet proven.
- Change summary: The diff adds a process-local Task policy, lifecycle hook wiring, exact envelopes, documentation/contracts, manifests, validators, and focused tests for strict fresh dispatch plus one-shot clarification reuse.

## Handoff

- Next role: Fresh implementer remediation, followed by a fresh validator task.
- Limitations: Defect-focused static/code review only; no implementation rewrite, OpenCode restart, live Task dispatch, or final acceptance validation. Upstream source was consulted only to check the already cited hook/output contract.
- Risks: Real output framing, role-packet incompatibility, command bypass, nonce replay, and unbounded state are blockers or material risks.
- Remediation handoff: Parse and validate the child text within the documented Task result framing without accepting ambiguous extra content; reconcile exact envelopes with every role's required packet; close or prove direct-command traversal; track consumed nonces; and bound/evict ledger state while preserving fail-closed behavior. Validator should add real-shape fixtures and run the post-restart live matrix before acceptance.
