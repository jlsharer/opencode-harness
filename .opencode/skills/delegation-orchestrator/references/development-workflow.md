# Shared development practice

Use this reference to prepare substantive development work under the active profile's `delegation-orchestrator` skill. That skill remains the sole delegation authority. This local reference replaces a parallel workflow document: it supplies development practices, not another admission procedure, role, tool, contract or acceptance mechanism. The parent coordinates and synthesizes; leaves perform the scoped research, planning, implementation and independent validation.

Read this guide once per scoped plan before dispatch. Reuse an already approved matching design and existing owner authorization. Read only the relevant role/mode sections in the [task/result examples](task-contract-examples.md); send leaves bounded relevant context through their existing packet fields, never instructions to load the parent skill. Examples are illustrative contract shapes, not observed work or acceptance proof. Replace their sample paths, hashes, IDs and command observations with real evidence.

The wording here is locally written, adapted from development practices in Superpowers 7.0.1: scoped planning, test-first implementation, cause-first debugging and independent review. The active harness contracts and profile rules govern how those practices are applied.

## Active-profile preflight

Record the following in the scoped plan or referenced brief before freezing a specification. Recheck a changed environment or scope; do not repeat unchanged preflight in every child packet.

- **Actual profile and tools:** identify source, portable, external runtime or global-native from observed activation/tool evidence. Record workspace, runtime and trace roots supplied by that profile, available native dispatch tools, supported transport and capacity. An absent admission tool is a blocker, not permission to simulate admission with prose or a shell import.
- **Approval and scope:** reference the matching approved design, owner authorization, deliverables, non-goals and exact edit boundaries. Ask only about unresolved scope or authorization. Reuse existing approval rather than reapproving it.
- **Packets and graph:** select current role/mode packet types and relevant examples, predecessor evidence, task ownership, gate ownership and fresh task/child identities. Record budget mode and actual task deadline. The current task default is five minutes; this guide adds no deadline control. Default workflow budgets remain `{"mode":"unbounded"}`; preserve existing numeric specifications as bounded.
- **Commands and environment:** record exact verification commands, working directories, required inputs, dependency availability, expected writes, temporary storage, platform compatibility and the profile's permission boundary. State which validator owns each managed gate and which checks require separately authorized external QA. Unavailable commands are blockers or explicit skipped checks, never passing gates.

Source, portable and external profiles retain their existing read-only managed shell and stop/recovery boundary. Before admission, identify legacy write-producing QA that needs builds, package operations, host caches or ignored dependencies: arrange it as separate external QA with the exact tested tree and observed exit codes. It never becomes a managed gate or repairs failed managed proof. Read-only gate commands need reviewed tracked or declared safe inputs, dependencies available after masking and writes confined to permitted private temporary storage. Do not assume an arbitrary script is compatible because the command classifier permits its name.

Global-native retains ordinary native host permissions and declared-file acceptance evidence. Its current managed dispatch is foreground only. Native permission to run ordinary tools supplies neither background transport nor legacy recovery enforcement. Use its own authority skill; do not import legacy guards into the global adapter. Admission, actual tools and evidence determine capability, not the profile name alone.

## Minimal meaningful task graph

Choose tasks for their evidence and deliverable, rather than filling every role. A small, well-understood deliverable with an approved approach may need only an implementer followed by a fresh independent validator. Add researcher work when facts are missing; planning consumes that research before implementation. Add integration only when separate outputs need an accountable writer to combine them. A parent may derive coordination structure but cannot replace leaf research, planning or acceptance.

Keep exactly the existing roles and modes: researcher/research; planner/plan or synthesis; implementer/implementation or integration; validator/validation, review, artifact-proof or integration-check. A specialty belongs in a bounded task, not a fifth role. Default to serial local execution. Parallelism needs explicit authorization or distinct-capacity evidence and supported transport; independent filenames alone do not establish capacity or writer safety.

| Scenario | Required decision |
| --- | --- |
| small-deliverable | implementer/implementation then fresh independent validator/review may suffice when the declared mapping and gates support it; omit unnecessary research and integration. |
| combined-review | One fresh independent validator may cover requirements, quality and exact gates in its bounded assignment. |
| review-success | Successful review still owes its assigned gates; their current proof remains required. |
| later-writer | Later writers invalidate old proof; grouped edits need current combined proof even when writers touch different paths. |
| legacy-qa | Identify incompatible write-producing checks before admission; separate external QA is never a managed gate. |
| global-permissions | Native host permissions retain foreground transport; no background support and no legacy recovery are implied. |
| unbounded | Retain deadlines, capacity, fresh identities and independent validation; no workflow agent/remediation cap is added. |
| owner-round | A finite owner test round and its manual verdict remain separate from workflow budgets and managed acceptance. |
| unknown-termination | Retain profile-required state and evidence; no terminal retry or claim of safe completion without native proof. |

## Bounded briefs

Give each task a concrete question or deliverable, allowed paths, non-goals, predecessor references, relevant contract example, verification expectations and handoff destination. Populate the existing role-specific packet fields; a brief is context, not a replacement envelope or new schema. Reference approved source material by path and section rather than restating an entire design or all examples.

Research should return cited findings and unknowns needed by the planner. Planning should describe a small sequence of testable changes and explain dependencies and risks. Implementation should own specific files, preserve other writers' changes, supply behavioral evidence and report limits. Validation should identify the exact tree, requirements, review focus, commands and assigned gates it must independently assess. Pass the current profile roots and artifact convention; never infer a different workspace from a UI title or startup directory.

Every separately scoped task, remediation, correction or terminal retry needs a fresh task identity and child under the active authority rules. The existing bounded child-originated clarification exception does not authorize a new deliverable in an old child. A deadline, failure or uncertain termination is not an invitation to resume terminal work.

## Grouped writes, review and final gates

Group cohesive edits into one accountable writer where possible. Use a focused failing behavioral or closure check before the change, confirm the failure addresses the intended requirement, make the smallest useful correction, then observe the same check passing. Existing behavior needs regression coverage only where it can meaningfully reveal breakage. For guidance and packaging, missing-resource, drift and independent-install checks provide useful evidence; phrase matching alone cannot prove runtime enforcement or model behavior.

After the final intended writer, assign a fresh independent validator the requirements and quality review together when one bounded task can cover them and the exact declared gates. Independence concerns who produced the effects, not a reviewer label. An implementer cannot accept its own work. Review should distinguish command-backed blockers tied to the goal, changed behavior or gates from suggestions without blocking evidence.

Keep current review-mode gate obligations: a favorable review does not waive assigned checks. Where the approved mapping has a separate final validation or integration-check task, complete it after all writers. One combined validator may perform review and final gates when the existing mapping and contracts allow; this guide does not require a redundant extra reviewer or relax any gate. Record exact commands, observed exit codes, relevant artifacts and the current tree/declared-file evidence required by the profile.

A later writer invalidates old proof, including grouped edits on different paths. Revalidate the combined final state and all affected gates; do not combine stale passing checks into acceptance. Never park a blocking finding and call the task accepted. Remediation uses fresh tasks within existing scope and policy; exhausted or genuinely blocked work is reported honestly. Only the active authority's acceptance procedure can accept a managed run.

## Cause-first debugging and behavioral checks

Reproduce the failure with the smallest useful observation. Separate environment incompatibility from a product regression before editing. Read the implicated behavior and compare a passing path, then form one evidence-backed cause and test it. Keep the observed error, command, environment and current tree reference with the finding. A test should exercise the requirement or boundary, not merely mirror the implementation's text.

For unexpected results, inspect actual output before proposing a fix. Narrow the experiment when evidence conflicts; avoid accumulating speculative changes. Run focused checks after each causal correction, then the required final checks on the combined tree. Report what an offline fixture proves and what still needs a separately authorized target-host or provider run. Never fabricate throughput, context usage, completion percentages or native termination measurements.

## Separate finite owner rounds

An owner may agree to a finite manual test round: record the candidate, environment, checks, stop condition and requested manual verdict. Reuse an existing matching agreement and keep owner feedback visible. Its finite round is separate from the default unbounded workflow budget and from managed acceptance. A manual pass does not replace independent validator gates; successful automated checks do not invent an owner's manual verdict. No new round limit, model-performance target or live-provider permission is implied.

## Honest diagnostics and evidence handoff

Classify the observed failure and name the next safe action:

- **Unsupported environment:** cite the missing capability or incompatible command/input boundary; use a compatible admitted check or arrange separately authorized external QA before claiming coverage.
- **Runtime rejection:** retain the exact rejection and relevant packet/spec identity; correct the scoped cause through fresh work allowed by the active profile. Ordinary native actions remain governed by host policy and do not replace rejected managed acceptance.
- **Budget or deadline:** report the actual bounded limit or task timeout. Unbounded workflow budgets remove agent/remediation caps only; task deadlines, capacity, scope, freshness and independent acceptance still apply.
- **Stale proof:** identify the later writer and affected tree/evidence; obtain fresh independent proof on the combined final state.
- **Unknown termination:** distinguish cancellation/result invalidation from native process termination. Keep the profile-required guard/state and evidence; use only that profile's supported diagnosis/recovery actions. Do not retry uncertain effects or claim release without proof. Global native cancellation does not create legacy guard/recovery powers.

A handoff contains the goal and current scope, approved plan reference, actual profile/roots, changed files, predecessor and trace artifact references, current tree/evidence identity, observed commands with exit codes, findings, skipped checks and blockers, and the next bounded task. Keep evidence and interpretation distinguishable. Unknown usage remains unknown. Traces, progress hooks, a policy matrix, example JSON and external QA results are context, not managed acceptance proof. Never restore old task authorization from retained context or a restart.
