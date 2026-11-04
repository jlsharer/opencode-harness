# Global-native regression evaluation runbook

This source-only reference records the November 3, 2026 sequence and supplies repeatable cases for later regression evaluations. It supplements the [global profile guide](global-profile.md#november-3-2026-live-and-offline-evidence) and [workflow design](superpowers/specs/2026-10-31-orchestration-workflow-refactor-design.md). It defines no runner, executable schema or new acceptance authority. Documentation is excluded from the package whitelist.

## Evidence and executed sequence

**LIVE** means operator-reported T3Code/OpenCode observations pasted into Codex. **ARTIFACT** means checks of installed harness bytes and metadata; distinguish independent Codex verification from operator-reported artifact checks in each record. **FIXTURE** means source/offline tests, including modeled native boundaries. These classes are not interchangeable. Exact client, native executable and WSL distro versions were not recorded. This sequence tested global-native, not legacy direct-session stop/recovery.

1. Reviewed source `a6ddfe9` was installed as package `0.1.20`, profile `2.0.0`, release `45bbc7c677178a545d21`. Doctor and independent asset checks passed; rollback was inspected **without `--apply`**, targeting retained release `7b035e27f8024f102a56` (18 replacements, 2 removals).
2. Full provider quit/restart and catalog refresh/reconnect instructions were provided. The actual reload method was not observed. Subsequent real tool availability and workflow execution supplied separate LIVE evidence.
3. A fresh four-role smoke run passed independent tests, acceptance and retirement. Same-parent/generation replay and wrong-digest rejection followed, with ordinary read/status checks.
4. The owner attempted Stop/cancellation on another run. Its observed initial state was **ADMITTED, NATIVE CALLBACK PENDING**, with no verified child ID. Cancellation changed state, but its response failed native JSON validation.
5. Root-cause investigation found an undefined raw output property. Fix `cd228d2` and registered-tool regression tests passed independent review and offline QA.
6. Full release QA passed and corrected release `fc523d34ba84d4fc316d` was installed and independently checked. Documentation/evidence were recorded at source `6147705`. Package/profile versions stayed `0.1.20`/`2.0.0`; release hash distinguishes the deployments.
7. The [fresh operator evaluation `82fd4a`](evals/2026-11-03-gn-eval-82fd4a.md) reports GN-009 **PASS for control version 1 only**, a new four-role acceptance/retirement, and repeated artifact/offline checks at source `bb7d2e7`. Its existing clean full-QA rerun completed: GN-008 is **PASS WITH CHILD-ENV ADJUSTMENT**, with operator-reported exit 0 and Codex-verified log hash/summaries (881 registered, 838 passed, 43 skipped, 0 failed/cancelled/todo). Earlier environment failures remain FAIL attempts. Completion-snapshot provenance is checked; live/artifact claims remain operator-reported, and the overall result is qualified to exercised coverage.

## Case matrix

Statuses apply to the stated assertion and evidence class, not the entire product.

| Case | Scenario / evidence | Recorded outcome |
| --- | --- | --- |
| GN-001 | Release provenance, doctor, rollback dry run / ARTIFACT | PASS, original and corrected installs |
| GN-002 | Real tool catalog / LIVE | PASS; reload method NOT_EXERCISED as an observation |
| GN-003 | Four roles, independent tests, acceptance / LIVE | PASS |
| GN-004 | Accepted retirement, replay, wrong digest, ordinary tools / LIVE | PASS |
| GN-005 | Pre-correlation cancellation state / LIVE | PASS for conservative state/refusal; termination unconfirmed |
| GN-006 | Historical cancellation response JSON / LIVE | **FAIL**, retained historical result |
| GN-007 | Registered-tool cancellation regression / FIXTURE | PASS after fix; RED reproduced defect |
| GN-008 | Full QA and corrected deployment / FIXTURE + ARTIFACT | Historical PASS; new operator full-QA repeat PASS WITH CHILD-ENV ADJUSTMENT (third attempt only) |
| GN-009 | Corrected live pre-correlation cancellation response / LIVE | PASS, new attempt with control version 1 only |
| GN-010 | Verified running-child cancellation / LIVE | NOT_EXERCISED |
| GN-011 | Live late-result rejection after cancellation / LIVE | NOT_EXERCISED |

## GN-001–GN-002: provenance and discovery

Goal: establish which installed artifact and actual tools are being tested. Preconditions: separately authorized global installation and a location without a conflicting project harness. Retain doctor JSON, source/release identity, inventory checks, rollback dry-run output and tool-catalog observation.

1. Run `node bin/opencode-harness.mjs global doctor` from the reviewed source using the intended native discovery/state roots; record cwd and exit. Inspect `global rollback` without `--apply`.
2. Compare release inventory hashes and projected discovery bytes with the reviewed source using installer projection semantics; unprojected role source is not byte-identical to projected discovery output.
3. After a separately authorized plugin update, fully restart the provider/server and reconnect/refresh the client. Ask the parent to load the installed global skill and verify `harness_orchestration` and `subagent` in its actual tool catalog before admission. Slash-command availability alone is insufficient.

Observed ARTIFACT checks: 56 release hashes, 37 unprojected source matches, 19 projected discovery matches, and 20 owned regular nonsymlink discovery files (4 roles, 5 commands, 10 skill files, 1 plugin). Clean-location doctor exited 0; source-checkout doctor also exited 0 and reported the expected project collision separately from installation health. Corrected rollback dry run targeted `45bbc7c677178a545d21`, with 13 replacements, and was not applied. Both installations retained their prior release and had no activation journal. Tool use established availability in the reported LIVE session; no specific UI reload procedure was proven.

## GN-003: positive four-role workflow

Use a fresh run and an unoccupied smoke directory. Before admission, choose a new directory if an example already exists; expand its actual name consistently in all allowed paths, declared evidence files and gate commands. Preserve existing untracked files. The original executed `harness-smoke/` paths below remain historical. The following future prompt is reusable, not a verbatim historical transcript; replace `NEW_SMOKE_DIR` before admission:

```text
Load the installed global delegation-orchestrator skill. Verify that
harness_orchestration and subagent are available. Admit a fresh workflow
with researcher, planner, implementer, and an independent validator, each
in a fresh child. Choose a new unoccupied smoke directory and expand its
actual name in all allowed paths, evidence and gates before admission.
Create only NEW_SMOKE_DIR/add.mjs and NEW_SMOKE_DIR/add.test.mjs.
Export add(a, b); use built-in Node tests for
positive numbers, negative numbers, and zero. Add no dependencies and
edit no project configuration. Declare both files as evidence. Require
the independent validator to run:
node --test NEW_SMOKE_DIR/add.test.mjs
Accept only current independent evidence, then report the v2 acceptance
digest and retire the accepted run using that exact digest.
```

Assertions: four verified role children, exact scope, independent command exit 0, current declared-file proof, accepted summary and digest. Retain role/call/child correlations, command/output/exit, evidence hash, acceptance response and retirement summary.

Historical executed scope/prompt used only `harness-smoke/add.mjs` and `harness-smoke/add.test.mjs`, declared both as evidence, and required `node --test harness-smoke/add.test.mjs`.

Observed run `global-native-smoke-20261103-a7f43c29`: four verified fresh children; only the two requested files created; **3 passed, 0 failed, exit 0**; accepted and retired. Acceptance digest:

```text
6634ab6eeb15c61beb7f1e720ba2367206d093e82fc25e3db01d3f319b9ec3e9
```

The new [operator repeat](evals/2026-11-03-gn-eval-82fd4a.md#four-role-evidence) used `harness-smoke-20261103-eval/` because prior paths existed and were preserved. It reports four verified children, three tests with exit 0, acceptance digest `720dcf74892ec99dd79aa7ac5d152d05e70342ecfdd5bb8c20724d5d27d7e41e`, and evidence hash `3e007a2a6993652d4313126b4b2dc8b5d5a9ecb9da466f3d9167a2670965fbe7`. Replay retained 13 identities / 1653 bytes with zero resident calls/runs and reservations; identical and wrong-digest requests left counters unchanged. These are new-run values; the historical 13 / 1762 in GN-004 remains unchanged.

The expected test-first missing-module RED and fallback when `rg` was unavailable did not block the final result.

## GN-004: retirement replay and ordinary tools

Precondition: accepted run, exact returned digest, same native parent and adapter generation. Supply these control objects directly to `harness_orchestration`, substituting current values; do not invent a native argument wrapper:

```json
{"version":2,"action":"retire","orchestrationId":"CURRENT_RUN","acceptanceDigest":"EXACT_TOOL_RETURNED_DIGEST"}
```

1. Retire, retain the summary, then repeat the identical request in the same parent/generation. Assert identical summary.
2. Alter only the digest's first character. Assert rejection; restore no authority.
3. Read `harness-smoke/add.mjs` through an ordinary tool and request status before/after the replay checks:

```json
{"version":2,"action":"status"}
```

Observed generation `ccab442b-09db-4a67-93f6-c9bf073e8dc0`: repeat returned the same summary; changing the original digest's first character `6` to `7` rejected with “unknown retirement or mismatched acceptance digest.” Read/status worked. Before/after resident runs, calls, reserved records/bytes/summary bytes were all 0; replay retained 13 identities and 1762 canonical bytes. No files or children were added.

Retain both status snapshots and exact responses. These counts are historical observations, not universal constants: other runs affect baselines; retirement frees this run's resident payloads while retaining replay metadata. Idempotent and wrong-digest attempts themselves must leave counters unchanged.

## GN-005–GN-006: Stop and pre-correlation cancellation

Use a fresh workflow with a declared independent validator gate, but launch only the read-only researcher. Stage-one prompt:

```text
Load the installed global skill and check actual tools. Admit a fresh
cancellation smoke workflow scoped to cancel-smoke, with a future
independent validator gate. Launch only a fresh researcher/research task
that runs this read-only command:
node -e "setTimeout(() => console.log('cancel-smoke-finished'), 60000)"
Do not launch planner, implementer, or validator. Preserve the exact
original task context and report available launch/child correlation.
```

Owner action: click **Stop once the child delay is visible**. If that state is never established, record the actual phase. Follow up in the same chat:

```text
Inspect the original run and generation. If the exact original task is
still cancellable, use task.cancel with its original exact context;
otherwise report its terminal state. Attempt acceptance: it must reject.
Check ordinary read and status. Preserve resource snapshots and any
actual late callback rejection; do not infer termination or clear/retire
uncertain work. If the generation changed or original run is missing,
report this attempt INCONCLUSIVE.
```

The documented direct cancellation control is:

```text
{"version":1,"action":"task.cancel","context":TASK_CONTEXT}
```

`TASK_CONTEXT` means the original exact admitted context, not an invented JSON string; controls 1 and 2 have offline regression coverage.

Actual run `global-native-cancel-smoke-20261103-b91d6f42`, task `cancel-research-b91d6f42`, scope `cancel-smoke`, researcher/research, retained the same generation above. Initial state was **admitted, native callback pending; no verified child ID**. Thus this is pre-correlation cancellation evidence, not proof that a child started or the delay ran.

GN-005 observations: state became cancelled; acceptance rejected as independent acceptance incomplete or stale; final `accepted: false`, digest null, retirement refusal “cancelled task: termination uncertain.” Resident runs/calls remained 1/1; reserved records/bytes remained 1/721. Ordinary read/status worked. These retained records are conservative uncertainty accounting, not automatically failure or a leak, and not a cleanup target.

GN-006 historical response remains **FAIL**: native output rejected with “Tool returned a non-JSON value for its output schema: Expected JSON value.” No late callback was observed. Stop, elapsed time, interrupted calls, restart and JSON-valid responses never prove native termination. Do not clear or retire this old run.

## GN-007–GN-008: fix, offline proof and deployment

The raw cancellation output owned `childID: undefined` before correlation. Native `Schema.Json` rejected it although JSON text silently dropped the field. Fix `cd228d2` omits only unknown `childID`, retains known strings and `termination: "unconfirmed"`, and changes no cancellation state, accounting or gates.

Retain registered-tool raw-output assertions and logs: six cases cover controls 1/2 × admitted/running/clarification. RED: 2 failed unknown-child cases, 4 passed. GREEN: focused 8/8, global 91/91. Running fixtures explicitly use the correlation API; they do not prove a live running child. Checks reject acceptance/late callbacks, retain uncertainty/accounting and permit ordinary tools. Independent review passed with no findings.

Historical Codex full QA: `npm test` registered 881, with 838 passed, 43 skipped, 0 failed; separate pinned-source suite 57/57; package dry run 73 files. An initial missing local plugin dependency was a clone prerequisite failure, resolved using existing dependencies without network/source changes, not a new product regression. Corrected installation passed the 56-asset/20-discovery checks in GN-001. Retain command exits, QA summary, release and installation hashes; none substitutes for LIVE retesting.

The [operator repeat](evals/2026-11-03-gn-eval-82fd4a.md#reported-qa-commands-and-external-log-references) reports global tests 91/91, pinned-source tests 57/57, global validation 56 assets, package dry run 73 files and inventory/discovery 56/20, all exit 0. Rollback was dry-run only; no new deployment occurred. Its full-QA repeat is **PASS WITH CHILD-ENV ADJUSTMENT** for the third attempt only: the default `/tmp` attempt failed two Bubblewrap-hidden fixture tests, and the next private `/var/tmp` attempt failed on inherited `OPENCODE_CONFIG_CONTENT`; both remain recorded FAIL attempts. The existing owner background job `sh_1a4025ed0001hfzTl8tTui9Z33` completed with operator-reported exit 0. Codex read the complete `gn-eval-82fd4a-npm-test-clean.log`, verified SHA-256 `4d673100474563df4443c7ab52bf750cbcd63126b8db7cab68c2c225b232a14c`, and parsed 881 registered, 838 passed, 43 skipped, 0 failed/cancelled/todo. Codex did not launch or wait for the job; none remains pending. The normalized record preserves separate initial and completion report hashes, without inventing an ending source commit.

Offline QA preflight for future evaluations: use an existing owner-only mode-0700 private `TMPDIR` below `/var/tmp`, outside Bubblewrap's masked `/tmp`. Remove inherited `OPENCODE_CONFIG_CONTENT` only from the offline QA child environment, recording presence and adjustment rather than its value; leave other inputs untouched. The recorded owner job has completed; its documentation update requires no duplicate full QA. This setup is never a bypass for native approvals or protocol checks; environment failures alone do not establish product regressions.

## GN-009–GN-011: live rerun evidence and remaining checks

After separately authorized provider restart for the plugin change, verify that the adapter **generation changes** and the corrected release is loaded. The same T3Code chat may be used if it receives the fresh instance, but create new orchestration/specification/task/call/child/prompt identities. Never reuse old cancellation context in a new instance. Profile `2.0.0` alone does not identify the patch: record release hash and generation.

GN-009 repeats pre-correlation cancellation when that phase can be observed. Assert raw JSON validity separately from cancelled state, acceptance refusal, ordinary-tool availability and resource accounting. Unknown-child output must omit the key, yielding `{ "termination": "unconfirmed" }`; a correlated known child may additionally have a valid string `childID`. Retain raw and text responses. The [new operator attempt](evals/2026-11-03-gn-eval-82fd4a.md#observed-cancellation-results) is **PASS for control version 1 only**: native raw and text JSON were `{"termination":"unconfirmed"}`, with no `childID` key or schema error. Version-2 acceptance refused, ordinary read/status worked, accepted remained false and digest null, and retirement refusal remained “cancelled task: termination uncertain.” No live version-2 cancellation is claimed.

Generation `7a9aff60-c5f6-48e2-b034-318fefa51171` differs from the historical generation but stayed unchanged through this Stop/cancel. No restart was performed or observed in this evaluation; reload method remains **NOT_EXERCISED**. The task was admitted with native callback pending; the interrupted-error session ID is an **unverified candidate**, not running-child correlation. No callback arrived. Before launch: resident runs/calls 1/0, replay 14/2241 bytes, reserved records/bytes/summary 0/499/499. After Stop: 1/1, 17/2654, 1/690/499; post-cancel and acceptance refusal were identical. Retained uncertainty is neither leak proof nor a cleanup goal; the cancelled run remains unaccepted and non-retirable. GN-006's historical failure is preserved.

GN-010 requires actual verified running-child correlation before Stop; a pending callback is insufficient. GN-011 requires an actually observed late callback and rejection on relevant output surfaces; silence is insufficient. Both remain **NOT_EXERCISED live**, despite fixture coverage. Missing original context or changed generation makes an attempted original-run assessment **INCONCLUSIVE**.

### Proposed closure of GN-010 and GN-011

The [proposed live-gap design](superpowers/specs/2026-11-03-global-native-live-gap-design.md) recommends a minimal source-only isolated driver first, preserving production adapter behavior. Complete an authentic clarification through native result validation, continue the exact verified unresolved child/task/nonce with a fresh call, establish the exact continuation stream boundary and fresh call-bound native execution, then cancel through the registered harness control. A correlated running label or launch acknowledgment alone is insufficient. This can prove **GN-010-CONTINUATION** only; **GN-010-FRESH remains NOT_EXERCISED**. Broader public exact tool-progress early binding is a separate later production option if required; no native core change is currently required.

For deterministic GN-011, hold a genuine core-dispatched completed callback before adapter.after serialization, cancel through the registered control, then release the unmodified callback. Holding inside the adapter queue would block cancellation. Fabricated callback fixtures cannot satisfy GN-011. If completion precedes cancellation, that attempt cannot also prove GN-010. Preserve actual output/content/metadata and native terminal/model/parent-visible rejection, acceptance refusal, and retained resource accounting. Controlled native driver evidence is qualified LIVE evidence; modeled driver tests remain FIXTURE and manual T3Code coverage remains separate.

The design is **PROPOSED**. Implementation, source-driver live attempts, and manual GN-010/GN-011 tests have not run. Both headline cases stay **NOT_EXERCISED**. The remaining test sequence is:

1. Approve the design, then prepare the implementation plan and source-driver TDD. Test authentic versus fabricated callback boundaries, exact clarification nonce/task/child/new-call identity, fresh versus historical execution observations, wrong/stale/duplicate/conflicting/unmatched events, changed parent/cwd/generation, disposal, cancellation races, bounded hold timeout, release without payload modification and no adapter-queue deadlock. No timeout may clear protocol uncertainty or gates.
2. Run focused driver/global adapter/protocol tests and pinned-native public event/schema/order audits. Run source and portable validation, both runtime test scripts, global validation/tests, full npm tests, pinned-source tests and package dry run for the final change. Record exact tree, commands, exits and skips. Offline QA uses an existing owner-only mode-0700 private `TMPDIR` below `/var/tmp`; unset inherited `OPENCODE_CONFIG_CONTENT` only in that child environment, recording presence/adjustment without reading its value.
3. Independently review the exact final source/generated/package tree and preserved global-only import closure; no legacy guard imports, installed test switch or second adapter. Resolve findings and rerun affected checks.
4. With separate matching provider/network authorization, use a fresh isolated native instance/config/data/state/workspace and source-only driver, verifying actual native build/public-event compatibility and absence of another adapter. No automatic auth, native database mutation, global installation or activation. Record versions, source/driver hashes, generation, parent/message/call/task/child, nonce/context, deadline, event ordering and raw responses.
5. For GN-010-CONTINUATION, the source-only driver registers a bounded read-only rendezvous tool using actual public `ctx.tool.transform`. Require an authentic native child invocation matching the verified session and fresh continuation boundary, then hold that tool’s execute Promise pending while registered cancellation runs. Driver readiness uses the actual invocation, not assumed streaming stdout. Release only after cancel returns; abort/timeout/premature completion is INCONCLUSIVE and always settles driver resources without clearing protocol uncertainty. No child file writes, installed rendezvous switch or production gate bypass. A previous same-child execution.started or absent callback is insufficient. For GN-011, retain the genuine late callback and all actual rejection surfaces. Use the deterministic outer-after hold as a separate attempt when completion already occurred. Test control versions 1 and 2 separately; absent observations are INCONCLUSIVE, never PASS. Retain old cancelled runs and uncertain reservations.
6. Separately authorize any installation/provider restart, record the release and changed generation, then perform manual T3Code smoke. Source-driver LIVE evidence does not imply UI Stop/catalog/restart coverage. Keep GN-010-FRESH and each unexercised control/surface explicit until matching proof exists.

## Minimal evaluation record

Use this illustrative Markdown/YAML record, not a new executable schema. Keep assertion statuses scoped; historical failures stay failures after a fix.

```yaml
case: GN-009
caseVersion: 1
controlVersion: 1 # record the version actually exercised
scenario: corrected pre-correlation cancellation response
profile: global-native 2.0.0
package: 0.1.20
release: RECORD_EXACT_HASH
sourceCommit: RECORD_COMMIT
clientVersion: unknown
nativeVersion: unknown
wslDistroVersion: unknown
evidenceKind: LIVE # LIVE | ARTIFACT | FIXTURE
evidenceReporter: operator # distinguish independent Codex artifact verification
sourceReportSha256: RECORD_FROZEN_REPORT_HASH
correlation:
  generation: RECORD
  parentSession: RECORD
  orchestration: FRESH
  task: FRESH
  call: FRESH
  child: unknown # record verified ID only when correlated
stepsAndResponses: RETAIN_EXACT_PROMPTS_CONTROLS_RAW_OUTPUT_AND_TEXT
commandsAndExits: RETAIN_EXACT_COMMAND_CWD_EXIT
proof: {declaredEvidenceHash: unknown, acceptanceDigest: null}
assertions:
  rawJson: {expected: valid, observed: unknown, status: PENDING}
  termination: {expected: unconfirmed, observed: unknown, status: PENDING}
resourceBeforeAfter: RETAIN_BOTH_STATUS_SNAPSHOTS
evidenceLocationsAndHashes: RECORD_NONSECRET_REFERENCES_AND_SHA256
overall: PENDING # PASS | FAIL | PENDING | NOT_EXERCISED | INCONCLUSIVE
```

Future automation can reuse these stable cases and existing registered-tool/installation fixtures. UI Stop, provider restart and real client observations remain manual steps until separately implemented and verified. No evaluation framework is claimed here.
