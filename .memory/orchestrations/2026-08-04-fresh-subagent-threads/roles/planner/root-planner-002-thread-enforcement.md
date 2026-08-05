# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-04-fresh-subagent-threads`
- role: `planner`
- artifactId: `root-planner-002-thread-enforcement`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Resolved routing decision: agent=`null`, model=`null`, variant=`null`, source=`unresolved`; local enforced=`false`.

## Input Contract

- Inputs received: Approved strict one-delegated-task-to-one-child-thread goal; fresh-session and sole clarification-continuation rule; required research artifact; repository scope; production no-edit boundary; exact planner artifact path; required contracts/schemas; acceptance, manifest, bootstrap, test, Task-argument, and handoff requirements.
- Required context present: Yes. The goal, prohibitions, one allowed exception, research evidence, deliverable path, acceptance expectations, routing status, and resolved routing decision were supplied. Exact implementation paths are bounded below from repository evidence.
- Routing metadata status: absent (`routingMetadataStatus: absent`). No caller routing labels or values were invented.

## Work Performed

- Summary: Converted the required research into a bounded implementation plan. Inspected the role/trace contracts, canonical and bootstrap memory templates, parent delegation surfaces, lifecycle adapter, manifests, source and portable validators, portable bootstrap tests, and source guidance. Selected a fail-closed Task-hook policy with an isolated dependency-free state machine, a structured project-owned prompt/result envelope carried only in documented Task string arguments/output, explicit prohibition of unverified alternate child-dispatch surfaces, and no speculative legacy mode.
- Files read: `.memory/orchestrations/2026-08-04-fresh-subagent-threads/roles/researcher/root-researcher-001-thread-reuse.md`; `.memory/protocols/memory-management.md`; `.memory/templates/{role-trace-artifact,orchestration-index}.md`; `.opencode/bootstrap/memory/templates/orchestration-index.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.opencode/agents/planner.md`; `.opencode/commands/{delegate-orchestration,delegate-plan}.md`; `.opencode/skills/delegation-orchestrator/SKILL.md`; `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`; `.opencode/workflows/delegation-workflow.md`; `.opencode/plugin-modules/harness-lifecycle.js`; `.opencode/plugins/index.js`; `.opencode/{portable,harness}.manifest.json`; `.opencode/scripts/{validate-harness,validate-portable-harness,portable-harness.test}.mjs`; `AGENTS.md`; `opencode-harness.design.md`.
- Files changed: This planner trace artifact only.
- Commands: Loaded the `customize-opencode` skill and used repository Read/Glob/Grep inspection. No shell command, implementation test, or final validation was run.

## Output Contract

- Outputs: Ordered implementation plan, exact file contracts, policy state model, Task-hook argument behavior, dependency order, executable acceptance gates, risks, assumptions, limitations, and implementer handoff.
- Evidence: The plan is grounded in the required researcher trace, especially findings 1-6 and its recommended edit/test/profile surfaces. Repository inspection confirms the current two-parameter hook mismatch, sole plugin entry point, closed portable inventory, seed parity checks, exact bootstrap counts, and current validator gaps.
- Artifact links: `.memory/orchestrations/2026-08-04-fresh-subagent-threads/roles/planner/root-planner-002-thread-enforcement.md`; `.memory/orchestrations/2026-08-04-fresh-subagent-threads/roles/researcher/root-researcher-001-thread-reuse.md`.

## Approved Goal and Scope

Implement a strict managed-orchestration invariant: one separately scoped delegated task gets one fresh OpenCode child thread. A fresh dispatch must omit `task_id`. The only reuse is a child-originated guidance/clarification request while that exact task remains unresolved; the parent may answer once on that child thread. Every remediation, retry, post-result correction, follow-up, changed scope, new deliverable, role reassignment, or replay is a new task and must omit `task_id`.

The enforcement boundary is parent-orchestrated OpenCode `Task` tool execution. Managed orchestration must prohibit direct `@subagent` and subagent-targeted command dispatch until a live validator proves those surfaces traverse the same enforceable hook. This avoids claiming coverage that the research could not establish.

## Policy State and File Contracts

### 1. Pure state machine and prompt envelope

**Add `.opencode/plugin-modules/task-thread-policy.js`.** Keep it dependency-free and host-neutral. Export a factory used by the lifecycle adapter and focused test helpers. Do not create another file under `.opencode/plugins/`.

Use these process-local records:

- `callsByCallId`: pre-execution snapshot keyed by Task `callID`, containing parent `sessionID`, dispatch kind, immutable task contract, and continuation authorization consumed by that call.
- `tasksByChildId`: keyed by the child session ID returned as Task `task_id`/metadata, containing parent session, `delegationTaskId`, `scopeKey`, role, immutable contract digest, state, and current clarification request nonce.
- States: `fresh-in-flight` (pre-hook accepted, child ID unknown), `terminal` (ordinary result, failure, or consumed continuation without a new request), `awaiting-guidance` (child result contains a valid clarification request), and `continuation-in-flight` (the one authorization was atomically consumed). No state survives plugin restart; restart therefore denies all reuse.

Define a versioned project-owned envelope embedded in the documented Task `prompt` string rather than adding unsupported Task arguments:

- Fresh dispatch envelope: `kind=fresh`, `version=1`, nonempty `delegationTaskId`, `scopeKey`, role, goal, allowed paths, deliverable, and acceptance criteria. Canonicalize these immutable fields and hash/canonical-string them in memory; do not retain full prompts.
- Child result marker: a bounded, exact machine-readable clarification object containing `kind=clarification-request`, `version=1`, matching `delegationTaskId`, a fresh request nonce, and the concise question. It means the task remains unresolved; an ordinary result is terminal.
- Continuation envelope: `kind=clarification-response`, `version=1`, matching `delegationTaskId` and request nonce, and only the parent's answer/necessary context. Scope, role, deliverable, paths, goal, and acceptance criteria are inherited from the ledger and cannot be replaced in continuation arguments.

Reject malformed, duplicate, oversized, or extra-field envelopes. Bound IDs/question/answer lengths. Log only sanitized task/scope identifiers, state transitions, and reasons—never full prompts, answers, output, paths, or secrets. The exact delimiter/JSON grammar is a project protocol, not an invented OpenCode config field; document it once in the policy module and canonical memory protocol.

### 2. Task hook argument behavior

**Update `.opencode/plugin-modules/harness-lifecycle.js`.** Instantiate the pure policy once per plugin instance and wire current documented hooks:

- In `tool.execute.before(input, output)`, ignore non-`task` calls for thread policy. Read Task arguments only from `output.args`, never `input.args`.
- Test `Object.hasOwn(output.args, 'task_id')`, not truthiness. Any fresh envelope with the property present—even `null`, empty, or unknown—is rejected. This directly covers the upstream invalid-ID fall-through identified by research.
- A Task call without `task_id` is accepted only as a fresh dispatch with a valid fresh envelope; register its call record.
- A Task call with `task_id` is accepted only if it exactly matches an `awaiting-guidance` record for the same parent `input.sessionID`, child ID, task ID, role, and request nonce and has a valid clarification-response envelope. Consume authorization synchronously before execution. Wrong parent/child/role/task/nonce, replay, ordinary follow-up, changed contract, retry, remediation, post-result correction, or absent process state throws a clear fail-closed error.
- In `tool.execute.after(input, output)`, correlate by `callID`; read child ID from the documented Task metadata shape; ordinary fresh/continued output becomes `terminal`, while one valid child clarification marker transitions to `awaiting-guidance`. A later clarification may authorize one later answer only after the preceding continuation returns such a marker.
- Treat an after-hook error or uncorrelatable/missing child metadata as terminal/deny-reuse. Never restore a consumed authorization, so an execution retry is fresh as required.
- Correct the existing Bash guard to read `output.args.command`; change startup telemetry from stale `session.start` to `session.created`; remove unsupported `message.after`. These are necessary signature corrections in the same touched adapter, not a behavior expansion.

No change is planned for `.opencode/plugins/index.js`: it remains the sole auto-loaded adapter and already imports the lifecycle module.

### 3. Focused executable tests

**Add `.opencode/plugin-modules/task-thread-policy.test.mjs`.** Use `node:test` and `node:assert/strict`; no package or network dependency. Cover:

1. no `task_id` + valid fresh envelope allows and records; any own `task_id` on fresh rejects;
2. unauthorized, invalid, stale, post-restart, wrong-parent, wrong-child, wrong-role, wrong-task, wrong-nonce, and replayed reuse reject;
3. ordinary result closes the task; remediation, retry, correction, follow-up, new deliverable, scope/path/goal/criteria change, and role reassignment cannot authorize reuse;
4. valid child request permits exactly one matching response; atomic consumption blocks concurrent/replayed calls; another response requires another child request;
5. hook fixtures prove pre-hook reads `output.args`, after-hook reads Task metadata/output, and `session.created` is the startup event;
6. simultaneous children do not leak authorization across parent sessions or task IDs;
7. malformed/extra-field/oversized envelopes reject and telemetry contains no raw prompt/output/answer/path content.

The tests should call the exported pure policy and the lifecycle hook adapter. Do not treat hook logs as acceptance proof.

### 4. Canonical runtime policy and memory record

**Update these byte-parity pairs:**

- `.memory/protocols/memory-management.md`
- `.opencode/bootstrap/memory/protocols/memory-management.md`
- `.memory/templates/orchestration-index.md`
- `.opencode/bootstrap/memory/templates/orchestration-index.md`

The protocol must normatively define fresh dispatch, the sole clarification exception, all forbidden reuse categories, fail-closed restart behavior, managed-Task-only dispatch, and remediation counters remaining attached to the original scoped work unit despite each remediation being a new `delegationTaskId`/child.

Add an index section for delegated tasks with: `delegationTaskId`, `scopeKey`, role, artifact ID, dispatch kind (`fresh` or `clarification-response`), child task/session ID, parent session ID, predecessor task/artifact, clarification request nonce/status, remediation loop, and terminal status. Operational IDs must not be copied into static templates as values or exposed outside destination-owned orchestration memory.

Do **not** change `.opencode/schemas/memory-trace-artifact.schema.json` or the role-trace templates: task/session state is orchestration dispatch state, not a role-authored trace field, and the existing closed trace object can summarize received task identity in `inputsReceived`. This avoids an unnecessary retained-history migration.

### 5. Role input contract

**Update `.opencode/contracts/role-io-contracts.json`.** Add `delegationTaskId` and `scopeKey` to every role's required input list. Add `dispatchKind` as a required input constrained by policy text to `fresh` for a new role task; clarification responses do not create a new role output/input contract and therefore do not masquerade as a new role instance. Do not add child session IDs to role outputs or traces.

No edit to `.opencode/schemas/role-io-contracts.schema.json` is needed because the catalog schema already permits required-field names as strings and its shape is unchanged. The implementer must confirm this by parsing/validation rather than changing the schema speculatively.

### 6. Parent and role-dispatch guidance

**Update portable-managed normative surfaces:**

- `.opencode/commands/delegate-orchestration.md`
- `.opencode/commands/delegate-research.md`
- `.opencode/commands/delegate-plan.md`
- `.opencode/commands/delegate-implement.md`
- `.opencode/commands/delegate-integrate.md`
- `.opencode/commands/delegate-validate.md`
- `.opencode/commands/delegate-artifact-verify.md`
- `.opencode/skills/delegation-orchestrator/SKILL.md`
- `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
- `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
- `.opencode/workflows/delegation-workflow.md`
- `.opencode/workflows/validation-workflow.md`

The central command/skill/workflow must include the same decision table as the canonical protocol, require the fresh/clarification envelopes, prohibit alternate unverified child-dispatch surfaces, and change “request remediation from the responsible role instance” to “create a fresh remediation task/role instance linked to the predecessor.” Each direct role command must state that one invocation is one new scoped task, require `delegationTaskId`/`scopeKey`, and never represent a continuation; its frontmatter remains unchanged.

**Update source-only consistency surfaces:**

- `AGENTS.md`
- `opencode-harness.design.md`
- `.opencode/commands/implement-feature.md`
- `.opencode/workflows/implement-feature-workflow.md`

These must state the same fresh/remediation/clarification boundary while preserving the portable/source distinction. The design must replace the stale “does not define durable task state” claim with the accurate process-local, non-durable guardrail boundary. No backward-compatibility switch or permissive legacy path is planned.

### 7. Validators

**Update `.opencode/scripts/validate-harness.mjs`.** Add deterministic checks that:

- canonical policy phrases and the forbidden-reuse decision table agree across protocol, skill, command, workflows, checklist, source guidance, and role commands;
- canonical memory files equal bootstrap seeds;
- all role input contracts require the three delegation fields without changing trace required fields;
- the pure policy module and test are in source/portable inventories;
- lifecycle uses two-argument pre-hook `output.args`, `session.created`, and no stale `input.args`, `session.start`, or `message.after`;
- `node --test .opencode/plugin-modules/task-thread-policy.test.mjs` passes;
- the adapter still has one auto-loaded plugin entry and exposes the policy hooks.

**Update `.opencode/scripts/validate-portable-harness.mjs`.** Add the two new files to `EXPECTED_MANAGED_FILES`; perform the same portable policy-presence/seed/contract checks; dynamically exercise or spawn the focused policy test; and instantiate the installed adapter to verify `config`, `tool.execute.before`, and `tool.execute.after` are reachable. Keep installed validation independent of `AGENTS.md`, the design, source validator, and orchestration history.

### 8. Manifests and bootstrap E2E

**Update `.opencode/portable.manifest.json` and `.opencode/harness.manifest.json`.** Add:

- `.opencode/plugin-modules/task-thread-policy.js`
- `.opencode/plugin-modules/task-thread-policy.test.mjs`

No other new production paths are required. Existing changed portable files are already listed; source-only files remain only in the harness manifest.

**Update `.opencode/scripts/portable-harness.test.mjs`.** Adjust exact bootstrap totals for two new managed files (`created/updated` 45 to 47, dry-run 45 to 47, idempotent `unchanged` 49 to 51), assert both policy files install, run the installed focused policy test, and add corruption checks proving the installed validator rejects a missing policy module/test or stale policy wording. Preserve minimal four-file memory seeding and destination-owned history behavior.

No change is planned for `.opencode/scripts/bootstrap-portable-harness.mjs`: it is manifest-driven. The implementer should change it only if a focused test demonstrates a hard-coded count/inventory dependency not visible in current inspection.

## Ordered Plan and Dependencies

1. Implement the pure state machine/envelope parser and its test first. This fixes the executable contract before prose or adapter integration.
2. Wire the lifecycle hooks to the pure module and correct current hook payload/event names. Keep `plugins/index.js` unchanged.
3. Update the canonical memory protocol and orchestration index, then copy exact bytes to bootstrap seeds.
4. Update all eight role input contracts in the catalog; verify the catalog schema already accepts the unchanged shape.
5. Update portable parent/dispatch/skill/workflow/checklist wording from the canonical decision table; then align source-only AGENTS/design/feature guidance.
6. Update portable and source manifests for the two added files.
7. Extend portable validation, source validation, and portable bootstrap E2E counts/negative fixtures.
8. Hand to `integrator` for cross-file phrase, seed, contract, inventory, and bootstrap-count consistency.
9. Start a **fresh** `validator` child task for command-backed acceptance. Any implementation correction/remediation starts another fresh implementer task; it must not resume the original child.

Dependency constraints: step 2 depends on step 1 exports; step 3 defines wording consumed by steps 4-5; validator inventory checks in step 7 depend on step 6; bootstrap count edits depend on the final portable manifest count. Documentation-only files can be edited in parallel after the canonical policy is fixed, but each separately delegated edit packet must itself start fresh without `task_id`.

## Verification Gates

Run in order from repository root:

1. `node --test .opencode/plugin-modules/task-thread-policy.test.mjs`
2. `node .opencode/scripts/validate-portable-harness.mjs --root .`
3. `node .opencode/scripts/portable-harness.test.mjs`
4. `node .opencode/scripts/validate-harness.mjs`

Then fully quit and restart OpenCode because plugin/config-time files changed. In a fresh live session, perform an operator-observed smoke matrix:

- dispatch two separately scoped tasks and verify distinct child IDs with omitted `task_id`;
- make one child return the exact clarification marker, answer once, and verify the same child ID;
- attempt replay, ordinary follow-up, retry, remediation, post-result correction, changed scope/deliverable/role, and verify each reused-ID call is blocked and the compliant replacement uses a new child ID;
- restart between request and response and verify reuse is denied;
- verify direct `@subagent`/subagent-command surfaces are not used for managed orchestration unless this smoke test proves they traverse the guard.

Acceptance requires a fresh validator trace with a pass/fail matrix and command outputs. Hook telemetry and the smoke log are guardrail evidence only, not substitutes for validator/artifact-verifier evidence.

## Assumptions, Risks, and Limitations

- Assumption: current documented OpenCode Task hooks provide `input.tool/sessionID/callID`, mutable `output.args` before execution, and Task metadata/output after execution, as cited by the researcher. The implementation must target that current shape only.
- The clarification marker is a deterministic project protocol but not a cryptographic security boundary; a child can emit it. Strictness comes from parent/child/task/role/nonce/state matching and fail-closed reuse.
- Process restart intentionally loses authorization and denies continuation. No durable ledger, compatibility migration, or secret-bearing session store is introduced.
- A hook cannot semantically prove that prose in an answer contains no hidden scope change. The narrow response envelope, immutable ledger contract, no extra fields, and parent guidance reduce this to the smallest enforceable surface; validator live tests must probe obvious mutations.
- Manual `@subagent` and host-managed subagent commands remain an upstream traversal uncertainty. The plan prohibits them for managed orchestration rather than claiming unsupported coverage.
- Older retained traces do not gain new structured trace fields. New role packets must satisfy the updated input catalog; source QA currently checks catalog structure rather than retroactively validating every historical packet.
- This planner did not create the missing orchestration `INDEX.md`; that path is outside the planner role's explicit write permission. The parent orchestrator or an authorized memory/index task must create it from the updated/current template and index both researcher and planner traces.
- No implementation files were edited and no acceptance command was run.

## Handoff

- Next role: `implementer` in a fresh child session with no `task_id`.
- Implementer allowed scope: only the exact paths listed in sections 1-8; do not edit `.opencode/plugins/index.js`, trace schema/templates, role-contract schema, or bootstrap script unless a cited executable failure proves the stated no-change decision wrong and a fresh scoped plan approves that expansion.
- Implementer packet must include: orchestration ID; a new `delegationTaskId` and `scopeKey`; this plan and research trace; exact path list; the state/argument/envelope contracts; seed byte-parity requirement; manifest/count changes; four verification commands; `routingMetadataStatus: absent`; and the supplied resolved routing decision.
- Handoff notes: Keep remediation as a new child/task while incrementing the original scoped work unit's remediation counter. Consume clarification authorization before execution, reject any unauthorized own `task_id` property, retain no raw prompt/output, and fail closed after restart. Report any upstream hook-shape mismatch as a blocker rather than adding a permissive compatibility branch.
- Limitations: Planning only; no production edits, final validation, live Task dispatch, or hook activation was performed.
- Risks: Hook traversal gaps, marker ambiguity, cross-session leakage, replay/concurrency, stale event shapes, inventory/count drift, and accidental promotion of guardrails to acceptance proof are the primary review/validation targets.
