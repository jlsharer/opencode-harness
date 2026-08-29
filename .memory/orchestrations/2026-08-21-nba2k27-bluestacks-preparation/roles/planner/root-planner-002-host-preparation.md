# Durable Migration and Host-Preparation Plan

## Metadata

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- role: `planner`
- artifactId: `root-planner-002-host-preparation`
- createdAt: `2026-08-21`
- taskMode: `plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-plan-host-preparation-002`; approved migration/preparation goal; explicit no-host scope; accepted offline validator trace; host-interface research; destination, architecture, evidence, test, and staged-activation criteria.
- Required context present: Yes. The source package, supplied evidence, contract, schema, and trace template were readable. The destination does not currently exist. Windows/BlueStacks identity and compatibility facts remain intentionally absent.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness` (the implementation target is the separately supplied `/home/joshl/projects/nba2k27-myplayer`).

## Work Performed

- Summary: Inspected the accepted 51-file source package and relevant oracle, approval, profile, CLI, package, documentation, and tests; reconciled the required JSONL wire format with the research's framing recommendation; selected a bounded internal real-launch boundary plus fake transport; produced exact migration, file, protocol, vault, testing, validation, and future-activation contracts.
- Files read: `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; both supplied research/validator artifacts; `/tmp/opencode/nba2k27-myplayer/package.json`; all source inventory names; and the relevant CLI, index, host adapter, UI oracle, approval, host profile, UI test, data-contract, and operator-safety files.
- Files changed: Only this required planner trace artifact was created. No implementation, package, host, harness source, Git, or global configuration file was edited.
- Commands/checks: Created only the required planner trace directory. No target command, build, copy, host probe, executable launch, capture, input, network action, or final validation was performed.

## Decisions and Tradeoffs

1. **Preserve offline behavior first.** Migrate the accepted bytes before changing them, prove a closed source/destination manifest match, then implement preparation in the durable destination. The source remains an immutable comparison input during this work unit.
2. **Use bounded JSONL, as required by acceptance.** This supersedes the research's length-prefixed control-frame recommendation. To retain equivalent bounds, each UTF-8 line has a hard byte limit and closed schema; screenshots use bounded, correlated base64 chunk lines rather than raw bytes or filesystem exchange. This costs about 4/3 wire expansion but gives one versioned parser and no secondary channel.
3. **Include a real launcher, but keep its authority internal and doubly gated.** Genuine later preflight readiness requires proving exact-path child lifecycle behavior. The launcher is not exported from the package root, has no CLI route, is never reached by defaults or tests, and accepts only a validated exact config plus a fresh, process-local, one-use capability. Tests inject a fake child factory and a sentinel makes any real process/network call fail. This is smaller and more implementation-ready than adding an activation command now.
4. **Separate preparation from activation.** Offline CLI commands validate config/transcripts and maintain an explicit external evidence root; none launches or contacts Windows. Real launch remains an internal API for a later, separately approved integration scope.
5. **Do not invent host facts.** No BlueStacks title/class, HWND topology, selector, coordinate, process path/hash/signer, Windows build, SDK version, or compatibility outcome is committed. Config and calibration fixtures use syntactically valid unmistakable test identities only.
6. **One-hour evidence maximum.** The packet's one-hour maximum replaces the research's suggested 24 hours. Default and maximum TTL are both 3,600 seconds. Screenshots never enter the package, workspace, Windows temp, archive, or npm tarball.

## Ordered Implementation Plan

### 1. Perform a fail-if-present, fidelity-proven migration

1. Assert that `/tmp/opencode/nba2k27-myplayer` is a current-user-owned, non-symlink directory and `/home/joshl/projects/nba2k27-myplayer` is absent. Do not merge into or overwrite an existing destination.
2. Before copying, use a dependency-free Node script to recursively `lstat` without following links and emit a sorted in-memory manifest of relative path, type, mode, size, and SHA-256 for regular files. Require exactly 4 directories and 51 regular files, no other types, no symlinks, and the accepted top-level inventory `docs/`, `package.json`, `src/`, `test/`.
3. Copy the complete source directory to the destination without Git initialization and without preserving foreign ownership. Re-run the same manifest algorithm and require equality of relative paths, types, modes, sizes, and file hashes plus current-user ownership at the destination. Record the pre-change manifest as validator output, not as a package file.
4. Run the accepted baseline gates in the destination before edits: syntax checks, all 71 tests, dependency tree, and dry-run pack. Require the previous 37-entry pack inventory. If any migration or baseline gate differs, stop before preparation edits.

### 2. Add closed preparation contracts without changing the existing optimizer defaults

Add these exact JavaScript/schema paths:

- `src/nba2k27-myplayer/schemas/host-companion-config.schema.json`
- `src/nba2k27-myplayer/host/protocol-v1.mjs`
- `src/nba2k27-myplayer/host/protocol-session.mjs`
- `src/nba2k27-myplayer/host/trusted-config.mjs`
- `src/nba2k27-myplayer/host/run-capability.mjs`
- `src/nba2k27-myplayer/host/companion-transport.mjs`
- `src/nba2k27-myplayer/host/stdio-companion-adapter.mjs`
- `src/nba2k27-myplayer/host/launch-companion.mjs`
- `src/nba2k27-myplayer/host/evidence-vault.mjs`

Modify only these existing runtime files:

- `src/nba2k27-myplayer/cli.mjs`
- `src/nba2k27-myplayer/index.mjs`
- `src/nba2k27-myplayer/oracle/host-adapter.mjs`
- `src/nba2k27-myplayer/oracle/bluestacks-ui-oracle.mjs`
- `src/nba2k27-myplayer/security/approval.mjs`
- `src/nba2k27-myplayer/state/host-profile.mjs`

Contracts:

- `protocol-v1.mjs` owns closed encoders/decoders, constants, duplicate-key rejection, bounds, correlation, and transcript validation. It is pure and has no filesystem, process, clock, random, or network authority.
- `protocol-session.mjs` owns the fail-closed state machine, injectable monotonic clock/random source, single outstanding request, deadlines, cancellation, and terminal-error behavior.
- `companion-transport.mjs` defines transport plus `FakeCompanionTransport`; fake transcripts are the default and sole test transport.
- `stdio-companion-adapter.mjs` maps the protocol's discovery/context/capture/input results to the existing four-method `HostAdapter` boundary. It does not launch a child.
- `launch-companion.mjs` is the sole `node:child_process` importer. It invokes the validated exact WSL-visible `.exe` path directly with fixed argv `--stdio-jsonl-v1`, `shell:false`, fixed piped stdio, no detached mode, no PATH search, no shell, no PowerShell, and a minimal explicit environment that does not copy ambient credentials. It rejects absent/invalid config or capability before importing/calling the injected real spawn function. It is omitted from root exports and CLI dispatch.
- `run-capability.mjs` creates a non-serializable branded token from a validated config digest, approval digest, mode, capability set, run ID, random 32-byte nonce, issuance time, and expiry. Token lifetime is at most five minutes, it is single-use, process-local, consumed before spawn, and cannot be reconstructed from JSON/config/environment. Observation and input use distinct capabilities; control additionally binds target/profile/plan and action/query budgets.
- `trusted-config.mjs` validates a caller-supplied explicit file only. It never reads environment variables, cwd defaults, registry, PATH, home directories, credentials, or network locations.
- Keep the original six optimizer/manual command semantics byte-compatible. Add only three offline preparation commands: `validate-host-config --input <explicit-json>`, `verify-host-transcript --input <explicit-jsonl>`, and `evidence-cleanup --config <explicit-json>`. The first two perform no host/process/network action. Cleanup touches only the configured external vault and cannot launch a companion. Continue rejecting `live`, `ui-control`, `capture`, `launch`, executable-path flags, and unknown flags as activation requests.
- Root `index.mjs` may export pure protocol/config validation, fake transport, and vault policy types. It must not export the real launcher, capability mint, or a live adapter factory. Import remains side-effect free.

### 3. Define the trusted config and executable authority boundary

`host-companion-config.schema.json` is Draft 2020-12, `additionalProperties:false`, version exactly `host-companion-config/1`, and has these closed groups:

- `companion`: `wslExecutablePath`, `windowsFinalPath`, lowercase 64-hex `sha256`, nonempty bounded `buildId`, optional closed signer object (`sha256Thumbprint`, `subjectPublicKeyInfoSha256`) only when signing exists, and expected protocol `1.0`. Both paths are exact absolute operator inputs; UNC/device/network paths, alternate data streams, control characters, dot segments, duplicate/trailing separators, and reparse/symlink components are rejected. No sample contains a purported real path or digest.
- `limits`: control line 98,304 bytes; JSON depth 16; 128 keys/object; 4,096-byte strings; 256 array items; capture 16 MiB decoded; capture chunks 48 KiB decoded; 342 chunks; cumulative stdout 64 MiB; stderr 8 KiB; one request and one capture in flight; startup 5 s, discovery 2 s, capture 3 s, input dispatch 1 s, post-capture 3 s, request 5 s, session 600 s. Config may only lower these compile-time maxima.
- `evidence`: an explicit absolute lexical-canonical Linux root outside source, destination, cwd/workspace, `/mnt/*`, and Windows shares; `ttlSeconds` defaults to and cannot exceed 3,600; screenshots default false; maximum screenshot count 4; screenshot bytes 64 MiB/run; all-file count 16; all-file bytes 66 MiB/run.

Before spawn, open/hash the configured executable no-follow, require current-user-owned non-group/world-writable regular file with one link and no symlink component, compare path identity before/after hash, and compare SHA-256. On the later Windows side, the companion repeats handle-based final-path, file identity, hash, optional signer, and ACL/reparse checks. A mismatch is terminal. Signing is recommended for release deployment but is not fabricated or made mandatory before a signer exists.

The launcher receives config as an already validated immutable object and a fresh capability as separate arguments. Config alone never grants launch. Capability minting is likewise unreachable from CLI/root exports and requires an explicit later activation call with a closed approval. No listener, service, socket, named pipe, ADB, download, registry lookup, scheduled task, startup item, or child-of-companion is permitted.

### 4. Implement the versioned bounded JSONL protocol and state machine

Every wire record is one UTF-8 JSON object followed by LF. CR, BOM, invalid UTF-8, blank lines, duplicate keys, non-integer numeric fields, unknown fields/types/versions, over-limit nesting/count/string/line/session bytes, unsolicited output, and bytes after a terminal record fail the session. IDs use a bounded ASCII canonical pattern. JSON is encoded canonically for hashes. Only one request may be outstanding.

Common request fields are exactly `v`, `kind`, `sessionId` (after hello), `requestId`, `sequence`, and closed `body`; responses echo `v`, `kind`, `sessionId`, `requestId`, and `sequence`, then have exactly one of `result` or stable `error`. Sequence starts at 1 after hello and increases by one; duplicate, gap, reordered, wrong-session, wrong-operation, completed-ID, or old-session records are rejected. No reconnect exists.

Handshake:

1. Parent sends `hello` with `v:"1.0"`, a fresh 32-byte base64url client nonce, and requested capabilities from `discover|capture|input`. Hello grants no UI work.
2. Companion returns a fresh server nonce plus protocol/build/native PID/process creation time/final-image-path digest/image SHA-256/signer digest-or-null/integrity/Windows-build/DPI-mode report.
3. Both compute `sessionId = SHA256("nba2k27-host-v1\0" || clientNonce || serverNonce || executableSha256 || processCreationTime)`; parent compares every pinned/required identity before sending discovery.

Operations are closed to `discover`, `bindTarget`, `capture`, `authorize`, `input`, `cancel`, and `close`:

- `discover` is bounded observation only and returns candidate digests and geometry observations; it never selects. Zero/multiple candidates remain explicit.
- `bindTarget` accepts one operator-selected candidate token and binds HWND, PID+creation time, final image path hash, image hash, signer hash, class/title hashes, visibility/cloak/minimize state, client/frame rectangles, DPI, monitor, foreground state, and profile nonce. Raw title/path are transient display-only and never evidence/log fields.
- `capture` is legal only for a bound unchanged target. It returns `captureStart`, indexed `captureChunk` records containing at most 48 KiB decoded base64 each, and `captureEnd`; every line repeats correlation fields. Declared count/decoded bytes/SHA-256 must match exactly, chunks must be contiguous, and no partial image is exposed after error. Provenance includes API, pixel format, dimensions/content rectangle, target/profile digests, pre/post geometry and identity, request-start monotonic time, WGC `SystemRelativeTime`, receive time, and freshness barrier. Accept only a post-barrier frame before deadline; an identical pixel hash is valid.
- `authorize` carries a short-lived session/run/target/profile/plan-bound approval digest and exact capability/action/query budget; it cannot broaden handshake capabilities. Parent also retains the authoritative shared ledger.
- `input` accepts only a previously previewed and approved immutable plan hash, one allowlisted semantic action, normalized fixed-point client coordinate or tiny explicit key-pair primitive, source capture hash/sequence, expected pre/post states, mutation class, and deadline. Arbitrary pixels, text, chords, shell strings, save/finalize/upload/share/account/purchase/delete/launch/restart are not representable. Charge the action before dispatch.
- `cancel` is idempotent only for the current request; `close` revokes all authority and exits. Neither can resume a cancelled session.

State machine:

`SPAWNED -> HELLO_VERIFIED -> OBSERVE_ONLY -> TARGET_BOUND -> CAPTURED -> PREVIEWED -> AUTHORIZED_CANARY -> ACTION_IN_FLIGHT -> CANARY_OBSERVED -> AWAIT_CONTINUATION -> AUTHORIZED_BOUNDED_CONTROL -> ACTION_IN_FLIGHT`, with `CANCELLING -> TERMINAL` and `CLOSING -> TERMINAL` reachable from active states. Preview is a parent-side immutable artifact (source image, highlighted semantic target, transformed point/key, expected cues, maximum attempts, plan hash); no input state is reachable without it. Canary is exactly one reversible navigation action with no automatic retry. Success returns to `AWAIT_CONTINUATION`; it never grants the remaining run. Each subsequent action requires fresh capture/identity/foreground/geometry/approval/ledger checks.

On timeout, send one bounded cancel only if parsing remains sound, close stdin, wait 250 ms, terminate the exact child, discard partial output, and report terminal uncertainty. EOF, crash, malformed/extra output, stderr overflow, cancellation, or timeout after input dispatch is `ACTION_OUTCOME_UNKNOWN`, never retried. The companion exits on stdin EOF, checks deadlines between API calls, creates no child, and emits at most stable-code stderr diagnostics. Later host validation must prove WSL termination propagation and no orphan by PID+creation time.

### 5. Add the nonresident native Windows companion source/build contract

Add exactly:

- `native/windows-companion/CMakeLists.txt`
- `native/windows-companion/CMakePresets.json`
- `native/windows-companion/README.md`
- `native/windows-companion/resources/app.manifest`
- `native/windows-companion/src/main.cpp`
- `native/windows-companion/src/jsonl_protocol.cpp`
- `native/windows-companion/src/jsonl_protocol.hpp`
- `native/windows-companion/src/identity.cpp`
- `native/windows-companion/src/identity.hpp`
- `native/windows-companion/src/capture.cpp`
- `native/windows-companion/src/capture.hpp`
- `native/windows-companion/src/input.cpp`
- `native/windows-companion/src/input.hpp`

Build contract: native x64 C++20, MSVC, one explicitly selected Windows SDK/toolchain recorded in build metadata, `/guard:cf`, `/DYNAMICBASE`, `/NXCOMPAT`, warnings-as-errors, no third-party/runtime package, no installer, no self-update, no service, and no runtime-loaded script. The manifest declares Per-Monitor-v2 DPI awareness. Build output is a single console `.exe`; binaries, PDBs, captures, keys, and signing material are ignored and excluded from npm pack. Build scripts must accept exact tool paths and never select a compiler or deployment path from ambient PATH at runtime.

Implementation uses only documented Win32/C++/WinRT surfaces supported by the supplied research: `EnumWindows`, window/process identity APIs, DWM geometry/cloak state, `Windows.Graphics.Capture` via `IGraphicsCaptureItemInterop::CreateForWindow`, D3D11, WIC in-memory encoding, foreground checks, virtual-desktop coordinate mapping, and `SendInput`. `PrintWindow` is not an automatic fallback. Unsupported WGC, focus denial, UIPI, held keys, geometry/DPI/monitor change, blank/protected capture, incomplete `SendInput`, or identity drift returns a stable terminal reason. The source contains no BlueStacks-private API or purported compatibility constants.

Deployment contract: later build/sign, hash, and manually place the `.exe` in one operator-approved local NTFS directory with reviewed owner/DACL and no reparse/network component. There is no installer or resident process; exact WSL and Windows final paths, hash, build ID, and actual signer metadata are written into an operator-owned config only after inspection. The process starts for one approved run and exits on close/EOF/timeout.

### 6. Implement an external one-hour evidence vault

`evidence-vault.mjs` requires an already-existing explicit parent that is absolute lexical-canonical, current-user-owned mode `0700`, and has no symlink component. It rejects package/source/workspace descendants, hard links, `/mnt/*`, Windows shares, group/world-writable ancestry, unexpected devices/owners/types, and any default path. It creates one unpredictable run directory mode `0700` and files with `O_CREAT|O_EXCL|O_NOFOLLOW`, mode `0600`, `nlink=1`; identity is checked before/after each streamed write and atomic metadata publication.

Default retention is metadata only. Screenshot retention requires a separate closed approval and remains at most 4 files/64 MiB; total vault is at most 16 files/66 MiB. Metadata contains protocol/build/run/request/sequence and target/profile/capture digests, dimensions, provenance timestamps, byte count, SHA-256, stable reason codes, expiry, and deletion state. It excludes raw paths/titles, image bytes in logs, account/clipboard/hierarchy/text, credentials, arbitrary errors, and stack traces. Logs pass the existing structured redactor and use only registered IDs/codes.

TTL is set at creation and cannot exceed one hour. Successful runs delete screenshots immediately unless separately approved for bounded failure/ambiguity evidence; startup and explicit cleanup remove expired runs. Cleanup first revalidates parent and run identities, atomically renames a run to an unpredictable quarantine name under the same verified parent, verifies device/inode/owner/mode/containment, recursively enumerates with no-follow checks and bounded count/bytes, deletes only matching regular files/directories, then proves quarantine absence and unchanged parent. Identity/containment mismatch performs no deletion. Failure returns a stable reason plus opaque retained/quarantine ID and expiry (the operator already has the explicit root), never screenshot content or an unredacted path; new live runs fail while unverifiable retained evidence or quota remains.

### 7. Add docs, package changes, fake companion, fixtures, and deterministic tests

Add docs:

- `docs/nba2k27-myplayer/host-companion-protocol.md`
- `docs/nba2k27-myplayer/windows-host-preflight.md`

Modify `docs/nba2k27-myplayer/operator-safety.md` and `docs/nba2k27-myplayer/data-contract.md` to distinguish offline preparation from prohibited/unapproved activation, document JSONL/config/vault limits, state no BlueStacks compatibility claim, and list the staged approval gates below.

Add tests/tools:

- `test/nba2k27-myplayer/host-protocol.test.mjs`
- `test/nba2k27-myplayer/host-authority.test.mjs`
- `test/nba2k27-myplayer/host-adapter-integration.test.mjs`
- `test/nba2k27-myplayer/evidence-vault.test.mjs`
- `test/nba2k27-myplayer/windows-contract.test.mjs`
- `test/nba2k27-myplayer/verify-no-live.mjs`
- `test/nba2k27-myplayer/verify-pack.mjs`
- `test/nba2k27-myplayer/fixtures/host/valid-observe.jsonl`
- `test/nba2k27-myplayer/fixtures/host/valid-canary.jsonl`
- `test/nba2k27-myplayer/fixtures/host/malformed.jsonl`
- `test/nba2k27-myplayer/fixtures/host/oversized.jsonl`
- `test/nba2k27-myplayer/fixtures/host/replay.jsonl`
- `test/nba2k27-myplayer/fixtures/host/stale-capture.jsonl`
- `test/nba2k27-myplayer/fixtures/host/partial-capture.jsonl`
- `test/nba2k27-myplayer/fixtures/host/wrong-identity.jsonl`
- `test/nba2k27-myplayer/fixtures/host/wrong-correlation.jsonl`
- `test/nba2k27-myplayer/fixtures/host/test-config.json`

Fixtures must contain synthetic test-only IDs, paths, hashes, windows, geometry, and pixels and be labeled non-host evidence. The fake companion supports deterministic fragmented/coalesced lines, delayed records, malformed output, stderr/stdout floods, crashes, hangs, cancellation, partial chunks, identity drift, and injected user/focus/geometry changes.

Update `package.json` without dependencies or lifecycle/publication scripts: retain `private`, Node >=24, existing bin and exports; add `native/` to `files`; add only explicit `test:host`, `check:host`, `verify:no-live`, and `verify:pack` scripts. Keep `test` and `check`. The packed inventory may include `package.json`, `src/`, `docs/`, and native source/build metadata only—never `test/`, compiled output, config with real host values, vault data, screenshot, key, signature, or trace.

Test requirements:

- Protocol fuzz/adversarial matrix: fragmentation/coalescing, CR/BOM/UTF-8, duplicate/unknown keys, all structural bounds, unsupported versions/capabilities, replay/gap/order/correlation, stale/extra/partial chunks, hash/count mismatch, unsolicited output, EOF, floods, deadline/cancel/crash at every state, and `ACTION_OUTCOME_UNKNOWN` after dispatch.
- Authority sentinels: monkey-patch/inject process and network sentinels that throw; import, all default commands, all tests, config validation, transcript verification, and fake integration must make zero calls. Static scan permits `node:child_process` only in `launch-companion.mjs` and denies network builtins, shell/PowerShell/cmd/ADB/listener/pipe/service APIs and ambient executable/config resolution everywhere.
- Approval/state tests: one-use capabilities, mode/config/approval/target/profile/plan binding, expiry, replay, shared budgets charged before input, preview requirement, one-action canary, continuation reapproval, foreground/identity/freshness/geometry fail-closed behavior, and prohibited action non-representability.
- Filesystem attacks: symlink/hard-link/FIFO/device, mode/owner/ancestor, package/workspace containment, rename replacement, quota, oversized stream, TTL boundary, cleanup identity change, quarantine failure, redaction, pack exclusion, and retained-ID reporting. Use owner-only temporary Linux directories only.
- Windows source contract tests are static and compile-contract checks only on Linux; they assert API allowlists/denylists, manifest DPI declaration, hardening options, no invented BlueStacks constants, and no compiled artifact. They do not claim a successful Windows build or host behavior.

### 8. Run independent validation gates

The implementer runs self-checks; a fresh validator independently reruns all commands from the durable destination. Required commands after implementation are:

```text
node --check src/nba2k27-myplayer/index.mjs
node --check src/nba2k27-myplayer/cli.mjs
node --test test/nba2k27-myplayer/*.test.mjs
npm run test:host
npm run check:host
npm run verify:no-live
npm run verify:pack
npm ls --all --json
npm pack --dry-run --json
node src/nba2k27-myplayer/cli.mjs validate-host-config --input test/nba2k27-myplayer/fixtures/host/test-config.json
node src/nba2k27-myplayer/cli.mjs verify-host-transcript --input test/nba2k27-myplayer/fixtures/host/valid-observe.jsonl
node src/nba2k27-myplayer/cli.mjs verify-host-transcript --input test/nba2k27-myplayer/fixtures/host/malformed.jsonl
```

The malformed transcript command must exit nonzero with only a stable redacted error. The validator additionally invokes the protocol test with the full adversarial name pattern, the evidence-vault filesystem-attack test, and the authority test under process/network sentinels. `verify-pack.mjs` compares dry-run JSON against a recursively derived exact allowlist and rejects test/evidence/binary/key/config/trace paths. `verify-no-live.mjs` checks package scripts for lifecycle/publication hooks and source for dependency, listener, network, shell, ADB, service, ambient lookup, CLI activation, and unauthorized process-launch surfaces.

Migration gate is separately command-backed by a validator-owned Node manifest comparison between the original source and the recorded pre-edit destination manifest, plus the pre-edit baseline results. Final acceptance requires all original tests still pass, every new deterministic test passes, preparation CLI behavior is process/network silent, no host command was run, and pack inventory exactly matches the newly derived source-only allowlist. Native compilation and host checks are explicitly deferred, not silently skipped as if passing.

### 9. Preserve a five-stage future activation ladder, each requiring new approval

No stage belongs to this implementation/validation work unit. Each starts a new explicitly approved scope and stops on any unknown:

1. **Build/sign/place:** on an authorized Windows build context, select and record exact MSVC/SDK/tool paths, build x64, review binary/imports/hardening, sign if an approved signer exists, hash, and place in an approved local NTFS directory. Validate final path, owner/DACL, reparse state, file identity, hash, signer, and pack exclusion. Approval ends after placement; do not launch.
2. **Read-only process preflight:** with a new observation-only capability, launch exact path over inherited stdio, validate hello/self-identity, Windows/WGC support, bounded discovery, termination propagation, and orphan absence. Do not bind/capture/input unless separately approved.
3. **Calibration:** with new approval, bind one operator-selected actual HWND/process and record observed BlueStacks/app versions, topology, DPI/monitor/client/content geometry, visibility states, profile nonce, and semantic content anchors. No hard-coded title/class/coordinate is accepted without observed evidence. No input.
4. **Capture-only canary:** with new capture approval and external vault decision, show fresh-frame provenance while visible/obscured/moved/resized/minimized and on relevant DPI monitors; test blank/protected content and identity/geometry drift. Passing capture does not approve input or game-state recognition.
5. **Bounded-input canary:** with a new target/profile/plan-bound control approval, explicit operator preview, foreground target, fresh source capture, shared budget, and one reversible navigation action, perform exactly one canary and capture two-cue postcondition. Stop in `AWAIT_CONTINUATION`; any further bounded run requires yet another explicit approval. No save/finalize/account/purchase/upload/share or irreversible action.

## File Contracts or Decisions

- **Migration:** destination starts as a byte/type/mode-faithful, current-user-owned copy of the accepted 51-file source; no Git metadata is created and no source file is altered.
- **Runtime authority:** only `host/launch-companion.mjs` may import process-launch authority; no network authority exists. It is internal, exact-path, non-shell, one-child, one-session, stdio-only, and requires config plus consumed one-use capability.
- **Protocol:** JSONL v1.0, closed/bounded/correlated, fresh nonce/session, one request in flight, base64 capture chunks, strict replay rejection, terminal deadlines/cancellation/crash semantics.
- **Companion:** reviewable native source and build metadata only; one nonresident console process; documented Win32 APIs; no private BlueStacks API or compatibility claim.
- **Evidence:** explicit external Linux owner-only vault, default/max one-hour TTL, no workspace/package screenshots, bounded count/bytes, integrity metadata, identity-checked quarantine cleanup, redacted structured reporting, and pack exclusion.
- **Package:** dependency-free/private/non-publishing remains; native source is packed, tests and all generated/sensitive artifacts are not; original six command behaviors remain intact and added preparation commands cannot activate a host.

## Dependencies

1. Accepted offline source and validator evidence (`implementation-validator-035-integration`).
2. Supplied host-interface research (`root-researcher-001-host-interface`).
3. Node.js 24 for implementation and deterministic Linux tests.
4. Future only: explicitly selected Windows x64 MSVC/SDK, local deployment directory, actual executable identity/signing facts, Windows/WSL/BlueStacks inventory, harmless test window, and separate stage approvals.

No current step depends on a reachable Windows host, BlueStacks, network, credentials, ADB, PowerShell runtime transport, provider service, or Git history.

## Verification Gates

1. **Migration fidelity:** closed no-follow manifest match and accepted 71-test/37-pack baseline before edits.
2. **Offline preservation:** existing optimizer/manual contracts and CLI bytes/semantics continue to pass.
3. **Protocol/security:** complete bounded JSONL, identity, replay, timeout, uncertainty, preview, approval, canary, and budget matrix passes under fake transport.
4. **No-live proof:** real process and every network call are sentinel-blocked and observed zero times in imports/defaults/tests/preparation CLI; static authority scan is exact.
5. **Vault:** owner/mode/no-follow/quota/TTL/quarantine/redaction attacks pass in external temporary roots; no evidence enters package/workspace/pack.
6. **Package:** no dependencies or lifecycle/publication hooks; exact source-only npm pack inventory; no binary/generated/private material.
7. **Native contract:** static source/build/API checks pass; Windows compilation and BlueStacks behavior remain explicit deferred gates.
8. **Independent validation:** fresh validator supplies command outputs and blocks acceptance on any changed behavior, skipped required Linux gate, host contact, or authority reachability.

## Assumptions and Open Questions

- Node.js 24 and the accepted source remain available through migration. The source lacks Git history, so fidelity is established by a closed manifest and baseline behavior rather than commit ancestry.
- Exact MSVC/SDK versions cannot be selected until the authorized build host is inventoried; the build contract requires recording them rather than guessing.
- Exact WSL interop termination behavior, WGC support, BlueStacks HWND/render topology, integrity level, DPI/content mapping, foreground behavior, and `SendInput` behavior remain blocking future preflight questions.
- A signer may not yet exist. Hash pinning is mandatory; signer pinning becomes mandatory only when an approved signed release is actually produced.
- Same-user replacement and user-input races cannot be eliminated; handle/identity checks, short capabilities, bounded authority, and stop-on-change reduce rather than erase that risk.

## Output Contract

- Outputs: Ordered bounded implementation plan; migration and exact durable inventory contracts; JSONL protocol/state machine; config/launch authority; Windows source/build/deploy contract; evidence vault; fake/adversarial tests; CLI/package/docs changes; executable validation gates; staged future activation; assumptions and handoff.
- Evidence: Supplied accepted validator trace, supplied official-source research synthesis, and direct read-only inspection of the accepted source inventory and relevant implementation files. Recommendations do not claim host testing.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/planner/root-planner-002-host-preparation.md`

## Handoff

- Next role: `implementer` in `taskMode: implementation`, scoped to migration plus the exact destination files above, followed by an independent `validator` in `integration-check` or `validation` mode.
- Handoff notes: Implement serially: fidelity migration/baseline first, pure protocol/config/fakes second, guarded launcher/adapter third, vault/native/docs/package/tests last. Do not activate the real launcher during implementation. Return the pre-edit migration manifest digest, changed-file list, derived final pack allowlist, self-check outputs, and explicit confirmation that process/network sentinels observed zero calls.
- Limitations: Planning only. No copy, implementation edit, final validation, native build, host probe, launch, capture, input, or compatibility test was performed. Exact host paths, hashes, signer, selectors, coordinates, versions, titles, and process identities intentionally remain operator-supplied/deferred.
- Risks: The real-launch module is sensitive even though unreachable from defaults; any export/CLI/default/test reachability is blocking. JSONL screenshot expansion increases memory/pipe pressure and must obey decoded and encoded limits. Native API correctness and WSL termination behavior require future Windows-host validation. Independent validator evidence is required before accepting this preparation work.
