# Integrated Closure Plan Remediation — Mechanical Addendum

## Metadata

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- role: `planner`
- artifactId: `root-planner-004-plan-remediation`
- createdAt: `2026-08-22`
- taskMode: `synthesis`
- delegationTaskId: `dt-remediate-plan-004`
- scopeKey: `integrated-plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh synthesis packet; the closure research, original integrated plan, failed plan proof, and three historical validator traces; exact remediation acceptance criteria.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; planned implementation root remains `/home/joshl/projects/nba2k27-myplayer`.

## Precedence and Resolved Conclusions

This artifact is a **normative replacement/addendum** to `root-planner-002-integrated-closure.md`.

1. Sections **Seven-Finding Traceability Table**, **D2**, **File Contracts and Canonical IR §§1, 2, 4, 5**, **Ordered Implementation Plan**, **Files to Add/Replace/Delete**, **Verification Gates**, and both validator packets are superseded wherever this artifact is more specific or conflicts.
2. The original plan's canonical IR/generated-contract architecture, protocol-2 framing, complete authority tuple, discovery/cancellation contracts, seven findings, and stated static/host limitations remain mandatory.
3. `externalHostReceiptDigest` is replaced by the ephemeral, parent-obtained **inspector receipt** below. No caller-supplied receipt, receipt path, digest, signature, or companion report can qualify for control.
4. Observation-only sessions may run without an inspector receipt but cannot contain `input`, mint a control capability, or enter an authorization state. Control requires a fresh receipt obtained directly by the parent from the separately pinned inspector and consumed once.
5. Implementation is now mechanically unblocked at plan level. There are no design choices delegated to the implementer. Host compilation/runtime and real calibration remain later, separately approved gates.

## Historical Reproduction Ledger

All paths are relative to `/home/joshl/projects/nba2k27-myplayer`. Each named test is an exact test case to retain or add. The command for vault rows is `node --test test/nba2k27-myplayer/evidence-vault.test.mjs`; CLI rows use `node --test test/nba2k27-myplayer/host-cli.test.mjs`; protocol/launcher/capability rows use `node --test test/nba2k27-myplayer/host-protocol.test.mjs test/nba2k27-myplayer/host-authority.test.mjs`; native/final rows use Gate B below; package rows use the command shown.

| Historical command-backed case | Root cause and invariant | Exact implementation location | Exact positive/adversarial test and expected result/code | Artifact/doc location |
| --- | --- | --- | --- | --- |
| Vault root inside package/workspace, independent of cwd | Exclusions formerly depended on `process.cwd()`. Package root and configured workspace exclusion are immutable canonical exclusions. | `host/trusted-config.mjs:validateTrustedConfig`; `host/evidence-vault.mjs:trustedRoot` | `vault rejects package and workspace descendants from foreign cwd`: sibling owner-only root passes; package/workspace child rejects `E_EVIDENCE_CONTAINMENT`. | config schema; `windows-host-preflight.md` evidence section |
| Vault absolute/canonical/root containment | Relative, `/mnt`, dot, dot-dot, duplicate/trailing-separator or escaped roots must not enter vault operations. | `trusted-config.mjs:validateEvidence`; `evidence-vault.mjs:trustedRoot` | one valid canonical root passes; each lexical attack rejects `E_EVIDENCE_CONFIG` or `E_VAULT_ROOT`. | IR filesystem rules; preflight evidence section |
| Vault symlink root/ancestor | No symlink component. | `evidence-vault.mjs:trustedRoot` | current `vault rejects symlink roots...`; real owner-only root passes, symlink rejects `E_VAULT_TRUST`. | preflight evidence section |
| Vault insecure root/run/file modes and ownership | Every mutable root/run is current-UID 0700; leaves are current-UID 0600, one link. | `trustedRoot`, `createEvidenceRun`, `writeEvidence`, `cleanupEvidence` | mode 0700/0600 positive; root 0755, run/file mode or owner mutation rejects `E_VAULT_TRUST`, `E_VAULT_RUN`, or `E_VAULT_CONTENT`. | IR vault obligations; preflight |
| Vault hard-link/content injection | Cleanup/write may touch only regular current-UID single-link files. | `writeEvidence`; `cleanupEvidence` quarantine inventory | regular file passes; hard link, directory, symlink, device-like/nonregular entry rejects `E_VAULT_CONTENT`/`E_QUARANTINE_CONTENT`. | IR vault obligations |
| Run/root identity replacement | Captured root/run dev+ino must match before/after each operation. | `createEvidenceRun`, `writeEvidence`, `cleanupEvidence` | current stale same-path replacement test rejects `E_VAULT_IDENTITY`; unchanged identity passes. | preflight residual-race section |
| Clone/forged/stale handle | WeakMap branding and filesystem identity, never caller object fields, authorize a run. | `records`, `createEvidenceRun`, `writeEvidence` | current genuine/clone/forged test gives one success and two `E_VAULT_HANDLE`; stale handle gives `E_VAULT_IDENTITY`. | IR vault handle rule |
| Concurrent cumulative byte quota | Lock by immutable record identity and recompute complete inventory under lock. | `locked`; `writeEvidence` | concurrent 2+2 under max 3: exactly one succeeds; other is `E_VAULT_HANDLE` for clone or `E_VAULT_QUOTA` for second genuine call. | generated quota vector |
| Cumulative file-count quota | Count all existing entries plus proposed leaf under lock. | `writeEvidence` | maxFiles 1: first succeeds, second `E_VAULT_QUOTA`. | generated quota vector |
| TTL boundary | Expired iff `created/mtime + ttl*1000 <= now`; no early deletion. | `createEvidenceRun`, `evidenceStatus`, `cleanupEvidence` | `expiry-1` retained; exact expiry quarantined; ttl outside 1..3600 rejects `E_EVIDENCE_CONFIG`. | schema/preflight |
| Quarantine identity/content/quota | Rename one immediate run, recheck parent and same dev+ino, then closed inventory. | `cleanupEvidence` | unchanged expired run deletes; replacement, excess file/byte, nested dir, link, mode/link mutation returns `E_QUARANTINE_IDENTITY` or `E_QUARANTINE_CONTENT`. | preflight cleanup table |
| Cleanup retained path before/after rename | Failure reports exact absolute source before successful rename, exact absolute quarantine after. | `cleanupEvidence:fail` and cleanup state ledger | injected pre-rename failure returns source path; current nested-content test returns `${root}/quarantine-*`; no opaque ID. | `windows-host-preflight.md` exact-path warning |
| Cleanup post-delete proof | Parent identity must remain and quarantine must be absent. | `cleanupEvidence` final checks | parent replacement or surviving quarantine returns `E_CLEANUP_IDENTITY`/`E_CLEANUP_FAILED`; stable deletion passes. | preflight residual-race section |
| CLI duplicate JSON at any depth | JSON must be parsed duplicate-aware before schema validation. | `cli.mjs:readBoundedJson`; generated `parseClosedJson` | top/nested/array-object duplicate rejects `E_DUPLICATE_KEY`; unique closed JSON passes. | host protocol JSON limits |
| CLI depth/key/node/array/string/byte limits | Bounds apply before use and cannot be widened by command. | `readBoundedJson`, `readBoundedBytes` | depth 17, 129 keys, 257 items, 4097-byte host string, node/1MiB overflow reject `E_JSON_PARSE` or `E_INPUT_BOUNDS`; exact maxima pass. | generated limits table |
| CLI trailing/malformed JSON | One complete JSON value only. | `readBoundedJson` | current trailing attack rejects `E_JSON_PARSE`; canonical value passes. | protocol JSON rules |
| CLI unknown fake/config fields | Closed command-specific shape; no activation-shaped extras. | `runCli` fake branch; `validateTrustedConfig` | unknown `secretPath`, config unknown, unknown response fields reject `E_FAKE_ONLY`, `E_FAKE_SHAPE`, or `E_CONFIG_SHAPE`. | CLI docs/status |
| CLI live/network/ADB/executable routes | No such command or flag exists. | `COMMAND_FLAGS`, `parseArgs` | `live`, `capture`, `adb` reject `E_COMMAND`; executable/path flag rejects `E_FLAG`; supported offline command passes. | CLI command inventory below |
| CLI supplied path canary | Errors expose stable code/text only. | `compactDiagnostics`, top-level CLI error rendering | all host commands with `PRIVATE_PATH_CANARY_7f91` in input/path produce no canary in stdout/stderr. | redaction contract |
| Fake response leakage | Output is a constructed closed summary, never fixture projection. | `runCli` fake branch | current `/private/token`/responses/path attack rejects; valid fixture output omits `path`, `token`, `responses`. | CLI fake-only docs |
| Protocol direct state bypass | Closed predecessor table; no `OBSERVE_ONLY -> authorize/input`. | generated `protocol-v1.mjs`; `protocol-session.mjs` | direct authorize/input rejects `E_STATE`/`E_INPUT_NOT_AUTHORIZED`; generated valid sequence passes. | generated transition table |
| Handshake-free/type-invalid hello | First record and challenge equality are mandatory. | generated validators/session | lone/type-invalid `helloResult` rejects `E_HELLO_CORRELATION`/`E_BODY_SHAPE`; exact challenge passes. | generated hello table |
| Incomplete request/capture at EOF | Outstanding work terminalizes; partial pixels discarded. | `validateTranscript`; `capture-reassembler.mjs`; launcher | incomplete request/chunks reject `E_TRANSCRIPT_INCOMPLETE`/`E_CAPTURE_TRUNCATED`; exact end passes. | capture docs |
| Replay/wrong identity/correlation/stale fixture | Session/request/sequence/operation/nonce and deadlines are exact. | generated protocol/session | generated replay, wrong identity/correlation, stale vectors reject their generated stable codes; positives pass. | conformance vectors |
| Invalid canary fixture | Fixtures come only from valid generated vectors. | vector renderer; delete handwritten fixture | generated canary validates; mutated body rejects `E_BODY_SHAPE`. | generated examples |
| Arbitrary/incomplete capability | Closed branded capability binds every mode-specific field. | `run-capability.mjs:mintRunCapability/consumeRunCapability` | bad digest/run/capability/extra/missing field rejects `E_CAPABILITY_BINDING`; complete token opaque, immutable, one-use. | generated binding table |
| Missing capture/preview/action/canary capability bindings | Control tuple is complete and receipt-gated. | same; `target-inspector.mjs:consumeInspectorReceipt` | delete each authority field or receipt: `E_CAPABILITY_BINDING`/`E_CONTROL_RECEIPT`; complete synthetic receipt passes fake only. | authority table |
| Unsolicited/early/duplicate/extra output | Every child record is consumed by one session/outstanding operation; terminal means no more bytes. | `launch-companion.mjs`; `protocol-session.mjs` | unsolicited close `E_HELLO_CORRELATION`; early `E_CHILD_EARLY_EXIT`; duplicate/extra `E_STDOUT_AFTER_TERMINAL`. | lifecycle table |
| Malformed/partial/overflow child output | Line, aggregate stdout/stderr, framing, and EOF are bounded. | `launch-companion.mjs`; generated decoder | malformed `E_STDOUT_PROTOCOL`; partial `E_STDOUT_PARTIAL`; overflows `E_STDOUT_BOUNDS`/`E_STDERR_BOUNDS`. | generated limits |
| Timeout/abort/error/nonzero/signal/exact termination | One child, one AbortSignal, fixed grace, no reuse. | `launch-companion.mjs` | existing fake schedules return `E_STARTUP_TIMEOUT`, `E_LAUNCH_ABORTED`, `E_CHILD_ERROR`, `E_CHILD_NONZERO`, `E_CHILD_SIGNAL`; exact success passes. | lifecycle docs |
| Wrong hello identity | Static challenge exact; observations cannot authorize. | `launch-companion.mjs`; generated hello; `target-inspector.mjs` | mutate every static field: reject before operation; mutate observation: receipt comparison rejects control `E_RECEIPT_MISMATCH`; observe mode labels it unverified. | trust table |
| Synthetic preview selector/state | Only verified pixels/profile/transition derive preview. | `recognizer.mjs`; `preview-sealer.mjs` | caller selector/state unrepresentable; synthetic pixel positive passes; hash/action-only path absent. | recognition docs |
| Capture omission/fake freshness | Framed bytes/digests/times are mandatory; no frame-age claim. | `Capture.cs`; `capture-reassembler.mjs` | every framing mutation rejects; exact synthetic bytes pass; `fresh:true` field is unknown/rejected. | capture docs |
| Under-bound native input/endpoint | Complete receipt/authority and in-client mapping precede one call. | generated guards; `Input.cs`; `OperationExecutor.cs` | delete each binding, use 1,000,000, drift identity, partial SendInput: reject/terminal as specified below. | authority/input docs |
| Ambient discovery/cancel absence | Exact profile filters, one worker, concurrent reader/cancel. | `Identity.cs`; `Program.cs`; `OperationExecutor.cs` | over-limit/filter mismatch and every cancel seam vector reject/terminalize deterministically. | discovery/cancel docs |
| Token-only C# parity | Parsed/generated structure plus semantic mutations, never regex presence. | checker/generator paths below; delete `windows-contract.test.mjs` | each IR rule mutation must fail `check-host-protocol.mjs`; unchanged generated tree passes. | static-evidence limits |
| Stale cleanup/native status docs | Generated status and explicit absolute retained-path wording. | protocol/preflight docs and generator | docs mutation fails `host-docs.test.mjs`; examples execute. | generated status matrix |
| Public/deep authority reachability | Exports stay closed; launcher/mint/inspector/generator writer are internal. | `index.mjs`; `package.json.exports`; no-live checker | root/CLI values undefined; deep package import `ERR_PACKAGE_PATH_NOT_EXPORTED`. | package contract |
| Package whitelist/no binaries/tests/live data | Exact reviewed prefixes and denylist. | `package.json.files`; `verify-pack.mjs` | `npm run verify:pack && npm pack --dry-run --json`: only whitelist below; injected exe/test/config/evidence fails. | package docs |
| No-live source/runtime route | No public command/export, network/listener/ADB/PowerShell/service authority. | `verify-no-live.mjs`; index/CLI | `npm run verify:no-live` returns `NO_LIVE_OK`; injected route/import fails. | activation status |
| Legacy package/product preservation | Existing 51-file behavior and offline suites remain. | all existing source; package scripts | `npm test && npm run check && npm ls --all --json`: all pass; root-only dependency tree. | release checklist |

The seven final findings are therefore represented by the ledger rows beginning at wrong hello identity through stale docs; the earlier vault, CLI, launcher, capability, cleanup, package, and no-live cases are equally mandatory and may not be deleted merely because current source already closes them.

## Non-Circular Inspector Receipt Authority

### Separate trusted producer

Add a second Windows project, built independently from the control companion:

- `companion/windows/inspector/Nba2k27.HostInspector.csproj`
- `companion/windows/inspector/Program.cs`
- `companion/windows/inspector/InspectorProtocol.cs`
- `companion/windows/inspector/IdentityInspector.cs`
- generated `companion/windows/inspector/Generated/InspectorProtocol.Generated.cs`

It shares no handwritten source or binary with the control companion, imports no capture/input/GDI/SendInput APIs, accepts no arbitrary path, shell, network, file-write, process-write, window-change, or control operation, and handles exactly one bounded stdin challenge followed by one receipt and exit. `scripts/check-host-protocol.mjs` parses its imports/P/Invokes and rejects forbidden authority.

Add parent module `src/nba2k27-myplayer/host/target-inspector.mjs` with exactly `obtainInspectorReceipt(...)`, `validateInspectorReceipt(...)`, and `consumeInspectorReceipt(...)`. The parent itself:

1. maps and verifies configured inspector and control-companion files using the algorithm below;
2. compares their distinct configured SHA-256 values and rejects equality (`E_BUILD_SEPARATION`);
3. launches the inspector by its exact mapped WSL path with `shell:false`, argv `--stdio-jsonl-inspector-v1`, bounded stdio, inherited Windows identity, and one AbortSignal;
4. sends a fresh 32-byte parent nonce, invocation ID, config digest, target-policy digest, operator-selected HWND, and parent-observed inspector hash;
5. accepts one exact correlated receipt from that child, then requires clean EOF/exit; and
6. stores the validated receipt only in a process-local WeakMap-branded object. It is never loaded from a caller/file and never accepted merely by digest.

### Receipt schema and eligibility

`inspectorReceipt/v1` has exactly:

```text
schemaVersion, protocolVersion, parentNonce, inspectorInvocationId,
configDigest, targetPolicyDigest, inspectorSha256, inspectorBuildId,
inspectorProtocolVersion, observationStartedUtcMs, observationEndedUtcMs,
observationStartedMonotonicTicks, observationEndedMonotonicTicks,
targetPid, targetProcessCreationFileTime, targetWindowsFinalPath,
targetWindowsFinalPathSha256, targetExecutableSha256, hwnd,
hwndOwnerPid, windowClassSha256, style, exStyle, visible, cloaked,
clientLeft, clientTop, clientWidth, clientHeight, dpiX, dpiY,
monitorSha256, receiptExpiresUtcMs
```

All integers are safe nonnegative integers; dimensions/DPI are positive and within config; digests are lowercase SHA-256; paths are canonical configured Windows paths. HWND is a canonical lowercase 1–16 hex-digit string, not a JSON number. Start ≤ end ≤ parent receipt time; duration ≤ `inspectorCallMs`; expiry is exactly `observationEndedUtcMs + receiptTtlMs` and must be future and no more than 5000 ms after the parent receive time. Parent recomputes `receiptDigest = SHA256(domain || canonical closed receipt)`. Authenticity is direct provenance from the exact child launched for the fresh nonce—not a companion signature or self-supplied digest.

Control eligibility requires one unexpired, unused branded receipt whose nonce/invocation/config/inspector pins match the parent launch, whose target path/hash/policy fields match config, and whose HWND→PID, PID start, class/style/visibility/cloak/client geometry/DPI/monitor fields exactly match the control companion's bind observation. `consumeInspectorReceipt` atomically marks it used before capability minting. Receipt replay, file loading, caller construction, digest-only input, optional receipt in control mode, and post-expiry use all return `E_CONTROL_RECEIPT`. Observe mode contains no receipt field. Same-UID replacement/collusion after verification, WSL-to-Windows execution races, compromised pinned builds, Windows API deception, and target replacement after observation remain explicit residual risks; this mechanism does not eliminate them.

## Exact Configuration, Parser, and Digest Contract

Replace `src/nba2k27-myplayer/schemas/host-companion-config.schema.json` and `validateTrustedConfig` with schema version `host-companion-config/2`. Top-level keys are exactly `schemaVersion,driveMapping,inspector,companion,target,calibration,limits,evidence`; none has defaults.

- `driveMapping`: exactly `driveLetter` (`^[A-Z]$`) and `driveMountRoot` (canonical absolute Linux path, 2..1024 bytes). The root is the **drive-specific root**: for drive `C`, `/mnt/c`, not `/mnt`.
- `inspector` and `companion`: exactly `windowsFinalPath,wslExecutablePath,sha256,buildId,protocolVersion`; companion also has exact `signerPolicyDigest,integrityPolicy,windowsBuildPolicy,dpiMode`. Each path is 4..1024 bytes; SHA fields lowercase 64 hex; IDs/protocols match `^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$`. Inspector protocol is `inspector/1`; companion protocol is `2.0`.
- `target`: exactly `windowsFinalPath,wslExecutablePath,executableSha256,windowClassSha256,windowTitleSha256,styleRequired,styleForbidden,exStyleRequired,exStyleForbidden,requireVisible,requireUncloaked,requireNotMinimized,maxCandidates,dpiX,dpiY,monitorSha256`. Masks are integers 0..4294967295; booleans are all `true`; `maxCandidates` 1..32; DPI 48..960. No path/title/image identity is inferred.
- `calibration`: exactly `profilePath,profileSha256,profileVersion,pixelFormat,width,height,stride,contentRect,templateCount,cueCount,stateCount,transitionCount,actionCount`. Profile path is canonical absolute no-follow Linux path outside package/workspace/evidence roots; format is `BGRA8_TOP_DOWN`; width 320..4096, height 240..4096, stride exactly width×4, total ≤ 16,777,216; each count 1..128 except templates/cues ≤64 and actions ≤32. `contentRect` is four integers wholly in bounds.
- `limits`: exactly `lineBytes,stdoutBytes,stderrBytes,captureBytes,captureChunkBytes,captureChunks,requestMs,sessionMs,inspectorCallMs,receiptTtlMs,maxActions,maxQueries,maxEvents,maxMouseMoves,maxMouseDowns,maxMouseUps,maxKeyDowns,maxKeyUps,maxCaptureCalls,maxInspectionCalls,maxProtocolCalls`. Closed bounds respectively: 1024..98304; 1024..67108864; 0..8192; 1..16777216; 1024..49152; 1..342; 100..5000; 1000..600000; 100..5000; 100..5000; 1..32; 1..128; 2..160; mouse move/down/up each 1..32; key down/up each 1..32; capture 1..64; inspection 1..128; protocol 1..512. Cross-rules require capture bytes/chunks arithmetic and each aggregate ≥ every allowed recipe.
- `evidence`: retain exact v1 fields/bounds and immutable containment: `root,ttlSeconds,retainScreenshots,maxScreenshots,maxScreenshotBytes,maxFiles,maxBytes`; `retainScreenshots=false`, TTL 1..3600, screenshots 0..4, screenshot bytes 0..67108864, files 1..16, bytes 1..69206016.

`cli.mjs:readBoundedJson` owns duplicate-aware bounded parsing. `validateTrustedConfig` owns semantic/cross-field validation, no-follow profile hashing, and deep freezing. Generated `canonicalizeHostConfig` owns lexicographic UTF-8 canonical JSON with integers only, no `-0`/float/exponent, and SHA-256 config digest. Schema, runtime validator, IR vectors, and public `schemas.hostCompanionConfig` must agree exactly.

The calibration profile is a required subordinate part of trusted configuration, not an ambient asset directory. Its closed schema is `calibration-profile/1` with exactly `schemaVersion,profileId,profileVersion,pixelContract,templates,cues,states,actions,transitions`. IDs are unique ASCII 1..64 bytes. `pixelContract` must exactly equal the parent calibration geometry/DPI/content rectangle. `templates` has 1..64 entries with exact keys `id,assetPath,sha256,width,height,mask`; dimensions are 1..512 and no larger than the frame; `assetPath` is a canonical relative safe name under the profile directory, never absolute/dot/dot-dot; `mask` is either null or exact `assetPath,sha256`. `cues` has 1..64 entries with exact keys `id,templateId,searchRect,maxScore,minimumMargin,hotspotX,hotspotY`; rectangles are in frame bounds and admit at least two placements, scores are integers 0..`includedPixels*1020`, margin is 1..that maximum, and hotspots are in template bounds. `states` has 1..128 exact `id,allOfCueIds,noneOfCueIds`, with nonempty unique `allOf` and disjoint lists. `actions` has 1..32 exact `id,semanticAction,recipe`; recipe is either `{"kind":"leftClick"}` or `{"kind":"keyPair","key":"Escape|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight"}`. `transitions` has 1..128 exact `id,preStateId,semanticAction,cueId,selectorDerivationId,postStateId,canaryStage,actionId`; the matching tuple is unique. Unknown fields, duplicate IDs, dangling references, unused actions/templates, and count mismatches with the parent config reject. `profileSha256` hashes the closed canonical profile including asset digests; `effectiveConfigDigest` is `SHA256("host-config/v2" || canonical parent config || canonical validated profile)`. The effective digest, not the parent JSON digest alone, binds hello, receipt, capability, preview, and authorization.

## Normative Windows-to-WSL Mapping and File Verification

`windows-path.mjs:mapPinnedWindowsPathToWsl(windowsPath,{driveLetter,driveMountRoot})` performs:

1. Reject NUL, `/`, relative/rootless paths, UNC (`\\`), device/verbatim (`\\?\`, `\\.\`), drive-relative, wrong/lowercase drive, ADS/any colon after offset 1, empty/dot/dot-dot segments, duplicate separators, trailing separator, trailing dot/space, and reserved DOS segments.
2. Require the configured drive-specific mount root to be lexical-canonical absolute Linux with no dot/dot-dot/duplicate/trailing separator.
3. Preserve Windows segment bytes/case and join them directly below that root. Example: mapping `C:\Program Files\NBA\control.exe` with `{driveLetter:"C",driveMountRoot:"/mnt/c"}` yields `/mnt/c/Program Files/NBA/control.exe`. `/mnt` is invalid for that configuration; `D:` and `c:` reject.
4. Require the result to equal the separately configured WSL path byte-for-byte.
5. `executable-identity.mjs:openPinnedRegularFile` walks every existing ancestor with `lstat`, rejects symlinks or ancestry escaping the canonical realpath of `driveMountRoot`, opens final leaf `O_RDONLY|O_NOFOLLOW`, and requires regular current-UID file, one link, and no group/world write bits. Capture `(dev,ino,mode,uid,nlink,size)` before and after streaming SHA-256, compare configured digest, then compare `realpath(parent)+basename`, `lstat`, and descriptor identity again immediately pre-spawn.

Run this independently for inspector, companion, and configured target image. Any mismatch is terminal before spawn. Closing the descriptor before Windows execution leaves a same-UID/cross-OS replacement interval; the plan makes no race-elimination claim.

## Deterministic Recognition and Selector Semantics

- Pixels are bytes in top-down row-major `BGRA8`; offset is `y*stride+x*4`, channel order B,G,R,A. Templates use the same format. A mask, if present, has exactly one byte per template pixel and permits only `0` (exclude) or `255` (include); at least one pixel is included.
- Every cue search rectangle must admit **at least two** legal template placements; otherwise `E_RECOGNITION_CANDIDATES`. Scan placements row-major. Score is checked integer `Σ|frameChannel-templateChannel|` over all four channels of included pixels. Maximum is `includedPixels*4*255` and must be a safe integer.
- Retain best and second-best placement. Equal best scores are a tie and fail `E_RECOGNITION_TIE`. Match iff `bestScore <= maxScore` (inclusive) and `secondBestScore-bestScore >= minimumMargin` (inclusive); margin is configured integer 1..maximum. No floating point or implicit scaling exists.
- Exactly one registered state may satisfy all `allOf` cues and none of `noneOf`; zero gives `E_STATE_NO_MATCH`, more than one gives `E_STATE_AMBIGUOUS`. Exactly one closed transition must match `(stateId,semanticAction,cueId,selectorDerivationId)`; zero/multiple gives `E_TRANSITION_CLOSED`.
- Evidence records profile/frame/template/mask/crop digests, cue ID, search and matched rectangles, best/second scores and coordinates, included count, algorithm ID, and transition ID. Its canonical digest uses generated canonical JSON and a domain separator.
- Point selector ID is `SHA256("selector/v1" || cueId || matchedRect || hotspotOffset)`. Pixel hotspot is `matchedLeft+offsetX,matchedTop+offsetY` and must be in client bounds. For extent `n`, encode pixel `p` as `n==1 ? 0 : floor((2*p*999999+(n-1))/(2*(n-1)))`; native decode is `n==1 ? 0 : floor((2*u*(n-1)+999999)/(2*999999))`. With configured extents ≤4096 this round-half-up pair must reproduce `p`; vectors prove every endpoint and extent 1.
- Convert client pixel to screen using the receipt-bound client origin. Require it inside the virtual desktop; clamping to the inclusive virtual desktop rectangle is then a proved no-op. Normalize each axis as `extent==1 ? 0 : floor((2*(screen-origin)*65535+(extent-1))/(2*(extent-1)))`. Native vectors prove recognized pixel→fixed selector→client pixel→screen/virtual coordinate identity.

## Event/Call Budget Semantics

One mouse click recipe is exactly move, left-down, left-up; one key recipe is exactly matching key-down, key-up. Each counts one action, 3 or 2 aggregate events, and one of each relevant per-type event. Every request/response operation counts one protocol call; each inspector native snapshot counts one inspection call; each companion discovery/revalidation snapshot counts one query and one inspection call; each GDI acquisition attempt counts one capture call.

All initial configured limits are positive. Immediately before an operation, atomically subtract its action/query/capture/inspection/protocol totals and its entire exact event recipe from remaining counters and append a reservation ledger record. This subtraction is the **only consumption**; constructing events marks reserved slots `prepared` without decrementing again. Check cancellation/deadline between preparation of each event. A cancellation before reservation consumes nothing; after reservation, attempted native call, partial send, exception, or cancellation consumes the reservation permanently. Insufficient aggregate or any per-type counter fails before native authority. `SendInput` is called once; a return other than the exact event count is terminal `ACTION_OUTCOME_UNKNOWN`, with no refund/retry.

## Native GDI Acquisition/Cleanup Ledger

`Capture.cs:Read` and generated structural obligations use this exact state ledger:

1. `GetDC(hwnd)` acquires target/client source DC; zero is `E_GDI_GET_DC`.
2. `CreateCompatibleDC(sourceDc)` acquires memory DC; zero is `E_GDI_CREATE_DC`.
3. `CreateCompatibleBitmap(sourceDc,width,height)` acquires bitmap; zero is `E_GDI_CREATE_BITMAP`.
4. `SelectObject(memoryDc,bitmap)` acquires selection ownership; null or `HGDI_ERROR` is `E_GDI_SELECT`. Save prior object only on success.
5. `BitBlt(...)` false is `E_GDI_BITBLT`.
6. Restore with `SelectObject(memoryDc,priorObject)` **before** `GetDIBits`; null/`HGDI_ERROR` is `E_GDI_RESTORE`. Only success marks bitmap deselected.
7. Allocate checked `stride*height`; prepare negative-height `BITMAPINFO`; `GetDIBits(memoryDc,bitmap,0,height,...)` must return exactly height, else `E_GDI_GET_DIBITS`.

`finally` runs strict reverse ownership order from every injected failure edge: if still selected, retry one restoration; only when deselected call `DeleteObject(bitmap)` and require true; call `DeleteDC(memoryDc)` and require true; call `ReleaseDC(hwnd,sourceDc)` and require exactly 1. `DeleteDC` is never used for target/client DC; `ReleaseDC` is never used for memory DC. After each cleanup attempt, zero the local handle/ownership slot to prohibit double cleanup; record stable cleanup codes `E_GDI_CLEANUP_RESTORE/OBJECT/DC/RELEASE` in order. If a primary code exists it remains the public terminal code and bounded internal evidence contains cleanup codes; if no primary exists, the first cleanup code is public `E_GDI_CLEANUP` with the ordered diagnostics. No native exception/path text crosses protocol. Structural-model tests inject failure at each of seven acquisition/work calls and each four cleanup calls, plus every combination of primary+cleanup failure.

## Exact Files, Public Surface, and Package Contract

### Add

- Original plan additions, plus `src/nba2k27-myplayer/host/target-inspector.mjs` and the five inspector project/generated paths above.
- Add generated receipt vectors/schema/table to the existing IR outputs; no standalone caller-facing receipt schema or receipt file loader exists.

### Replace

- All original replace-in-place paths.
- Explicitly replace `src/nba2k27-myplayer/schemas/host-companion-config.schema.json`, `src/nba2k27-myplayer/index.mjs`, `src/nba2k27-myplayer/cli.mjs`, `package.json`, `test/nba2k27-myplayer/verify-pack.mjs`, and `test/nba2k27-myplayer/verify-no-live.mjs`.

### Delete/supersede

- Delete the original plan's listed handwritten transcript fixtures and `windows-contract.test.mjs` only after generated replacements pass.
- Delete protocol-1/status tables, `fresh:true`, hash-derived states, `DERIVABLE_ACTIONS`, single-record capture, caller receipt inputs, and any obsolete optional `externalHostReceiptDigest` contract.

### Public index/export contract

All non-host exports currently on `index.mjs` lines 8–33 remain byte-for-byte named exports. The host public names remain exactly:

```text
PROTOCOL_VERSION, PROTOCOL_CAPABILITIES, PROTOCOL_OPERATIONS, PROTOCOL_LIMITS,
PROTOCOL_ACTIONS, REVERSIBLE_CANARY_ACTIONS, ProtocolError, parseClosedJson,
decodeProtocolLine, encodeProtocolLine, validateProtocolRecord, deriveSessionId,
validateTranscript, SESSION_STATES, ProtocolSession, ConfigError,
validateTrustedConfig, CompanionTransport, FakeCompanionTransport,
StdioCompanionAdapter, createEvidenceRun, writeEvidence, evidenceStatus,
cleanupEvidence, schemas.hostCompanionConfig
```

No launcher, capability mint/consume, inspector, receipt, executable verifier, recognizer, preview sealer, capture reassembler, generator, native guard, or control function is exported. `package.json.exports` remains exactly `{".":"./src/nba2k27-myplayer/index.mjs","./cli":"./src/nba2k27-myplayer/cli.mjs"}`; package deep imports remain blocked.

### CLI and package manifest

CLI commands remain exactly the existing 13: `validate-request`, `validate-observation`, `optimize`, `replay`, `manual-worksheet`, `manual-import`, `validate-host-config`, `verify-host-transcript`, `fake-host-preflight`, `fake-calibration`, `action-preview`, `evidence-cleanup`, `evidence-status`. No inspector, launch, receipt, capture, input, live, build, or generator command is added.

`package.json.files` is exactly:

```json
["src/","docs/","companion/windows/","protocol/","scripts/generate-host-protocol.mjs","scripts/check-host-protocol.mjs"]
```

Scripts are exactly:

```text
test = node --test test/nba2k27-myplayer/*.test.mjs
check = node --check src/nba2k27-myplayer/index.mjs && node --check src/nba2k27-myplayer/cli.mjs && node scripts/generate-host-protocol.mjs --check
generate:host = node scripts/generate-host-protocol.mjs --write
test:host = node --test test/nba2k27-myplayer/host-*.test.mjs test/nba2k27-myplayer/evidence-vault.test.mjs
check:host = node scripts/check-host-protocol.mjs
verify:no-live = node test/nba2k27-myplayer/verify-no-live.mjs
verify:pack = node test/nba2k27-myplayer/verify-pack.mjs
```

No lifecycle/publication/dependency script exists. `verify-pack.mjs` compares the complete dry-run list against only `package.json`, `src/**`, `docs/**`, `companion/windows/**`, `protocol/**`, and the two exact scripts; it rejects tests, binaries (`exe,dll,pdb`), screenshots/templates other than explicitly reviewed synthetic source fixtures (which remain tests and unpacked), configs, receipts, evidence, credentials, traces, `bin/obj`, and generated test outputs.

## Corrected Dependency Order

1. Add every ledger reproduction first; currently closed cases must stay green and unsafe cases fail for their historical reason.
2. Define IR v2, config v2, canonical parser/digest, path mapping, inspector receipt, recognition arithmetic, budget ledger, GDI obligations, errors, and vectors.
3. Add deterministic generator/checker/reference interpreter and generate Node, companion C#, inspector C#, docs, fake models, vectors, and manifest.
4. Replace package/schema/index/CLI/scripts and prove no privileged public reachability before wiring launch code.
5. Implement vault/CLI preservation regressions and path/file verification.
6. Implement and fake-test inspector acquisition/receipt consumption; control remains impossible without its fresh branded result.
7. Replace protocol/session/launcher/capability and capture framing.
8. Implement GDI capture/reassembly, then recognition/preview, then discovery/full identity.
9. Implement authorization/input/event budgets/cancellation last.
10. Generate docs/status, remove stale files only after replacements pass, and run implementer self-check.
11. Dispatch fresh independent plan-proof/review, then implementation review and integration check. One command-backed implementation remediation remains the maximum.

## Verification Gates

Run from `/home/joshl/projects/nba2k27-myplayer`; no command may invoke Windows, an `.exe`, BlueStacks, ADB, network, Git, global config, install, or publication.

### Gate A — generated/config/trust contracts

```sh
node scripts/generate-host-protocol.mjs --check
node scripts/check-host-protocol.mjs
node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs test/nba2k27-myplayer/host-protocol-mutations.test.mjs test/nba2k27-myplayer/host-trust.test.mjs test/nba2k27-myplayer/host-docs.test.mjs
```

Requires config/schema/parser/digest agreement, exact path vectors, inspector forbidden-authority scan and receipt replay/mismatch/expiry vectors, semantic-rule bijection, C# parser mutations, GDI failure matrix, and generated docs.

### Gate B — full historical and new behavior

```sh
node --test test/nba2k27-myplayer/evidence-vault.test.mjs test/nba2k27-myplayer/host-cli.test.mjs test/nba2k27-myplayer/host-protocol.test.mjs test/nba2k27-myplayer/host-authority.test.mjs test/nba2k27-myplayer/host-capture.test.mjs test/nba2k27-myplayer/host-recognition.test.mjs test/nba2k27-myplayer/host-input-authority.test.mjs test/nba2k27-myplayer/host-discovery.test.mjs test/nba2k27-myplayer/host-cancellation.test.mjs test/nba2k27-myplayer/host-adapter-integration.test.mjs
```

Every ledger row must map to a named subtest and expected stable code. Recognition vectors cover one-candidate rejection, ties, inclusive boundaries, state/transition ambiguity, selector round trips and virtual-desktop endpoints. Budget vectors cover every aggregate/per-type exhaustion and cancellation seam. Capture vectors cover every acquisition and cleanup failure.

### Gate C — preservation/package/no-live

```sh
npm test
npm run check
npm run test:host
npm run check:host
npm run verify:no-live
npm run verify:pack
npm ls --all --json
npm pack --dry-run --json
```

Requires exact exports/scripts/files policy, no privileged reachability, private dependency-free package, no hooks/binaries/live assets, and all legacy behavior.

### Gate D — honest toolchain skip

```sh
command -v dotnet
command -v csc
```

Both are expected unavailable. Record skips; if present, stop rather than compile or broaden scope.

## Corrected Validator Handoff Packets

### Fresh plan-proof before implementation

Re-run an `artifact-proof` validator against the original plan plus this precedence addendum. It must prove: every ledger row has path/function/test/code/command; receipt authority cannot be caller- or companion-created; config/schema/index/package contracts are closed; mapping examples are unambiguous; recognition/budget/GDI semantics are complete; and no superseded optional receipt or stale script remains. Any omission blocks implementation.

### Fresh implementation review

After implementation, a fresh `review` validator independently runs Gates A–D and reports matrices for: historical ledger; seven findings; inspector separation/receipt freshness/single use; config/path identity; generated parity; GDI cleanup; recognition/selector; budgets/partial send; cancellation; exports/package/no-live; and static/host limitations. A failure cites exact command, behavior, and minimal paths.

### Final integration check

Acceptance requires all: `gate-historical-ledger`, `gate-seven-findings`, `gate-inspector-authority`, `gate-config-path`, `gate-generated-contract`, `gate-native-model`, `gate-preservation`, `gate-package`, `gate-no-live`, and `gate-limit-disclosure`. Partial acceptance is forbidden. Independent evidence must attach command outputs, pack inventory, generated digests/rule coverage, mutation results, receipt attack matrix, and skipped compiler statement.

## Assumptions, Tradeoffs, and Residual Risks

- The separately pinned inspector is the selected non-circular authority because it has no input/capture authority and the parent obtains its challenge-bound result directly. It is not a security boundary against malicious same-UID replacement/collusion, compromised builds, or Windows deception.
- Strict drive-specific mapping and file modes may reject legitimate installations. Failure is preferable to ambient discovery.
- Synthetic fixtures prove only deterministic software semantics. They establish no NBA 2K27/BlueStacks template, topology, capture, freshness, focus, UIPI, ABI, compilation, or input behavior.
- GDI timestamps prove operation order, not newly presented emulator frames. Static resource models do not prove Win32 cleanup at runtime.
- No implementation, final validation, native execution, host contact, network/ADB, Git, global configuration, publication, or real calibration was performed by this synthesis.

## Work Performed

- Summary: Resolved all five plan-proof blockers by adding an exhaustive historical ledger, a separate hash-pinned inspector receipt authority, exact config/path/package contracts, deterministic recognition/selector and event accounting, and a complete GDI ownership/failure ledger; corrected dependency and validator packets.
- Files read: Contract/schema/template; six supplied role artifacts; read-only current candidate package, index, config schema/runtime validator, CLI, vault, host tests, and package/no-live verifiers needed to make integration contracts exact.
- Files changed: Only this planner trace artifact; no implementation file was edited.
- Commands/checks: No shell commands or validation executed; read-only file inspection only.

## Output Contract

- orderedPlanOrResolvedConclusions: Precedence decisions and corrected eleven-step dependency order above.
- fileContractsOrDecisions: Exact historical ledger, receipt authority, config v2, mapping, recognition, budget, GDI, exports/package/CLI, and add/replace/delete contracts above.
- dependencies: `root-researcher-001-closure`, `root-planner-002-integrated-closure`, and failed `root-validator-003-plan-proof`; a fresh plan proof must pass before implementation.
- verificationGates: Gates A–D and corrected independent validator packets above.
- handoffNotes: Treat this artifact as normative over conflicting original-plan text; implement only in the candidate root, retain no-live/public boundaries, and do not infer host readiness.
- Outputs: Resolved synthesis conclusions and mechanically complete implementation/validation handoff.
- Evidence: Supplied command-backed validator traces and read-only current integration contracts; design decisions are requirements, not claims of implemented or host behavior.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-004-plan-remediation.md`
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-004-plan-remediation.md`

## Handoff

- Next role: Fresh validator in `taskMode: artifact-proof`; only after PASS, fresh bounded implementer work units in the dependency order above.
- Limitations: Synthesis and source-contract inspection only; no implementation, tests, compiler, Windows/BlueStacks, network/ADB, or final acceptance evidence.
- Risks: Same-UID/cross-OS replacement, inspector/control collusion under a compromised user/build, target change after receipt, static C# evidence ceiling, GDI/frame-age uncertainty, and all deferred host compatibility risks.
