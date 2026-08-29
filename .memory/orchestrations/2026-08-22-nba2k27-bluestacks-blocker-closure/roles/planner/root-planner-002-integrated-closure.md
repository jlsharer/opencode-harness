# Integrated Seven-Blocker Closure Plan

## Metadata

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- role: `planner`
- artifactId: `root-planner-002-integrated-closure`
- createdAt: `2026-08-22`
- taskMode: `plan`
- delegationTaskId: `dt-plan-closure-002`
- scopeKey: `integrated-plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh planner packet, approved goal, boundaries, seven acceptance groups, four supplied evidence artifacts, dependencies, assumptions, and three decisions to resolve.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness` (trace workspace). The planned implementation target named by the approved goal is `/home/joshl/projects/nba2k27-myplayer`.

## Seven-Finding Traceability Table

All paths in this table are relative to `/home/joshl/projects/nba2k27-myplayer`. “Generated” means the file is reproducibly emitted from `protocol/host-protocol.ir.json` and must pass byte-for-byte regeneration.

| # | Exact prior reproduction | Root cause | Required invariant | Files/functions | Positive and negative tests | Generated artifact | Documentation section | Validation command |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1. Hello trust | Fake child supplied the configured image digest but wrong build ID, final-path digest, signer, integrity, Windows build, DPI mode, PID, and creation time; `launchCompanion` accepted because line 53 called `acceptHello` without expected identity. | Static parent expectations, parent-observed Linux bytes, and companion-observed Windows facts are conflated; the session ID trusts self-reported creation time. | Before spawn, the parent validates the explicit WSL path, deterministic Windows↔WSL lexical mapping, file identity, bytes/digest, protocol/config/invocation/session pins, and expected static hello fields. Hello exactly echoes the challenge/static pins. Dynamic PID, creation, final opened path, signer, integrity, Windows build, and DPI are observations only and cannot mint control authority. | `protocol/host-protocol.ir.json`; `src/.../host/{trusted-config,windows-path,executable-identity,launch-companion,protocol-session,run-capability}.mjs`; generated `protocol-v1.mjs`; generated `companion/windows/Protocol.cs`; `Identity.cs`. | Exact expected hello passes; independently mutate every static echo/nonce/capability and reject pre-operation; dynamic mutations remain labeled unverified evidence and cannot satisfy the independent-receipt gate; missing receipt cannot mint control; path case/segment/mount/symlink/file replacement and digest drift fail; session derivation excludes self claims. | `src/.../host/protocol-v1.mjs`, `companion/windows/Protocol.cs`, `test/.../generated/conformance-vectors.json`, docs trust table/error catalog. | “Trust sources, hello, and executable selection.” | `node --test test/nba2k27-myplayer/host-trust.test.mjs test/nba2k27-myplayer/host-authority.test.mjs` |
| 2. Pixel-derived preview | `markPreviewed({semanticAction})` hard-coded Escape, made pre-state from the capture hash prefix, and made post-state from another digest; no pixels, templates, cues, coordinates, or recognition evidence were inputs. | Preview was a hash-derived authorization constructor, not recognition of transported pixels against an approved calibration bundle. | Only verified reassembled BGRA bytes plus a validated operator-created profile may enter recognition. Recognition deterministically selects one registered state/transition, derives selector and expected post-state, records cue coordinates/scores/digests, and seals the preview. Caller selector/state fields are unrepresentable. | `src/.../host/{calibration-profile,recognizer,preview-sealer,protocol-session,stdio-companion-adapter}.mjs`; `test/.../fixtures/host/calibration/synthetic-profile.json`; synthetic `.bgra` fixtures. Delete `DERIVABLE_ACTIONS` and `markPreviewed(preview)`; replace with `recognizeCapture(frame, profile)` and `sealPreview(recognition, semanticAction, budgets, expiry)`. | Synthetic exact/threshold pass; one-pixel boundary; row-major tie; uniqueness-margin fail; required/forbidden cue fail; profile/template/mask/crop/DPI/geometry drift fail; caller selector/pre/post ignored/rejected; post-state is not accepted until a second recognized capture. | Profile/state/transition schemas and recognition rule vectors. | “Calibration profile, recognition evidence, preview sealing.” | `node --test test/nba2k27-myplayer/host-recognition.test.mjs test/nba2k27-myplayer/host-adapter-integration.test.mjs` |
| 3. Capture transport | Native `Capture.Read` produced bytes, but `Protocol.cs` returned no bytes/dimensions/format/times; it echoed the barrier and asserted `fresh=true`. `GetDIBits` ran while the bitmap was selected. | A one-record capture summary was mistaken for transported pixel evidence and operation ordering; GDI resource order was wrong. | One capture request yields a non-interleaved `captureStart`, exact contiguous `captureChunk*`, and `captureEnd`. Bounds are validated before pixel allocation; raw top-down BGRA is reassembled and digest checked. Before/after target snapshots and times prove correlated operation ordering, not emulator-frame age. Every native resource is restored/released on all exits. | IR capture records; `src/.../host/{capture-reassembler,protocol-session}.mjs`; `companion/windows/{Capture,OperationExecutor,Program}.cs`; generated validators/fake. | Empty/oversize/overflow dimensions; stride/total/count mismatch; malformed/noncanonical base64; duplicate/missing/reordered/interleaved chunks; bad per-chunk/whole/metadata/provenance digest; nonce/sequence/identity/time drift; truncation/EOF/cancel; synthetic exact reassembly. Structural cleanup checker mutates restore-before-`GetDIBits`, delete/release paths, and before/after snapshots. | Capture schemas, vectors, C# record/validator tables, fake chunk emitter, error catalog. | “Capture framing, operation freshness, and GDI limits.” | `node --test test/nba2k27-myplayer/host-capture.test.mjs test/nba2k27-myplayer/host-protocol.test.mjs` |
| 4. Native input binding | C# authorize retained only plan/budgets/expiry; input compared only plan/capture/sequence/deadline, accepted arbitrary schema-valid selectors/states, allowed fixed point `1_000_000`, lacked post-check, then called `SendInput`. | Node capability, approval, and native authorization were separate incomplete authority models. | One canonical immutable authority binds executable/config/session/target/capture/frame/recognition/preview/action set/approval/canary/geometry/focus/budgets/deadlines. Selector comes only from recognition. Action and per-event budgets are reserved before the one `SendInput` call. Only an exact 2-event key pair or 3-event left click is allowed. Zero/partial/exception/post-dispatch drift is terminal `ACTION_OUTCOME_UNKNOWN`, consumes authority, and is never retried. | IR `bindings`, `operations.authorize/input`, `nativeGuards`; `src/.../host/{run-capability,protocol-session,preview-sealer}.mjs`; `companion/windows/{OperationExecutor,Input}.cs`; generated C# guards. | Delete/mutate each binding field; approval replay; stale capture/recognition/preview; canary or stage drift; zero budgets; endpoint mapping; key/mouse allowlist; reordered guards; dispatch before charge; zero/partial/full fake SendInput; post-return identity/focus drift; retry attempt. | Closed binding schema, guard table, state vectors, fake native outcomes, errors. | “Authority tuple, immediate rechecks, input outcome.” | `node --test test/nba2k27-myplayer/host-input-authority.test.mjs test/nba2k27-myplayer/host-authority.test.mjs` |
| 5. Discovery/cancel | `Identity.Discover` enumerated and hashed up to 32 ambient visible windows with no exact configured filter; identity omitted final path/signature/cloak/frame/monitor details. `Program` synchronously read/handled requests and had no successful cancel path. | Discovery, target identity, and worker lifecycle were underspecified; reader and native work could not progress concurrently. | Bounded discovery applies exact operator profile filters before expensive work, returns opaque tokens, and never selects. Bind/recheck includes HWND ownership, PID+creation+parent relation, final path/image/signature-policy result, class/title, visibility/cloak/style, client/content/frame rectangles, DPI/monitor. A dedicated bounded reader and one worker support EOF, request cancel, `AbortSignal`, deadlines, and exact process termination semantics. Cancellation is checked between every controllable native step and while constructing each event; once the single `SendInput` call begins, late cancellation means unknown outcome. | `src/.../host/{protocol-session,launch-companion}.mjs`; `companion/windows/{Program,Identity,OperationExecutor}.cs`; generated terminalization/state tables. | Zero/many/filter mismatch/over-limit candidates; owner/root-owner/parent PID/start/path/class/style/geometry/DPI mutation at bind, capture, authorize, pre-dispatch, post-dispatch; cancel queued/pre-native/pre-dispatch/during-call/post-return; EOF idle/chunks/action; timeout/AbortSignal/error/nonzero/orphan termination fake schedules. | Discovery/identity schemas, cancellation state vectors, generated worker transition/error table. | “Discovery and identity”; “Cancellation and terminal outcomes.” | `node --test test/nba2k27-myplayer/host-discovery.test.mjs test/nba2k27-myplayer/host-cancellation.test.mjs test/nba2k27-myplayer/host-authority.test.mjs` |
| 6. No-compiler parity | `windows-contract.test.mjs` used 11 positive and one negative regex checks; all tests passed despite findings 3–5. `dotnet` and `csc` were unavailable. | Hand-maintained Node/C# contracts and token-presence assertions could not establish semantic correspondence. | One IR generates Node validators/state transitions, fake companion behavior, C# protocol core/guards, vectors, errors, and docs. Regeneration is exact. Every semantic rule has a mutation case that changes vectors and generated control flow and causes a checker failure. A tokenizer/parser validates generated C# declarations, decisions, transition tables, method calls, branch operands, and native guard order—not words. Claims stop short of compilation/ABI/Win32 behavior. | Add `protocol/host-protocol.ir.json`, `scripts/{generate-host-protocol,check-host-protocol}.mjs`, `test/.../support/{protocol-reference,csharp-structural-checker}.mjs`, `host-protocol-generation.test.mjs`, `host-protocol-mutations.test.mjs`; delete `windows-contract.test.mjs`. | Exact generation; independent reference interpreter executes every positive/negative vector; swap equality operand, omit binding, widen coordinate, force freshness, move charge, bypass cancel, change interop signature/cleanup/order, accept partial SendInput—each must fail. Mutation coverage is keyed one-to-one to every IR `semanticRules[].id`. | All files named above plus `generated/manifest.json` with source digest/output digests/rule coverage. | “Generated authority and offline evidence limits.” | `node scripts/check-host-protocol.mjs && node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs test/nba2k27-myplayer/host-protocol-mutations.test.mjs` |
| 7. Docs drift | `host-companion-protocol.md` said capture/input fail closed while C# invoked `BitBlt`/`SendInput`; it described chunking absent from wire behavior. | Security-significant protocol/status prose was maintained independently from implementation contracts. | Protocol/version/records/fields/limits/states/errors/examples/trust labels/activation status are generated from the IR. Hand prose may explain residual risks but cannot redefine generated facts. Examples are executable vectors. Status says dormant source exists, offline evidence is static, and control remains disabled without independent host evidence. | Generated blocks in `docs/.../host-companion-protocol.md`; update `windows-host-preflight.md` and `companion/windows/README.md`; generator/checker and doc tests. | Change a limit, record, status, unknown-outcome rule, trust label, or example and stale-check fails; every JSONL example decodes and executes; contradiction lint rejects “verified/active/supported/fresh frame” claims outside allowed caveat text. | Generated Markdown blocks/examples/status matrix. | “Implementation status and activation ladder.” | `node scripts/check-host-protocol.mjs && node --test test/nba2k27-myplayer/host-docs.test.mjs` |

## Resolved Decisions

### D1 — Framing remains bounded JSONL

Use JSONL because a raw chunk maximum of 49,152 bytes expands to exactly 65,536 base64 characters, leaving more than 32 KiB under the fixed 98,304-byte line limit for closed metadata. This is safe only as a three-record-type subprotocol, not as the current one-result capture.

1. `captureStart` opens one capture response and carries correlation plus all allocation bounds.
2. `captureChunk` carries one indexed chunk. No other protocol record may interleave.
3. `captureEnd` closes the stream and is the only point at which pixels become usable.

The decoder applies the line bound before JSON parsing, the closed JSON bounds before semantic validation, start arithmetic before `Buffer.alloc(byteTotal)`, and aggregate stdout/session bounds throughout. Any failure terminalizes the session and discards the incomplete buffer. A capture stream is not a series of separately successful responses.

### D2 — Windows path mapping is pure, explicit, and fail closed

Add `windows-path.mjs` with `mapPinnedWindowsPathToWsl(windowsFinalPath, mountRoot)`. The config must explicitly contain `windowsDriveMountRoot` (initially an operator value such as a canonical absolute drive-root path; no default) and both final paths. The mapper accepts only one uppercase drive-letter absolute Windows path, rejects UNC/device/verbatim paths, ADS/colon after the drive, empty/dot/dot-dot segments, trailing dot/space, reserved device segments, NUL, separators in segments, and noncanonical WSL roots. It lowercases only the drive letter and joins the original path segments. The result must be byte-for-byte equal to `wslExecutablePath`; no PATH, `wslpath`, registry, environment, filesystem search, case folding, or ambient mount lookup is allowed. A legitimate installation whose spelling/mount cannot satisfy that proof is unsupported and fails before file open.

The parent then no-follow opens and hashes the explicit WSL file, compares before/after descriptor identity and digest, closes it, immediately re-lstats the same path, and gives that exact string to `spawnAuthority`. This establishes which bytes the parent reviewed, not which Windows image ultimately executed. Because Node/WSL cannot execute the retained Linux descriptor as the Windows image, same-UID replacement after the last check remains a documented race. The companion’s final-path/image report cannot close that race.

### D3 — Static C# evidence is semantic but not compilation evidence

Generated C# uses a deliberately narrow grammar: immutable record declarations, closed field-spec arrays, transition/guard tables, and straight-line calls into handwritten native modules. The custom checker tokenizes identifiers/literals/operators/braces, builds declarations and method/control-flow nodes, resolves table references, and compares normalized structures to the IR and vectors. Unsupported syntax in generated regions fails closed. For handwritten native seams it verifies parsed method bodies and ordered call nodes, including `ReserveBudgets` before `RevalidateIdentity`/`RequireForeground`/`SendInput`, restore-before-`GetDIBits`, complete `finally` cleanup, one `SendInput`, and exact return-count comparison.

The mutation runner modifies a temporary IR or parsed C# tree—not source strings—and requires each `semanticRules[].id` to: (a) change at least one positive/negative executable vector, (b) change the generated Node decision artifact, (c) change the generated C# decision/control-flow artifact, and (d) be rejected when one side remains stale. This is substantially stronger than token presence. It still proves neither C# compilation nor source-generator, ABI, marshaling, runtime resource, Win32, WSL, BlueStacks, capture, focus, UIPI, or input behavior; those remain later gates.

## File Contracts and Canonical IR

### 1. Canonical source: `protocol/host-protocol.ir.json`

Use closed JSON parsed with duplicate-key detection. Top-level keys are exactly:

```text
schemaVersion, protocolVersion, canonicalizationVersion, limits, identifiers,
trustSources, hello, records, operations, states, bindings, errors,
calibrationProfile, recognition, nativeGuards, terminalOutcomes,
documentation, semanticRules
```

Required contracts:

- `schemaVersion = "host-protocol-ir/1"`; `protocolVersion` changes from `1.0` to `2.0` because capture framing and authority records are incompatible.
- `limits`: exact integers for line/depth/nodes/keys/string/array/transcript/stdout/stderr, capture width/height/stride/bytes/chunk bytes/chunks, candidates, templates/cues/search pixels, action/query/event budgets, request/session duration, and cancellation turns. Cross-field predicates are named semantic rules, not comments.
- `identifiers`: anchored ASCII patterns, byte lengths, digest algorithm `sha256`, nonce bytes `32`, canonical base64url/base64 rules, canonical JSON version, and domain separators.
- `trustSources`: each field has exactly `parentConfigured`, `parentObserved`, `externalReceipt`, or `companionObserved`. Only the first three may appear in authority. `companionObserved` is evidence-only.
- `hello`: exact challenge and result field specs. Challenge includes client nonce, launcher invocation ID, protocol, exact ordered capabilities, config digest, parent-observed executable digest, expected build ID, expected final-path digest, signer-policy digest, integrity policy, Windows-build policy, DPI policy, and optional external host-receipt digest. Result contains `challengeEcho` exactly equal to all challenge fields, server nonce, and a separately named `observations` object. Observations include PID, process creation FILETIME, opened final-path digest, image digest, signer result, integrity, Windows build, and DPI mode; none feeds session or capability derivation.
- Session ID is SHA-256 over a length-delimited canonical tuple with a domain separator, protocol, client nonce, server nonce, launcher invocation ID, parent-observed executable digest, config digest, and exact static challenge digest. It excludes all dynamic observations.
- `records`: exact field/type/range/unknown-field policies for `hello`, `helloResult`, `request`, ordinary `response`, `captureStart`, `captureChunk`, and `captureEnd`. Every record after hello carries session/request/sequence/operation correlation.
- `operations`: request/result/error variants and predecessor states for discover, bind, capture, authorize, input, cancel, and close. Capture’s terminal success is `captureEnd`; chunks are not terminal responses.
- `states`: complete deterministic transition table including `CAPTURE_STREAMING`, `PIXELS_VERIFIED`, `RECOGNIZED`, `PREVIEW_SEALED`, canary/post-capture states, cancellation, `ACTION_OUTCOME_UNKNOWN`, and terminal states. No generic fallthrough transition exists.
- `bindings`: one ordered field list for launch, target, frame, recognition, preview, action, approval, canary, and budget/deadline authority. Every consumer compares the canonical digest and required constituent fields; digest equality never substitutes for required semantic validation.
- `errors`: stable code, terminal/nonterminal classification, whether dispatch may have begun, whether budgets remain consumed, and public redaction text. No native exception text/path enters protocol output.
- `semanticRules`: every field has `id`, `description`, `nodeDecision`, `csharpDecision`, `positiveVectorIds`, `negativeVectorIds`, and a closed `mutation` recipe. Generation fails if any validator predicate, state edge, binding, trust rule, guard order, limit relation, cleanup obligation, or terminal outcome lacks a rule and mutation.

### 2. Deterministic generator and outputs

Add `scripts/generate-host-protocol.mjs`. It accepts only `--write` or `--check`, resolves repository paths from `import.meta.url`, uses no network/time/randomness/environment, parses the IR closed, sorts only fields declared unordered, preserves declared order elsewhere, writes LF/UTF-8 with one terminal LF, and writes through same-directory temporary files plus rename in write mode. `--check` generates in memory and byte-compares every output, reports only repository-relative stale paths, and exits nonzero without edits.

Inputs are exactly the IR, generator source, and fixed templates under `protocol/templates/`. Outputs are:

- `src/nba2k27-myplayer/host/protocol-v1.mjs` — despite the historical filename, generated exports are protocol 2; rename imports in a later cleanup is optional only if done atomically. It contains record validators, constants, transitions, binding comparators, errors, session derivation, and capture-stream validation helpers.
- `test/nba2k27-myplayer/generated/fake-companion-model.mjs` — deterministic fake protocol/native model with injected clock, bytes, snapshots, cancellation seams, and SendInput outcomes.
- `companion/windows/Protocol.cs` and `companion/windows/Generated/ProtocolModels.Generated.cs` — generated parser/records/state/validation/operation-guard tables. `Protocol.cs` ceases to contain handwritten native authority.
- `test/nba2k27-myplayer/generated/conformance-vectors.json` — canonical positive/negative hello, record, state, capture, binding, cancellation, and terminal-outcome vectors with expected state/error.
- `test/nba2k27-myplayer/generated/error-catalog.json`.
- Generated marker blocks in `docs/nba2k27-myplayer/host-companion-protocol.md` for limits, trust, record fields, state transitions, errors, examples, and implementation status.
- `test/nba2k27-myplayer/generated/manifest.json` containing IR/generator/template/output SHA-256 values and sorted semantic-rule/vector/mutation coverage. The manifest does not include itself.

`scripts/check-host-protocol.mjs` runs generator check, both JS interpreters, structural C# checking, mutation coverage, docs examples, and generated-manifest digest verification.

### 3. Exact capture framing

`captureStart` fields are exactly:

```text
v, kind, sessionId, requestId, sequence, operation, captureId,
captureNonce, targetBefore, width, height, stride, pixelFormat, byteTotal,
chunkBytes, chunkCount, contentRectPx, dpiX, dpiY, monitorDigest,
captureMethod, captureMethodVersion, operationStartedMonotonicTicks,
monotonicFrequency, operationStartedUtcMs
```

Constraints: `operation="capture"`; `pixelFormat="BGRA8_TOP_DOWN"`; width/height positive within profile and global limits; checked `stride = width * 4`; checked `byteTotal = stride * height`; `chunkBytes` is positive and at most 49,152; `chunkCount = ceil(byteTotal/chunkBytes)` and within the configured maximum; rectangle is closed and in bounds; target/profile/geometry/DPI/monitor equals the bound target; nonce exactly echoes the request’s fresh 32-byte capture nonce. Parent validates all of these before allocating `byteTotal`.

Each `captureChunk` is exactly:

```text
v, kind, sessionId, requestId, sequence, operation, captureId,
captureNonce, index, decodedBytes, chunkSha256, dataBase64
```

Indices must arrive once in ascending contiguous order from zero. Decoded size is `chunkBytes` except for the mathematically exact final remainder. Base64 must have canonical alphabet/padding and re-encode byte-for-byte. Decode into the prebounded target slice while hashing; reject interleaving, duplicates, gaps, excess chunks/bytes, and trailing chunks.

`captureEnd` is exactly:

```text
v, kind, sessionId, requestId, sequence, operation, captureId,
captureNonce, targetAfter, copyCompletedMonotonicTicks,
operationEndedMonotonicTicks, monotonicFrequency, operationEndedUtcMs,
pixelsSha256, metadataSha256, provenanceSha256, outcome
```

`outcome` is exactly `complete`. Frequencies match start; ticks satisfy start ≤ copy ≤ end; wall times satisfy start ≤ end and remain within request/session deadlines. Before and after full target snapshots are exactly equal and match the bound target. `metadataSha256` hashes canonical start/end metadata excluding all three final digests; `provenanceSha256` hashes a domain-separated length-delimited tuple of metadata digest, pixel digest, and ordered chunk digests. Pixel digest is recomputed over raw bytes. Pixels become immutable input to recognition only after all checks pass.

C# capture order is: full before snapshot; bounds; acquire window DC; create compatible DC/bitmap; select bitmap; `BitBlt`; restore prior selected object; allocate bounded BGRA array; `GetDIBits` to negative-height top-down DIB; record copy tick; full after snapshot; hash/stream. `finally` conditionally restores selection if still selected, deletes bitmap, deletes memory DC, and releases the source DC on the acquiring thread. Cleanup failures cannot overwrite the primary error; a cleanup-only failure is terminal. This proves operation correlation only—never “fresh emulator frame.”

### 4. Calibration profile and deterministic recognition

The operator-created profile is closed JSON with exact top-level keys:

```text
schemaVersion, profileId, profileRevision, protocolVersion, pixelContract,
targetPolicyDigest, templates, cues, states, actions, transitions
```

- `pixelContract`: BGRA8 top-down, exact width/height/stride, content rectangle, DPI policy, monitor policy, and no implicit scaling.
- `templates[]`: unique safe ID, relative asset ID (not arbitrary path), exact width/height, raw BGRA SHA-256, optional binary-mask asset ID/digest, and nonzero unmasked-pixel count. Assets are operator supplied later; repository assets are synthetic geometric/color fixtures explicitly named `synthetic-*`.
- `cues[]`: unique ID, template ID, bounded search rectangle, integer metric `sum-absolute-bgra-v1`, maximum score, minimum second-best margin, and hotspot offset within template bounds.
- `states[]`: unique ID, nonempty `allOfCueIds`, `noneOfCueIds`, and exact-match policy. Exactly one state must satisfy the evidence.
- `actions[]`: semantic action, mutation class, selector kind, and allowed event recipe ID. No free-form text/chord/shell value.
- `transitions[]`: unique tuple `(preStateId, semanticAction, cueId, selectorDerivationId)` to exactly one `postStateId`, canary stage, and action ID. Ambiguous or missing tuples reject.

Validation hashes every asset before use, rejects unknowns/duplicates/out-of-bounds arithmetic, and computes a canonical profile digest. Recognition scans each cue’s region row-major, computes integer SAD over unmasked BGRA channels with checked integers, retains deterministic best and second-best positions, and accepts only score ≤ threshold and `(secondBest-best) ≥ margin`. Ties fail. Evidence includes frame/profile/template/mask/crop digests, cue ID, rectangle, best/second scores, unmasked count, algorithm/version, and chosen coordinates. State derives only from registered cue predicates. Point selector is the matched hotspot and is converted to fixed `[0,999999]` by `floor(pixel * 999999 / max(1, extent-1))`; reverse mapping must be in `[0,width-1]`/`[0,height-1]`. Key pairs may come only from the transition’s registered recipe. Expected post-state comes only from that transition.

The sealed preview is canonical and includes full launch/target/capture/frame/profile/recognition/transition/action/budget/expiry bindings. It accepts only `(verifiedFrame, validatedProfile, semanticAction, requestedBudgets, expiry)`; no selector, pre-state, post-state, cue result, or mutation class is caller input. Exact operator approval signs/digests the entire displayed preview. A fresh post-action capture must independently recognize the registered post-state; the prediction alone is not success.

### 5. Complete authority and input contract

The control capability, authorize request, native immutable authorization, and input request all bind the same canonical fields:

```text
protocolVersion, executableSha256, configDigest, launcherInvocationId,
sessionId, externalHostReceiptDigest, targetDigest, profileDigest,
processId, processCreationTime, parentProcessDigest, ownerWindowDigest,
finalImagePathDigest, imageDigest, signerPolicyDigest, classDigest,
titleDigest, styleDigest, visibilityDigest, clientRectDigest,
contentRectDigest, frameRectDigest, dpiDigest, monitorDigest,
captureId, captureNonce, captureSequence, frameSha256,
captureMetadataSha256, captureProvenanceSha256, calibrationProfileDigest,
recognitionEvidenceDigest, transitionId, previewDigest, actionSetDigest,
actionDigest, semanticAction, selectorDigest, expectedPreState,
expectedPostState, mutationClass, approvalId, approvalDigest,
canaryId, canaryStage, maxActions, maxQueries, maxEvents,
remainingActions, remainingQueries, remainingEvents,
requestDeadlineUtcMs, sessionDeadlineUtcMs
```

No control capability is minted unless `externalHostReceiptDigest` names independently obtained Windows build/placement/read-only identity evidence whose expected static deployment fields match config. The companion cannot produce that receipt. Offline tests use a clearly synthetic test-only receipt issued by an injected fake authority.

Immediately before dispatch, generated/native guards execute in this exact order:

1. request/session/sequence/operation/body closure and outstanding-worker identity;
2. EOF/session/request cancellation, request deadline, session deadline, approval expiry;
3. constant-time comparison of every immutable authority field and canonical constituent value;
4. require correct canary/continuation stage and exact recognized action/selector/transition;
5. prove positive action/query/event remainders, then atomically reserve one action and the exact event count before native authority; no refund after this point;
6. full fresh target snapshot and comparison of process/window/owner/path/image/signature/class/style/visibility/cloak/client/content/frame/DPI/monitor fields;
7. require current foreground HWND exactly equals bound HWND; never call `SetForegroundWindow`;
8. while constructing each allowlisted event, check cancellation/deadline and decrement its already-reserved event slot; reject unexpected key state where observable;
9. final cancellation/deadline/full snapshot/geometry/focus check at the dispatch seam;
10. exactly one `SendInput(events.Length, events, sizeof(INPUT))` call;
11. compare inserted count exactly, then take a post-call full identity/geometry/focus snapshot for evidence;
12. require a separately requested, framed, recognized post-capture before reporting the transition observed.

Allowed batches are only: key down plus matching key up for Escape/Enter/arrows, or absolute move plus left-down plus left-up. No chord, text, held key, right click, wheel, drag, multi-click, or extra flag is allowed. Point pixels are clamped by construction to inclusive client pixels before conversion to virtual-desktop absolute coordinates; IR vectors cover extent 1 and both endpoints. Per-event budget means all two/three event slots are positive and charged before the call. SendInput inserts an array in one API call, so cancellation cannot be observed between actual Windows insertions; cancellation is checked between construction/native steps and immediately before the call. Any zero/partial return, exception, crash, EOF, timeout, cancellation after call entry, or post-check drift becomes terminal `ACTION_OUTCOME_UNKNOWN`; authority and budgets stay consumed and no retry/compensation occurs.

### 6. Discovery, identity, lifecycle, and cancellation

Extend trusted target/profile input with exact operator-created predicates—never defaults—for process image digest, optional required parent-process image/start relation, class/title digests, required style/ex-style masks, required owner/root-owner relation, visibility/uncloaked/non-minimized status, client/content/frame geometry policy, DPI policy, monitor digest, and maximum candidates. Discovery first applies bounded window/class/title/style/visibility/cloak checks, then PID and parent/owner relation, and only then opens/hashes the process and checks signature policy. It stops with an error on enumeration failure or candidate overflow, returns opaque random per-session tokens, and never auto-selects. Bind requires explicit one-token selection and a complete resnapshot.

Every target snapshot contains HWND→PID, PID creation FILETIME, parent PID+creation/image digest when required, owner/root-owner window digests, final process path digest, image digest, signature-policy result digest, class/title/style digests, visible/iconic/cloak flags, client/content/extended-frame rectangles, DPI awareness/window DPI, monitor digest, and foreground flag. Revalidate at bind, capture before/after, authorize, every pre-input seam, and post-input. Raw paths/titles do not leave the companion; policy digests do.

`Program.cs` becomes an async bounded byte-framed stdin reader plus one serialized operation worker. The reader owns parsing/correlation and a request cancellation registry; the worker owns native state. `cancel` can mark only the exact outstanding request. EOF cancels queued/in-progress work, closes output, and exits nonzero if any request/capture/action is incomplete. Parent `AbortSignal`, request timeout, or session timeout sends one correlated cancel when safe, closes stdin, waits a fixed grace period, then terminates the exact child handle; fake tests prove signals/order and no reuse. Before native dispatch, cancellation returns a correlated cancelled terminal result with no input. At or after `SendInput` entry, cancel/EOF/timeout cannot prove no action and therefore yields `ACTION_OUTCOME_UNKNOWN`.

## Ordered Implementation Plan and Dependencies

Each step is a separate implementation work unit with fresh independent validation. Do not start a dependent step until its gate passes.

1. **Freeze baseline and add reproduction tests.** Add failing tests for all seven final attacks and preserve the existing optimizer/oracle/report/UI/CLI/package suite. Gate: attacks fail for the expected current reason, baseline suite remains unchanged, and no public/default host authority appears.
2. **Create IR/generator/reference evidence first.** Add closed IR, deterministic generator, generated Node/C#/fake/vector/error/docs artifacts, checker, structural parser, and mutation coverage. Do not yet connect native authority. Gate: exact regeneration, two JS interpreters agree on every vector, all mutations are detected, C# static limits are stated honestly.
3. **Replace protocol/session contracts.** Move Node codec/state/binding logic and fake companion to generated protocol 2 artifacts; implement capture streaming state and transcript validation. Delete handwritten fixtures/contracts listed below. Gate: historical malformed/unsolicited/correlation attacks plus all stream mutations reject.
4. **Implement explicit path/trust/launcher lifecycle.** Add strict lexical mapping, descriptor hashing/rechecks, static challenge echo, observation-only dynamic fields, receipt gate, session derivation, abort/EOF/termination behavior, and full capability bindings. Gate: wrong-hello/path/byte/replacement/lifecycle matrix passes and same-UID risk remains documented.
5. **Implement capture contract before recognition.** Correct native resource order and produce start/chunks/end; reassemble in Node and fake. Gate: byte-exact synthetic frames and all malformed chunk/provenance/cleanup mutations pass; no freshness claim is made.
6. **Implement calibration/recognition/preview.** Validate operator profile schema/assets, deterministic matching, state/transition/selector derivation, sealed preview, exact approval, and post-capture recognition. Gate: synthetic profile matrix passes; no NBA/BlueStacks value or caller state/selector exists.
7. **Implement bounded discovery/full identity.** Add exact-filter discovery, opaque selection, parent/owner/process/window identity, and all revalidation boundaries. Gate: fake native snapshot drift at every seam rejects before authority.
8. **Implement native authorization/input/cancellation last.** Generated guards must wrap handwritten native seams; add one-worker async cancellation, exact budget reservation/order, one allowlisted SendInput batch, unknown outcome, and post-capture requirement. Gate: structural guard-order and schedule/partial-send tests pass; source remains unreachable publicly and unactivated.
9. **Generate/update docs and package contracts.** Replace stale status and examples with generated blocks; document offline limits and later staged ladder. Update package scripts and pack expectations for source additions only. Gate: examples execute, contradiction lint passes, no generated test/calibration/live evidence is packed.
10. **Implementer self-check, then independent hostile review.** Implementer runs the exact commands below and hands off changed-file/digest evidence. Validator independently re-runs and attacks the result; self-reported generation or fake results are not acceptance.
11. **One bounded contingency remediation only.** If and only if hostile review reports command-backed defects tied to these gates, create one fresh implementation remediation scoped to those defects, then a fresh validator integration check. No second remediation and no scope expansion to Windows/live behavior.

## Files to Add, Replace, Supersede, or Delete

### Add

- `protocol/host-protocol.ir.json`
- `protocol/templates/{protocol-node,protocol-csharp,protocol-models-csharp,protocol-docs}.tmpl`
- `scripts/{generate-host-protocol,check-host-protocol}.mjs`
- `src/nba2k27-myplayer/host/{windows-path,executable-identity,capture-reassembler,calibration-profile,recognizer,preview-sealer}.mjs`
- `companion/windows/Generated/ProtocolModels.Generated.cs`
- `companion/windows/OperationExecutor.cs`
- `test/nba2k27-myplayer/generated/{fake-companion-model.mjs,conformance-vectors.json,error-catalog.json,manifest.json}`
- `test/nba2k27-myplayer/support/{protocol-reference,csharp-structural-checker}.mjs`
- `test/nba2k27-myplayer/{host-trust,host-capture,host-recognition,host-input-authority,host-discovery,host-cancellation,host-protocol-generation,host-protocol-mutations,host-docs}.test.mjs`
- `test/nba2k27-myplayer/fixtures/host/calibration/` synthetic profile, tiny BGRA templates/masks/frames, and a manifest explicitly labeling them non-game test data.

### Replace in place

- `src/nba2k27-myplayer/host/protocol-v1.mjs` becomes generated protocol 2 output.
- `companion/windows/Protocol.cs` becomes generated protocol core/guards.
- `src/nba2k27-myplayer/host/{protocol-session,trusted-config,run-capability,launch-companion,companion-transport,stdio-companion-adapter}.mjs` consume generated records and complete bindings.
- `companion/windows/{Program,Identity,Capture,Input}.cs` implement only the native/worker seams behind generated guards.
- `companion/windows/Nba2k27.HostCompanion.csproj` is updated only to the compile contract needed by the selected `LibraryImport` declarations; static checks must not claim that this compiles.
- `docs/nba2k27-myplayer/{host-companion-protocol,windows-host-preflight}.md`, `companion/windows/README.md`, `package.json`, `test/nba2k27-myplayer/{host-protocol,host-authority,host-adapter-integration,verify-no-live,verify-pack}.mjs`.

### Delete/supersede so contradictory contracts cannot survive

- Delete `test/nba2k27-myplayer/windows-contract.test.mjs`; semantic generation/structural/mutation tests replace regex presence checks.
- Delete hand-authored host transcript fixtures `valid-observe.jsonl`, `valid-canary.jsonl`, `wrong-correlation.jsonl`, `partial-capture.jsonl`, `replay.jsonl`, `stale-capture.jsonl`, and `wrong-identity.jsonl`; generated vectors and a vector-to-JSONL renderer replace them. Keep malformed/oversized raw framing fixtures only when they cannot be represented by canonical JSON, and document that exception in the generated manifest.
- Remove `DERIVABLE_ACTIONS`, hash-derived states, `fresh:true`, single-record capture result, `1_000_000` coordinate acceptance, C# handwritten protocol validation/state fields, and every independently maintained protocol table/example.
- Do not add compiled binaries, real screenshots/templates, private profiles/configs, receipts, evidence, credentials, or host values.

## Verification Gates and Exact Commands

Commands run from `/home/joshl/projects/nba2k27-myplayer`; no command may contact Windows, BlueStacks, ADB, network, Git, or global configuration.

### Gate A — deterministic authority artifacts

```sh
node scripts/generate-host-protocol.mjs --check
node scripts/check-host-protocol.mjs
node --test test/nba2k27-myplayer/host-protocol-generation.test.mjs test/nba2k27-myplayer/host-protocol-mutations.test.mjs test/nba2k27-myplayer/host-docs.test.mjs
```

Required: byte-identical outputs; manifest digests/coverage exact; every rule mutation changes vectors and Node/C# decisions and is caught cross-boundary; parsed C# guard/control-flow/cleanup checks pass; docs examples are vectors. No token/string-presence assertion counts.

### Gate B — protocol, framing, recognition, authority, and lifecycle

```sh
node --test test/nba2k27-myplayer/host-protocol.test.mjs test/nba2k27-myplayer/host-trust.test.mjs test/nba2k27-myplayer/host-capture.test.mjs test/nba2k27-myplayer/host-recognition.test.mjs test/nba2k27-myplayer/host-input-authority.test.mjs test/nba2k27-myplayer/host-discovery.test.mjs test/nba2k27-myplayer/host-cancellation.test.mjs test/nba2k27-myplayer/host-authority.test.mjs test/nba2k27-myplayer/host-adapter-integration.test.mjs
```

Required attack matrix: every historical attack in all three validator traces; every field deletion/type/boundary/replay/reorder/cross-session/cross-config/cross-target/cross-frame/cross-recognition/cross-preview/cross-approval/cross-canary mutation; all malformed capture streams; synthetic pixel/template/mask/profile drift; stale evidence; identity mutation at every recheck seam; cancellation at every scheduled seam; zero/partial SendInput; late unknown outcome/no retry. Positives use only generated vectors and synthetic assets.

### Gate C — package preservation and no-live boundary

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

Required: all existing optimizer/oracle/report/UI/CLI behavior passes; Node 24 dependency-free ESM remains; package is private with no dependency/lifecycle/publication scripts; public exports/bin expose no launcher, capability mint, native authority, generator write route, or live command; no network/listener/ADB/PowerShell/service/global-config authority; pack inventory contains reviewed source/docs/protocol generator inputs but no tests, generated test assets, compiler output, config, receipt, screenshot/template, evidence, credentials, traces, or binaries. `verify-pack.mjs` compares an explicit reviewed path policy, not only a permissive prefix.

### Gate D — honest compiler skip

```sh
command -v dotnet
command -v csc
```

Expected in this environment: both unavailable. Record the nonzero results as skipped toolchain evidence; do not install, compile, or infer compile success. If either unexpectedly exists, stop rather than broadening scope. Later compilation/runtime validation requires a separately approved Windows/toolchain stage.

## Final Hostile-Review Packet

Dispatch a fresh validator in `taskMode: review` with changed files, generated manifest, all seven prior reproductions, IR/schema contracts, and Gates A–D. Its acceptance matrix is separate and must contain:

| Review area | Required decision evidence |
| --- | --- |
| Seven exact attacks | Fresh independent reproduction; no reliance on implementer test summary. |
| Trust model | Static challenge and parent byte/path checks proven; dynamic self-report never authorizes; same-UID/on-host risks stated. |
| IR/generation | Fresh regeneration diff, rule/vector/mutation bijection, independent interpreter result. |
| C# structure | Parser-derived declarations/control flow/guard/cleanup evidence and seeded mutations, not regex/token presence. |
| Capture/recognition | Independent malformed-stream and synthetic pixel/template drift matrix; no caller state/selector. |
| Input/cancel/identity | Fresh schedule and snapshot mutations, budget-before-dispatch, zero/partial unknown outcome/no retry. |
| Docs/package/no-live | Executable examples, status consistency, full pack inventory, public reachability/authority scan. |
| Limits | Explicitly no compile, Windows, BlueStacks, frame-freshness, focus/UIPI, signer, or compatibility claim. |

Any FAIL must cite a command, exact changed behavior or acceptance gate, and minimal remediation paths. Non-command lifecycle/progress/self-report evidence cannot accept or block.

## Final Integration-Check Packet

After hostile review passes—or after the one allowed remediation and fresh re-review—dispatch a fresh validator in `taskMode: integration-check`. Its independent acceptance matrix is:

1. `gate-seven-findings`: all seven rows pass with fresh evidence.
2. `gate-generated-contract`: IR closure, exact regeneration, dual interpreter, structural C#, mutation coverage, and docs vectors pass.
3. `gate-implementation`: protocol/capture/recognition/authority/discovery/cancellation fake/static behavior passes.
4. `gate-preservation`: full legacy/new suite passes with no unapproved behavior/default/export changes.
5. `gate-package`: exact reviewed pack inventory, private/dependency-free/no hooks/no binaries/assets/secrets passes.
6. `gate-no-live`: source/reachability/runtime scans and command log prove no live authority was exercised.
7. `gate-limit-disclosure`: unavailable compiler and all host risks remain explicit and activation remains blocked.

Acceptance requires all seven gates. The validator must attach command outputs, generated file digests, mutation summary keyed to every semantic rule, attack results, package inventory, skipped-check statement, and residual-risk statement. Partial acceptance is forbidden.

## Assumptions, Tradeoffs, and Residual Risks

- Node.js 24, dependency-free ESM, dormant/internal launcher/native source, and existing offline product behavior remain fixed.
- Protocol 2 is intentionally incompatible with protocol 1; a compatibility shim would preserve unsafe ambiguity and is not planned.
- JSONL is retained for auditability and existing bounded transport, at the cost of base64 expansion; fixed limits keep each line and total bounded.
- Exact lexical Windows↔WSL mapping rejects some legitimate installations rather than consulting ambient mapping services.
- Synthetic calibration assets prove algorithm determinism only. Real BlueStacks/NBA 2K27 topology, values, screenshots, templates, thresholds, transitions, and DPI policies must be supplied later by the operator and are not invented here.
- Parent-observed Linux bytes plus static echo do not independently attest the executed Windows process. The unresolved same-UID replacement interval, compromised companion, forged on-host observation, registry/package/build compromise, and malicious same-user process remain risks. Control therefore requires a separate externally sourced host receipt and later staged proof.
- GDI operation timestamps do not prove newly presented emulator-frame freshness. BitBlt may return stale, black, or incomplete accelerated content.
- Static generation/parsing/mutation does not prove C# compilation, `LibraryImport` source generation, unsafe/marshaling/ABI correctness, resource behavior, cancellation propagation, WSL orphan handling, UIPI, focus stability, or SendInput behavior.
- No implementation, validation, host contact, network/ADB, native execution, Git, global configuration, publication, or game-value creation is authorized by this plan.

## Work Performed

- Summary: Converted the supplied research and three validator findings into one dependency-ordered implementation plan, resolved framing/path/static-evidence decisions, defined exact file/IR/capture/calibration/trust/authority/lifecycle contracts, and specified independent review and acceptance packets.
- Files read: Supplied four evidence artifacts; planner contract/schema/template; current candidate package, Node host modules, C# companion modules/project, host tests/fixtures, package checks, and host protocol/preflight documentation.
- Files changed: Only this planner trace artifact. No implementation file was edited.
- Commands/checks: Read-only file inspection only; no shell command, implementation, generation, test execution, final validation, network, native, Windows, BlueStacks, ADB, Git, or publication action.

## Output Contract

- orderedPlanOrResolvedConclusions: Eleven-step implementation sequence and resolved JSONL framing, explicit path mapping, and no-compiler semantic-evidence decisions above.
- fileContractsOrDecisions: Exact canonical IR, deterministic generator outputs, capture/calibration/recognition/trust/authority/discovery/cancellation contracts, and add/replace/delete inventory above.
- dependencies: `closure-research` is complete; IR/generator precedes protocol, launcher, capture, recognition, discovery, input, docs, hostile review, and final integration check in that order.
- verificationGates: Gates A–D plus separate hostile-review and final integration-check matrices above.
- handoffNotes: Implement only in `/home/joshl/projects/nba2k27-myplayer`, preserve offline/default/package behavior, keep live/native activation unreachable, and stop after one command-backed contingency remediation at most.
- Outputs: Ordered plan, file contracts/decisions, dependencies, executable offline gates, assumptions/tradeoffs/risks, and validator handoff packets.
- Evidence: Direct supplied research/validator findings and current candidate file contracts; recommendations do not claim implementation or host behavior.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-002-integrated-closure.md`
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/planner/root-planner-002-integrated-closure.md`

## Handoff

- Next role: Fresh `implementer` tasks, beginning with the bounded IR/generator work unit; later fresh validator `review` and `integration-check` tasks as ordered above.
- Limitations: This is a plan only. It did not edit or validate the candidate, generate artifacts, run tests, compile C#, or contact Windows/BlueStacks. Exact host/game/calibration facts remain unavailable by contract.
- Risks: Same-UID executable replacement and companion self-report cannot be independently closed by WSL parent code; no-compiler evidence has a strict static ceiling; GDI frame age/BlueStacks capture, DPI/topology, focus/UIPI, cancellation/orphan propagation, native ABI, and real input remain later independently approved risks.
