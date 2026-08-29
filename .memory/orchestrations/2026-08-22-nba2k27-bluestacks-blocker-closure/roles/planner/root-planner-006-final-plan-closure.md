# Final Plan-Proof Closure Addendum

## Metadata

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- role: `planner`
- artifactId: `root-planner-006-final-plan-closure`
- createdAt: `2026-08-22`
- taskMode: `synthesis`
- delegationTaskId: `dt-finalize-plan-006`
- scopeKey: `integrated-plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh synthesis packet; closure research; original plan; first proof; remediation addendum; second proof; all three historical host-preparation validators; exact four-finding acceptance criteria.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing labels or values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; planned implementation root remains `/home/joshl/projects/nba2k27-myplayer`.

## Precedence and Four Resolved Conclusions

This artifact has **final normative precedence** over conflicting text in `root-planner-002-integrated-closure.md` and `root-planner-004-plan-remediation.md`.

1. **Complete identity:** original-plan sections “Complete authority and input contract” and “Discovery, identity, lifecycle, and cancellation,” plus remediation section “Non-Circular Inspector Receipt Authority,” are replaced by `ControlIdentityTupleV1` and the exact approval/launch sequence below. No companion-only dynamic observation may authorize control.
2. **Coordinates:** remediation section “Deterministic Recognition and Selector Semantics,” final bullet, is replaced by the authoritative virtual-desktop contract and checked conversion below. Virtual geometry is not selected by the control companion.
3. **Historical proof:** remediation section “Historical Reproduction Ledger” is replaced in full by the zero-placeholder ledger below. Abbreviated paths, unnamed generated functions, generic codes, and command grouping are not normative.
4. **Budgets:** original-plan guard steps 5 and 8 and remediation section “Event/Call Budget Semantics” are replaced by parent-owned `ParentBudgetLedgerV1`. Children enforce only delegated subsets and never own aggregate truth.

All other nonconflicting requirements remain mandatory: protocol 2; closed IR and deterministic generation; separate read-only inspector; framed raw-pixel capture; deterministic recognition; sealed preview and action approval; GDI ownership ledger; one `SendInput` call; unknown partial outcome; bounded discovery/cancellation; exact package/public/no-live boundary; static-evidence limitations; and Gates A–D.

## Decision 1 — `ControlIdentityTupleV1`

### Closed field contract

`ControlIdentityTupleV1` is a closed canonical object. Its exact ordered fields are:

```text
schemaVersion,
effectiveConfigDigest, calibrationProfileDigest,
inspectorWindowsFinalPath, inspectorWslExecutablePath, inspectorExecutableSha256,
inspectorBuildId, inspectorProtocolVersion,
controlWindowsFinalPath, controlWslExecutablePath, controlExecutableSha256,
controlBuildId, controlProtocolVersion, controlSignerPolicyDigest,
controlIntegrityPolicy, controlWindowsBuildPolicy, controlDpiMode,
inspectorLaunchChallenge, inspectorInvocationId,
controlLaunchChallenge, controlInvocationId, controlSessionChallenge, controlSessionClientNonce,
targetWindowsFinalPath, targetWindowsFinalPathSha256, targetExecutableSha256,
targetPid, targetProcessCreationFileTime,
targetParentPid, targetParentProcessCreationFileTime, targetParentExecutableSha256,
hwnd, hwndOwnerPid, hwndOwnerTid, hwndClassAtom, hwndClassName,
windowStyle, windowExStyle,
clientLeftScreen, clientTopScreen, clientWidth, clientHeight,
windowVisible, windowClientVisible, windowIconic, windowCloaked,
processDpiAwarenessContext, windowDpi,
virtualDesktopX, virtualDesktopY, virtualDesktopWidth, virtualDesktopHeight,
monitorDeviceName, monitorIdentitySha256,
monitorLeft, monitorTop, monitorRightExclusive, monitorBottomExclusive,
observationSequence, observationStartedMonotonicTicks,
observationEndedMonotonicTicks, monotonicFrequency,
observationStartedUtcMs, observationEndedUtcMs
```

Canonical JSON is UTF-8, closed, duplicate-free, integer-only, lexicographically keyed, with domain `control-identity-tuple/v1`. Paths are retained only inside the parent/inspector/control authority boundary; ordinary public output uses tuple/digest and policy results, not raw paths. `hwnd` is lowercase 1–16 hex digits. PID/TID/FILETIME/atom/style/ex-style are nonnegative integers in their Win32 widths; PID/TID and creation times are positive. Screen/desktop coordinates are signed 32-bit integers, but all addition/subtraction is checked signed 64-bit. Width/height/DPI/frequency are positive. Rectangle right/bottom values are exclusive.

### Source classification and admissibility

| Fields | Classification | Authority and rule |
| --- | --- | --- |
| `effectiveConfigDigest`, `calibrationProfileDigest`; all inspector/control paths, digests, build/protocol/policy values; configured target path/hash/class/style/DPI/monitor policy | **pinned** | Produced by `validateTrustedConfig`/`canonicalizeHostConfig`; exact equality everywhere. A configured policy/range is not replaced by a child observation. |
| `inspectorWslExecutablePath`, `inspectorExecutableSha256`, `controlWslExecutablePath`, `controlExecutableSha256`; challenges/nonces/invocation IDs | **parent-observed** | Parent obtains paths through strict mapping, hashes verified descriptors, and generates 32-byte challenges/nonces plus safe invocation IDs before the inspector launch. Control values remain unused and undisclosed to the control until its one launch. Exact equality. |
| Target process/parent/window/class/string/styles/rectangles/visibility/DPI/virtual-desktop/monitor fields and receipt observation interval | **inspector-observed** | Read-only inspector obtains them with Win32 APIs from the operator-selected HWND during one challenge. They become control-authoritative only through the directly correlated branded receipt. |
| The same target/window/DPI/desktop/monitor fields and each control observation interval | **control-reobserved** | Control obtains them independently at bind, capture-before, capture-after, preview source check, canary-before, canary-after, and final pre-input seam. Identity fields must exactly equal the receipt; interval fields obey ordering/freshness rules below. |

Unsupported is not a value in the tuple. If the inspector or control cannot authoritatively obtain target parent PID/creation/image, owner PID/TID, class atom and exact class string, client visibility, DPI-awareness context, virtual geometry, or monitor identity/bounds, it returns the exact terminal code `E_CONTROL_IDENTITY_UNSUPPORTED`; control is ineligible. This resolves “where supported” without silently dropping fields.

### Authoritative observations and equality/range rules

- Inspector obtains final target path from the opened process handle, hashes its canonical uppercase Windows form as `targetWindowsFinalPathSha256`, hashes the opened image bytes as `targetExecutableSha256`, and obtains PID/creation and parent PID/creation/image. All must equal pinned target policy. Parent PID may be zero only in observation mode; zero is `E_CONTROL_IDENTITY_UNSUPPORTED` in control mode.
- Inspector obtains HWND owner PID/TID with `GetWindowThreadProcessId`; owner PID must equal `targetPid`. It obtains `GCW_ATOM`, exact `GetClassNameW` text, `GWL_STYLE`, and `GWL_EXSTYLE`; atom, string, masks, and configured class digest must agree exactly.
- `clientLeftScreen/clientTopScreen` come from checked `ClientToScreen(hwnd,{0,0})`; width/height come from `GetClientRect`. The opposite corner is recomputed with checked 64-bit addition. `windowVisible=true`, `windowClientVisible=true`, `windowIconic=false`, and `windowCloaked=false` are required. “Client visible” means `IsWindow`, `IsWindowVisible`, non-iconic, non-cloaked, positive client rectangle, and at least one client pixel intersects the authoritative virtual desktop.
- `processDpiAwarenessContext` is the canonical generated enum for `GetWindowDpiAwarenessContext`/`AreDpiAwarenessContextsEqual`; `windowDpi=GetDpiForWindow(hwnd)`. Both exactly match receipt and configured policy.
- Virtual desktop is obtained only as the four-value snapshot `SM_XVIRTUALSCREEN`, `SM_YVIRTUALSCREEN`, `SM_CXVIRTUALSCREEN`, `SM_CYVIRTUALSCREEN`. Width/height must be positive; checked exclusive end must fit signed 64-bit. Monitor device name, `MONITORINFOEX` bounds, and a digest over exact device name plus bounds form monitor identity. `MonitorFromWindow(hwnd,MONITOR_DEFAULTTONEAREST)` must name that monitor. Monitor bounds must be positive and contained in the virtual desktop.
- Stable identity equality is byte/integer/Boolean exact; no case folding, path re-resolution, tolerance, clamping, policy substitution, or digest-only omission is allowed. The control observation’s canonical identity projection (all tuple fields except observation interval/sequence) must equal the receipt projection.
- Receipt has `observationSequence=1`. For the control process, sequence starts at 1 and increases by exactly one per snapshot. Each interval satisfies `0 < startTicks <= endTicks`, fixed positive frequency, `startUtcMs <= endUtcMs`, and duration `ceil((end-start)*1000/frequency) <= limits.identityObservationMs`. Parent receipt time is at or after receipt end; parent request/response monotonic interval encloses the child interval within configured clock-skew bounds. Receipt expiry is exactly `observationEndedUtcMs + limits.receiptTtlMs`.
- Capture-before and capture-after identity projections are exact equal; sequence increments by one and intervals are monotonic/nonoverlapping. Preview binds the verified capture-after tuple digest. Canary and final pre-input observations must occur after preview/action approval and before its expiry. Final pre-input observation must end no more than `limits.preInputIdentityAgeMs` before `SendInput` entry.
- Any mismatch, replayed/non-increasing sequence, reversed interval, excessive age/duration/skew, expired receipt/approval, or unsupported field is terminal before further authority: `E_CONTROL_IDENTITY_MISMATCH`, `E_OBSERVATION_SEQUENCE`, `E_OBSERVATION_TIME`, or `E_CONTROL_IDENTITY_UNSUPPORTED` respectively.

### Receipt, approval, capability, hello, and operation bindings

`InspectorChallengeV1` contains the pinned/parent-observed tuple fields available pre-observation, `ParentBudgetLedgerV1` ID and inspector reservation envelope, operator-selected HWND, and one fresh `inspectorLaunchChallenge`. `InspectorReceiptV1` contains the challenge echo, the complete tuple, receipt expiry, attempted local budget totals, and `receiptDigest = SHA256("inspector-receipt/v1" || canonical receipt without receiptDigest)`.

`LaunchApprovalIntentV1` contains exactly `receiptDigest`, `controlIdentityTupleDigest`, `effectiveConfigDigest`, `calibrationProfileDigest`, `receiptExpiresUtcMs`, `approvalExpiresUtcMs` (equal to receipt expiry), control mode, and the current ledger digest. The existing closed `ApprovalLedger` records an operator’s explicit approval of that exact canonical intent; no default or public CLI creates it. `launchApprovalDigest` covers the entire intent.

`ControlLaunchCapabilityV1` contains the exact tuple projection, receipt and approval IDs/digests/expiries, control challenge/client nonce/invocation, ledger ID plus launch reservation envelope, allowed observation/capture/preview operations, and `inputAllowed=false`. A later `ActionCapabilityV1` is minted only from a sealed preview and a second exact operator action approval; it binds the same tuple digest, authoritative virtual desktop, receipt lineage, capture/recognition/preview/action/canary fields, expiry, and its budget reservation. Launch approval never authorizes input.

Static `ControlHelloExpectationV1` is derived only from parent pins/observations and the launch capability: protocol/capabilities/build ID, effective config/calibration digest, control Windows/WSL path digests, parent-observed executable SHA-256, signer/integrity/Windows-build/DPI policies, control challenge/client nonce/invocation, receipt/tuple digest, ledger/reservation digest, and `inputAllowed=false`. The hello must exactly echo it. PID, creation, final opened path, signer result, integrity result, Windows build, and DPI result remain observations and cannot establish executable trust; they must be checked against pins/receipt before operations.

The tuple digest is present unchanged in inspector receipt, launch approval intent, control launch capability, hello expectation/echo, bind result, capture start/end, recognition evidence, sealed preview, action approval, canary authorization/result, input request, and final pre-input result. Capture records additionally include their complete before/after observations, not only the digest.

### Exact approval-time and launch sequence

The parent executes this order serially; no step may be reordered or combined:

1. Validate/deep-freeze config and calibration; create `ParentBudgetLedgerV1`; generate the one inspector challenge/invocation and the one reserved-but-undisclosed control launch challenge/session challenge/client nonce/invocation that the receipt, approval, capability, and hello will share.
2. Map inspector path and call `openPinnedRegularFile`; immediately before spawn recheck descriptor/path identity and digest. Reserve inspector launch plus its exact protocol request/response budgets, permanently consume them, then spawn exactly once.
3. Send one `InspectorChallengeV1`. Accept exactly one correlated `InspectorReceiptV1`, then clean EOF and zero exit. Validate full tuple, challenge, local budget report, interval, TTL, config/calibration, target policy, and control eligibility. Canonicalize receipt and retain only a process-branded immutable object and digest.
4. Present `LaunchApprovalIntentV1`. The operator explicitly approves that exact receipt/config/calibration/TTL/ledger digest. `ApprovalLedger.consume` consumes that approval once; no receipt or capability is consumed yet if approval fails.
5. In one parent critical section, check approval and receipt unexpired; `consumeInspectorReceipt` marks the branded receipt used; reserve/consume capability-mint and control-launch budgets; mint one `ControlLaunchCapabilityV1`. A failure after either consume is terminal and neither is restored.
6. Immediately remap/reopen/re-hash/recheck the configured control executable. Any drift terminates the consumed capability. Use the fresh, still-unused control challenge/session challenge/client nonce/invocation committed by the receipt and capability, derive `ControlHelloExpectationV1`, and spawn the exact verified path once.
7. Send one hello challenge and accept one exact static hello plus clean protocol correlation. Child self-reports do not replace parent executable trust. Derive session ID only from parent challenge/nonces/invocation, executable/config/calibration/receipt/tuple/ledger digests, and protocol—not child PID/time.
8. Before capture, the control reobserves the full tuple and exact-matches the unexpired receipt. Capture-before/after repeat the match. Recognition and preview use only verified pixels and bind the tuple/desktop digest.
9. Operator action approval consumes the exact preview/action/tuple/desktop/budget/TTL digest once. Canary authorization performs another tuple match; after canary, capture/recognition prove the registered state.
10. Immediately before any input, reserve the whole action/event recipe, reobserve the full tuple and virtual desktop, require exact receipt/preview/canary equality and unexpired approvals, then make one `SendInput`. Replay, expiry, drift, budget mismatch, partial send, EOF, cancel after dispatch, or post-check drift terminates with no retry.

This has no circular trust: the parent authenticates the inspector and control files; the inspector authoritatively observes the target; the control only corroborates target state. Neither child attests its own executable into authority.

## Decision 2 — Authoritative Virtual Desktop and Exact Coordinate Conversion

The tuple fields `virtualDesktopX/Y/Width/Height`, monitor identity/bounds, and screen-space client rectangle are mandatory in receipt, launch approval/capability, capture, recognition, preview, action approval, canary, and input. Inspector obtains them during receipt; control reobtains them at every observation and immediately before input. Equality is exact.

For a recognized client hotspot `(pX,pY)` and client extents `(clientWidth,clientHeight)`:

1. Require widths/heights positive and within config. Require `0 <= pX < clientWidth` and `0 <= pY < clientHeight`. Negative local coordinates, exclusive endpoints, zero/negative extents, and unsafe integers reject `E_COORDINATE_BOUNDS`.
2. Selector encode remains `n==1 ? 0 : floor((2*p*999999+(n-1))/(2*(n-1)))`; decode remains `n==1 ? 0 : floor((2*u*(n-1)+999999)/(2*999999))`. Require integer `0 <= u <= 999999` and exact `decode(encode(p))==p`; otherwise `E_SELECTOR_ROUNDTRIP`.
3. Compute screen pixel with checked signed 64-bit: `screenX=clientLeftScreen+decodedX`, `screenY=clientTopScreen+decodedY`. Negative screen coordinates are valid only when the virtual desktop origin is negative and the point is inside it.
4. Compute checked exclusive ends `vRight=virtualDesktopX+virtualDesktopWidth`, `vBottom=virtualDesktopY+virtualDesktopHeight`. Require `virtualDesktopX <= screenX < vRight` and `virtualDesktopY <= screenY < vBottom`; otherwise `E_COORDINATE_OFF_DESKTOP`. No clamping occurs.
5. Let `dX=screenX-virtualDesktopX`, `dY=screenY-virtualDesktopY`. Require `0 <= dX < virtualDesktopWidth` and equivalent Y. Normalize round-half-up:
   `absX = width==1 ? 0 : floor((2*dX*65535+(width-1))/(2*(width-1)))`, and likewise Y. Checked multiplication/addition overflow is `E_COORDINATE_OVERFLOW`. Output is inclusive `0..65535`: desktop origin maps to 0 and final included pixel maps to 65535. For extent 1, only delta 0 is accepted and maps to 0.
6. A click is one `INPUT[3]` in one call: move flags `MOUSEEVENTF_MOVE|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_VIRTUALDESK` (`0xC001`), left-down flags `MOUSEEVENTF_LEFTDOWN|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_VIRTUALDESK` (`0xC002`), and left-up flags `MOUSEEVENTF_LEFTUP|MOUSEEVENTF_ABSOLUTE|MOUSEEVENTF_VIRTUALDESK` (`0xC004`). All three carry the same `absX/absY`. A key pair has exactly key-down/key-up and no mouse coordinates.

Vectors exhaust extents 1–4096, local endpoints, 0/65535 desktop endpoints, negative virtual origins, multi-monitor bounds, off-desktop client pixels, zero/negative extents, exclusive endpoints, and all checked-overflow terms. The approved recognized hotspot must round-trip to the exact dispatched in-client pixel.

## Decision 3 — Zero-Placeholder Historical Reproduction Ledger

Every path is relative to `/home/joshl/projects/nba2k27-myplayer`. A name marked **new** is the exact test/function the implementer must add. Existing tests retain their exact current names unless replaced after an equivalent new test is green.

| Reproduction category | Current or exact proposed path/function | Stable outcome | Exact test file and test name | Exact command/probe |
| --- | --- | --- | --- | --- |
| Package/workspace vault containment independent of cwd | `src/nba2k27-myplayer/host/trusted-config.mjs:validateTrustedConfig` | valid sibling `ok`; package/workspace child `E_EVIDENCE_CONTAINMENT` | `test/nba2k27-myplayer/host-authority.test.mjs` — `config rejects defaults, network/device paths, unknowns, excessive TTL and package evidence independent of cwd` (extend with workspace child) | `node --test test/nba2k27-myplayer/host-authority.test.mjs` |
| Vault absolute/canonical/root exclusions | `src/nba2k27-myplayer/host/evidence-vault.mjs:trustedRoot`; `src/nba2k27-myplayer/host/trusted-config.mjs:validateTrustedConfig` | `E_VAULT_ROOT` or `E_EVIDENCE_CONFIG` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `vault rejects relative mnt dot dotdot duplicate and trailing-separator roots` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Symlink and insecure root | `src/nba2k27-myplayer/host/evidence-vault.mjs:trustedRoot` | `E_VAULT_TRUST` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — `vault rejects symlink roots and non-owner-only modes` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Run/file mode, owner, link, nonregular content | `src/nba2k27-myplayer/host/evidence-vault.mjs:createEvidenceRun/writeEvidence/cleanupEvidence` | `E_VAULT_RUN`, `E_VAULT_CONTENT`, or `E_QUARANTINE_CONTENT` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `vault rejects insecure run file hard-link symlink directory and nonregular content` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Run/root identity replacement | `src/nba2k27-myplayer/host/evidence-vault.mjs:createEvidenceRun/writeEvidence` | `E_VAULT_IDENTITY` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — `vault rejects a stale handle after same-path run replacement` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Clone/forged handle | `src/nba2k27-myplayer/host/evidence-vault.mjs:records/writeEvidence` | genuine succeeds; clone/forged `E_VAULT_HANDLE` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — `vault atomically enforces cumulative count/bytes and rejects cloned/forged handles` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Concurrent cumulative byte quota | `src/nba2k27-myplayer/host/evidence-vault.mjs:locked/writeEvidence` | one 2-byte write succeeds under max 3; second genuine call `E_VAULT_QUOTA` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `vault serializes genuine concurrent writes by filesystem identity and enforces cumulative bytes` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Cumulative file quota | `src/nba2k27-myplayer/host/evidence-vault.mjs:writeEvidence` | first succeeds; second `E_VAULT_QUOTA` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — `owner-only vault enforces modes, exclusive writes, quotas, TTL and cleanup` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| TTL exact boundary | `src/nba2k27-myplayer/host/evidence-vault.mjs:evidenceStatus/cleanupEvidence`; `src/nba2k27-myplayer/host/trusted-config.mjs:validateTrustedConfig` | expiry-1 retained; exact expiry removed; bad TTL `E_EVIDENCE_CONFIG` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `vault expires at the exact ttl boundary and never early` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Quarantine identity/content/quota | `src/nba2k27-myplayer/host/evidence-vault.mjs:cleanupEvidence` | `E_QUARANTINE_IDENTITY` or `E_QUARANTINE_CONTENT` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `cleanup rejects quarantine replacement links nesting modes and quota overflow` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Exact retained path before/after rename | `src/nba2k27-myplayer/host/evidence-vault.mjs:fail/cleanupEvidence` | pre-rename source absolute path; post-rename quarantine absolute path | `test/nba2k27-myplayer/evidence-vault.test.mjs` — `cleanup failures report the exact absolute retained quarantine path` (extend with pre-rename injection) | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Post-delete proof | `src/nba2k27-myplayer/host/evidence-vault.mjs:cleanupEvidence` | stable deletion `ok`; parent replacement `E_CLEANUP_IDENTITY`; residue `E_CLEANUP_FAILED` | `test/nba2k27-myplayer/evidence-vault.test.mjs` — **new** `cleanup revalidates parent identity and quarantine absence after deletion` | `node --test test/nba2k27-myplayer/evidence-vault.test.mjs` |
| Duplicate JSON at every depth | `src/nba2k27-myplayer/cli.mjs:readBoundedJson`; generated `src/nba2k27-myplayer/host/protocol-v1.mjs:parseClosedJson` | `E_DUPLICATE_KEY` | `test/nba2k27-myplayer/host-cli.test.mjs` — `host CLI rejects duplicate keys, excessive depth, trailing data and unknown fake fields without path disclosure` (extend nested/array object) | `node --test test/nba2k27-myplayer/host-cli.test.mjs` |
| CLI byte/depth/key/node/array/string bounds and trailing JSON | `src/nba2k27-myplayer/cli.mjs:readBoundedJson/readBoundedBytes`; `src/nba2k27-myplayer/host/protocol-v1.mjs:parseClosedJson` | `E_INPUT_BOUNDS` or `E_JSON_PARSE` | `test/nba2k27-myplayer/host-cli.test.mjs` — **new** `host CLI enforces exact host JSON and byte bounds` | `node --test test/nba2k27-myplayer/host-cli.test.mjs` |
| Unknown fake/config fields | `src/nba2k27-myplayer/cli.mjs:runCli`; `src/nba2k27-myplayer/host/trusted-config.mjs:validateTrustedConfig` | `E_FAKE_ONLY`, `E_FAKE_SHAPE`, or `E_CONFIG_SHAPE` | `test/nba2k27-myplayer/host-cli.test.mjs` — `host CLI rejects duplicate keys, excessive depth, trailing data and unknown fake fields without path disclosure` | `node --test test/nba2k27-myplayer/host-cli.test.mjs` |
| Live/network/ADB/executable routes | `src/nba2k27-myplayer/cli.mjs:COMMAND_FLAGS/parseArgs` | `E_COMMAND` or `E_FLAG` | `test/nba2k27-myplayer/host-cli.test.mjs` — **new** `host CLI has no live capture adb inspector launch receipt or executable flag` | `node --test test/nba2k27-myplayer/host-cli.test.mjs` |
| Supplied path canary and fake response leakage | `src/nba2k27-myplayer/cli.mjs:compactDiagnostics/runCli` | valid fake summary omits canary/path/token/response; invalid fixture returns `E_FAKE_ONLY` or `E_FAKE_SHAPE` without supplied text | `test/nba2k27-myplayer/host-cli.test.mjs` — `host CLI rejects duplicate keys, excessive depth, trailing data and unknown fake fields without path disclosure` and `fake host output is a closed summary and never echoes fixture fields` | `node --test test/nba2k27-myplayer/host-cli.test.mjs` |
| Direct protocol state bypass | generated `src/nba2k27-myplayer/host/protocol-v1.mjs:assertTransition`; `src/nba2k27-myplayer/host/protocol-session.mjs:ProtocolSession.request` | `E_STATE` or `E_INPUT_NOT_AUTHORIZED` | `test/nba2k27-myplayer/host-protocol.test.mjs` — `session enforces every handshake, target, capture, preview, approval, canary and budget predecessor` | `node --test test/nba2k27-myplayer/host-protocol.test.mjs` |
| Handshake-free/type-invalid hello | generated `src/nba2k27-myplayer/host/protocol-v1.mjs:validateHelloResult`; `src/nba2k27-myplayer/host/protocol-session.mjs:ProtocolSession.acceptHello` | `E_HELLO_CORRELATION` or `E_BODY_SHAPE` | `test/nba2k27-myplayer/host-protocol.test.mjs` — **new** `transcript rejects handshake-free and type-invalid hello results` | `node --test test/nba2k27-myplayer/host-protocol.test.mjs` |
| Incomplete request/capture at EOF | generated `src/nba2k27-myplayer/host/protocol-v1.mjs:validateTranscript`; `src/nba2k27-myplayer/host/capture-reassembler.mjs:finishCaptureStream` | `E_TRANSCRIPT_INCOMPLETE` or `E_CAPTURE_TRUNCATED` | `test/nba2k27-myplayer/host-protocol.test.mjs` — **new** `transcript rejects outstanding request and partial capture at eof` | `node --test test/nba2k27-myplayer/host-protocol.test.mjs` |
| Invalid canary fixture | `test/nba2k27-myplayer/support/render-protocol-vector.mjs:renderProtocolVector` (**new**); `test/nba2k27-myplayer/generated/conformance-vectors.json:canary-valid/canary-invalid-body` | exact vector passes; mutated body `E_BODY_SHAPE` | `test/nba2k27-myplayer/host-protocol-generation.test.mjs` — **new** `generated canary transcript is schema-valid and mutation-sensitive` | `node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs` |
| Replay/wrong identity/correlation/staleness | generated `src/nba2k27-myplayer/host/protocol-v1.mjs:validateCorrelation/assertFreshObservation`; `src/nba2k27-myplayer/host/protocol-session.mjs:ProtocolSession.response` | `E_SEQUENCE`, `E_SESSION_BINDING`, `E_CORRELATION`, or `E_OBSERVATION_TIME` respectively | `test/nba2k27-myplayer/host-protocol.test.mjs` — `session rejects correlation, replay, stale response and post-dispatch uncertainty` (extend four exact cases) | `node --test test/nba2k27-myplayer/host-protocol.test.mjs` |
| Arbitrary/incomplete/replayed capability | `src/nba2k27-myplayer/host/run-capability.mjs:mintRunCapability/consumeRunCapability` | `E_CAPABILITY_BINDING`; replay `CAPABILITY_INVALID` | `test/nba2k27-myplayer/host-authority.test.mjs` — `capability mint is closed, validated, immutable, one-use and launcher-bound` and `control capability requires every immutable process/window/capture/preview/approval/canary/budget binding` | `node --test test/nba2k27-myplayer/host-authority.test.mjs` |
| Unsolicited/early/duplicate/extra child output | `src/nba2k27-myplayer/host/launch-companion.mjs:launchCompanion`; `src/nba2k27-myplayer/host/protocol-session.mjs:ProtocolSession.acceptHello/response` | `E_HELLO_CORRELATION`, `E_CHILD_EARLY_EXIT`, or `E_STDOUT_AFTER_TERMINAL` | `test/nba2k27-myplayer/host-authority.test.mjs` — `launcher requires correlated hello and exact terminal close transcript` | `node --test test/nba2k27-myplayer/host-authority.test.mjs` |
| Malformed/partial/overflow/error/nonzero/signal/abort/timeout child lifecycle | `src/nba2k27-myplayer/host/launch-companion.mjs:launchCompanion` | `E_STDOUT_PROTOCOL`, `E_STDOUT_PARTIAL`, `E_STDOUT_BOUNDS`, `E_STDERR_BOUNDS`, `E_CHILD_ERROR`, `E_CHILD_NONZERO`, `E_CHILD_SIGNAL`, `E_LAUNCH_ABORTED`, `E_STARTUP_TIMEOUT` | `test/nba2k27-myplayer/host-authority.test.mjs` — `launcher lifecycle rejects malformed, partial, stderr overflow, child error/nonzero/signal/early exit and abort using fake children only` (extend stdout aggregate) | `node --test test/nba2k27-myplayer/host-authority.test.mjs` |
| Wrong hello identity/self-attestation | `src/nba2k27-myplayer/host/executable-identity.mjs:openPinnedRegularFile`; `src/nba2k27-myplayer/host/target-inspector.mjs:validateInspectorReceipt`; `src/nba2k27-myplayer/host/launch-companion.mjs:validateControlHello` (**new exact functions/paths**) | static mismatch `E_HELLO_IDENTITY`; receipt mismatch `E_CONTROL_IDENTITY_MISMATCH` | `test/nba2k27-myplayer/host-trust.test.mjs` — **new** `control hello rejects every static mutation and companion observation cannot authorize` | `node --test test/nba2k27-myplayer/host-trust.test.mjs` |
| Inspector receipt completeness, replay, approval order | `src/nba2k27-myplayer/host/target-inspector.mjs:obtainInspectorReceipt/validateInspectorReceipt/consumeInspectorReceipt`; `src/nba2k27-myplayer/host/run-capability.mjs:mintControlLaunchCapability` (**new**) | `E_CONTROL_IDENTITY_UNSUPPORTED`, `E_CONTROL_RECEIPT`, or `E_APPROVAL_BINDING` | `test/nba2k27-myplayer/host-trust.test.mjs` — **new** `receipt approval consumption and control launch capability follow one exact sequence` | `node --test test/nba2k27-myplayer/host-trust.test.mjs` |
| Synthetic/hash-derived preview | `src/nba2k27-myplayer/host/recognizer.mjs:recognizeCapture`; `src/nba2k27-myplayer/host/preview-sealer.mjs:sealPreview`; delete `src/nba2k27-myplayer/host/protocol-session.mjs:ProtocolSession.markPreviewed` | caller state/selector `E_PREVIEW_BINDING`; synthetic recognized vector succeeds | `test/nba2k27-myplayer/host-recognition.test.mjs` — **new** `preview derives selector states and transition only from verified pixels and profile` | `node --test test/nba2k27-myplayer/host-recognition.test.mjs` |
| Capture omission/fake freshness/GDI ordering | `src/nba2k27-myplayer/host/capture-reassembler.mjs:beginCaptureStream/acceptCaptureChunk/finishCaptureStream`; `companion/windows/Capture.cs:Read`; `companion/windows/OperationExecutor.cs:ExecuteCapture` (**new**) | `E_CAPTURE_START`, `E_CAPTURE_CHUNK_ORDER`, `E_CAPTURE_CHUNK_LENGTH`, `E_CAPTURE_CHUNK_DIGEST`, `E_CAPTURE_PIXEL_DIGEST`, `E_CAPTURE_PROVENANCE`, `E_CAPTURE_IDENTITY`, or `E_CAPTURE_TIME`; `fresh` rejects `E_BODY_SHAPE`; GDI errors are `E_GDI_GET_DC`, `E_GDI_CREATE_DC`, `E_GDI_CREATE_BITMAP`, `E_GDI_SELECT`, `E_GDI_BITBLT`, `E_GDI_RESTORE`, `E_GDI_GET_DIBITS`, `E_GDI_CLEANUP_RESTORE`, `E_GDI_CLEANUP_OBJECT`, `E_GDI_CLEANUP_DC`, `E_GDI_CLEANUP_RELEASE`, or `E_GDI_CLEANUP` | `test/nba2k27-myplayer/host-capture.test.mjs` — **new** `capture transports exact pixels and rejects every framing provenance identity time and gdi mutation` | `node --test test/nba2k27-myplayer/host-capture.test.mjs` |
| Under-bound input, endpoint and partial send | generated `src/nba2k27-myplayer/host/protocol-v1.mjs:validateActionAuthority`; `companion/windows/OperationExecutor.cs:ExecuteInput`; `companion/windows/Input.cs:PrepareAuthorizedInput/DispatchReservedInput` (**new**) | `E_ACTION_BINDING`, `E_COORDINATE_BOUNDS`, `E_COORDINATE_OFF_DESKTOP`, `E_COORDINATE_OVERFLOW`, or `E_SELECTOR_ROUNDTRIP`; partial result `ACTION_OUTCOME_UNKNOWN` | `test/nba2k27-myplayer/host-input-authority.test.mjs` — **new** `input binds complete tuple preview approval canary budgets coordinates and one send` | `node --test test/nba2k27-myplayer/host-input-authority.test.mjs` |
| Virtual-desktop drift and coordinate endpoints | `companion/windows/Input.cs:ConvertClientPixelToVirtualAbsolute`; `companion/windows/Identity.cs:ObserveControlIdentity` (**new**) | `E_CONTROL_IDENTITY_MISMATCH`, `E_COORDINATE_BOUNDS`, `E_COORDINATE_OFF_DESKTOP`, or `E_COORDINATE_OVERFLOW` | `test/nba2k27-myplayer/host-input-authority.test.mjs` — **new** `virtual desktop conversion is exact at endpoints negative origins and drift seams` | `node --test test/nba2k27-myplayer/host-input-authority.test.mjs` |
| Ambient discovery/incomplete identity | `companion/windows/Identity.cs:Discover/ObserveControlIdentity/BindSelectedTarget` (**new replacements for `TrySnapshot`/old `Bind`**) | `E_DISCOVERY_FILTER`, `E_DISCOVERY_LIMIT`, `E_CONTROL_IDENTITY_UNSUPPORTED`, or `E_CONTROL_IDENTITY_MISMATCH` | `test/nba2k27-myplayer/host-discovery.test.mjs` — **new** `discovery filters before expensive work and bind observes the complete control tuple` | `node --test test/nba2k27-myplayer/host-discovery.test.mjs` |
| Cancel absent/synchronous worker | `companion/windows/Program.cs:RunAsync`; `companion/windows/OperationExecutor.cs:ExecuteAsync`; `companion/windows/RequestCancellationRegistry.cs:Cancel` (**new**) | pre-dispatch `E_CANCELLED`; at/after send `ACTION_OUTCOME_UNKNOWN` | `test/nba2k27-myplayer/host-cancellation.test.mjs` — **new** `reader remains concurrent and every cancel eof timeout seam has one terminal outcome` | `node --test test/nba2k27-myplayer/host-cancellation.test.mjs` |
| Cross-process budget bypass | `src/nba2k27-myplayer/host/parent-budget-ledger.mjs:createParentBudgetLedger/reserveBudget/reconcileBudgetReport`; `companion/windows/Generated/BudgetLedger.Generated.cs:LocalBudgetSubset` | `E_BUDGET_RESERVATION`, `E_BUDGET_EXHAUSTED`, or `E_BUDGET_RECONCILIATION` | `test/nba2k27-myplayer/host-budget-ledger.test.mjs` — **new** `parent ledger serializes inspector control capture preview canary action event cancel and cleanup authority` | `node --test test/nba2k27-myplayer/host-budget-ledger.test.mjs` |
| Token-only C# parity | `scripts/check-host-protocol.mjs:checkGeneratedCSharp`; `test/nba2k27-myplayer/support/csharp-structural-checker.mjs:checkCSharpStructure`; delete `test/nba2k27-myplayer/windows-contract.test.mjs` | unchanged tree passes; each semantic mutation fails | `test/nba2k27-myplayer/host-protocol-mutations.test.mjs` — **new** `every semantic rule mutation invalidates node csharp vectors and structural proof` | `node scripts/check-host-protocol.mjs && node --test test/nba2k27-myplayer/host-protocol-mutations.test.mjs` |
| Stale cleanup/native protocol docs | `scripts/generate-host-protocol.mjs:renderDocumentation`; `docs/nba2k27-myplayer/host-companion-protocol.md` and `docs/nba2k27-myplayer/windows-host-preflight.md` generated blocks | mutation `E_GENERATED_STALE`; examples execute | `test/nba2k27-myplayer/host-docs.test.mjs` — **new** `generated status retained-path protocol and unknown-outcome text cannot drift` | `node scripts/generate-host-protocol.mjs --check && node --test test/nba2k27-myplayer/host-docs.test.mjs` |
| Public/deep authority reachability | `test/nba2k27-myplayer/verify-no-live.mjs:verifyPublicAuthorityBoundary` (**new internal function**); `src/nba2k27-myplayer/cli.mjs:runCli` | root/CLI authority undefined; deep import `ERR_PACKAGE_PATH_NOT_EXPORTED` | `test/nba2k27-myplayer/host-authority.test.mjs` — **new** `public root cli and package deep imports expose no privileged authority` | `node --test test/nba2k27-myplayer/host-authority.test.mjs && npm run verify:no-live` |
| Package whitelist/no binaries/tests/live data | `test/nba2k27-myplayer/verify-pack.mjs:verifyPackInventory` (**new internal function**) | `PACK_OK`; injected denied path returns assertion failure | `test/nba2k27-myplayer/verify-pack.mjs` — **new internal test case** `verifyPackInventory rejects every denied package class` | `npm run verify:pack && npm pack --dry-run --json` |
| No-live source/runtime routes | `test/nba2k27-myplayer/verify-no-live.mjs:verifyNoLiveBoundary` (**new internal function**); `src/nba2k27-myplayer/cli.mjs:parseArgs` | `NO_LIVE_OK`; injected route returns assertion failure | `test/nba2k27-myplayer/verify-no-live.mjs` — **new internal test case** `verifyNoLiveBoundary rejects privileged imports commands and transports` | `npm run verify:no-live` |
| Legacy product/package preservation | `src/nba2k27-myplayer/optimizer/run.mjs:runOptimization`; `src/nba2k27-myplayer/cli.mjs:runCli` | all tests/checks pass; `npm ls` reports root-only dependency tree | `test/nba2k27-myplayer/integration.test.mjs` — `CLI replay optimization produces a schema-valid deterministic report without persistence` | `npm test && npm run check && npm ls --all --json` |

### Explicit obsolete replacements

- Current `protocol-v1.mjs:validBody`, `validResult`, `validateProtocolRecord`, and handwritten transition loop in `validateTranscript` are replaced by generated protocol-2 exports `validateRequestBody`, `validateResponseRecord`, `validateProtocolRecord`, `assertTransition`, `validateCorrelation`, and `validateTranscript` at the same exact output path.
- `protocol-session.mjs:DERIVABLE_ACTIONS` and `ProtocolSession.markPreviewed` are deleted; `recognizer.mjs:recognizeCapture` and `preview-sealer.mjs:sealPreview` replace them.
- `Identity.cs:TrySnapshot`, old `Discover`, old `Bind`, and `RequireBound` are replaced by `ObserveControlIdentity`, filtered `Discover`, `BindSelectedTarget`, and `RequireExactControlIdentity`.
- `Input.cs:Dispatch` is replaced by `PrepareAuthorizedInput`, `ConvertClientPixelToVirtualAbsolute`, and `DispatchReservedInput` behind `OperationExecutor.ExecuteInput`.
- `Protocol.cs:TryHandle` native branching is replaced by generated parser/guards plus `OperationExecutor.ExecuteRequest`; `Program.Main` synchronous loop is replaced by `Program.RunAsync` invoked from a minimal `Main`.
- `launch-companion.mjs`’s direct `session.acceptHello(record, sha)` call is replaced by `validateControlHello(record, expectation, receipt, reservation)`.
- `run-capability.mjs:mintRunCapability` remains for observe mode; control mode uses exact `mintControlLaunchCapability` and `mintActionCapability`, both requiring branded receipt/approval and parent-ledger envelopes.
- `test/nba2k27-myplayer/windows-contract.test.mjs` is deleted only after generation/structural/mutation tests pass. Handwritten transcript fixtures named in the original plan are replaced by `render-protocol-vector.mjs` plus `generated/conformance-vectors.json`.

## Decision 4 — `ParentBudgetLedgerV1`

### Sole owner and closed state

Add `src/nba2k27-myplayer/host/parent-budget-ledger.mjs`. Only the Node parent creates and mutates a ledger. The closed immutable-view fields are:

```text
schemaVersion="parent-budget-ledger/1", ledgerId, effectiveConfigDigest,
limits, consumed, nextReservationId, terminal, ledgerDigest
```

`limits` and `consumed` have exactly these positive-integer keys:

```text
inspectorLaunches, controlLaunches,
protocolRequests, protocolResponses,
captureCalls, captureChunks, captureBytes,
recognitionCalls, previewCalls, approvalConsumes,
canaryCalls, actionCalls,
mouseEvents, keyEvents, totalInputEvents,
cancellationRequests, cleanupCalls
```

Config v2 `limits` replaces the former aggregate names with exactly `maxInspectorLaunches`, `maxControlLaunches`, `maxProtocolRequests`, `maxProtocolResponses`, `maxCaptureCalls`, `maxCaptureChunks`, `maxCaptureBytes`, `maxRecognitionCalls`, `maxPreviewCalls`, `maxApprovalConsumes`, `maxCanaryCalls`, `maxActionCalls`, `maxMouseEvents`, `maxKeyEvents`, `maxTotalInputEvents`, `maxCancellationRequests`, and `maxCleanupCalls`. Every maximum is at least 1; `maxTotalInputEvents >= maxMouseEvents + maxKeyEvents` is not required, but every configured recipe must individually fit all relevant maxima. Counters begin at zero and only increase. `ledgerDigest = SHA256("parent-budget-ledger/v1" || ledgerId || effectiveConfigDigest || canonical limits || canonical consumed || nextReservationId || terminal)`.

`reserveBudget(ledger, operationId, sparseDelta)` is the only mutation. The parent serializes calls in one promise/critical-section chain. `sparseDelta` is closed over the keys above; every present delta is a positive safe integer. Empty, zero, negative, fractional, overflow, exhausted, reused operation ID, or terminal ledger rejects before authority with `E_BUDGET_RESERVATION` or `E_BUDGET_EXHAUSTED`. It increments `nextReservationId` by exactly one and permanently moves all deltas into consumed before launch/request/event authorization. No timeout, failed launch, child rejection, cancellation after reservation, partial response, partial `SendInput`, exception, crash, or cleanup failure refunds a counter.

Each `BudgetReservationEnvelopeV1` contains exactly:

```text
schemaVersion, ledgerId, reservationId, operationId,
beforeCounters, deltaCounters, afterCounters,
beforeLedgerDigest, reservationDigest
```

`reservationId` is the monotonic positive integer. `beforeCounters`/`afterCounters` contain all 17 counters; `deltaCounters` is sparse and positive. `reservationDigest` covers the closed envelope excluding itself. Every launch capability and protocol request carries its envelope. Inspector/control validate ledger ID, increasing reservation ID, digest, local relevant before/delta/after values, and local maxima. They can refuse excess but cannot grant, refund, edit, or aggregate authority.

Every child response/receipt/capture end/terminal result contains `attemptedCumulative` for its delegated local subset and the reservation ID/digest. “Attempted” increments at the same pre-native seam even if the native operation fails. Parent `reconcileBudgetReport` requires exact reservation correlation and exact delta between the prior accepted child report and reported cumulative values. Missing, lower, excess, duplicate, wrong-ledger, wrong-reservation, or inconsistent reports terminalize the ledger with `E_BUDGET_RECONCILIATION`. Parent counters remain consumed even on mismatch.

### Exact operation-to-counter mapping

| Operation/message/event | Reservation delta |
| --- | --- |
| Spawn inspector process | `inspectorLaunches:1` |
| Spawn control process | `controlLaunches:1` |
| Each outbound inspector/control JSONL challenge, hello, request, cancel, or close record | `protocolRequests:1`; cancel also `cancellationRequests:1` |
| Each expected inbound JSONL receipt, hello result, ordinary response, capture start, capture chunk, or capture end record | `protocolResponses:1` per record, reserved before the triggering outbound record. Partial/missing records consume the full expected reservation. |
| One inspector receipt observation | No extra aggregate counter beyond launch and protocol records; the exact read-only snapshot is intrinsic to that one receipt request. |
| One control identity-only bind/recheck | Its request/response counters only. Child local subset records one `identityObservations` value, which is bounded by generated per-operation structure but is not a parent aggregate counter. |
| One GDI capture attempt | `captureCalls:1`, `captureBytes:byteTotal`, `captureChunks:ceil(byteTotal/chunkBytes)`, plus one outbound request and `2+chunkCount` inbound records. Reserve all before the request; partial capture consumes all. |
| One parent recognition invocation | `recognitionCalls:1` before `recognizeCapture` |
| One parent preview seal invocation | `previewCalls:1` before `sealPreview` |
| Consume launch approval or action approval | `approvalConsumes:1` for each distinct consume, before `ApprovalLedger.consume` |
| Non-canary semantic action authorization | `actionCalls:1` plus exact event recipe and total counters |
| Canary semantic action authorization | `canaryCalls:1` **and** `actionCalls:1` plus exact event recipe and total counters; this intentional overlap counts one canary that is also one action, not two actions. |
| Left click recipe | `mouseEvents:3,totalInputEvents:3` for move/down/up; no key delta |
| Key-pair recipe | `keyEvents:2,totalInputEvents:2` for matching down/up; no mouse delta |
| Parent process/session cleanup attempt, including kill-after-grace | `cleanupCalls:1` before the attempt; GDI resource cleanup is intrinsic to the already charged capture call and does not charge this parent counter. |

Discovery and ordinary revalidation do not consume `captureCalls`, `recognitionCalls`, or action/event counters. Capture chunk records intentionally consume both `captureChunks` and `protocolResponses`: the former bounds decoded payload structure, the latter bounds wire messages. Canary intentionally consumes both `canaryCalls` and `actionCalls`. These are distinct dimensions, not accidental double charging.

For an action, the parent derives the complete array before authorization, then reserves `actionCalls`, optional `canaryCalls`, exact mouse/key count, `totalInputEvents`, and request/response records in one atomic reservation. Event construction only marks those reserved indices prepared; it does not decrement counters. Control verifies all indices and makes one `SendInput`. If only 0, 1, or 2 of 3 mouse events—or 0 or 1 of 2 key events—are reported inserted, the full reservation remains consumed and the outcome is `ACTION_OUTCOME_UNKNOWN`.

## Exact IR, Generated Artifacts, and File Contracts for These Four Closures

### IR additions/replacements

In `protocol/host-protocol.ir.json`, add exact top-level keys `controlIdentity`, `launchApproval`, `budgetLedger`, `coordinateConversion`, and `historicalReproductions` to the original closed list. Their exact child fields are:

```text
controlIdentity:
  schemaVersion, orderedFields, fieldTypes, sourceClassifications,
  inspectorRequiredFields, controlRequiredFields, equalityRules,
  intervalRules, unsupportedPolicy, observationSeams, errors
launchApproval:
  inspectorChallengeFields, inspectorReceiptFields, launchApprovalIntentFields,
  controlLaunchCapabilityFields, controlHelloExpectationFields,
  actionCapabilityFields, sequence, digestDomains, expiryRules, errors
budgetLedger:
  schemaVersion, counterNames, limitNames, reservationFields,
  operationCosts, childSubsets, reconciliationRules, noRefundOutcomes, errors
coordinateConversion:
  selectorScale, absoluteScale, checkedIntegerBits, clientEncodeFormula,
  clientDecodeFormula, screenFormula, virtualFormula, acceptedRanges,
  mouseRecipes, errors, vectorIds
historicalReproductions:
  id, category, currentOrProposedPath, function, stableOutcome,
  testPath, testName, command, replacementStatus
```

Generation fails if an ordered tuple field lacks type/source/equality/seam coverage; a counter lacks a positive configured maximum or operation mapping; a historical row lacks an exact path/function/outcome/test/command; or any configured placeholder vocabulary appears.

### Generated artifacts

The existing generated-output contract is extended exactly with:

- `src/nba2k27-myplayer/host/protocol-v1.mjs`: tuple/receipt/capability/reservation validators, equality and coordinate functions, errors, operation-cost table.
- `companion/windows/Generated/ProtocolModels.Generated.cs`: `ControlIdentityTupleV1`, receipt/challenge/capability/request/reservation records.
- `companion/windows/Generated/ControlIdentity.Generated.cs`: closed field comparators, interval checks, supported-field policy, observation-seam table.
- `companion/windows/Generated/BudgetLedger.Generated.cs`: `LocalBudgetSubset`, operation costs, increasing-reservation and attempted-cumulative checks.
- `companion/windows/inspector/Generated/InspectorProtocol.Generated.cs`: challenge/complete receipt/tuple/local-budget records and validators.
- `test/nba2k27-myplayer/generated/conformance-vectors.json`: complete tuple mutations, approval order/replay/expiry, desktop/coordinate endpoints, all budget costs/exhaustion/reconciliation, and every historical row ID.
- `test/nba2k27-myplayer/generated/error-catalog.json`: every exact code named in this addendum.
- `test/nba2k27-myplayer/generated/manifest.json`: output digests plus one-to-one tuple-field, budget-counter, operation-cost, historical-row, vector, and mutation coverage.
- Generated blocks in `docs/nba2k27-myplayer/host-companion-protocol.md` and `docs/nba2k27-myplayer/windows-host-preflight.md`: tuple trust/source table, receipt/approval sequence, desktop conversion, budget mapping, historical status, errors, and dormant activation status.

### Add/replace paths and exact functions

- Add `src/nba2k27-myplayer/host/parent-budget-ledger.mjs`: `createParentBudgetLedger`, `reserveBudget`, `reconcileBudgetReport`, `terminalizeBudgetLedger`.
- Add/complete `target-inspector.mjs`: `obtainInspectorReceipt`, `validateInspectorReceipt`, `consumeInspectorReceipt`.
- Add/complete `run-capability.mjs`: `mintControlLaunchCapability`, `mintActionCapability`; retain exact observe-mode handling.
- Replace `launch-companion.mjs`: add internal `validateControlHello`; every child write/read uses a reservation envelope.
- Replace `executable-identity.mjs`: `openPinnedRegularFile`, `recheckPinnedRegularFileImmediatelyPreSpawn`.
- Replace inspector `IdentityInspector.cs`: `ObserveCompleteControlIdentity`; inspector `Program.cs`: `RunOneReceiptAsync`.
- Replace control `Identity.cs`: `ObserveControlIdentity`, `RequireExactControlIdentity`, `BindSelectedTarget`, filtered `Discover`.
- Replace `OperationExecutor.cs`: `ExecuteCapture`, `ExecuteInput`, `ExecuteRequest`; replace `Input.cs` functions named in the obsolete list.
- Add `test/nba2k27-myplayer/host-budget-ledger.test.mjs`; add/replace the exact tests in the ledger. Update `host-trust`, `host-capture`, `host-input-authority`, `host-discovery`, `host-cancellation`, generation/mutation/docs tests.
- Replace `src/nba2k27-myplayer/schemas/host-companion-config.schema.json` and `src/nba2k27-myplayer/host/trusted-config.mjs:validateTrustedConfig` with all 17 exact maximum names listed above plus `identityObservationMs` and `preInputIdentityAgeMs`; replace `src/nba2k27-myplayer/index.mjs`, `package.json`, `test/nba2k27-myplayer/verify-pack.mjs`, and `test/nba2k27-myplayer/verify-no-live.mjs` only as already closed by the remediation addendum.

No launcher, receipt, ledger mutator, capability mint, inspector, recognizer, capture reassembler, generator write function, or native authority becomes public or a CLI command.

## Dependency-Ordered Implementation and Verification Gates

1. Add every named historical reproduction and the ledger completeness checker; preserve currently green rows and reproduce unsafe rows without live authority.
2. Extend IR/config/errors with complete tuple, approval sequence, authoritative desktop, parent ledger, operation costs, and all vectors.
3. Extend generator, reference interpreter, C# structural checker, mutation runner, and generated artifacts. Gate on exact regeneration and one-to-one coverage.
4. Implement parent path verification, parent ledger, inspector complete observation/receipt, launch approval, single-use receipt/capability, then static hello validation. Control remains input-ineligible.
5. Implement full control reobservation at bind/capture/preview/canary/input seams and exact desktop conversion; then connect capture/recognition/preview.
6. Implement action approval, atomic action/event reservation, local subset enforcement/reconciliation, one-call input, unknown partial outcome, cancellation, and cleanup charging last.
7. Generate docs/status, update closed package surfaces, delete obsolete tests/fixtures only after replacements pass, then run implementer self-check.
8. Dispatch fresh independent review and integration check. One command-backed implementation remediation remains the maximum; this addendum authorizes no host/native execution.

Run from `/home/joshl/projects/nba2k27-myplayer`:

```sh
node scripts/generate-host-protocol.mjs --check
node scripts/check-host-protocol.mjs
node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs test/nba2k27-myplayer/host-protocol-mutations.test.mjs test/nba2k27-myplayer/host-docs.test.mjs
node --test test/nba2k27-myplayer/evidence-vault.test.mjs test/nba2k27-myplayer/host-cli.test.mjs test/nba2k27-myplayer/host-protocol.test.mjs test/nba2k27-myplayer/host-authority.test.mjs test/nba2k27-myplayer/host-trust.test.mjs test/nba2k27-myplayer/host-capture.test.mjs test/nba2k27-myplayer/host-recognition.test.mjs test/nba2k27-myplayer/host-input-authority.test.mjs test/nba2k27-myplayer/host-discovery.test.mjs test/nba2k27-myplayer/host-cancellation.test.mjs test/nba2k27-myplayer/host-budget-ledger.test.mjs test/nba2k27-myplayer/host-adapter-integration.test.mjs
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

Required gates:

- **Identity/approval:** mutate every tuple field and source label; omit every independently required field; replay/expire/reorder receipt and approval; replace either executable between checks. All fail before authority. Inspector/control self-assertion never substitutes for parent file proof or inspector target proof.
- **Desktop/input:** exhaustive formula vectors plus receipt/control desktop drift; exact flags and one array; no clamping; full event reservation remains consumed on partial send.
- **Ledger:** every counter has positive max, operation mapping, exhaustion vector, reservation digest test, child-subset enforcement, attempted cumulative reconciliation, no-refund schedule, and parent-only mutation proof.
- **Historical ledger:** checker resolves every path and current function or recognizes the exact proposed path/function, locates every exact test name, confirms stable outcome and command, and rejects placeholders.
- **Parity/docs/package:** exact generation, dual interpretation, parsed C# structures and mutations, accurate dormant status, exact exports/files/scripts, no privileged route or packed binary/live data.
- **Toolchain:** `dotnet` and `csc` are expected unavailable. Record skips; if either exists, stop rather than compile or broaden scope.

## Zero-Placeholder Checklist

- [x] One closed identity tuple is shared by receipt, approval, capabilities, hello, capture, preview, canary, and input.
- [x] Every tuple field has a pinned, parent-observed, inspector-observed, or control-reobserved source and exact equality/range rule.
- [x] Unsupported independent identity makes control ineligible.
- [x] Receipt → explicit launch approval → one-use consume/mint → immediate control recheck → hello → reobservation order is exact and non-circular.
- [x] Virtual desktop and monitor geometry are inspector-authoritative, control-reobserved, approval-bound, and checked immediately pre-input.
- [x] Client/fixed/screen/virtual conversion, ranges, rounding, endpoints, overflow handling, and exact `SendInput` flags are closed.
- [x] Every historical reproduction row has an existing current path/function or exact proposed path/function, exact outcome/code, exact test name, and exact command.
- [x] Obsolete paths/functions/tests/fixtures have explicit replacements.
- [x] Parent is the only aggregate budget owner; all 17 counters, limits, mappings, reservations, reports, reconciliation, and no-refund outcomes are exact.
- [x] Action recipes reserve every event before authorization; partial send consumes the full reservation.
- [x] IR fields, outputs, implementation paths/functions/tests/docs, dependency order, and validation commands are exact.
- [x] No placeholder, abbreviated path, implied function, generic generated component, caller receipt, live operation, or host-readiness claim remains.

## Implementer Handoff

Implement only in `/home/joshl/projects/nba2k27-myplayer`, in the eight dependency steps above. Treat this artifact as final over both prior plans wherever text conflicts. Preserve all already-proved vault/CLI/package/default/no-live behavior. Use injected fake inspector/control children and synthetic pixels only. Do not run or build Windows binaries, contact BlueStacks/ADB/network, alter Git/global configuration, publish, create real calibration data, or expose privileged APIs. Stop and return a blocker rather than weakening tuple equality, approval order, desktop authority, ledger ownership, static-evidence honesty, or package boundaries.

## Assumptions, Tradeoffs, and Residual Risks

- Separate inspector/control binaries are built only in a later approved Windows stage; fake children are used now.
- Existing `ApprovalLedger` supplies the closed operator approval record; no public approval UI or default activation route is added.
- Requiring every independently observed field may reject hosts where an API is unavailable. That is intentional.
- Same-UID/cross-OS file replacement, compromised pinned builds, inspector/control collusion, Windows API deception, target change between snapshots, GDI frame-age limits, ABI/marshaling, focus/UIPI, and BlueStacks compatibility remain unproved host risks.
- This synthesis performed no implementation or acceptance validation.

## Work Performed

- Summary: Resolved the second proof’s four blockers with one complete shared identity tuple and approval sequence, authoritative desktop conversion, an exact current/proposed historical ledger, and a parent-only cross-process budget ledger; specified final IR/files/tests/docs/dependencies/gates.
- Files read: Role contract/schema/template; all eight supplied research/planner/validator artifacts; current candidate host modules, C# source, config schema, index/package, host/vault tests, and no-live/pack verifiers needed to resolve exact names.
- Files changed: Only this required planner trace artifact; no implementation file was edited.
- Commands/checks: Read-only file/glob inspection only. No shell command, implementation, generation, test, final validation, compiler, native/Windows/BlueStacks/ADB/network, Git, global configuration, or publication action.

## Output Contract

- orderedPlanOrResolvedConclusions: Four final precedence decisions and eight-step dependency order above.
- fileContractsOrDecisions: Exact tuple, receipt/approval/capability/hello sequence, virtual desktop conversion, historical ledger, parent budget ledger, IR, generated artifacts, paths/functions/tests/docs, and obsolete replacements above.
- dependencies: `root-planner-002-integrated-closure`, `root-planner-004-plan-remediation`, and authoritative failed proof `root-validator-005-plan-reproof`; implementation follows only after fresh independent plan proof passes.
- verificationGates: Exact commands and identity, desktop, ledger, historical, parity/docs/package, and honest-toolchain gates above.
- handoffNotes: This artifact has final precedence; implement in bounded fake/static work units only and retain every no-live and residual-risk boundary.
- Outputs: Resolved synthesis conclusions, executable closure addendum, zero-placeholder checklist, and exact implementer handoff.
- Evidence: Supplied command-backed validators and direct read-only current-source inspection; proposed contracts are requirements, not evidence of implementation or host behavior.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-006-final-plan-closure.md`
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-006-final-plan-closure.md`

## Handoff

- Next role: Fresh validator in `taskMode: artifact-proof`; only a PASS permits fresh bounded implementer work units.
- Limitations: Synthesis/read-only source inspection only; no future files/tests exist yet, and no implementation, final validation, compiler, Windows/native, BlueStacks, network/ADB, Git, or publication action occurred.
- Risks: Same-UID/cross-OS races, compromised/colluding binaries, static C# evidence ceiling, target drift between observations, GDI/frame freshness, focus/UIPI, and all deferred host compatibility risks.
