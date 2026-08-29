# Final Three-Seam Closure Addendum

## Metadata

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- role: `planner`
- artifactId: `root-planner-008-plan-seams`
- createdAt: `2026-08-22`
- taskMode: `synthesis`
- delegationTaskId: `dt-close-plan-seams-008`
- scopeKey: `integrated-plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet; closure research; three prior planner artifacts; the failed final plan proof; current `security/approval.mjs`, host Node modules, host tests, and Windows companion source; three exact unresolved seams.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing labels or values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; planned implementation root: `/home/joshl/projects/nba2k27-myplayer`.

## Final Precedence and Resolved Conclusions

This artifact has final normative precedence over `root-planner-002-integrated-closure.md`, `root-planner-004-plan-remediation.md`, and `root-planner-006-final-plan-closure.md` **only** for (1) complete control identity and observations, (2) typed launch/action approval, and (3) child grants/accounting/reconciliation. All nonconflicting, previously proved contracts remain mandatory.

1. `ControlIdentityTupleV1` is now the observation value only; sequence and clock fields are removed from it and live in `IdentityObservationV1`. A receipt and every control seam carry a complete tuple, never an abbreviated identity projection.
2. Current `src/nba2k27-myplayer/security/approval.mjs` is not adapted for host intent authority. Its public `parseRunApproval`, `ApprovalLedger.bind/consume`, `ApprovalBudget`, exports, legacy eight-key record, and `action|query` behavior remain unchanged. Host control uses the named internal replacement `HostApprovalIntentLedger` in new `src/nba2k27-myplayer/host/approval-intent-ledger.mjs`; it is not exported from `index.mjs` or reachable from the CLI/package subpaths.
3. `ParentBudgetLedgerV1` remains the sole aggregate owner. `ChildBudgetGrantV1` is a restrictive, immutable per-child grant and accounting transcript; it never grants, refunds, or changes parent aggregate authority.
4. Every unavailable required Win32 observation—including owner/root-owner, DWM frame, monitor, DPI, foreground, or exact UTF-16 evidence—returns `E_CONTROL_IDENTITY_UNSUPPORTED` and makes control ineligible. No null/default/sentinel substitutes for an API failure.

## Decision 1 — Complete Identity and Observation Contracts

### Canonical scalar and digest rules

- Every object below is closed: unknown, missing, duplicate, accessor, symbol, prototype-bearing, non-plain, non-integer, `-0`, floating, exponent, or unsafe numeric input rejects before canonicalization.
- Canonical JSON is UTF-8, lexicographically keyed, integer/Boolean/null/string only, with domain-separated SHA-256. Digests are lowercase 64-hex. HWNDs are lowercase 1–16 hex digits without `0x` or leading zero; zero is never serialized.
- `Utf16EvidenceV1 = {utf16CodeUnits, sha256}`. `utf16CodeUnits` is the exact number of UTF-16 code units returned, excluding the terminating NUL. `sha256` hashes exactly those code units encoded little-endian, without NUL, normalization, case folding, truncation, or replacement. Raw class names and titles never enter intents, protocol logs, diagnostics, or ordinary evidence.
- `RectV1 = {left,top,rightExclusive,bottomExclusive}` uses signed 32-bit observed coordinates, checked signed-64 subtraction/addition, `rightExclusive>left`, and `bottomExclusive>top`. No tolerance or clamping exists.

### Nested closed records

`WindowIdentityV1` has exactly:

```text
schemaVersion="window-identity/1", hwnd,
owningProcessId, owningThreadId,
classAtom, className,
style, exStyle, visible, enabled
```

`owningProcessId` and `owningThreadId` are positive UInt32 results from the same successful `GetWindowThreadProcessId(hwnd,...)`; `classAtom` is the nonzero UInt16 `GCW_ATOM`; `className` is `Utf16EvidenceV1`; `style`/`exStyle` are UInt32 bit patterns from `GetWindowLongPtrW(GWL_STYLE/GWL_EXSTYLE)` with cleared/checked last error; `visible=IsWindowVisible(hwnd)` and `enabled=IsWindowEnabled(hwnd)`. `IsWindow(hwnd)` must be true before and after the record.

`MonitorIdentityV1` has exactly:

```text
schemaVersion="monitor-identity/1", monitorKey,
deviceName, monitorRect, workRect, primary
```

`MonitorFromWindow(selectedHwnd,MONITOR_DEFAULTTONEAREST)` must return nonzero and `GetMonitorInfoW/MONITORINFOEXW` must succeed. The numeric `HMONITOR` is process-local and is never serialized. `deviceName` is `Utf16EvidenceV1`; `monitorKey=SHA256("monitor-identity/v1" || canonical(deviceName,monitorRect,workRect,primary))`. This is the handle-derived stable-in-session monitor tuple compared across inspector/control. Any second call for the same nonzero handle yielding a different tuple is unsupported.

`VirtualDesktopV1` has exactly:

```text
x, y, width, height, rightExclusive, bottomExclusive
```

The first four values come from one `SM_XVIRTUALSCREEN/Y/CX/CYVIRTUALSCREEN` snapshot; width/height are positive; exclusive ends are checked signed-64 sums and must equal the serialized values.

### Exact `ControlIdentityTupleV1`

The closed ordered fields are:

```text
schemaVersion="control-identity-tuple/1",
effectiveConfigDigest, calibrationProfileDigest, targetPolicyDigest,
targetWindowsFinalPathSha256, targetExecutableSha256,
targetSignerPolicyResultDigest,
targetPid, targetProcessCreationFileTime,
targetParentPid, targetParentProcessCreationFileTime,
targetParentExecutableSha256,
selectedWindow, ownerWindow, rootOwnerWindow,
selectedWindowTitle,
windowRect, extendedFrameBounds,
clientRectLocal, clientTopLeftScreen, clientBottomRightScreen,
contentRectScreen,
processDpiAwarenessContext, windowDpi,
monitor, virtualDesktop,
foregroundHwnd, selectedOrRootOwnerIsForeground,
windowVisible, windowIconic, windowCloaked
```

Rules are exact:

- `selectedWindow` is nonnull `WindowIdentityV1`; its HWND is the operator-selected HWND and its PID/TID are obtained independently. Its PID equals `targetPid`.
- `ownerWindow` is either null **only when** successful `GetWindow(selectedHwnd,GW_OWNER)` returns zero, or a complete nonnull `WindowIdentityV1` whose `hwnd` is that nonzero result. A Win32 error or failure to obtain every nested field is unsupported.
- `rootOwnerWindow` is a complete nonnull `WindowIdentityV1` whose HWND is the nonzero result of `GetAncestor(selectedHwnd,GA_ROOTOWNER)`. Zero/error/incomplete is unsupported. It may equal `selectedWindow`; if so, the two complete records must be byte-identical.
- `selectedWindowTitle` is `Utf16EvidenceV1` over exact `GetWindowTextLengthW`/`GetWindowTextW` output. A zero-length title is allowed only when both calls establish an empty title with no error; truncation or length disagreement is unsupported. Any title length/digest change from the approved receipt is `E_CONTROL_IDENTITY_MISMATCH` until a new receipt and approvals exist.
- `windowRect` is successful `GetWindowRect`; `extendedFrameBounds` is successful `DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS)`. `clientRectLocal` is successful `GetClientRect`, requires `left=top=0`, and is positive. Both local corners are independently passed through `ClientToScreen`; they become `clientTopLeftScreen` and `clientBottomRightScreen`. `contentRectScreen` equals those mapped corners as a `RectV1`. All five geometric facts are separately serialized and compared.
- `processDpiAwarenessContext` is one closed generated enum (`UNAWARE`, `SYSTEM_AWARE`, `PER_MONITOR_AWARE`, `PER_MONITOR_AWARE_V2`, `UNAWARE_GDISCALED`) established through `GetWindowDpiAwarenessContext` plus `AreDpiAwarenessContextsEqual`; unknown/zero is unsupported. `windowDpi=GetDpiForWindow(selectedHwnd)` is positive and policy-matching.
- `foregroundHwnd` is the nonzero canonical result of `GetForegroundWindow`. `selectedOrRootOwnerIsForeground` is exactly `(foregroundHwnd==selectedWindow.hwnd || foregroundHwnd==rootOwnerWindow.hwnd)`. Control eligibility requires it true. The workflow never calls `SetForegroundWindow`.
- `windowVisible`, `windowIconic`, and `windowCloaked` repeat selected-window visible/iconic/DWM-cloak facts for explicit policy. They must be `true,false,false`; `selectedWindow.visible` must equal `windowVisible`. The selected window and root owner must be enabled; configured owner-window policy is exact when owner exists.
- Every field above—including foreground HWND, title, all nested owner/root-owner fields, all rectangles, monitor, DPI, desktop, visibility/enabled/iconic/cloak, process lineage, and digests—is the dynamic identity projection and must exactly equal the approved inspector receipt at every control observation. No digest comparison permits omission of the complete object.

### `IdentityObservationV1`

Closed fields are exactly:

```text
schemaVersion="identity-observation/1", seam, observerKind,
observerInstanceDigest, sequence,
startedMonotonicTicks, monotonicTicks, monotonicFrequency,
startedWallUtcMs, wallUtcMs,
tuple, tupleDigest, receiptDigest,
priorObservationDigest, observationDigest
```

`seam` is one of:

```text
INSPECTOR_RECEIPT, CONTROL_POST_HELLO,
CAPTURE_BEFORE, CAPTURE_AFTER, PREVIEW_SOURCE,
PRE_CANARY, POST_CANARY, PRE_ACTION,
BEFORE_EACH_INPUT_EVENT, POST_ACTION,
CANCELLATION_TERMINAL
```

`observerKind` is `inspector|control`; `observerInstanceDigest` is a parent-bound digest of the exact launch nonce/invocation/executable identity, never PID/path. Sequence is global for the receipt lineage: inspector is exactly 1 and the parent supplies each subsequent expected value; every accepted observation is prior+1. Ticks are nonnegative, frequency positive, start≤end, and duration is within `limits.identityObservationMs`. Within one `observerInstanceDigest`, frequency is constant and both start/end ticks strictly exceed the prior observation's end tick. Across inspector/control instances, ticks are not compared; `startedWallUtcMs` and `wallUtcMs` must nevertheless be strictly greater than the prior observation's `wallUtcMs`, start≤end, and satisfy configured parent request/receipt skew. This explicitly avoids pretending process-local clocks share an epoch.

`tuple` is the complete object above; `tupleDigest=SHA256("control-identity-tuple/v1" || canonical(tuple))`. The inspector first constructs `InspectorReceiptCoreV1`, which contains its challenge/config/policy/grant bindings plus the complete tuple and clock/sequence fields. `receiptDigest=SHA256("inspector-receipt-core/v1" || canonical(core))`. The inspector observation then copies those core tuple/time/sequence fields and that receipt digest. Parent validation requires the copies exact, eliminating a digest cycle. Every control observation carries that same receipt digest.

For sequence 1, `priorObservationDigest=null`; otherwise it is the exact prior accepted `observationDigest`. `observationDigest=SHA256("identity-observation/v1" || canonical(all fields except observationDigest))`.

### `IdentityObservationSetV1`

Closed fields are exactly:

```text
schemaVersion="identity-observation-set/1", setId,
receiptDigest, controlSessionDigest, revision,
firstSequence, lastSequence, observations,
terminal, setDigest
```

`setId` is parent-generated before inspector launch. `controlSessionDigest=null` at receipt revision 1 and is the fixed digest after control hello. `revision` increments exactly one whenever observations are appended. `observations` is the complete cumulative ordered array, never a digest-only or truncated projection; `firstSequence=1`, `lastSequence=observations.length`, chain digests are exact, and `setDigest=SHA256("identity-observation-set/v1" || canonical(all fields except setDigest))`. A child sends the complete current set where required; the parent rejects a changed prefix. `terminal=true` only after exactly one final `CANCELLATION_TERMINAL` observation and no later append.

Required prefixes/cardinality are:

| Authority point | Required newly appended observation(s) |
| --- | --- |
| Inspector receipt | one `INSPECTOR_RECEIPT` |
| Control hello accepted | one `CONTROL_POST_HELLO` before any operation |
| Each capture | exactly one `CAPTURE_BEFORE`, then one `CAPTURE_AFTER`; no intervening identity observation |
| Preview seal | one new `PREVIEW_SOURCE`, after the capture-after bound to recognition |
| Canary | one `PRE_CANARY`, exactly 2 or 3 `BEFORE_EACH_INPUT_EVENT` observations matching its registered key/click recipe, one `POST_CANARY`; no `PRE_ACTION`/`POST_ACTION` for canary |
| Non-canary action | one `PRE_ACTION`, exactly 2 or 3 `BEFORE_EACH_INPUT_EVENT` observations matching its recipe, one `POST_ACTION` |
| Cancel/close/terminal | exactly one `CANCELLATION_TERMINAL` after the last completed/failed operation and before child close response |

At every nonterminal seam, the tuple must equal the receipt and `selectedOrRootOwnerIsForeground=true`. At pre-canary/pre-action/before-each-event, mismatch fails before `SendInput` with `E_CONTROL_IDENTITY_MISMATCH` or `E_FOREGROUND_REQUIRED`. A post-canary/post-action mismatch, API failure, or foreground loss after call entry is `ACTION_OUTCOME_UNKNOWN`; it never establishes that no input occurred. A terminal observation mismatch is `E_CONTROL_IDENTITY_MISMATCH` unless action entry already occurred, in which case outcome remains unknown. Sequence/chain errors are `E_OBSERVATION_SEQUENCE`; time/freshness errors are `E_OBSERVATION_TIME`; unsupported APIs are `E_CONTROL_IDENTITY_UNSUPPORTED`.

## Decision 2 — Typed One-Use Approval Intents

### Existing-source compatibility decision

Direct inspection proves `security/approval.mjs` currently parses a public eight-key run approval and `ApprovalLedger.consume` accepts only `action|query`. It cannot safely represent host receipt, observation, executable, grant, canary, or digest bindings. Therefore:

- Do not change or reuse that class for host authority and do not change its current tests or public exports.
- Add internal `src/nba2k27-myplayer/host/approval-intent-ledger.mjs` exporting only to internal relative imports: `canonicalizeLaunchApprovalIntent`, `canonicalizeActionApprovalIntent`, `createHostApprovalIntentLedger`, `issueLaunchApproval`, `issueActionApproval`, `consumeLaunchApproval`, `consumeActionApproval`, and `consumeCanaryResultForActionCapability`.
- `HostApprovalIntentLedger` uses closure-private `WeakMap` records and `WeakSet` spent state; no constructor, map, record, mutable counter, issue function, or token is public/package-exported/CLI-reachable.

### Closed launch intent

`LaunchApprovalIntentV1` has exactly:

```text
schemaVersion="launch-approval-intent/1", intentKind="launch",
inspectorReceipt, receiptDigest,
identityObservationSet, identityObservationSetDigest,
controlIdentityTuple, controlIdentityTupleDigest,
effectiveConfigDigest, calibrationProfileDigest, operatorPolicyDigest,
controlExecutableIdentityDigest, controlSessionIntentDigest,
ttlPolicyDigest, parentLedgerDigest,
childBudgetGrant, childBudgetGrantDigest,
launchReservationDigest, deadlinePolicyDigest,
intentExpiresUtcMs, launchDeadlineUtcMs, intentDigest
```

The full branded inspector receipt, full revision-1 observation set, complete tuple, and complete control grant are present; every paired digest is recomputed. `controlExecutableIdentityDigest` covers only pinned/parent-observed path/hash/build/protocol/signer/integrity policy facts, never raw paths. `controlSessionIntentDigest` covers the undisclosed launch/session nonces and invocation by digest. `ttlPolicyDigest` covers exact receipt/intent/grant TTL fields; `deadlinePolicyDigest` covers receipt, intent, launch, request, and session deadlines. `intentExpiresUtcMs` is the minimum of receipt, grant, and launch-approval expiry; launch deadline cannot exceed it. `intentDigest=SHA256("launch-approval-intent/v1" || canonical(all fields except intentDigest))`.

### Closed action intent

`ActionApprovalIntentV1` has exactly:

```text
schemaVersion="action-approval-intent/1", intentKind="action",
receiptDigest,
identityObservationSet, identityObservationSetDigest,
controlIdentityTuple, controlIdentityTupleDigest,
captureFrame, captureFrameDigest,
captureProvenance, captureProvenanceDigest,
recognitionEvidence, recognitionEvidenceDigest,
sealedPreview, previewDigest,
actionSet, actionSetDigest,
expectedTransition, expectedTransitionDigest,
canaryRequestPolicy, canaryRequestPolicyDigest,
geometryAuthority, geometryDigest,
focusPolicy, focusPolicyDigest,
eventReservation, eventReservationDigest,
parentLedgerDigest,
actionDeadlineUtcMs, sessionDeadlineUtcMs,
deadlinePolicyDigest, intentExpiresUtcMs, intentDigest
```

The observation set is the complete current prefix ending in `PREVIEW_SOURCE`; frame/provenance/recognition/preview/action set/transition/canary/geometry/focus/event reservation are their complete closed objects plus recomputed digests. `actionSet` contains every exact canonical action recipe that operator approval permits, including the one reversible canary recipe and final recipe(s); no free-form text, path, title, template bytes, secret, or caller extension exists. `eventReservation` is the already consumed parent reservation for the full canary plus final action recipe and expected protocol responses. `intentExpiresUtcMs=min(receipt, preview, grant, reservation, action, session deadlines)`. `intentDigest=SHA256("action-approval-intent/v1" || canonical(all fields except intentDigest))`.

### Issue, consume, canary, and final capability sequence

1. `issueLaunchApproval(ledger, canonicalIntent, {operatorApprovalId, approvedAtUtcMs})` and `issueActionApproval(...)` accept only a generated, deep-frozen canonical branded intent and an injected explicit operator decision. They return a frozen zero-property token (`Object.create(null)`) whose record binds ledger ID, kind, approval ID, exact intent digest, issued time, and expiry. A token is opaque, immutable, nonserializable, and valid only in its creating process/ledger.
2. `consumeLaunchApproval(token, exactIntentDigest, now)` and `consumeActionApproval(...)` atomically mark a genuine token spent **before** kind, digest, expiry, or downstream mint checks. Clone/structured-clone/forged/null/missing tokens are unrecognized; cross-ledger and cross-kind tokens fail; mutation is impossible because the canonical intent and private record are frozen. No failure refunds/reissues a token.
3. Successful consume returns another opaque one-use `ConsumedApprovalHandleV1` private record, not caller-readable fields. Launch consume can mint only `ControlLaunchCapabilityV1`. Action consume can mint only one `CanaryCapabilityV1` whose exact recipe is projected from the approved action set and canary policy.
4. `CanaryResultV1` has exactly `schemaVersion, canaryRequestDigest, actionIntentDigest, preCanaryObservationSetDigest, postCanaryObservationSet, postCanaryObservationSetDigest, postCaptureFrameDigest, postCaptureProvenanceDigest, postRecognitionEvidenceDigest, observedTransitionDigest, parentReservationDigest, childGrantDigest, completedUtcMs, resultExpiresUtcMs, resultDigest`. All full observation data is inside `postCanaryObservationSet`; the registered transition and state must match the approved canary policy.
5. `consumeCanaryResultForActionCapability(consumedActionHandle, canaryResult, now)` consumes both one-use records before validation. It requires exact action intent, reservation, grant, pre/post observation chain, post-capture/provenance/recognition, expected transition, and expiry. It mints one `ActionCapabilityV1` whose permitted recipes, selector, transition, geometry, focus, event reservation, deadlines, tuple, and receipt are copied solely from the consumed `ActionApprovalIntentV1`. `canaryResultDigest` is prerequisite evidence only; it cannot add, replace, widen, reorder, or mutate approved action authority.

Errors are exact and redacted:

| Condition | Launch | Action/canary |
| --- | --- | --- |
| absent/forged/clone/wrong ledger | `E_LAUNCH_APPROVAL_REQUIRED` | `E_ACTION_APPROVAL_REQUIRED` |
| shape/kind/cross-kind | `E_LAUNCH_APPROVAL_KIND` | `E_ACTION_APPROVAL_KIND` |
| any field/digest/current-intent mismatch | `E_LAUNCH_APPROVAL_BINDING` | `E_ACTION_APPROVAL_BINDING` |
| expiry/deadline | `E_LAUNCH_APPROVAL_EXPIRED` | `E_ACTION_APPROVAL_EXPIRED` |
| second consume/reused consumed handle | `E_LAUNCH_APPROVAL_REPLAY` | `E_ACTION_APPROVAL_REPLAY` |
| canary object/binding/transition mismatch | n/a | `E_CANARY_RESULT_BINDING` |
| canary expiry | n/a | `E_CANARY_RESULT_EXPIRED` |
| canary/result/handle replay | n/a | `E_CANARY_RESULT_REPLAY` |

No error or log includes the token, intent object, raw title/class/path, receipt body, action data, supplied mismatch, or secret; logs contain only stable code, kind, generated correlation ID, and predeclared digest labels with values omitted.

## Decision 3 — Exact Child Grants and Accounting

### Closed grant variants

`ChildBudgetGrantV1` is the discriminated union of two closed variants. Common exact fields are:

```text
schemaVersion="child-budget-grant/1", ledgerId, childKind,
sessionNonce, launchNonce, grantId,
parentReservationId, parentReservationDigest,
maxima, attempted,
requestSequenceMin, requestSequenceMax,
responseSequenceMin, responseSequenceMax,
expiresUtcMs, effectiveConfigDigest, receiptDigest,
capabilityDigest, grantDigest
```

IDs/nonces are parent-generated and unique. Ranges are positive, inclusive, nonempty, and their lengths equal exact reserved protocol request/response maxima. `grantDigest=SHA256("child-budget-grant/v1" || canonical(all fields except grantDigest))`. `attempted` has exactly the same keys as `maxima`, all zero. Every maximum is a positive safe integer and no child can raise it.

Inspector variant:

```text
childKind="inspector"; sessionNonce=null; receiptDigest=null;
capabilityDigest=inspectorChallengeDigest;
maxima/attempted keys exactly:
protocolRequests, protocolResponses, identityObservations,
cancellationRequests
```

Control variant:

```text
childKind="control"; sessionNonce=<32-byte base64url>;
receiptDigest=<receipt digest>; capabilityDigest=<control launch capability digest>;
maxima/attempted keys exactly:
protocolRequests, protocolResponses, identityObservations,
captureCalls, captureChunks, captureBytes,
canaryCalls, actionCalls,
mouseEvents, keyEvents, totalInputEvents,
cancellationRequests
```

Inspector has no capture/canary/action/event counters. Control has no inspector launch, control launch, recognition, preview, approval-consume, or parent cleanup counters. Those keys are absent—not zero aliases. Any wrong-kind key, absent permitted key, nonzero initial attempted value, changed binding, expired grant, duplicate grant ID, or out-of-range sequence rejects `E_CHILD_GRANT_SHAPE`, `E_CHILD_GRANT_KIND`, `E_CHILD_GRANT_BINDING`, `E_CHILD_GRANT_EXPIRED`, or `E_CHILD_GRANT_REPLAY` before operation.

### Child-local attempt algorithm

Each child keeps one private mutable `attempted` map keyed by the grant digest and one next request/response sequence. For every delta it calls generated `AttemptBudget(counter,delta)` **immediately before** the bounded operation/message/event. It first checked-adds and fails `E_CHILD_BUDGET_EXHAUSTED` without attempting when the next value exceeds maximum. Otherwise it increments permanently. There is no refund after error, cancellation, partial output, partial `SendInput`, exception, or close.

Exact local deltas are:

| Child activity | Delta before activity |
| --- | --- |
| Valid correlated inbound challenge/hello/request/cancel/close | `protocolRequests:1`; cancel also `cancellationRequests:1` |
| Start one full identity snapshot | `identityObservations:1` |
| Start one GDI capture | `captureCalls:1`; each emitted chunk additionally `captureChunks:1,captureBytes:<decoded length>` |
| Start canary dispatch | `canaryCalls:1,actionCalls:1` |
| Start non-canary dispatch | `actionCalls:1` |
| Prepare each click event immediately before its `BEFORE_EACH_INPUT_EVENT` observation | `mouseEvents:1,totalInputEvents:1` (exactly three) |
| Prepare each key event immediately before its observation | `keyEvents:1,totalInputEvents:1` (exactly two) |
| Emit one bounded child record | `protocolResponses:1` immediately before exactly one write |

An identity snapshot is the complete atomic contract-level observation; individual Win32 calls are bounded by generated call count/order and do not invent additional grant counters. `SendInput` receives the one fully prepared 2/3-event array once; event counters were already attempted and are never incremented again.

Every response—including hello result, inspector receipt, ordinary result/error, capture start/chunk/end, canary/action result, rejection, and close—contains closed `ChildAccountingV1`:

```text
grantDigest, requestSequence, responseSequence,
parentReservationId, parentReservationDigest,
beforeAttempted, deltaAttempted, afterAttempted,
priorResponseDigest, responseDigest
```

All three maps contain every key permitted for that child, with zero deltas explicit. `after=before+delta` field-by-field. For the first response, `priorResponseDigest=grantDigest`; afterward it is the immediately prior accepted response digest. `responseDigest=SHA256("child-accounting-response/v1" || canonical(protocol record excluding responseDigest))`. The child computes prospective maps, charges `protocolResponses:1`, freezes the accounting block, then performs exactly one bounded write.

### Non-circular request/response reservation

1. Before each send, the parent atomically reserves one `protocolRequests` plus the exact expected count and per-record local delta of all responses. The parent reservation is already consumed; the request carries its reservation ID/digest and expected response schedule.
2. The first inspector challenge/control hello carries the grant. The child may perform only bounded framing and grant validation before installing it; it then charges `protocolRequests:1` for that same first record, performs hello/receipt work, and charges the one response immediately before output. Thus no ungranted operation is used to obtain the grant.
3. A syntactically framed, correctly session/grant/reservation-correlated request with an invalid body still charges `protocolRequests:1`. It may emit exactly one closed rejection only when that request's schedule reserved a rejection response and local response capacity remains; the rejection charges `protocolResponses:1`. Otherwise it closes output without response. Unparseable, over-limit, wrong-session, wrong-grant, wrong-reservation, duplicate, or out-of-range input is not a validated request and causes immediate close without local increment or response.
4. Hello/challenge is sequence `requestSequenceMin` and expects exactly one hello-result/receipt response. Close is the last reserved request and expects exactly one close response whose accounting includes its request and response increments plus the final `CANCELLATION_TERMINAL` identity observation. Clean EOF without that close response is incomplete. Capture reserves `captureStart + chunkCount captureChunk + captureEnd`; partial output consumes the full parent reservation and the child reports only what it actually attempted.

### Parent reconciliation

`reconcileBudgetReport(ledger,reservation,grant,response,expectedResponseSpec)` runs in the existing serialized parent critical section and does this exact order:

1. Require active ledger/grant, exact ledger/grant/reservation/config/receipt/capability digests, unexpired grant, unused `(grantId,parentReservationId,responseSequence)` tuple, and the next request/response sequence.
2. Require `beforeAttempted` byte-equal to the prior accepted child cumulative map (all zero for first response), `deltaAttempted` byte-equal to that exact response's pre-reserved expected local delta, and checked field-wise `after=before+delta<=maxima` with no extra/missing/decreasing field.
3. Require `priorResponseDigest` equal grant digest for first response or prior accepted response digest thereafter; recompute response digest over the complete response/accounting block.
4. Require response count not exceed the reservation schedule. On the final expected response require cumulative response count and child cumulative map equal the reservation's complete expected attempted state. Then mark reservation reconciled once.
5. Any duplicate/skipped/decreasing sequence, missing/extra response, wrong prior digest, excess/unexpected counter, changed prefix, wrong reservation, reservation reuse, or arithmetic mismatch calls `terminalizeBudgetLedger` and returns `E_BUDGET_RECONCILIATION`. Parent reserved counters remain consumed. EOF/timeout/crash before final response similarly terminalizes after lifecycle classification; it never synthesizes a child report or refunds.

## IR, Generated Types, and End-to-End Field Trace

Extend `protocol/host-protocol.ir.json` with closed top-level keys `identityTypes`, `identityObservations`, `approvalIntents`, and `childBudgetGrants` (replacing conflicting `controlIdentity`, abbreviated approval, and `budgetLedger.childSubsets` definitions). Generation fails unless every leaf has a Node type, C# type, canonical/digest rule, source API, equality rule, protocol membership, vector, mutation, error, and documentation row.

Exact generated outputs are:

- `src/nba2k27-myplayer/host/protocol-v1.mjs`: `validateControlIdentityTupleV1`, `validateIdentityObservationV1`, `validateIdentityObservationSetV1`, `validateChildBudgetGrantV1`, `validateChildAccountingV1`, canonicalizers/digests, seam/field/counter constants, and protocol validators. It never offers an abbreviated identity validator.
- `companion/windows/Generated/ProtocolModels.Generated.cs`: complete records `Utf16EvidenceV1`, `WindowIdentityV1`, `MonitorIdentityV1`, `VirtualDesktopV1`, `ControlIdentityTupleV1`, `IdentityObservationV1`, `IdentityObservationSetV1`, both grant variants, and `ChildAccountingV1`.
- `companion/windows/Generated/ControlIdentity.Generated.cs`: exact API source table, complete equality, seam/cardinality/chain/time/foreground rules, and no-optional-field policy.
- `companion/windows/Generated/BudgetLedger.Generated.cs` and `companion/windows/inspector/Generated/InspectorProtocol.Generated.cs`: kind-specific maxima/attempted maps, request/response schedules, `AttemptBudget`, accounting blocks, receipt/observation/grant records.
- `test/nba2k27-myplayer/generated/conformance-vectors.json`: all complete positive values and exact mutation families below; `error-catalog.json` contains every code in this addendum; `manifest.json` proves leaf-to-output/vector/mutation/doc bijection.
- Generated docs blocks in `docs/nba2k27-myplayer/host-companion-protocol.md`, `docs/nba2k27-myplayer/windows-host-preflight.md`, and `companion/windows/README.md`: full field/source/seam/approval/grant/accounting tables, no raw values, dormant status, and static-evidence limits.

Exact runtime carriage is mandatory:

- `InspectorReceiptV1` contains complete tuple and revision-1 observation set.
- Launch/action intents contain complete objects and paired digests as listed.
- `ControlLaunchCapabilityV1`, `ActionCapabilityV1`, hello/challenge/result, bind result, capture start/end, preview-source request/result, canary request/result, input request/result, error terminal, and close contain the complete current `IdentityObservationSetV1`; capture provenance includes complete before/after observations and their set digest.
- Recognition evidence contains the complete verified capture-after observation; sealed preview contains complete recognition evidence and preview-source observation; canary and native calls receive the complete current set. Native `RequireExactControlIdentity` compares every leaf before returning authority.
- A tuple digest, set digest, or “target/geometry/identity digest” may correlate records but never replaces the complete tuple/set at an authority seam. Existing `targetDigest`, `windowId`, `geometryDigest`, or shortened snapshot objects are deleted from control protocol 2.

## Exact Source Paths and Functions

Relative to `/home/joshl/projects/nba2k27-myplayer`:

- Add `src/nba2k27-myplayer/host/approval-intent-ledger.mjs` with the eight exact functions named above. Preserve `src/nba2k27-myplayer/security/approval.mjs` unchanged for legacy/public compatibility.
- Add/complete `src/nba2k27-myplayer/host/target-inspector.mjs:obtainInspectorReceipt,validateInspectorReceipt,consumeInspectorReceipt`; `run-capability.mjs:mintControlLaunchCapability,mintCanaryCapability,mintActionCapability`; `parent-budget-ledger.mjs:createParentBudgetLedger,reserveBudget,reconcileBudgetReport,terminalizeBudgetLedger`.
- Replace `launch-companion.mjs:launchCompanion` protocol-1 direct hello path with internal `validateControlHello`, `sendReservedRequest`, `acceptReservedResponse`, and `closeReservedSession`.
- Replace `protocol-session.mjs:ProtocolSession` control state with generated protocol-2 transitions and complete observation-set carriage; delete `DERIVABLE_ACTIONS` and `markPreviewed` as already planned.
- Replace `companion/windows/Identity.cs:TrySnapshot/Bind/RequireBound` with `ObserveControlIdentity`, `AppendIdentityObservation`, `RequireExactControlIdentity`, and `BindSelectedTarget`. Add exact P/Invokes for `GetWindow`, `GetAncestor`, `GetWindowLongPtrW`, `GetClassLongPtrW`, `IsWindowEnabled`, `GetWindowRect`, `DwmGetWindowAttribute`, `GetWindowDpiAwarenessContext`, `AreDpiAwarenessContextsEqual`, `GetMonitorInfoW`, and virtual-screen metrics.
- Add `companion/windows/ChildBudgetLedger.cs:InstallGrant,AcceptRequest,AttemptBudget,CreateAccounting,CloseWithAccounting`; add inspector equivalents inside `companion/windows/inspector/Program.cs` and generated inspector protocol.
- Replace `Protocol.cs:TryHandle` with generated parsing plus `OperationExecutor.ExecuteRequest`; replace `Program.cs:Main` synchronous loop with `RunAsync`; `OperationExecutor.ExecuteCapture/ExecuteInput` append observations and accounting exactly as above.

## Exact Vectors and Adversarial Tests

### Identity vectors

The generator emits one positive full workflow `identity-complete-valid` and the exact Cartesian family
`identity-<seam-id>-mutate-<field-id>` for all 11 seam IDs
`inspector-receipt,control-post-hello,capture-before,capture-after,preview-source,pre-canary,post-canary,pre-action,before-each-input-event,post-action,cancellation-terminal`
and these 34 field IDs:

```text
owner-null, owner-hwnd, owner-pid, owner-tid, owner-class-atom,
owner-class-length, owner-class-digest, owner-style, owner-exstyle,
owner-visible, owner-enabled,
root-owner-null, root-owner-hwnd, root-owner-pid, root-owner-tid,
root-owner-class-atom, root-owner-class-length, root-owner-class-digest,
root-owner-style, root-owner-exstyle, root-owner-visible, root-owner-enabled,
title-length, title-digest,
frame-left, frame-top, frame-right, frame-bottom,
content-left, content-top, content-right, content-bottom,
foreground-hwnd, foreground-relation
```

That is exactly 374 mutation vectors. Each mutation changes one schema-valid value after digest recomputation; every vector expects `E_CONTROL_IDENTITY_MISMATCH`, except null/incomplete required root owner or unavailable API vectors, which expect `E_CONTROL_IDENTITY_UNSUPPORTED`, and false pre-dispatch foreground relation, which expects `E_FOREGROUND_REQUIRED`. Separate exact vectors cover selected HWND, `GetWindowRect`, client-local/mapped corners, monitor, DPI, desktop, visibility/enabled/iconic/cloak, all other tuple leaves, sequence skip/replay/decrease, prior-digest mismatch, per-instance tick/frequency regression, wall-time nonadvance, stale age, changed set prefix, wrong receipt, and wrong cardinality. The manifest requires every tuple/observation leaf at every applicable seam; 374 is only the specifically required owner/title/frame/content/foreground subset.

Add `test/nba2k27-myplayer/host-identity-observation.test.mjs` with exact tests:

- `complete identity carries selected owner root-owner title frame content dpi monitor desktop and foreground at every seam`
- `identity mutation matrix rejects all 374 owner root-owner title frame content and foreground drifts`
- `observation sets enforce receipt equality sequence clocks chains cardinality and complete carriage`
- `unsupported owner root-owner dwm monitor dpi or foreground api makes control ineligible`

### Approval vectors/tests

Add `test/nba2k27-myplayer/host-approval-intent.test.mjs` with exact tests:

- `legacy public ApprovalLedger remains byte-for-byte compatible and cannot satisfy host intents`
- `launch intent is closed complete canonical opaque expiring and one-use`
- `launch approval rejects missing mismatched mutated cloned replayed expired and cross-kind handles`
- `action intent binds receipt observation capture provenance recognition preview actions transition canary geometry focus reservation and deadlines`
- `action approval rejects every missing mismatched mutated cloned replayed expired and cross-kind binding`
- `post-approval canary result and consumed action intent mint one final capability without widening authority`
- `canary result rejects wrong observation capture transition reservation grant expiry replay and action intent`
- `approval errors and logs disclose no token path title class receipt action or supplied value`

Generated vector IDs are `launch-approval-valid`, `action-approval-valid`, `launch-approval-missing-<field>`, `launch-approval-mutate-<field>`, `action-approval-missing-<field>`, and `action-approval-mutate-<field>` for every exact top-level and recursively required leaf; plus `*-expired`, `*-clone`, `*-replay`, `*-cross-kind`, `canary-result-valid`, and one `canary-result-mutate-<field>` per canary-result leaf. Manifest leaf coverage fixes the expanded list and count from the IR, so adding a field without vectors fails generation.

### Grant/accounting vectors/tests

Add/extend `test/nba2k27-myplayer/host-budget-ledger.test.mjs` with exact tests:

- `inspector grant permits only request response identity and cancellation counters with zero initial attempts`
- `control grant permits only its exact capture canary action event request response identity and cancellation counters`
- `child rejects wrong kind missing max nonzero baseline sequence expiry digest replay and forbidden counter`
- `child charges before every bounded operation response native event and never refunds`
- `hello challenge malformed rejection capture close and terminal accounting are reserved without circularity`
- `parent reconciles exact before delta after response count sequence chain and reservation once`
- `parent terminalizes on duplicate skipped decreasing excess unexpected reused or wrong-digest accounting`
- `partial response crash timeout cancellation and partial send consume reservations without refund`

Exact vector families are `grant-inspector-valid`, `grant-control-valid`, `grant-<kind>-wrong-kind`, `-missing-<counter>`, `-extra-<forbidden-counter>`, `-nonzero-initial-<counter>`, `-exhaust-<counter>`, `-sequence-low`, `-sequence-high`, `-expired`, `-wrong-config`, `-wrong-receipt`, `-wrong-capability`, `-wrong-reservation`, `-replay`; and reconciliation vectors `reconcile-valid-<response-kind>`, `reconcile-duplicate`, `-skip`, `-decrease-<counter>`, `-excess-<counter>`, `-unexpected-<counter>`, `-before-mismatch`, `-delta-mismatch`, `-after-mismatch`, `-prior-digest`, `-response-digest`, `-response-count`, `-reservation-reuse`, `-partial-eof`, and `-no-refund-partial-send`.

## Dependencies and Ordered Handoff

1. Preserve the historical ledger and all previously proved behavior. Add the identity/approval/grant test names and IR leaf-coverage assertions first.
2. Update closed IR/config/error catalog with the schemas, domains, seam cardinalities, intent fields, grant variants, deltas, response schedules, and vector families above.
3. Extend generator, independent JS interpreter, C# structural checker, mutation runner, generated types/docs/vectors/manifest. Exact generation and leaf bijection gate all runtime work.
4. Implement complete inspector tuple/receipt/observation revision 1 and inspector grant/accounting. Validate unsupported APIs and one receipt response/close transcript.
5. Implement internal host approval ledger, exact launch intent consume, receipt consume, control grant, launch capability, binary recheck, hello accounting, and post-hello observation—in that order.
6. Implement cumulative control observation sets through capture/recognition/preview; then exact action intent consume and canary capability/result.
7. Implement final capability mint, pre-action/per-event/post-action observations, child event accounting, parent reconciliation, one-call input, cancellation/terminal close, and unknown-outcome handling last.
8. Generate docs/status; preserve exact public exports/CLI/package/no-live boundaries; remove old abbreviated identity/approval/budget code only after all replacement gates pass.
9. Fresh independent artifact proof must pass before implementation; fresh implementation review and integration check remain required afterward. One bounded command-backed implementation remediation remains the maximum.

## Verification Gates

Run only from `/home/joshl/projects/nba2k27-myplayer`; these are future implementation gates, not checks performed by this planner:

```sh
node scripts/generate-host-protocol.mjs --check
node scripts/check-host-protocol.mjs
node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs test/nba2k27-myplayer/host-protocol-mutations.test.mjs test/nba2k27-myplayer/host-docs.test.mjs
node --test test/nba2k27-myplayer/host-identity-observation.test.mjs test/nba2k27-myplayer/host-approval-intent.test.mjs test/nba2k27-myplayer/host-budget-ledger.test.mjs test/nba2k27-myplayer/host-trust.test.mjs test/nba2k27-myplayer/host-capture.test.mjs test/nba2k27-myplayer/host-input-authority.test.mjs test/nba2k27-myplayer/host-cancellation.test.mjs
node --test test/nba2k27-myplayer/evidence-vault.test.mjs test/nba2k27-myplayer/host-cli.test.mjs test/nba2k27-myplayer/host-protocol.test.mjs test/nba2k27-myplayer/host-authority.test.mjs test/nba2k27-myplayer/host-recognition.test.mjs test/nba2k27-myplayer/host-discovery.test.mjs test/nba2k27-myplayer/host-adapter-integration.test.mjs
npm test
npm run check
npm run test:host
npm run check:host
npm run verify:no-live
npm run verify:pack
npm ls --all --json
npm pack --dry-run --json
command -v dotnet
command -v csc
```

Acceptance requires: 100% tuple/observation leaf×seam coverage; all 374 named core drift vectors; full recursive launch/action/canary leaf vectors; both exact grant variants and every counter/delta/reconciliation attack; unchanged legacy approval behavior; no abbreviated identity object; exact generation/dual interpretation/parsed C# mutation evidence; accurate dormant docs; no public/live authority or packed binary/private value. `dotnet`/`csc` remain expected unavailable; if present, stop instead of compiling or broadening scope.

## Assumptions, Tradeoffs, and Residual Risks

- The operator may separately focus the selected/root-owner window before receipt/canary/action. This workflow never acquires focus. Strict receipt equality intentionally forces a new receipt and approvals after any title, owner, root-owner, geometry, monitor, desktop, DPI, foreground-HWND, or other tuple change.
- Full cumulative observation sets increase wire size but remain bounded by config and eliminate digest-only identity ambiguity.
- Leaving the public legacy approval module unchanged avoids silently widening existing UI authority; the host ledger is internal and incompatible by design.
- Synthetic/fake/static evidence cannot prove C# compilation, ABI/marshaling, actual Win32 values, BlueStacks capture/frame age, focus/UIPI, `SendInput`, termination, or same-UID/cross-OS race resistance. Activation remains prohibited.

## Work Performed

- Summary: Resolved the three supplied plan blockers by inspecting the actual legacy approval ledger and host/native source, defining complete identity/observation schemas and seam sequence, selecting an internal typed approval-ledger replacement, and closing child grants/accounting/reconciliation without circular response authority.
- Files read: Contract/schema/template; supplied research/planner/validator artifacts; current `security/approval.mjs`, host modules/tests/index/package, and Windows `Identity.cs`, `Protocol.cs`, and `Program.cs`.
- Files changed: Only this required planner trace artifact; no implementation file was edited.
- Commands/checks: Read-only file/glob/content inspection only. No implementation, generation, tests, final validation, compiler/native/Windows/BlueStacks/ADB/network execution, Git/global configuration, or publication.

## Output Contract

- orderedPlanOrResolvedConclusions: Final precedence decisions and nine-step dependency order above.
- fileContractsOrDecisions: Exact identity/observation, approval intent/ledger, child grant/accounting/reconciliation schemas; source functions; generated outputs; tests; errors; vectors; docs.
- dependencies: `root-planner-006-final-plan-closure` and failed `root-validator-007-final-plan-proof`; all nonconflicting contracts from earlier plan artifacts remain prerequisites.
- verificationGates: Exact offline/static commands and acceptance conditions above.
- handoffNotes: A fresh artifact-proof validator must prove this addendum closes all three findings before any implementer dispatch. Implementation remains internal, fake/static, dormant, and no-live.
- Outputs: Zero-ambiguity synthesis closure for the final three seams.
- Evidence: Supplied validator findings plus direct read-only current-source inspection; these are implementation requirements, not implemented/runtime claims.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-008-plan-seams.md`
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-008-plan-seams.md`

## Handoff

- Next role: Fresh `validator` in `taskMode: artifact-proof`; only a PASS permits fresh bounded implementer work.
- Limitations: Plan synthesis and read-only source inspection only. Future files/tests do not exist and no acceptance validation was performed.
- Risks: Static evidence ceiling; strict API availability and foreground/title stability; same-UID/cross-OS replacement/collusion; target drift; GDI/frame-age; focus/UIPI; BlueStacks compatibility; all deferred native activation risks.
