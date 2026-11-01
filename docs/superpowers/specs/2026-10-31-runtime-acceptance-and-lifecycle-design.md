# Runtime acceptance and lifecycle follow-up design

Date: October 31, 2026  
Status: Design and characterization complete; implementation and validation authorized November 1, 2026
Parent: [Shared orchestration workflow](2026-10-31-orchestration-workflow-refactor-design.md)  
Execution plan for this phase: [Runtime characterization](../plans/2026-10-31-runtime-design-characterization.md)

The design-and-characterization phase is complete. On November 1, 2026, the owner explicitly authorized proceeding with implementation and validation of the completed design. The [runtime implementation plan](../plans/2026-11-01-runtime-implementation.md) carries the four concrete proposals into independently reviewed increments; active-profile ownership and complete-input evidence reuse remain deferred. Activation, provider access, installation and publication remain outside this authorization. Existing matching owner authorization for Git operations persists; this document grants no additional Git authority. The existing Codex direct bootstrap authorization is separate from native OpenCode managed admission and acceptance.

The four proposals address mapping-specific gate duties, immutable admitted deadlines, proven local task failure, and accepted global run retirement. Active-profile ownership and complete-input evidence reuse receive separate feasibility decisions. Keep four roles, existing modes, fresh task and child identities, independent acceptance, serial writer isolation, scope controls, and conservative uncertainty handling. Workflow budgets remain independent of deadlines and finite resource limits.

## Evidence and architecture

The source research inspected these existing seams; the baseline tests below characterize them without changing them:

| Component | Current responsibility and design seam |
| --- | --- |
| `dispatch-controller.ts`: `WorkflowSpec`, `validateWorkflow`, `reserve`, `complete`, `sweep` | Normalization, mapping order, dependencies, gates, immutable attempts, deadline and capacity transitions |
| `managed-dispatch.ts`: controller registration, `completeTask`, `interrupt`, recovery methods | Frozen spec, observed command proof, scope/tree/artifact proof, foreground and background correlation, process-wide stop |
| `global-protocol.ts`: `admitOrchestration`, `admitTask`, `started`, `result`, `accept` | Parent-bound run registry, native child freshness, declared-file evidence and global acceptance |
| `global-native-plugin.ts`: `before`, `after`, control action handling | Native call registry, actual host correlation, all-surface rejection, global ordinary-tool independence |
| `v2-dispatch-bridge.ts` and `v2-native-plugin.ts` | Native launch/Job evidence, command callbacks and outward completion diagnostics |
| `orchestration-input.schema.json`, role contracts, source/generated projections | Exact-field compatibility, profiles and executable examples |

Source paths above are under `.opencode/src/plugin-modules/` except the schema under `.opencode/schemas/`. The global adapter remains independent of legacy launch/stop/recovery infrastructure. Neither traces nor compaction summaries restore authority.

## 1. Mapping-specific gate duties

### Current behavior and approaches

Version `1.0.0` requires nonempty `workUnits[].acceptanceGateIds`. Each successful validator, including `review`, must prove all gates assigned to its unit and a current tree hash. The legacy adapter additionally requires independently observed exact-command success. Global result checking derives command duties from `acceptanceGates[].workUnitIds`, whereas controller closure derives them from unit declarations. Normalization only checks one direction. An extra gate can name a unit which omits that gate: global command proof then requires more than the controller closes, leaving final acceptance incomplete.

Keeping the current combined review/validation mapping is compatible and remains the recommended v1 workflow. Making `review` implicitly exempt would hide duties in a mode name and could bypass dependency gates. **Recommended author choice:** explicitly version per-mapping obligations, with one declared validator mapping owner for each final gate. Multiple owners whose partial results jointly close a gate would require additional evidence aggregation and partial-proof states; defer that design.

### Proposed versioned representation

Support exact workflow versions `1.0.0` and `2.0.0`; reject unknown versions. V2 adds required `gateObligations: string[]` to each mapping and optional `taskTimeoutMs` as specified below. Non-validator mappings require `gateObligations: []`. Validator obligations are unique known gate IDs and may be empty, including for advisory review. A gate's owner is the unique mapping tuple `(workUnitId, role, taskMode)` listing it; that mapping must be a validator and its unit must be covered by the gate. Every final gate must have exactly one owner. Mapping tuple uniqueness remains unchanged.

Keep nonempty unit final gate assignments in v2. An advisory review can run within a deliverable unit with empty mapping obligations; this proposal does not add gate-free work units. Require exact bidirectional equality of unit/gate association edges in v2. Construct one immutable normalized gate relation at admission containing gate ID, covered unit IDs, exact command and owner mapping tuple. Controller, legacy and global adapters consume this relation through a shared obligation lookup; no adapter re-derives a competing set from raw input.

Suggested internal lookup interface is `gateObligationsFor(spec, mappingKey): readonly NormalizedGate[]`, where `mappingKey` is the existing tuple, not a new caller-selected identity. Include normalized relation and mapping obligations in frozen specification comparison. Deep copies returned for diagnostics must not mutate it. Unknown, duplicated, non-validator, uncovered, multiply owned and ownerless obligations reject before registration or attempt consumption.

### Transitions, proof and dependencies

A successful advisory review with zero obligations marks only its mapping complete. It neither closes a gate nor satisfies final acceptance. It still needs a valid role result, current evidence binding, and profile-specific artifact/scope checks. A gate-owning validator succeeds only with exactly its mapping's gate IDs, current tree hash and command-backed evidence required by the active profile. Partial or extra gate closure rejects without terminal success. Final acceptance requires all required mappings complete and every final gate closed for the current evidence state.

The shared-gate downstream-validator dependency exception must check actual obligation ownership: the mapping may cross an otherwise blocked predecessor only to prove the relevant shared gates under the existing scope and prerequisite rules. A validator with zero obligations receives no exception. Ordinary consumers and advisory review remain blocked behind required dependency gates. Starting another writer conservatively invalidates all closed gates and completed validator mappings, including advisory review; legacy accepted proof also clears. Evidence reuse is outside this proposal.

### V1 compatibility and diagnosis

V1 rejects new fields and retains all-unit-gates validator semantics, existing exact result envelopes, and existing ordering. Symmetric v1 workflows behave identically. The normalized compatibility relation must retain both original association edge sets and identify their symmetric difference; never silently intersect them, choose the weaker set, or close extra gates from unowned proof.

For asymmetric v1 input, preserve the historical profile-specific admission and proof rules in the compatibility branch, but expose a precise diagnostic naming the unit, gate and inconsistent declarations. Global completion/acceptance remains unable to succeed with incomplete closure; surface the inconsistency before the generic incomplete-acceptance message. Legacy compatibility must not claim that its historical unit-based proof establishes global acceptance. Migration/preflight to v2 fails until the author reconciles both declarations and assigns owners. A future decision to reject asymmetric v1 input at admission is a distinct compatibility tightening, not an incidental effect of this design.

This makes v2's relation authoritative across all profiles while preserving explicit v1 projections. Add parity fixtures for both profiles rather than claiming historical asymmetric v1 already had common semantics. The task packet/result version can stay v1 because obligations are authority in the admitted spec and commands are described through existing fields; any new envelope fields require their own version change. Update schema, controller types, adapters, generated JavaScript, examples and profile validation together in the later implementation.

## 2. Immutable admitted task durations

### Current behavior and choice

Today `createDispatchController` captures construction `timeoutMs`, default `300000`, accepting safe integers `1..3600000`. Reservation sets an absolute deadline. Clarification and background updates do not renew it; at `now >= deadline` the attempt becomes `cancel-requested`, retains capacity and rejects late output. Global construction has neither a timeout nor a clock option; V2 does not forward a task timeout override.

Alternatives are a controller-wide operator duration, an admitted workflow-wide duration, or admitted per-mapping duration. **Recommended author choice:** per-mapping `taskTimeoutMs` in workflow v2, default `300000`, with the same inclusive safe-integer bounds. It permits bounded long validation without extending every research task. Avoid per-packet duration, which would move immutable authority to each dispatch.

### Admission and reservation contract

Add trusted controller/adaptor option `maxTaskTimeoutMs` with default `3600000` and bounds `1..3600000`. Resolve every v2 mapping duration during admission: absent means `300000`; reject non-integer, unsafe integer, zero, negative, NaN, infinity, out-of-range, or a value above the trusted ceiling. A ceiling below the default rejects an omitted duration; never silently clamp. The normalized admitted spec records the effective chosen duration even when defaulted.

Keep existing construction `timeoutMs` as a v1 compatibility/fixture option only. V1 preserves its current default and override. If callers supply both legacy `timeoutMs` and a v2 workflow, reject the conflicting option before admission; do not silently replace the spec value. A trusted ceiling is policy, not owner authority to enlarge scope or duration. Expose the effective duration and ceiling in admission diagnostics.

At successful atomic reservation, sample the controller clock once, verify finite safe integer time and safe addition, and set `deadline = reservedAt + taskTimeoutMs`. This is the absolute `expiresAt` semantics; retain the existing property name `deadline` internally and in current snapshots to avoid gratuitous renaming. Failed reservations consume no attempt and create no deadline. Frozen duration, reservation time and deadline never change on compaction, clarification, queued context update, polling, or refreshed briefs. A retry uses a fresh task/child and its own successful reservation under the original mapping duration and remaining budget.

Forward the same trusted ceiling and clock through managed dispatch and global protocol construction. Introduce `createGlobalProtocol(options?: { now?: () => number; maxTaskTimeoutMs?: number })` as an internal injection seam; production uses the standard clock, tests use a fake clock. V2 forwards configuration to managed dispatch rather than defining a second deadline. Existing V2 activation/download/recovery-shell timeouts remain separate.

Both adapters schedule/check against the controller's stored deadline, including background timers; they must not calculate a later independent deadline. Snapshot/brief/status data report duration, deadline, remaining time and cancel/reconciliation state as diagnostics only. Expiration retains capacity until the current native termination rules reconcile it. Late success cannot cancel expiry, and unbounded budgets cannot override it. Persisted timestamps are historical evidence, never authorization after restart.

## 3. Proven local failure without process-wide interruption

### Existing distinction and alternatives

A typed `failed` or `blocked` result, and some task-thread-policy `rejected` results, already complete locally after frozen-spec and scope checks. Malformed result does not universally stop the process. Errors thrown by artifact/digest checks, trusted command proof, scope/spec checks or controller proof currently enter `completeTask`'s catch and `interrupt` every registered controller. A foreground callback is marked complete only for a non-rejected policy result containing a result; malformed parsing does not prove termination.

Keeping process-wide interruption is safe but can stop unrelated work. Making all format/proof errors locally retryable would confuse an error label with native termination evidence. **Recommended author choice:** narrow local failure only after a separate, complete termination-and-effects proof. Keep current recovery as the default when any required proof is absent.

### Independent dimensions and proof record

Classify failures internally by stage: transport/correlation, contract/result decoding, command evidence, artifact evidence, controller proof, specification identity, or workspace scope. A stage never decides retry safety by itself. Evaluate separate native-termination and effects-safety dimensions.

The local-failure proof must bind the exact adapter instance, parent, orchestration/spec digest, task/mapping, child, final native call/turn, and applicable Job ID/generation. It must establish all of the following at one serialized terminalization boundary:

1. Frozen parent/spec/workspace/trace identities still match admission and the current task is the correlated live attempt.
2. The final launch is acknowledged and has a supported authoritative terminal callback or existing authoritative Job terminal proof. Idle observed before launch or while a callback is pending is insufficient.
3. No pending Task callback, queued launch, clarification turn, context update, native command, abort or termination inspection can still affect this attempt. Every admitted turn is accounted for, with post-final-launch termination proof.
4. Scope inventory and allowed transition checks cover current effects. Read-only roles produced no unauthorized writes; permitted implementation effects are in scope and identified by exact current tree evidence.
5. Cancellation/expiry/interruption has not raced with the proof. If it has, follow the existing cancel/recovery reconciliation path; local error classification cannot release its lease.

Use only native capabilities currently supported by each adapter. The initial supported local-failure slice is a fresh child created and bound once for its initial single background turn, with exactly one acknowledged original call and no update, clarification or control history. Actual native `JobInfo` exposes `id`, `type`, `status`, `started_at`, optional `completed_at`, `output` and `error`, but no public generation, admitted-call or turn token. Require the returned Job ID/type and independently returned session ID/parent to match admission; timestamps are consistency checks, not generation authentication. Fresh child identity and immutable single-turn history provide this slice's binding. Every ever-updated/clarified attempt, foreground completion, message-only idle and continuation remains unsupported until a real host contract proves the needed binding. Capture raw bounded output and checked terminal observations before typed JSON decoding; malformed transport/wrapper or correlation remains unproven. Only private trusted evidence may authorize local artifact or exact-command result-proof failure. All harness-owned admissions, launch/command callbacks, inspections, abort and recovery work must be settled; failed command callbacks retain poison accounting. Recheck controller/deadline, identity/spec and exact current tree under the terminalization boundary; unknown work, expiry or any identity/spec/scope failure retains stop and capacity. The host exposes no globally settled after-hook primitive: counters prove only harness-owned callbacks, while other plugins remain within the host trust boundary. No proposed `isSafelyTerminated` API, public proof boolean or invented generation is assumed. Existing v1 C6–C8 no-proof cases retain their conservative outcomes. Global ordinary-tool behavior and local rejection remain separate; do not import legacy recovery into global.

### Atomic outcome and rejected effects

After all proof succeeds, transition the attempt from its active state to terminal `failed`, record the original rejection and proof classification, release only its capacity, invalidate any affected gates/mapping completion and keep unrelated controllers usable. Tombstone task, child and call identities before release. The original rejection remains the primary diagnostic even if later cleanup fails. Replace every success-bearing return surface, including rich/native metadata surfaces, with rejection; never return a partially decoded success beside the error.

In-scope implementation effects may remain as **unaccepted rejected-attempt effects** identified by the proven tree. They do not complete the mapping or count as accepted output. A fresh remediation task must explicitly receive that state and independently revalidate the deliverable. Any actual rollback is a separately scoped fresh writer or an existing authorized exact operation; classification must not silently revert files. Out-of-scope, ambiguous, drifting or unobservable effects retain the process stop.

Retries use fresh task, child and call identities; budget charges from the failed attempt remain. Old/duplicate/late results reject even after newer remediation succeeds. Keep local proof and tombstones available for diagnostics without exposing artifact contents or reviving authority. If proof construction or atomic commitment fails, preserve the stop and reservation. Existing marker resolve/release requirements remain unchanged for that path.

V2's completion catch currently reports stopped-workflow wording. Update it only alongside the actual new transition, reporting whether the process stopped, the task failed locally, and whether fresh in-scope work is possible. Version any newly public recovery/status shape explicitly; internal error classification alone needs no role-result envelope change. Rollback uses the prior package on a freshly reconciled session; it cannot downgrade live uncertain state or reuse old identities.

## 4. Explicit accepted global run retirement

### Current limit and resource choice

Global protocol retains up to 128 run records across all parents, keyed by `(parentID, orchestrationId)`. Acceptance does not free a slot. The adapter retains up to 4096 native call records; the protocol also retains used child IDs. Deleting only runs moves exhaustion elsewhere. Deleting a consumed call without a rejection replacement makes `after` return early and can expose a late native success.

Exact lifetime membership for arbitrary IDs with infinite operations cannot be represented in bounded memory. LRU eviction forgets real replays; Bloom filters alter exact membership and cannot supply indefinite exact history. An enforced monotonic epoch/sequence identity contract could permit bounded watermarks but changes native/caller identity assumptions and needs its own design. A durable ledger also grows and cannot restore authorization.

**Recommended author choice:** compact accepted runs into exact tombstones with explicit finite replay-metadata bounds. Defaults: at most **65,536 logical identity records** and **16,777,216 canonical UTF-8 serialized replay-metadata bytes** per adapter/protocol instance, covering retained and reserved replay metadata together. Identity records include run keys, scoped task keys, native call keys and globally used child IDs; acceptance summaries also consume byte allowance. Container/runtime overhead is additional bounded implementation overhead, not a promise of 16 MiB total process memory. Preserve existing identifier length limits. These limits are resource policy, independent of workflow budgets.

Reserve enough identity and byte credits before admitting a run/task/call or launching an unknown child; reserve the maximum allowed child ID and fixed proof-summary shape before native launch, then settle to actual exact bytes. Clarification/update calls consume their own credits. Count canonical fixed-shape records, not implementation object estimates; rejected reservations cannot create authority. Keep rejected/consumed identities once authority or native launch was possible. Exhaustion fails closed with resource-specific diagnostics; no implicit eviction, restart recommendation, or fallback to untracked work. Defaults are fixed in the first implementation; configurable increases require separately bounded trusted options and explicit tests.

### Versioned API and transaction

Keep v1 action clients working unchanged. Introduce global control protocol/profile version `2.0.0` with supported-version discovery and explicit actions `status` and `retire`; workflow version is independently negotiated and may be v1 or v2. Unknown actions/versions reject. The new control request includes `version: 2`, `action: "retire"`, `orchestrationId` and an exact `acceptanceDigest` returned by v2 acceptance. Native event/session evidence supplies the parent, cwd and adapter generation; callers cannot choose these bindings. No `force`, `clear` or resume option exists.

A canonical acceptance summary contains parent/run identity, canonical cwd, adapter generation, spec digest, accepted tree hash, final gate IDs/evidence hashes and acceptance sequence. Compute `acceptanceDigest` from that fixed canonical representation. Retain it with exact run/task/child/call tombstones; retain full evidence through existing trace policy, without treating traces as authority.

Retirement preconditions are an accepted run, exact parent/cwd/generation/digest match, no admitted/running/awaiting-guidance/cancelled/uncertain work, no pending callback/command/continuation/abort, and all related adapter calls consumed. A historically failed attempt is compatible only if its termination is already known and its identities remain rejected; cancelled or uncertain work is never made retireable by classification. Recheck under a shared adapter/protocol transaction guard immediately before changing records.

The serialized transaction is: validate all preconditions and reserved storage; prepare exact rejection entries for every run/task/child/call; install those entries; replace full adapter calls with rejection-only lookup entries; remove full run and task payloads; release resident slots. If any step cannot commit safely, retain the full accepted records and reject retirement. Do not free capacity first or temporarily expose unknown calls. Repeating the exact retirement request can return the same retired summary without authorizing anything; another parent/digest/generation rejects.

After retirement, admission with the old parent/run key rejects; old task keys cannot resume the run, old native call keys reject, and previously used child IDs remain forbidden globally. Task IDs retain their current run-scoped namespace; coincident text in a genuinely new run is not historical authority, while remediation still requires fresh IDs. `after` must consult active **and tombstoned** call keys before its unknown-call early return. Tombstoned late callbacks run all-surface rejection replacement and never parse/accept success. Truly unrelated ordinary native calls remain unaffected.

Expose resident runs `/128`, resident calls `/4096`, exact identity records `/65536`, replay bytes `/16777216`, remaining reserved capacity, and retirement eligibility/refusal reasons. Acceptance alone never auto-retires. Cross-parent capacity shares one instance as today. Teardown leaves its late-hook rejection behavior intact; restart creates no proof of termination and must not be offered to evade unresolved work or replay limits. This proposal does not introduce cross-process durable authorization or claim cross-process arbitrary-ID lifetime membership.

## 5. Feasibility decisions

### Active profile ownership: retain file collision checks

`projectHarnessCollision` conservatively checks recognized local plugin file contents in cwd ancestors. The global native contract exposes no shared atomic plugin-owner claim. V2's `plugin.list`, effective-role checks, event stream and launcher nonce are not a mutual per-session ownership protocol shared with global.

A registry snapshot alone has absence and reload races. Replacing file evidence requires a supported native contract for atomic exclusive claim keyed by canonical location, session and plugin generation, verified claimant identity, teardown/reload revocation, and a before-dispatch recheck. Unavailable/inconsistent capability must fail closed. Keep the existing collision policy and its migration guidance. Existing collision fixtures characterize file evidence only; no invented successful host mock establishes that the real host supplies ownership proof.

### Complete-input evidence reuse: retain blanket invalidation

Legacy tree/validation-input evidence and global `declaredFileEvidence(cwd, files)` cover declared observations, not all command dependencies. An unchanged declared file hash can coexist with a changed command result caused by an undeclared input. Disjoint path edits alone cannot prove reuse.

Reuse would need an admitted complete dependency closure including absence, symlinks/no-follow identities, config/fixtures/generated and ignored files, package dependencies, executable/toolchain identity, exact command and environment, plus a hermetic execution guarantee or fail-closed dynamic-input policy. Proof must bind that closure to the tested revision. Start with explicitly supported hermetic commands if a later phase establishes such a capability. No path-only cache, dependency guessing or selective reuse ships now; writers invalidate all current gate evidence.

## Acceptance matrix and baseline mapping

`C1–C12` are the new passing characterizations in the phase plan; they prove current behavior only. Future rows remain acceptance cases for later runtime implementation, never skipped/default-failing tests pretending to implement this design.

| Design | Future acceptance cases | Current evidence and new baseline |
| --- | --- | --- |
| Gate obligations | Zero-duty review succeeds without closure; final acceptance and ordinary dependencies remain blocked; exact owner closes; absent/duplicate owner rejects atomically; both adapters agree; writer invalidates advisory and gate proof | Existing controller dependency/shared-gate/proof and writer-invalidation tests; global command-backed acceptance; C1–C3 pin review duties and v1 asymmetry |
| Compatibility | V1 exact fields and symmetric behavior unchanged; asymmetric v1 diagnosed without weaker inference; v2 association mismatch rejects; packet unknown fields still reject | Existing normalized schema/role-contract tests; C2–C3 |
| Deadline | Default and `1`/`3600000` accepted; invalid/unsafe values and ceiling conflict reject pre-admission; both adapters use selected duration; snapshots cannot alter it; no reset across clarification/update/compaction; exact-boundary late output rejected and capacity retained | Existing timeout, clarification, background-update and immutable snapshot tests; C4–C5 pin actual default and captured construction option |
| Local failure | Fully proved artifact/command/contract failure releases only that task; no gates close; original error and rejected effects retained; fresh remediation succeeds; all success surfaces replaced | Existing managed scope/artifact/observed-command tests and global all-surface rejection tests; C6–C8 distinguish existing local result failures from process-wide proof interruption |
| Uncertainty races | Missing callback, pre-launch idle, pending update/turn/command, changed spec/tree, wrong parent/generation, failed abort, expiry and cancellation all retain stop/capacity | Existing managed recovery, lost-callback, pending-launch and post-launch abort regressions; no new permissive mock substitutes for native proof |
| Retirement | Explicit accepted retirement permits a 129th sequential run and releases consumed call payloads; rejects active/cancelled/uncertain/pending/cross-parent work; exact old run/task/child/call denial; late success replacement; atomic rollback; separate resident and replay exhaustion | Existing duplicate/dispose/global identity tests; C9–C11 pin current 128-instance limit and accepted child history. Future tests must cross 4096 consumed calls through retirement and hit exact replay bounds |
| Ownership and reuse | No capability means collision rejection; no full input proof means invalidation; hidden input/environment/tool changes cannot reuse proof | Existing ancestor collision and writer invalidation tests; C12 runs an inert command affected by an undeclared input while declared hashes stay equal |

Later implementation should land in independent gate/deadline, local-failure, and global-retirement increments with their own executable acceptance tests and compatibility review. None can rely on another proposal being implemented implicitly. Keep current conservative paths until corresponding runtime tests pass. Release requires source/portable/global/runtime closure checks and regenerated artifacts; installation or native restart requires matching separate authorization.
