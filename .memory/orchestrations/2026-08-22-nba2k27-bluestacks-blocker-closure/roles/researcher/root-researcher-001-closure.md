# Blocker-Closure Research: Authoritative Invariants and Offline Evidence

## Metadata

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- role: `researcher`
- artifactId: `root-researcher-001-closure`
- createdAt: `2026-08-22`
- taskMode: `research`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-research-closure-001`, scoped question, candidate path, three prior validator traces, official-documentation preferences, freshness and downstream requirements.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`

## Evidence Classification

- **Repository fact (RF):** directly observed in the supplied candidate source or prior validator traces.
- **Documented fact (DF):** stated by the cited Microsoft documentation.
- **Inference (I):** a conclusion from RF/DF, not an API guarantee.
- **Recommendation (R):** proposed invariant/design; not evidence that it is implemented or works on Windows/BlueStacks.

## Cited Findings — Seven-Finding Traceability Matrix

| # | Direct evidence and trust boundary | Authoritative invariant | Meaningful offline evidence |
| --- | --- | --- | --- |
| 1. Launcher hello identity | **RF:** `launchCompanion` invokes `acceptHello(record, executableSha256)` without `expectedIdentity`, so only the image digest is pinned; all other hello fields can be self-asserted (`launch-companion.mjs:18-25,35-37,51-54`; `protocol-session.mjs:26-31`). The final validator accepted deliberately wrong build/path/signer/integrity/Windows/DPI/PID/creation values (`root-validator-008...:3-6,70-73`). **DF:** WSL supports direct `.exe` execution, pipes/redirection, same active Windows user and normal Task Manager appearance, but the cited WSL contract does not guarantee that a Linux child PID identifies the Windows process or independently attest its final image/signature [S1]. | Stable authority comes from **parent-controlled configuration/build attestation plus parent observation of the exact opened executable bytes**, not the companion's report. The hello may prove nonce/session possession and must equal every pre-pinned stable value, but its PID, creation time, path, signer, integrity, Windows build and DPI are claims unless independently observed through a separately trusted Windows observer. Do not elevate those claims into authorization merely because they are echoed. | Fake-child matrix changes each hello field independently and requires rejection before any operation. Assert that session ID uses parent nonce, server nonce, parent-observed executable SHA-256 and parent invocation ID—not claimed creation time. Test no expected field may be omitted. A generated hello vector labels every field `parentObserved`, `parentConfigured`, or `companionClaim`; a mutation changing a trust label or omitted comparison fails generation/check. Windows-only gate must later establish dynamic process/signature/integrity facts with an independently authorized OS observation path. |
| 2. Pixel-derived preview | **RF:** `markPreviewed` accepts only a semantic action, hard-codes Escape, fabricates the pre-state from the first 16 hash characters and fabricates post-state from a digest (`protocol-session.mjs:10,74-82`); the final validator blocks this (`root-validator-008...:6-8`). The adapter's fake capture can be any object and has no recognizer (`stdio-companion-adapter.mjs:1-2`; `host-adapter-integration.test.mjs:5`). | A preview is valid only if a deterministic recognizer consumes the **reassembled, digest-verified raw pixel bytes** and a separately approved calibration/template bundle. Selector, observed pre-state, and recognition evidence are outputs of that computation, never caller fields or hashes masquerading as visual state. Expected post-state comes from the approved template/action transition catalog and becomes proven only after a fresh post-action capture recognizes it. | Use synthetic pixel fixtures created solely for tests (clearly not game data) plus a manifest of exact dimensions, pixel format, masked templates, cue regions, thresholds, tie/uniqueness margin, hotspots and allowed transitions. Verify exact-match/pass, one-pixel/threshold boundaries, ambiguous ties/fail, missing/forbidden cues/fail, template/hash drift/fail, crop bounds/fail, and selector derivation from matched bounds. No NBA 2K27 cue/template may be invented offline; operator calibration is a later gate. |
| 3. Pixel transport/freshness/provenance | **RF:** native capture computes BGRA bytes but protocol returns no bytes, dimensions, format, byte count or timestamps and sets `fresh=true` while echoing the request barrier (`Capture.cs:21-35`; `Protocol.cs:45-49`; `root-validator-008...:8-9,75-77`). Existing JSONL has a 98,304-byte line limit and config already caps decoded chunks at 49,152, 342 chunks and 16 MiB (`protocol-v1.mjs:4-7,55-61`; `trusted-config.mjs:21-23`). **DF:** BitBlt copies a rectangle's color data, can fail, performs no color management and is device/capability sensitive [S9]. GetDIBits copies a DDB into caller-selected DIB format, returns scan lines, supports top-down DIBs with negative height, and requires the bitmap not be selected into a DC when called [S10]. SHA-256 hashes supplied bytes [S17]. | Transport must prove bounded **operation freshness**, complete raw-pixel identity and capture provenance; it must not claim GPU/frame-presentation freshness that GDI does not expose. Before/after target identity must match. Dimensions/stride/byte count/format/content rectangle/DPI/monitor, operation sequence, parent nonce/barrier, child monotonic and UTC timestamps, per-chunk and whole-pixel digests are mandatory and canonical. | Generated vectors stream real deterministic byte arrays through chunk encode/decode, reorder/drop/duplicate/truncate/oversize/bad-base64/bad-length/bad-chunk-hash/bad-whole-hash/bad-identity/bad-time/barrier replay mutations. Parent recomputes every length and SHA-256 over raw bytes and rejects until a terminal end record closes an exact chunk set. C# extractor/generation checks resource-order and identity/time field production; no offline claim is made that BitBlt sees BlueStacks content. |
| 4. Native input authority | **RF:** native authorize stores only plan/budgets/expiry, while native input compares only plan/capture/sequence/deadline before dispatch (`Protocol.cs:20-25,50-52`). `Input.Dispatch` checks target/focus/geometry twice before `SendInput`, but not after; normalized `1,000,000` maps to exclusive right/bottom (`Input.cs:15-28`; validator `root-validator-008...:8-10`). **DF:** RECT right/bottom are exclusive [S18]. SendInput returns the inserted-event count, is subject to UIPI, cannot identify UIPI as the failure cause, inserts one supplied array serially, and does not reset existing key state [S11]. Foreground acquisition is restricted and can be denied; `GetForegroundWindow` can be NULL [S12,S13]. | One exact native action must be byte-for-byte bound to session/run, target/profile/full geometry+DPI, verified capture, recognition/preview, action set, plan, approval, canary stage, allowed semantic action/selector, pre/post state IDs, expiry and shared budgets. Coordinates are `[0,width-1]`/`[0,height-1]` or fixed-point `[0,999999]`. Immediately before one bounded `SendInput` call: cancellation/deadline, full authorization, budget charge, fresh identity, geometry/DPI/monitor, visible/uncloaked status, foreground and source-capture recency are rechecked in that order. | Node model and fake-native model consume the same conformance vectors; deletion/mutation of any binding rejects. Assert charge-before-dispatch and no retry. Inject fake snapshots around the dispatch seam to prove every drift/focus/cancel case blocks the fake SendInput authority. Partial/zero SendInput result becomes terminal `ACTION_OUTCOME_UNKNOWN`; it is not reported as accepted. Windows-only gate covers UIPI, keyboard state, focus and real mapping. |
| 5. Discovery, revalidation, cancellation, partial failure | **RF:** `Identity.Discover` hashes accessible processes while enumerating up to 32 visible top-level windows; the binding lacks final path, signer, cloak/frame fields and explicit DPI/monitor (`Identity.cs:14-19,49-78`). Program synchronously blocks in `Console.ReadLine`/request handling; `cancel` validates but has no handling branch (`Program.cs:15-27`; `Protocol.cs:73-85`). **DF:** EnumWindows enumerates top-level desktop-app windows and may stop when callback returns false [S4]; window ownership comes from GetWindowThreadProcessId [S5]. QueryFullProcessImageName requires a process handle and yields the full image path [S2]; GetProcessTimes gives creation FILETIME in 100ns units since 1601 [S3]. TextReader cancellation exists, but `Console.In` ReadLineAsync executes synchronously [S14]; Stream.ReadAsync accepts a cancellation token and zero means EOF [S15]. CancelIoEx merely requests cancellation and completion may still be success/cancel/failure [S16]. | Discovery is bounded candidate enumeration under exact configured filters and never automatic selection: cheap window/class/title/visibility/cloak checks first; only matching candidates incur process open/path/hash/signature work; return opaque tokens; operator chooses one; bind re-snapshots all fields. Revalidate HWND→PID, PID+creation, final path digest, image/signature policy, class/title, visibility/cloak, client/content/frame geometry, DPI/monitor and foreground at every capture/input boundary. Reader and worker must be concurrent. EOF/cancel/deadline before dispatch cancels cleanly; after dispatch starts, outcome is unknown unless an exact response proves completion. | Source/IR checks require async byte-framed stdin loop, one worker, cancellation registry and terminalization table. Fake scheduling vectors cover cancel-before-start, while queued, at pre-dispatch seam, during native call, after return, EOF with no request, EOF with capture chunks, and EOF after input dispatch. Any partial capture is discarded; any partial input result is unknown/terminal. Windows-only testing must establish actual redirected-stdin cancellation and WSL termination/orphan behavior; Microsoft docs do not guarantee it. |
| 6. Node/fake/C# semantic parity without compiler | **RF:** current Windows tests are only 11 positive and one negative regex checks, so 90 tests pass while native semantics fail (`root-validator-008...:10-11,76-87`). `dotnet` and `csc` were unavailable (`...:98-101`). | Offline parity evidence must exercise a language-neutral semantic contract and prove generated C# is current; token presence is insufficient. It can establish schema/state/order intent, not compilation, ABI, marshaling or Win32 behavior. | Define one canonical protocol/operation IR; generate closed Node validators/constants, C# validators/records/transition tables, docs tables and positive/negative vectors. `generate --check` requires byte-identical generated files. Run vectors through Node runtime and an independent JS reference interpreter. Add a bounded C# tokenizer/structural extractor that verifies generated regions, interop signatures and hand-written native guard ordering. Mutation tests alter equality operands, remove binding fields, widen coordinates, set unconditional freshness, move budget charge, bypass cancel, change interop signature/resource cleanup, or accept partial SendInput; each mutation must make at least one semantic check fail. This is meaningful static evidence but remains explicitly weaker than compilation. |
| 7. Protocol/docs consistency | **RF:** docs say capture/input fail closed although source invokes BitBlt/SendInput (`host-companion-protocol.md:27-30`; final validator `root-validator-008...:11-12,87-88`). Docs describe planned chunking absent from the protocol. | Operation names, field sets, limits, states, error semantics, trust labels, wire examples and activation status have one machine-readable authority. Security-significant prose must not be independently maintained as contradictory claims. | Generate protocol tables/examples/limits and an implementation-status matrix between stable markers; `generate --check` and schema validation reject stale docs. All examples must also be conformance vectors decoded by Node. A docs mutation (for example `unsupported`→`active`, changed chunk limit, missing unknown-outcome rule) must fail the check. Hand-written operator caveats remain outside generated blocks but are linted for known contradictory status phrases. |

## Exact Hello Expected-versus-Observed Model

The existing hello field set is not itself an attestation mechanism. Recommended model:

| Field | Authoritative expected source | Observed value | Decision/use |
| --- | --- | --- | --- |
| `protocolVersion`, `capabilities`, `buildId` | Parent's closed config plus signed/reviewed build manifest | Companion hello | Exact equality; mismatch terminal. Build ID is a compatibility pin, not proof by itself. |
| `executableSha256` | Parent no-follow opens the configured WSL path, checks owner/mode/link/identity before/after hashing, then passes that exact selected path to spawn (existing partial behavior at `launch-companion.mjs:18-30`) | Companion image digest | Parent-observed digest is authoritative; companion value only corroborates and must equal it. Recheck file identity immediately before spawn; current code hashes then closes, leaving same-UID replacement as residual risk. |
| `windowsFinalPathDigest`, signer certificate/thumbprint/SPKI, integrity policy | Pre-pinned deployment attestation produced during a separately authorized Windows build/sign/place gate | Companion report | Exact compare as consistency only. It is **not independently observed by the WSL parent**. Activation requires a separately trusted Windows observer/build receipt; otherwise mark `unverified` and do not mint control authority. |
| `windowsBuild`, `dpiMode` | Closed allowed policy/range in config; DPI expectation also in manifest | Companion OS observation | Exact policy check, but self-report is not authoritative host attestation. Windows preflight must independently verify. |
| `pid`, `processCreationTime` | No reliable parent source established by cited WSL docs | Companion report | Use only as untrusted correlation until independently observed. Never derive session authority solely from these claims. A Windows observer can establish PID/creation via a process handle and GetProcessTimes [S3]. |
| `clientNonce`, `launcherInvocationId`, expected executable digest | Parent-generated | Hello echoes only client nonce | Parent values are authoritative and bound into session/capability. |
| `serverNonce` | Companion-generated CSPRNG | Hello | Freshness contribution only; uniqueness tests and replay rejection required. It does not attest identity. |

**Recommended session ID:** SHA-256 over a domain separator and canonical length-delimited tuple `(protocol, parent client nonce, child server nonce, parent invocation ID, parent-observed executable SHA-256, parent config digest)`. Do not include a self-asserted creation time as if it strengthened identity. Stable hello expected fields must also be included in the consumed capability binding. If independent dynamic identity cannot be established, observation-only may proceed only under an explicit unverified-host policy; control remains disabled.

## Concrete Deterministic Calibration and Recognition Model

1. **Calibration bundle (operator-produced, closed, hashed):** `bundleVersion`, exact `pixelFormat=BGRA8_TOP_DOWN`, width/height/stride, content rectangle, expected orientation and DPI policy, template files by SHA-256, optional binary masks, cue search rectangles in pixel coordinates, match metric/threshold, minimum uniqueness margin, state definitions (`allOf`/`noneOf` cues), action transition entries, and hotspot within the matched cue/bounds. Unknown keys and out-of-bounds values reject.
2. **No invented game data:** repository tests may use labeled geometric/color fixtures such as `synthetic-state-a`; they cannot claim NBA/BlueStacks meaning. Real state IDs, cues, templates, thresholds and transitions require operator-selected screenshots in the later calibration gate.
3. **Input:** only reassembled raw bytes whose declared geometry and whole SHA-256 have been verified. Recognition never accepts caller-supplied state or point.
4. **Deterministic matching:** initially require exact calibrated dimensions/DPI policy (no implicit scaling). For each cue, scan its bounded region in row-major order, compute a specified integer metric over unmasked BGRA channels, and retain best and second-best scores. Accept only threshold plus uniqueness margin. Avoid floating-point differences by fixed integer formulas.
5. **State:** accept exactly one state whose required cues pass and forbidden cues do not. `recognizedPreState` is that state ID; evidence records cue/template/crop digests, matched rectangle, best/second score and algorithm version.
6. **Selector:** derive the pixel hotspot from the accepted match and convert with an explicit integer rule to `[0,999999]`, proving the reverse mapping lies within `[0,width-1] × [0,height-1]`. Key selectors are allowed only when the approved action catalog maps the recognized state/action to that exact key pair.
7. **Transition:** `expectedPostState` is the bundle's allowed transition for `(recognizedPreState, semanticAction, selector derivation)`. After input, a new capture must recognize that post-state from pixels; a predicted post ID is not proof.
8. **Preview artifact:** canonical digest over bundle hash, capture/provenance binding, all cue evidence, pre-state, transition, exact selector/action, budgets and expiry. Authorization signs/approves that digest and no independently supplied selector/state is accepted later.

## Bounded Pixel JSONL Wire Format and Provenance Proof

JSONL remains justified because a 48 KiB raw chunk encodes to 65,536 base64 characters plus bounded metadata, below the existing 98,304-byte line ceiling. Keep one outstanding operation, but permit a closed correlated multi-record capture response:

1. `captureStart`: session/request/operation sequence; `captureId`; echoed 256-bit parent `captureNonce` (the current 64-character ID barrier is too weakly typed); `operationStartedMonotonicTicks`, `operationStartedUtcMs`; exact **before identity**; `width`, `height`, `stride`, `pixelFormat`, `byteCount`, `chunkBytes`, `chunkCount`, `contentRectPx`, `dpiX/Y`, monitor ID; capture method/version.
2. `captureChunk`: same correlation and capture ID; contiguous `index` from zero; `decodedBytes` (1..limit, last may be shorter); canonical base64; `chunkSha256`; data. No other records may interleave.
3. `captureEnd`: same correlation; `operationEndedMonotonicTicks`, `operationEndedUtcMs`; optional `copyCompletedMonotonicTicks`; exact **after identity**; `pixelsSha256`; `metadataDigest`; `provenanceDigest`; terminal success.

Parent checks before allocation: dimensions positive, checked `stride == width*4`, checked `byteCount == stride*height`, all configured maxima, `chunkCount == ceil(byteCount/chunkBytes)`, and aggregate stdout budget. It decodes each chunk once into a bounded sink while hashing. It rejects duplicates/gaps/noncanonical base64/length or digest mismatch and does not expose pixels until `captureEnd` verifies whole SHA-256, exact identity equality and monotonic ordering.

`metadataDigest = SHA256(canonical metadata excluding chunks/digests)`; `provenanceDigest = SHA256(domain || metadataDigest || pixelsSha256 || ordered chunk-hash list)`. This proves which declared operation/identity/geometry produced the bytes under the trusted implementation. It does **not** prove that BitBlt captured a newly presented emulator frame. The only supportable offline freshness statement is: the operation was correlated to a fresh parent nonce and the implementation reports that copy/read occurred after request acceptance and before the response, with monotonic ordering. A true frame-age guarantee needs a capture API exposing frame timestamps plus later Windows/BlueStacks validation.

Native GDI correction: GetDIBits documentation says the bitmap must not be selected into a DC [S10]; current `Capture.cs:28-31` calls it while selected. Restore the prior object before `GetDIBits`, check every cleanup return where actionable, and preserve the primary failure while reporting cleanup failure safely. `ReleaseDC` must pair with each GetDC on the same thread [S20], and selected GDI objects cannot be deleted [S19].

## Native Recheck and Cancellation Semantics

Immediately before dispatch, use this fail-closed order:

1. verify session/request correlation, operation state and exact closed body;
2. check EOF/session cancellation, request deadline and approval expiry;
3. load immutable authorization and constant-time compare every digest/ID/budget field to the exact preview action;
4. verify action/canary stage and reserve/charge action and query budgets **before** any native authority;
5. take a fresh full target snapshot and compare HWND→PID, PID+creation, final path/image/signature policy, class/title, visibility/cloak, client/content/frame geometry, DPI/monitor and target/profile digests;
6. require current foreground HWND (do not attempt to steal focus); reject NULL or mismatch;
7. recheck cancellation/deadline at the final dispatch seam;
8. make exactly one `SendInput` call with an all-up/all-down bounded array (maximum one key pair or one move/down/up click); compare return count exactly;
9. re-snapshot identity/geometry/focus after return for evidence, but never turn post-check failure into a claim that no input occurred; classify it `ACTION_OUTCOME_UNKNOWN`;
10. require a separately correlated post-capture and pixel recognition before declaring the expected state observed.

The reader must continue while one worker executes. A cancel received before step 8 causes no dispatch and a correlated `cancelled:true`. Once step 8 begins, SendInput has no cited cancellation contract; cancel/EOF/deadline is too late. Success can be claimed only if the full count returns and protocol response completes; zero/partial count, exception, crash, EOF, timeout or cancellation after dispatch yields terminal `ACTION_OUTCOME_UNKNOWN`, consumes authority/budget and is never retried. Do not split a logical action over multiple SendInput calls. If future actions require multiple calls, they are unsupported until an explicit partial-operation/compensation policy exists.

## Cohesive Dependency-Ordered Design Recommendation

This is a research recommendation for downstream planning, not a final implementation plan:

1. **Canonical authority first:** define the protocol/operation IR, trust labels, full identity/geometry/capture/preview/approval/canary/budget bindings, errors and limits. Resolve the key policy: control is impossible when dynamic hello identity remains only self-asserted.
2. **Generator and vectors:** generate Node/C# closed schemas, transition tables, docs fragments and conformance vectors. Add regeneration, semantic extractor and mutation checks before changing native authority.
3. **Launcher identity/lifecycle:** consume the generated hello model, compare all pins, remove self-claimed creation time from authoritative session derivation, and retain exact EOF/correlation/unknown-outcome behavior.
4. **Capture transport:** implement begin/chunk/end raw pixels, checked bounds/hashes/times/identities and correct GDI resource ordering; parent reassembly is the sole source for recognition.
5. **Recognizer/preview:** implement deterministic bundle validation and pixel recognition; generate selector/pre-state/evidence/transition preview only from verified pixels and approved templates.
6. **Discovery/binding and native authorization:** narrow discovery under exact filters, complete snapshots, persist the entire immutable authority, and compare it before each operation.
7. **Input/cancellation worker:** add concurrent framing/worker/cancel state, exact pre-SendInput ordering, atomic bounded event batches and terminal unknown handling.
8. **Generated docs/status:** switch protocol/operator documents to generated tables and an accurate dormant/unverified status matrix.
9. **Independent offline validator, then Windows ladder:** run vectors/mutations/fake scheduling/package/no-live checks. Only afterward proceed to compiler/build, read-only identity, calibration, capture-only and one reversible input canary gates.

## Implementation Implications

- Existing protocol result shapes cannot carry pixels; `protocol-v1.mjs`, `Protocol.cs`, transcript/session logic, fixtures and docs need one coordinated schema revision rather than additive patches.
- `markPreviewed({semanticAction})` must disappear or require verified pixels plus a branded, validated calibration bundle. Synthetic state construction must be unrepresentable.
- Capability/authorization records need hello-policy/build-attestation identity and exact capture/recognition evidence bindings, not only existing control fields.
- Native target records need final image path digest, signer-policy result, class/title, visibility/cloak, client/content/frame rectangles, DPI and monitor. Keep raw paths/titles out of ordinary protocol output; digest or policy-result fields suffice.
- A custom offline C# analyzer must be intentionally narrow and fail closed on unsupported syntax. Generated C# minimizes what it must understand. It cannot replace an actual compiler.
- Correct GDI ordering/resources and `LibraryImport` compile/marshaling remain a later toolchain gate even when generated semantics pass.

## Risks and Unresolved Uncertainty

1. **Fundamental trust gap:** no cited WSL contract gives the Linux parent an independently authoritative Windows PID, creation time, final path, signer or integrity identity. A companion cannot attest itself merely by reporting those values. A separately trusted Windows build/observer receipt or a reduced observation-only mode is required.
2. **BlueStacks capture:** BitBlt can succeed yet return stale/black/incomplete accelerated content; Microsoft documents pixel copy mechanics, not BlueStacks compatibility. Version-sensitive and unresolved.
3. **Frame freshness:** GDI offers no cited presentation timestamp. Nonce/times establish operation ordering only, not new emulator-frame age.
4. **Foreground/UIPI:** SendInput can be blocked by UIPI without an identifying error; focus can change, and SetForegroundWindow is restricted [S11-S13]. Windows-only proof is mandatory.
5. **Discovery topology:** BlueStacks process/window class/title/render-child topology is unknown and version-sensitive. No exact filters or templates should be guessed.
6. **Cancellation:** redirected standard-input cancellation and WSL child termination/orphan propagation are not established by the cited docs. Fake semantics are necessary but insufficient.
7. **Static parity ceiling:** generation/extraction/mutation proves intended source structure and semantic tables, not C# compilation, source-generator behavior, ABI sizes, marshaling or runtime API correctness.
8. **Same-UID launch race:** current parent hashes/closes then spawns by path. Parent-observed bytes and executed bytes may diverge under same-UID replacement; no Linux descriptor-to-Windows-exec mechanism was established.

## Source List

All web sources accessed `2026-08-22`. Microsoft API pages frequently retain an older `ms.date` while metadata shows a newer `updated_at`; both are recorded where useful.

- **[L1]** Candidate `src/nba2k27-myplayer/host/protocol-v1.mjs`, especially lines 4-12, 55-113, 116-146. Repository fact.
- **[L2]** Candidate `src/nba2k27-myplayer/host/protocol-session.mjs`, lines 12-85. Repository fact.
- **[L3]** Candidate `src/nba2k27-myplayer/host/launch-companion.mjs`, lines 13-64; `run-capability.mjs`, lines 10-28; `trusted-config.mjs`, lines 14-25. Repository fact.
- **[L4]** Candidate `companion/windows/{Protocol,Identity,Capture,Input,Program}.cs` and `.csproj`. Repository fact.
- **[L5]** Candidate `test/nba2k27-myplayer/{host-protocol,host-authority,host-adapter-integration}.test.mjs`; `docs/nba2k27-myplayer/host-companion-protocol.md`. Repository fact.
- **[L6]** Prior validator traces `root-validator-004-host-preparation.md`, `root-validator-006-host-revalidation.md`, and `root-validator-008-final-host-preparation.md`. Direct supplied validator evidence.
- **[S1]** Microsoft, “Working across file systems” (WSL interoperability), <https://learn.microsoft.com/en-us/windows/wsl/filesystems>. Published `2021-09-27`; updated `2026-06-02`.
- **[S2]** Microsoft, “QueryFullProcessImageNameW function,” <https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryfullprocessimagenamew>. Published `2018-12-05`; updated `2024-02-22`.
- **[S3]** Microsoft, “GetProcessTimes function,” <https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocesstimes>. Published `2018-12-05`; updated `2025-07-01`.
- **[S4]** Microsoft, “EnumWindows function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows>. Published `2018-12-05`; updated `2025-07-01`.
- **[S5]** Microsoft, “GetWindowThreadProcessId function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid>. Published `2018-12-05`; updated `2025-07-01`.
- **[S6]** Microsoft, “SetProcessDpiAwarenessContext function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocessdpiawarenesscontext>. Published `2018-12-05`; updated `2025-07-01`. Recommends a manifest; API must precede DPI-dependent calls and can fail if awareness already set.
- **[S7]** Microsoft, “GetDpiForWindow function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdpiforwindow>. Published `2022-05-25`; updated `2025-07-01`.
- **[S8]** Microsoft, “ClientToScreen function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clienttoscreen>. Published `2018-12-05`; updated `2025-07-01`. Converts client to screen device coordinates.
- **[S9]** Microsoft, “BitBlt function,” <https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-bitblt>. Published `2018-12-05`; updated `2024-02-22`.
- **[S10]** Microsoft, “GetDIBits function,” <https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-getdibits>. Published `2018-12-05`; updated `2024-02-22`.
- **[S11]** Microsoft, “SendInput function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput>. Published `2018-12-05`; updated `2025-07-01`.
- **[S12]** Microsoft, “SetForegroundWindow function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow>. Published `2025-10-06`; updated `2025-10-07`.
- **[S13]** Microsoft, “GetForegroundWindow function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow>. Published `2018-12-05`; updated `2025-07-01`.
- **[S14]** Microsoft, “TextReader.ReadLineAsync Method,” <https://learn.microsoft.com/en-us/dotnet/api/system.io.textreader.readlineasync?view=net-8.0>. API doc date `2025-07-01`; updated `2026-08-13`.
- **[S15]** Microsoft, “Stream.ReadAsync Method,” <https://learn.microsoft.com/en-us/dotnet/api/system.io.stream.readasync?view=net-8.0>. API doc date `2025-07-01`; updated `2026-07-01`.
- **[S16]** Microsoft, “CancelIoEx function,” <https://learn.microsoft.com/en-us/windows/win32/api/ioapiset/nf-ioapiset-cancelioex>. Published `2018-12-05`; updated `2024-02-22`.
- **[S17]** Microsoft, “SHA256.HashData Method,” <https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.sha256.hashdata?view=net-8.0>. API doc date `2025-07-01`; updated `2026-07-01`.
- **[S18]** Microsoft, “GetWindowRect function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrect>. Published `2018-12-05`; updated `2025-07-01`.
- **[S19]** Microsoft, “DeleteObject function,” <https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-deleteobject>. Published `2018-12-05`; updated `2024-02-22`.
- **[S20]** Microsoft, “ReleaseDC function,” <https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-releasedc>. Published `2018-12-05`; updated `2024-02-22`.
- **[S21]** Microsoft, “DwmGetWindowAttribute function,” <https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetwindowattribute>. Published `2019-05-30`; updated `2025-07-01`.
- **[S22]** Microsoft, “CloseHandle function,” <https://learn.microsoft.com/en-us/windows/win32/api/handleapi/nf-handleapi-closehandle>. Published `2018-12-05`; updated `2024-02-22`.

## Work Performed

- Summary: Inspected current Node/native/docs/tests and all three supplied validator traces; researched current official Microsoft WSL, Win32 and .NET API contracts; derived the seven exact trust/invariant findings and one dependency-ordered closure design. No Windows/BlueStacks/native operation, ADB, network API, compilation or delegation occurred.
- Files read: Contract/schema/template; three validator traces; candidate host Node modules, C# companion, project file, host protocol docs and host tests listed in [L1]-[L6].
- Files changed: Only this required researcher trace artifact; no candidate file was edited.
- Commands/checks: Read-only file/glob inspection and official-documentation fetches. No shell commands, native execution or acceptance validation.

## Output Contract

- Outputs: Cited findings; seven-finding traceability matrix; exact hello field trust model; deterministic pixel recognition model; bounded JSONL pixel format and provenance model; native recheck/cancellation semantics; semantic parity/generator/mutation strategy; dependency-ordered design; implementation implications; risks; source list.
- Evidence: Repository line evidence [L1]-[L6] and Microsoft API contracts [S1]-[S22], with facts separated from inference/recommendation.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/researcher/root-researcher-001-closure.md`

## Handoff

- Next role: `planner` in fresh `taskMode: plan`, to turn these invariants into exact file contracts and executable offline/Windows gates without weakening the self-attestation limitation.
- Limitations: Linux/static/offline research only. No candidate edits, compiler, native execution, Windows/BlueStacks observation, calibration data, signer verification or acceptance validation. Documentation contracts do not prove implementation behavior.
- Risks: Fundamental hello self-attestation gap; GDI/BlueStacks and frame-freshness uncertainty; UIPI/focus and cancellation uncertainty; unknown game templates/topology; static evidence cannot replace compilation or staged Windows validation.
