# Windows-via-WSL Host Interface Research

## Metadata

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- role: `researcher`
- artifactId: `root-researcher-001-host-interface`
- createdAt: `2026-08-21`
- taskMode: `research`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-research-host-interface-001`; scoped comparison of inherited-stdio WSL interop with named pipes/localhost; Windows API, trust, identity, DPI, capture, input, timeout, and evidence questions; supplied target and prior validator trace.
- Required context present: Yes. Research was bounded to supplied files and official Microsoft/BlueStacks documentation. No host probe, executable invocation, account/game action, implementation edit, or delegation was performed.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Read the role contracts, supplied implementation/validator evidence, and current official WSL, Win32, PowerShell, and BlueStacks documentation; compared transport and companion choices; derived fail-closed preparation implications while labeling facts, inference, and recommendations.
- Files read: `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; supplied validator trace; relevant target adapter, oracle, approval, safety, and test files listed under local sources.
- Files changed: Only this required trace artifact was created; no implementation or supplied-evidence file was edited.
- Commands/checks: No shell commands, host probes, process execution, or live checks. Documentation was retrieved read-only.

## Executive Finding

**Recommendation (not a compatibility claim):** prepare a single, nonresident, compiled Windows console companion, launched by an exact absolute `.exe` path from WSL for each approved session, with all communication on that child's inherited stdin/stdout. Use a small native x64 C++20 Win32/C++/WinRT implementation calling User32/DWM, `Windows.Graphics.Capture`, D3D11/WIC, and `SendInput`. Do not use a service, ADB, localhost, a named endpoint, shell mediation, or BlueStacks private interfaces.

This is the narrowest reviewable boundary because official WSL documentation says Windows executables launched from Linux run as the active Windows user and support ordinary piping/redirection [S1]. Inherited anonymous streams are already bound to the launched child and need no discoverable listener, ACL, port, firewall rule, endpoint lifecycle, or reconnect semantics. This is an architectural inference from [S1], contrasted with Microsoft's documentation that named pipes are named endpoints accessible to processes subject to security checks and can be remotely accessible unless explicitly denied [S16-S17], and that socket binding has port-hijack/exclusivity concerns [S18].

No supplied or official source establishes that the current BlueStacks/NBA 2K27 window is capturable or safely controllable through these APIs. That remains an on-host preflight question.

## Cited Findings

### 1. Existing local contract is intentionally fake-only

- **Direct local evidence:** `HostAdapter` exposes only `listInstances`, `inspectContext`, `capture`, and `performInput`; the only concrete implementation is an in-memory `FakeHostAdapter` [L1]. `BlueStacksUiOracle` uses injected host calls and implements unique-instance, profile/context, checkpoint, allowlist, approval, budget, pre/post-recognition, retry, and canary guards [L2-L3].
- **Direct local evidence:** project documentation explicitly says the CLI has no live/UI-control transport, `BlueStacksUiOracle` is not live-ready, and no approval can enable prohibited live behavior [L4]. The accepted integration trace likewise says no concrete host adapter or CLI activation path exists and no live BlueStacks compatibility is claimed [L5].
- **Implementation implication:** a later companion must remain an injected implementation behind the four-method boundary; enabling it is a separate implementation/validation scope. Preparation must not silently make the current CLI live-capable.

### 2. Transport comparison

| Option | Documented facts | Research assessment |
| --- | --- | --- |
| WSL launches exact Windows `.exe`; inherited stdin/stdout | Win32 tools can be run directly from WSL, run as the active Windows user with the WSL process's rights, appear as ordinary Windows processes, and piping/redirection work [S1]. | **Select.** One child, one session, no listener. Bind protocol to process lifetime and startup nonces. |
| Windows named pipe | Named pipes are named one-way/duplex endpoints; any process can access subject to checks; defaults grant creator/administrators/System full control and Everyone/anonymous read; remote access is possible if Server service runs unless network access is denied [S16-S17]. | **Reject for this scope.** It adds naming, DACL/logon-SID, first-server/impersonation, remote-deny, connection race, and stale-endpoint work without a need for reconnect/multi-client behavior. |
| TCP localhost | A listening socket is network transport. Microsoft documents address-reuse/port-hijack and exclusive-bind considerations [S18]. | **Reject.** It conflicts with the no-network design and adds bind/auth/firewall/dual-stack exposure. Loopback is not equivalent to inherited process-private handles. |
| PowerShell script or `Add-Type` P/Invoke companion | PowerShell officially provides `Get-AuthenticodeSignature` and SHA-256 `Get-FileHash` [S14-S15]. | **Use only as a manual deployment/preflight aid, not runtime transport.** Script/module resolution, execution policy, text streams, startup overhead, and complex WinRT/D3D capture make the runtime surface less closed and reviewable. Execution policy is not treated as a security boundary. |
| Compiled C# companion | .NET can launch without shell mediation and redirect streams, but requires an installed runtime or a larger self-contained deployment. | Viable fallback if the host's exact .NET runtime is approved and pinned. Native C++ has fewer runtime/deployment prerequisites for this bounded Windows API surface. |

### 3. Exact companion/API surface

- **Window discovery:** `EnumWindows` enumerates top-level desktop-app windows and is preferred by Microsoft over a `GetWindow` loop [S2]. For each candidate, use `IsWindow`, `IsWindowVisible`, `IsIconic`, `GetWindowThreadProcessId` [S3], `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`, `QueryFullProcessImageNameW` [S21], and `GetProcessTimes` creation time [S20]. Use `GetClassNameW`, bounded `GetWindowTextLengthW`/`GetWindowTextW`, and DWM attributes only as observations, not hard-coded BlueStacks constants. `IsWindowVisible` only tests the style and does not prove the window is unobscured [S22].
- **Window geometry:** declare Per-Monitor-v2 DPI awareness in the executable manifest; Microsoft recommends a manifest rather than setting process DPI awareness by API [S6]. Obtain `GetDpiForWindow` [S7], `GetClientRect` [S8], `ClientToScreen` [S9], monitor identity, and optionally `DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS)` [S10]. Client coordinates start at `(0,0)` and bottom/right are exclusive [S8]; `ClientToScreen` returns device coordinates [S9].
- **Capture:** prefer `Windows.Graphics.Capture`, check `GraphicsCaptureSession.IsSupported`, create a `GraphicsCaptureItem` for the exact HWND through `IGraphicsCaptureItemInterop::CreateForWindow` (Windows 10 1903+) [S11-S13], obtain a new D3D11 frame, copy only `ContentSize`, and encode in memory through WIC. Frames provide `SystemRelativeTime` in QPC time [S11], which supports freshness checks. Do not write a Windows temporary screenshot. `PrintWindow` is only a gated diagnostic fallback: it asks the target app to render, is synchronous, and may block unpredictably [S19]; it must not be silently substituted.
- **Input:** use `SendInput` only for closed mouse/keyboard primitives. It is subject to UIPI, only injects into equal/lower integrity targets, can be disrupted by already-held keys, and its result does not identify UIPI as the cause [S4]. `SetForegroundWindow` is restricted and can be denied [S5]; therefore the companion should not attempt focus-stealing workarounds. Require the already-foreground HWND from `GetForegroundWindow` [S10a] immediately before every input batch and recheck after it.
- **BlueStacks variability:** official BlueStacks documentation says multiple instances can exist and be launched/aligned independently [B1], and BlueStacks can be updated through its About tab or installer [B2]. Thus window title, class, process layout, version, resolution, Android runtime, and instance association are version-sensitive observations. No official source found defines a stable HWND/class/title or endorses Win32 capture/input automation.

### 4. Executable selection and trust controls

**Recommendation/inference:**

1. Configuration contains one exact absolute Windows executable path and one approved SHA-256; no PATH lookup, extension inference, shell, `cmd.exe`, PowerShell runtime wrapper, registry discovery, or download.
2. Deployment preflight opens every path component and the executable without following reparse points, rejects reparse points, network/UNC locations, alternate streams, group/everyone write, and unexpected owner; obtains the final path from the open handle (`GetFinalPathNameByHandleW` resolves final paths [S13a]). Store a pinned file identity and SHA-256. Require a valid Authenticode signature and pinned signer thumbprint when release signing exists; otherwise explicit hash pinning is mandatory. PowerShell can report signature and SHA-256 during manual preflight [S14-S15], but the runtime should repeat native handle-based checks.
3. WSL opens/hashes the explicit `/mnt/<drive>/...` file immediately before direct spawn and compares to its pin. The companion's startup `hello` reports its protocol/build ID, native PID, process creation time, final image path hash, image SHA-256, signer identity hash, integrity level, Windows build, and DPI mode. The parent compares every expected field before permitting discovery/capture/input.
4. The companion opens its own image and every selected target process with query handles; target identity is `(PID, processCreationTime, finalImagePathHash, imageSha256, signerHash)`, not PID alone. PID reuse or inability to query any required field fails closed.

**Residual limitation:** path/ACL/hash checks protect against accidental or differently privileged replacement; they do not eliminate malicious same-user replacement or a race in mutable deployment storage. A locked administrator-managed directory and signed release improve this, but are host changes deferred by the packet.

### 5. Closed stdio protocol

**Recommended wire contract:**

- Byte protocol, not newline parsing: each control frame is `uint32_be length` followed by UTF-8 JSON; maximum control payload `65,536` bytes, depth `16`, keys `128`, string `4,096`, array `256`; duplicate keys, unknown fields, invalid UTF-8, non-integers, noncanonical IDs, trailing bytes, and unsupported versions are terminal errors. Screenshot response is one control frame declaring `blobLength` and `sha256`, followed by exactly that many bytes; blob maximum `16 MiB` and one blob in flight.
- First parent frame is exactly `hello{protocolMajor:1, protocolMinor:0, clientNonce:<32 random bytes base64url>, requestedCapabilities:[...]}`. It cannot request UI work. Companion returns its own 32-byte nonce and identity report. Both derive `sessionId = SHA256("host-interface-v1" || clientNonce || serverNonce || executableSha256 || processCreationTime)`; subsequent messages must echo it.
- Every request contains a safe `requestId` and strictly increasing unsigned `sequence`; every response echoes both, names exactly one operation, and has closed `ok/result` or `ok:false/reasonCode` shapes. Reject duplicates, gaps, out-of-order requests, multiple outstanding requests, and unknown operations. The companion keeps the sequence ledger only in memory. A new process has new nonces, so old requests fail session binding; inherited streams prevent reconnect.
- Capability negotiation is intersection-only: `discover`, `capture`, and `input` are separate. Start observation-only; a control session requires a separately supplied, expiring run approval bound to session ID, run ID, target token, profile hash, exact capabilities, maximum queries/actions, and action allowlist. Preserve the existing shared-ledger semantics [L2-L3].
- `stderr` is not protocol and never carries paths, titles, screenshots, arbitrary exceptions, or stack traces. Allow at most 8 KiB of stable code-only diagnostics; any stderr overflow, malformed stdout, unsolicited frame, extra blob byte, EOF, or nonzero exit is terminal. stdout is capped cumulatively (recommended 64 MiB/session) and backpressure is enforced.
- Parent deadlines: startup 5 s, discovery 2 s, capture 3 s, input dispatch 1 s, postcondition capture 3 s, whole request 5 s, whole session 10 min. On deadline, parent sends one bounded `cancel` if the parser is responsive, closes stdin, waits 250 ms, then terminates the interop child and discards partial output. The companion independently checks deadlines between API steps and exits on stdin EOF. No further input is permitted after cancellation/timeout. Exact WSL kill propagation must be tested on-host; it is not established by [S1].

### 6. Window identity and coordinates

**Recommendation/inference:**

1. `discover` returns zero or more bounded candidate descriptors, never auto-selects. The operator selects exactly one after viewing a capture preview. The companion issues an opaque random `windowToken` bound in memory to HWND plus target process identity, window class hash, title hash, initial client rectangle, DPI, monitor, and a profile/version nonce. Raw title/path are display-only during interactive preflight and are not retained.
2. A title substring or class name can narrow candidates only after an observed profile is approved; neither establishes identity. Reject zero, multiple, invisible, cloaked, minimized, elevated-above-companion, changing, or unqueryable candidates. Because BlueStacks supports multiple instances [B1], instance identity must be explicit and unique.
3. Before and after each capture and before every input event, re-resolve and compare HWND→PID, process creation time/image identity, visibility/minimized/cloaked state, client rectangle, DPI, monitor, and profile hash. Reject any mismatch; never rediscover and substitute automatically.
4. Selectors are semantic plus normalized fixed-point client coordinates (for example integer millionths), never unbounded screen pixels. At preview and execution, map through the fresh capture content rectangle and fresh `GetClientRect`/`ClientToScreen`; reject points outside an inset safe rectangle. For absolute `SendInput` mouse movement, account for the full virtual desktop and negative monitor origins; do not assume primary-monitor `(0,0)`.
5. Reject any DPI, client-size, orientation, monitor, letterbox/content-anchor, or capture-size change between preview and action. Recalibration requires a new profile and approval. Do not infer Android density from Windows DPI.

### 7. Capture provenance and freshness

Each accepted capture should carry: protocol/build/session/request/sequence IDs; target token and process-identity digest; HWND token digest; profile hash; pre/post geometry, DPI, monitor and foreground state; capture API and pixel format; request-start monotonic time; frame `SystemRelativeTime`; receive monotonic time; width/height/content rectangle; byte length; and image SHA-256.

**Freshness gate:** start or refresh the capture session for the bound HWND, discard queued frames, and accept only a frame whose QPC-derived `SystemRelativeTime` is after the request's capture barrier and within the 3-second request deadline [S11]. Revalidate target identity and geometry after copying. Reject timeout, closed item, unsupported capture, zero/changed dimensions, over-limit bytes, stale timestamp, malformed encoding, protected/blank-frame diagnostic result, or pre/post identity mismatch. A changed pixel hash is not required because a valid static screen may be identical; timestamp plus fresh frame arrival and identity checks are the provenance basis.

### 8. Input preview, approval, focus, canary, and budgets

- Observation and planning never input. An input request references an immutable plan hash composed from session, target/profile, source screenshot hash/sequence, semantic action, selector, transformed device point/key sequence, expected pre/post states, timeout, mutation class, and retry count.
- Show the operator the source capture, semantic action, highlighted target point/key, expected state change, and exact maximum attempts. Approval is closed, short-lived, single-run, capability-specific, target/profile/plan-bound, and budgeted. Recheck approval expiry at consumption, not only parsing. Preserve one shared ledger so restarting an adapter cannot reset action/query counts [L2-L3].
- Allow only named semantic actions already closed by `ALLOWED_ACTIONS`; continue prohibiting save/finalize/upload/share/account/purchase/delete/launch/restart and arbitrary coordinates/text/chords [L2,L4]. Mouse input is one move+single click at an approved point; keyboard input is a tiny per-action allowlist of explicit key-down/key-up pairs. Reject held modifier keys; always issue allowed key-up cleanup on a partially sent pair.
- Require the exact target HWND to be foreground immediately before each event; do not automatically click merely to focus. If an operator-approved `SetForegroundWindow` attempt is ever added, verify success with `GetForegroundWindow` and still stop on denial [S5,S10a]. Recheck process/window/geometry/source checkpoint and two independent state cues directly before consuming an action.
- First live control is a separate **one-action reversible navigation canary** (stricter than the local maximum of two [L2-L3]); no retry unless that exact action is independently classified non-value-mutating and the source checkpoint is unchanged. Require a fresh post-frame and two independent cues. Stop on user activity, focus loss, modal/auth boundary, geometry/version change, timeout, ambiguity, or unexpected state. Canary success does not authorize the remaining run; require operator continuation.

### 9. Crash, timeout, and cancellation behavior

- Single request in flight makes uncertainty explicit. Charge action budget **before** `SendInput`; after dispatch begins, crash/EOF/timeout yields `ACTION_OUTCOME_UNKNOWN`, never retry automatically. Require a fresh observation and approval decision.
- Capture/query timeout is terminal for the process; discard partial output. Input timeout closes authority immediately. Companion should not spawn children. If future children become unavoidable, a Windows launcher/job with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` can terminate an associated process tree [S19a], but this is unnecessary in the recommended one-process design.
- Handle Ctrl-C/parent exit by revoking capability, closing capture/D3D resources, emitting no more frames, and exiting. Do not persist session secrets or approvals. Parent must test that closing/killing the WSL interop process terminates the native companion; until proven, an on-host process check by reported `(PID, creationTime)` is mandatory after forced timeout.

### 10. Owner-only, short-retention evidence

**Recommendation/inference:**

- Keep evidence in the WSL Linux filesystem, not `/mnt/c`: create a per-run directory mode `0700` under an already trusted owner-only parent, metadata files `0600`, no symlinks, no hard links, atomic no-follow creation. Microsoft recommends keeping Linux-command-line work in the WSL filesystem [S1]. On DrvFS, Linux modes are derived from Windows permissions unless metadata is enabled, and `chmod` has limited effect without metadata [S20a].
- Stream image bytes directly from companion to WSL memory. Default retention is metadata-only: stable reason codes, hashes, dimensions, monotonic timings, counters, and redacted identity digests. No raw Windows path/title, account data, clipboard, hierarchy, keystroke text, arbitrary exceptions, or screenshot in ordinary logs, matching the local redaction intent [L3].
- Retain a screenshot only when separately approved for a failed/ambiguous checkpoint; cap at 4 images and 64 MiB total per run. Suggested TTL is 24 hours, with deterministic deletion at successful completion and startup garbage collection. Record deletion failures without exposing paths; fail new live runs if the private evidence root or quota cannot be verified.
- Caveat: Windows access through `\\wsl$` runs as the distribution's default user [S20a]. Linux `0600` therefore protects against other Linux users but not the same Windows/default-user authority or administrators. This is short-retention operational privacy, not isolation from a malicious same-user actor.

## Exact Deferred On-Host Prerequisites and Checks

No item below was performed in this research task.

1. Record Windows edition/build, WSL version/mode, desktop session, architecture, graphics adapter/driver, HDR state, scaling per monitor, virtual-desktop geometry, and whether Windows Graphics Capture is supported. Require Windows 10 1903+ for `CreateForWindow` [S12-S13].
2. Record exact BlueStacks version from About, Android runtime/instance name, application/game version, configured emulator resolution/orientation, and whether exactly one intended instance is running. BlueStacks updates and multiple instances make these mutable [B1-B2].
3. Confirm operator-installed BlueStacks satisfies vendor requirements; official guidance lists Windows and current graphics drivers and recommends Windows 10+, virtualization, and stronger resources [B3]. Do not change BIOS, BlueStacks, driver, DPI, firewall, ACL, or Windows policy during preflight.
4. Manually enumerate and approve the actual top-level/render window relationship; capture while visible, obscured, moved, resized, maximized, minimized, and on each DPI monitor. Establish whether WGC returns current complete client content and whether protected/blank/black frames occur. Do not fall back silently.
5. Confirm target integrity level is not above companion, `SendInput` count matches exactly, held-key checks work, foreground cannot be stolen unexpectedly, virtual-desktop mapping is pixel-correct, and one reversible canary produces the expected two-cue postcondition. No account, purchase, save/finalize, game submission, or irreversible action.
6. Verify exact executable final path, component reparse status, NTFS owner/DACL, SHA-256, Authenticode signer/status, build ID, and after-spawn self-report. Test replacement, symlink/junction, wrong signer/hash, PATH collision, shell metacharacters, and mutable-directory failures.
7. Test protocol fragmentation/coalescing, malformed/oversized frames, duplicate keys/IDs, replayed session/request, stale/extra blob, stdout/stderr flood, EOF mid-frame, unsupported version/capability, cancellation at every phase, companion crash/hang, WSL parent kill, and orphan absence by PID+creation time.
8. Verify WSL evidence root ownership/modes/no-follow behavior, no Windows temp artifacts, quotas, TTL deletion, `\\wsl$` caveat, redaction, and that no network socket, named pipe, service, scheduled task, registry autorun, ADB, or BlueStacks private API is opened.

## Planner-Ready Test and Deployment Implications

- Separate artifacts: protocol/schema and fake transcript harness; Windows companion source/build manifest; WSL adapter; manual deployment/preflight guide; no activation in the existing CLI by default.
- Build reproducibly for one pinned Windows SDK/toolchain; produce binary SHA-256 and optional Authenticode signer metadata. Deployment is a deliberate copy to an approved local NTFS directory with reviewed DACL, never an installer/service or self-update.
- Unit/fake tests must cover closed schemas, identities, nonces/sequences, bounds, approvals, ledgers, coordinate math including negative origins/DPI, provenance, timeout uncertainty, and redaction. Windows integration tests must use a harmless purpose-built test window before BlueStacks preflight.
- Acceptance must keep observation and control separate. Capture support does not imply input support; a passing fake adapter does not establish live compatibility; a passing BlueStacks capture does not establish correct game-state recognition.

## Risks and Unresolved Questions

1. **Blocking:** live BlueStacks HWND/process composition, WGC behavior, graphics backend, integrity level, and `SendInput` behavior are unknown until on-host preflight. Official BlueStacks sources do not promise compatibility.
2. **Blocking for force-timeout assurance:** official WSL material confirms execution and pipes but not exact termination propagation from a killed Linux interop process to the native process.
3. WGC `CreateForWindow` programmatic selection and capture-border/consent behavior can vary by Windows build/policy; confirm the exact host behavior. The general capture article documents picker consent and a yellow border [S11], while the interop API documents HWND targeting [S12-S13] but not all policy/UI behavior.
4. Native C++/WinRT minimizes runtime prerequisites but increases D3D/COM implementation complexity. Framework-dependent C# is simpler to review but adds an exact .NET runtime prerequisite; planner should choose only after host inventory.
5. Same-user mutation, user-generated input racing automation, and screenshot sensitivity cannot be completely eliminated. The design limits authority and retention rather than claiming a hostile same-user sandbox.
6. A stable semantic content rectangle inside the BlueStacks client area is unknown. Windows DPI is not Android display density; calibration must be observed and version-bound.

## Source List

All web sources accessed `2026-08-21`. Microsoft Learn pages expose article dates and/or update metadata; both are recorded where available.

### Supplied/local evidence

- **[L1]** `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/host-adapter.mjs`, lines 1-30.
- **[L2]** `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/bluestacks-ui-oracle.mjs`, lines 6-132.
- **[L3]** `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/security/approval.mjs`, lines 1-54; `test/nba2k27-myplayer/ui-adapter.test.mjs`, especially lines 75-135, 229-299.
- **[L4]** `/tmp/opencode/nba2k27-myplayer/docs/nba2k27-myplayer/operator-safety.md`, lines 3-9.
- **[L5]** `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-035-integration.md`, lines 94-112.

### Microsoft documentation

- **[S1]** Microsoft, “Working across file systems,” article date 2021-09-27, updated 2026-06-02: https://learn.microsoft.com/en-us/windows/wsl/filesystems
- **[S2]** Microsoft, “EnumWindows function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows
- **[S3]** Microsoft, “GetWindowThreadProcessId function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid
- **[S4]** Microsoft, “SendInput function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput
- **[S5]** Microsoft, “SetForegroundWindow function,” article date 2025-10-06, updated 2025-10-07: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow
- **[S6]** Microsoft, “SetProcessDpiAwarenessContext function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setprocessdpiawarenesscontext
- **[S7]** Microsoft, “GetDpiForWindow function,” article date 2022-05-25, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getdpiforwindow
- **[S8]** Microsoft, “GetClientRect function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getclientrect
- **[S9]** Microsoft, “ClientToScreen function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-clienttoscreen
- **[S10]** Microsoft, “DwmGetWindowAttribute function,” article date 2019-05-30, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/nf-dwmapi-dwmgetwindowattribute
- **[S10a]** Microsoft, “GetForegroundWindow function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow
- **[S11]** Microsoft, “Screen capture,” article date 2026-05-13, updated 2026-07-17: https://learn.microsoft.com/en-us/windows/apps/develop/media-authoring-processing/screen-capture
- **[S12]** Microsoft, “IGraphicsCaptureItemInterop,” article date 2019-06-24, updated 2024-04-11: https://learn.microsoft.com/en-us/windows/win32/api/windows.graphics.capture.interop/nn-windows-graphics-capture-interop-igraphicscaptureiteminterop
- **[S13]** Microsoft, “IGraphicsCaptureItemInterop::CreateForWindow,” article date 2019-06-24, updated 2024-04-11: https://learn.microsoft.com/en-us/windows/win32/api/windows.graphics.capture.interop/nf-windows-graphics-capture-interop-igraphicscaptureiteminterop-createforwindow
- **[S13a]** Microsoft, “GetFinalPathNameByHandleW function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew
- **[S14]** Microsoft, “Get-AuthenticodeSignature,” article date 2024-01-18, updated 2026-06-15: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-authenticodesignature?view=powershell-7.5
- **[S15]** Microsoft, “Get-FileHash,” article date 2022-12-12, updated 2025-03-24: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-filehash?view=powershell-7.5
- **[S16]** Microsoft, “Named Pipe Security and Access Rights,” article date 2018-05-31, updated 2025-04-15: https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipe-security-and-access-rights
- **[S17]** Microsoft, “Named Pipes,” article date 2018-05-31, updated 2025-04-15: https://learn.microsoft.com/en-us/windows/win32/ipc/named-pipes
- **[S18]** Microsoft, “Using SO_REUSEADDR and SO_EXCLUSIVEADDRUSE,” article date 2018-05-31, updated 2025-03-11: https://learn.microsoft.com/en-us/windows/win32/winsock/using-so-reuseaddr-and-so-exclusiveaddruse
- **[S19]** Microsoft, “PrintWindow function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-printwindow
- **[S19a]** Microsoft, “Job Objects,” article date 2025-07-14, updated 2025-07-16: https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects
- **[S20]** Microsoft, “GetProcessTimes function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocesstimes
- **[S20a]** Microsoft, “File Permissions for WSL,” article date 2021-09-27, updated 2026-06-02: https://learn.microsoft.com/en-us/windows/wsl/file-permissions
- **[S21]** Microsoft, “QueryFullProcessImageNameW function,” article date 2018-12-05, updated 2024-02-22: https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-queryfullprocessimagenamew
- **[S22]** Microsoft, “IsWindowVisible function,” article date 2018-12-05, updated 2025-07-01: https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-iswindowvisible

### Official BlueStacks documentation

- **[B1]** BlueStacks Support, “How to create and manage instances using the Multi-instance Manager on BlueStacks 5,” 2025-02-20: https://support.bluestacks.com/hc/en-us/articles/360052834092-How-to-create-and-manage-instances-using-the-Multi-instance-Manager-on-BlueStacks-5
- **[B2]** BlueStacks Support, “How to update BlueStacks 5,” 2024-04-05: https://support.bluestacks.com/hc/en-us/articles/360058931651-How-to-update-BlueStacks-5
- **[B3]** BlueStacks Support, “System requirements for BlueStacks 5,” 2024-08-09: https://support.bluestacks.com/hc/en-us/articles/360056129211-System-requirements-for-BlueStacks-5

## Output Contract

- Outputs: Cited findings; exact recommended architecture and rejected alternatives; protocol, trust, identity, DPI, capture, input, timeout, evidence, prerequisites, test/deployment implications; risks and unresolved questions; source list.
- Evidence: Supplied fake-only implementation and accepted validator trace, current official Microsoft WSL/Win32/PowerShell documentation, and official BlueStacks support pages, all accessed 2026-08-21.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/researcher/root-researcher-001-host-interface.md`

## Handoff

- Next role: `planner` in `taskMode: plan`, to turn this evidence into bounded file contracts and executable offline/on-host gates without activating live control.
- Limitations: Documentation research only. No host inventory, API probe, process execution, BlueStacks/game interaction, compatibility validation, or implementation was performed. Several API details are recommendations inferred from documented primitives rather than vendor-endorsed BlueStacks integration.
- Risks: Live capture/input compatibility, WSL forced-termination behavior, window/content identity, graphics backend, and same-user mutation remain unresolved. These must fail closed and be resolved by later on-host preflight and independent validation.
