# Darwin-Native Portable Bootstrap Research

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `researcher`
- artifactId: `root-researcher-001-native-options`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research option 2, a secure Darwin-native replacement for descriptor-alias emulation in the portable bootstrap; inspect bootstrap/manifests/tests/validators/runtime and distribution boundaries; evaluate Node, native-helper, compilation, binary, cwd, and minimal alternatives; make no implementation edits; write this exact trace.
- Required context present: `orchestrationId`, scoped question, relevant paths and prior diagnosis, stock-macOS freshness requirement, no-external-npm constraint, implementation-preparation downstream need, and routing status were supplied.
- routingMetadataStatus: `absent`. Caller routing metadata labels were absent and none were invented.
- Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Traced every destination write and preflight phase, portable/source inventories, tests, validator assumptions, and prior race review; inspected current Node 24/26 APIs and Darwin syscall manuals; probed toolchain, Node FFI, Darwin `*at` calls, advanced Darwin resolution flags, architecture, and runtime versions on macOS 15.6.
- Files read: `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/portable.manifest.json`; `.opencode/harness.manifest.json`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/validate-harness.mjs`; `.opencode/package.json`; `.opencode/package-lock.json`; `AGENTS.md`; role contract, trace schema, memory protocol/templates; prior descriptor-alias researcher/planner/validator traces; prior portability planner/implementer/reviewer/acceptance traces.
- Files changed: This required researcher trace only. The researcher permission in `.opencode/agents/researcher.md:4-8` does not permit `INDEX.md` or delegation-packet writes, so neither was created.
- Commands:
  - Host/toolchain probe: `uname -a`, `sw_vers`, `node --version`, `process.arch`, `process.versions`, `xcrun --find clang`, `clang --version`, `xcode-select -p`, `file /usr/bin/true`.
  - Darwin manuals: `man 2 openat`, `linkat`, `renameat`, `unlinkat`, and `mkdirat`; `man 1 xcode-select` and `codesign`.
  - Node capability probes: ordinary and `--experimental-ffi` imports of `node:ffi`; direct libc FFI probes of `mkdirat`, `openat`, `linkat`, `renameat[x_np]`, `unlinkat`, `write`, `close`, and `__error` in temporary directories.
  - SDK macro probe: `clang -dM` for Darwin `AT_*`, `O_*`, and `RENAME_*` constants.
  - Documentation retrieval: Node v24/v26 `fs`, Node v26 `child_process`, `ffi`, and Node-API documentation (retrieved 2026-08-04).

## Output Contract

- Outputs: Cited findings, decisive option recommendation, exact native operations/protocol and timing, distribution/cleanup/architecture implications, file and test impact, risks, source list, and next-role handoff.
- Evidence: Direct repository/manual/command evidence is labeled separately from design inference.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/researcher/root-researcher-001-native-options.md`.

### Cited Findings

1. **The required behavior is a small, closed filesystem primitive set (direct).** Current alias-backed functions require: open/create a child directory without following its leaf (`bootstrap-portable-harness.mjs:94-103`); retain every destination parent and compare identities (`:106-135,207-229`); create/write a same-parent exclusive temporary, hard-link it no-clobber or rename it for explicit overwrite, unlink it, and clean it on error (`:137-154`); create/link/unlink probe files in every parent before the publication loop (`:187-235,326-330`); and remove newly created empty directories in reverse depth (`:201-204`). Darwin therefore needs `openat`, `mkdirat`, `fstat`, `write`/`close`, `linkat`, `renameat` (or `renameatx_np`), and `unlinkat` with `AT_REMOVEDIR`; no general copy, recursive traversal, or npm library is needed.

2. **Darwin supplies those syscalls in stock libc (direct).** Local macOS 15.6 manuals state that relative `openat`, `mkdirat`, `linkat`, `renameat`, and `unlinkat` resolve from a supplied directory descriptor; the manuals date the core `*at` additions to OS X 10.10. `linkat` atomically creates the new hard-link entry and returns `EEXIST` when it already exists. Current-host FFI probes successfully performed `mkdirat`, descriptor-relative `openat`, exclusive temporary creation/write, `linkat(..., AT_SYMLINK_FOLLOW)`, `unlinkat`, and plain `renameat` on APFS. This is the native equivalent of the present Linux alias mechanism, without `/dev/fd` traversal.

3. **Stable Node filesystem APIs still do not expose dirfd-relative names (direct).** The Node v24.19 and v26.6 `fs` API inventories expose pathname `open`, `mkdir`, `link`, `rename`, and `unlink`, plus descriptor `fstat`/I/O, but no public `openat`/`mkdirat`/`linkat`/`renameat`/`unlinkat` overload. This matches the current implementation's need to synthesize pathname descendants (`bootstrap:90-103,139-153`). Private bindings would be version-unstable and are not a secure portable contract.

4. **Node FFI is real but unsuitable as the baseline (direct plus inference).** Node documents `node:ffi` as added in v26.1.0, experimental, unsafe, build-dependent, gated by `--experimental-ffi`, and additionally permission-gated by `--allow-ffi`. On the current Node v26.4.0, ordinary import failed `ERR_UNKNOWN_BUILTIN_MODULE`, while a process started with `--experimental-ffi` successfully called the Darwin primitives. **Inference:** self-respawning with an experimental flag could be a zero-artifact prototype, but it would silently raise the portable Node floor from the prior built-ins-only assumption (`portability root-planner-003:27,44,197`), exclude builds without FFI, enlarge crash/corruption risk inside the bootstrap process, and bind the contract to an experimental API. It is not the best secure release implementation.

5. **Runtime compilation cannot mean “stock macOS” (direct plus inference).** This host has optional Command Line Tools (`xcode-select -p` -> `/Library/Developer/CommandLineTools`; Apple clang 17). The `xcode-select(1)` manual says `--install` opens a UI to request installation and that compiler shims are controlled by an active developer directory. **Inference:** a checked-in C source compiled at bootstrap time is dependency-free in npm terms but adds an optional developer-tool prerequisite, PATH/toolchain trust, latency, prompts, and new failure modes. Compilation can fail closed before target publication, but cannot satisfy unattended stock-macOS availability. It is useful for release builds and developer verification, not as the only runtime path.

6. **A standalone prebuilt helper is safer than a Node addon (inference grounded in docs).** Node-API provides ABI stability but still requires architecture-specific native artifacts and addon loading; Node permission mode can deny addons, and malformed native code executes in-process. A standalone libc-only command has no Node ABI dependency, can be launched directly with `spawn`/`execFile` (which Node documents as no-shell by default), and isolates parser/syscall faults to a child. A universal Mach-O can cover `arm64` and `x86_64`; this host's stock `/usr/bin/true` is itself universal, demonstrating the deployment form. Two thin binaries add selection/hash complexity without security benefit.

7. **Subprocess `cwd` is not a substitute (direct plus inference).** Node documents `cwd` as a pathname/URL, not a directory descriptor. The prior host probe showed `chdir('/dev/fd/<fd>')` fails `ENOTDIR` (`descriptor-alias researcher:27-29,45`). **Inference:** spawning stock `cp`, `ln`, or shell utilities with `cwd: targetPath` reopens mutable pathnames during process setup and those tools do not provide the required retained-parent identity protocol. It loses the guarantee rather than implementing dirfd-relative operations.

8. **Do not require newer Darwin “beneath” flags for correctness (direct).** SDK headers expose `O_NOFOLLOW_ANY`, `O_RESOLVE_BENEATH`, `AT_SYMLINK_NOFOLLOW_ANY`, `AT_RESOLVE_BENEATH`, `RENAME_NOFOLLOW_ANY`, and `RENAME_RESOLVE_BENEATH`. On this APFS/macOS 15.6 host, `openat` accepted both open flags and `renameatx_np` accepted `RENAME_NOFOLLOW_ANY`, but `linkat` rejected the `AT_*_ANY/BENEATH` combinations with `EINVAL`, and `renameatx_np`/`unlinkat` rejected their `*_RESOLVE_BENEATH` variants with `EINVAL`. Core basename operations against already pinned parent fds succeeded. Therefore advanced flags may be defense-in-depth when a helper self-probe proves them, but the portable Darwin path must use component-at-a-time `openat(..., O_DIRECTORY|O_NOFOLLOW)` and basename-only mutation against pinned fds, matching the current mechanism.

9. **The distribution boundary requires native assets to be first-class inventory (direct).** Portable installation copies only `managedFiles` (`portable.manifest.json:13-56`; `AGENTS.md:5`), and the manifest already includes bootstrap/test/validator assets (`portable.manifest.json:49-52`). The source manifest and source validator require exact `.opencode` inventory (`harness.manifest.json:58-67`; `validate-harness.mjs:38-85,229-279`). The installed validator independently hard-codes the portable inventory and currently reads every managed file as UTF-8 during forbidden-reference scanning (`validate-portable-harness.mjs:17-54,106-130,220-243`). A binary and auditable C source must therefore be listed in both manifests; both validators must classify the binary rather than text-scan it.

10. **All helper activation must happen before destination publication (direct plus inference).** Today planning/collision checks complete at `bootstrap:271-308`; non-dry-run capability selection occurs at `:316-326`; parent probes precede publication (`:326-330`); forced capability failure leaves the target empty (`portable-harness.test.mjs:164-169`). **Inference:** verify helper bytes/hash, materialize and execute a protocol self-test, and validate platform/architecture/protocol after operation planning but before any destination directory/probe. Then the real helper must open the canonical target itself with no-follow semantics, compare expected `dev/ino`, prepare and probe every parent, and only then accept/enter publication. Any missing, malformed, incompatible, non-executable, killed, or nonzero helper state before that phase must close/clean probes and created directories and fail with no managed or memory file published.

### Decisive Recommendation

**Ship one checked-in, release-built universal (`arm64` + `x86_64`) standalone C helper plus its checked-in source, and invoke a verified private temporary copy through a versioned one-shot binary protocol. Do not runtime-compile in the bootstrap, do not use a Node addon, and do not make experimental Node FFI the release path.**

Recommended prospective paths (names are design recommendations, not edits):

- `.opencode/bootstrap/native/darwin-portable-fs.c` — auditable libc-only source, portable-managed.
- `.opencode/bootstrap/native/darwin-portable-fs.universal` — universal Mach-O treated as immutable data, portable-managed.
- `.opencode/scripts/build-darwin-portable-fs.mjs` — source/release-only reproducible build and slice/protocol/hash check; Node built-ins plus `xcrun clang`, no npm.

Treating the checked-in Mach-O as data is preferable to executing it in place: bootstrap reads it, verifies SHA-256 from the closed manifest capability record, creates a private `mkdtemp` directory, writes the exact bytes with exclusive mode `0700`, rehashes, executes that absolute path without a shell, and recursively removes the private directory in `finally`. This avoids relying on archive executable-mode preservation and avoids carrying source-tree quarantine xattrs onto the materialized copy. Release signing/notarization policy remains a distribution decision; hash verification proves bundle consistency, not publisher authenticity.

### Exact Helper Contract and Timing

**Protocol (recommended inference):** one request over stdin, one bounded response over stdout/stderr, no shell and no environment-driven production behavior.

- Request header: fixed magic, protocol version `1`, flags, expected `dev`/`ino` as 64-bit values, target-path byte length, operation count, and total byte length.
- Each operation: one-byte overwrite policy, 32-bit normalized relative POSIX path length, 64-bit content length, UTF-8 path bytes, then raw content bytes. Reject NUL, absolute/empty/dot/dot-dot components, excessive counts/lengths, duplicate paths, malformed/trailing frames, and integer overflow independently in C even though JS already validates them (`bootstrap:16-45`).
- Response: fixed magic/version, status/phase (`activation`, `root-open`, `parent-preflight`, `publication`, `cleanup`), operation index, errno, and bounded diagnostic. JS maps indexes back to safe relative paths; the helper never emits unchecked request bytes as a format string.
- Root acquisition: helper opens the canonical absolute target with `O_RDONLY|O_DIRECTORY|O_NOFOLLOW_ANY` when available (fallback `O_NOFOLLOW` only after component-safe canonical-path handling), `fstat`s it, and compares the request identity before target side effects.
- Parent phase: traverse every unique parent one component at a time using `openat(parentFd, component, O_RDONLY|O_DIRECTORY|O_NOFOLLOW)`; on `ENOENT`, `mkdirat` then reopen; retain all parent fds and created-directory records. Re-resolve from root and compare `dev/ino` around each probe, preserving the current identity checks.
- Capability phase: in every retained actual parent, create an exclusive random basename with `openat(O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW,0600)`, write/close, `linkat(parent,tmp,parent,linked,AT_SYMLINK_FOLLOW)` (required by some Darwin filesystems per `linkat(2)`), then `unlinkat` both. Complete and clean all probes before publishing operation 0.
- Publication: create sibling temp with `openat(... O_CREAT|O_EXCL|O_NOFOLLOW,0644)`, fully write with EINTR/short-write handling and close; default publication uses `linkat` to the destination basename (atomic `EEXIST` no-clobber) then unlinks temp; explicit managed overwrite uses same-parent `renameat`/supported `renameatx_np`; always attempt temp cleanup. All mutable names are single basenames relative to a retained parent fd.
- Normal failure cleanup: close all fds, unlink known helper-created probe/temp names, and remove helper-created directories deepest-first with `unlinkat(...,AT_REMOVEDIR)` while tolerating absent/nonempty states. Parent JS always terminates/waits for the child and removes the private helper directory. SIGKILL/power loss can leave random hidden temps or empty dirs; neither current code nor a helper can guarantee cleanup under SIGKILL, so add detection/cleanup policy rather than claim otherwise.

**Order:** parse/validate/plan and detect collisions -> verify manifest-declared helper hash -> materialize private executable -> `--self-test` handshake (protocol, Darwin, native slice, required symbols/basic scratch operations) -> apply root test hook if any -> send real request -> helper opens and identity-checks root -> create/pin all parents -> probe all parents and clean probes -> publish operations -> cleanup/close -> parent removes private helper. Dry-run must not materialize/execute the helper and continues to report safety “not-exercised.”

### Security Properties and Important Limit

- Preserved: fail closed before managed/memory publication on helper activation or any parent capability failure; root identity binding; no symlink-following during component traversal; destination-parent pinning; destination-local hard-link capability checks; atomic no-clobber; explicit-only overwrite; no shell/PATH interpretation; no npm/network dependency.
- Improved: Darwin no longer treats `/dev/fd` as traversable; native failure is isolated from Node; hash/protocol/architecture mismatch is detected before target writes; helper can independently reject malformed paths.
- **Known inherited limit:** current `assertParentStillReachable` is a check before/after an operation (`bootstrap:126-153`), not a kernel-atomic assertion that a pinned directory cannot be renamed outside the root between check and publication. A native helper reproducing only that sequence preserves current tested behavior but should not be described as proving absolute containment against an adversarial concurrent directory rename. Darwin “resolve beneath” flags were not uniformly usable in probes. Reviewer/planner must either retain the current accurately scoped guarantee or commission a separate adversarial proof/design; this research did not establish a stronger atomic primitive.

### Concrete Option Evaluation

| Option | Stock availability | Security/distribution result |
|---|---|---|
| Existing Node `fs` | Yes | No public dirfd-relative names; cannot implement option 2. |
| Node v26 experimental FFI | Only v26.1+ compatible builds and explicit flag | Minimal artifacts and probe works, but experimental/unsafe/version-raising; prototype only. |
| Runtime-compiled standalone C | Only when optional CLT/Xcode is installed | Secure if compiled/materialized before target writes, but not stock/unattended. Use for release build/test, not runtime baseline. |
| Runtime-compiled Node-API addon | Requires compiler, Node headers/tooling, addon permission | Most complex runtime path; unnecessary in-process risk. Reject. |
| Prebuilt Node-API addon | No compiler, ABI-stable Node-API | Still per-architecture/loading complexity and in-process crash surface. Inferior to command helper. |
| Checked-in source interpreted by stock Python/Perl/Ruby | Interpreter availability/version is not a reliable current macOS contract; language APIs still may lack `*at` | Adds fragile runtime assumptions; reject. |
| Prebuilt thin binaries | Yes for matched architecture | Works but doubles selection/hash/signing cases. Prefer one universal binary. |
| Universal standalone helper + source | Yes on Intel/Apple Silicon macOS | Best balance: no npm/compiler/Node ABI, isolated, auditable, exact native primitives. |
| Subprocess `cwd`/stock utilities | Yes | Pathname cwd and utility semantics do not preserve descriptor/identity/no-clobber contract. Reject. |

### Files and Contracts Requiring Updates

- `.opencode/scripts/bootstrap-portable-harness.mjs:3-10,23-45,90-235,271-340`: platform backend selection; helper hash/materialization/protocol; Darwin operation batching; common planning; Linux alias backend retained; helper cleanup and diagnostics; avoid global mutable `descriptorAlias` for Darwin.
- `.opencode/portable.manifest.json:4-12,13-56`: replace the false `/dev/fd` assertion with explicit Linux alias and Darwin native-helper capability records; add C/binary managed paths and SHA-256/protocol/architecture declaration; bump schema version because the closed shape changes.
- `.opencode/scripts/validate-portable-harness.mjs:17-66,106-130,220-243`: exact new inventory/capability contract; binary hash/Mach-O metadata expectations; skip UTF-8/forbidden-token text scanning only for the exact declared binary while continuing to scan C source; no runtime helper execution as static acceptance proof.
- `.opencode/scripts/portable-harness.test.mjs:49-186`: update 43-file counts; assert Darwin native safety label; helper missing/hash/protocol/architecture/self-test failure leaves no published file; compile source and compare/probe helper where CLT is available; retain all parent-probe, no-clobber, overwrite, symlink/root/parent replacement, cleanup, installed-rerun, and Linux alias regressions. Test helper normal cleanup and killed-helper residue behavior separately.
- `.opencode/harness.manifest.json:58-67` and `.opencode/scripts/validate-harness.mjs:38-85,229-279`: inventory/classify C source, binary, and source-only build script; enforce exact binary hash and universal slices in source QA; ensure source QA invokes portable validation but does not confuse it with macOS activation.
- User/release guidance (`AGENTS.md:3-7` and `opencode-harness.design.md:5` are source-only boundary authorities): document macOS helper provenance/rebuild command, supported architectures/minimum OS, no runtime compiler/npm, and release signing/notarization policy without making installed portable runtime depend on source-only docs.

### Test/Review Requirements (implementation implications, not acceptance)

- Build/source parity: compile both slices, combine universal, inspect `arm64` and `x86_64`, verify libc-only linkage/deployment target, protocol self-test, deterministic hash update, and source-vs-committed binary reproducibility policy.
- Real macOS: fresh install, idempotence, overwrite, partial memory, no-clobber race, symlink insertion, root/intermediate/after-open replacement, parent-before-probe replacement, later-parent probe failure, helper corruption/incompatibility, ordinary and private-temp cleanup.
- Linux regression: `/proc/self/fd` backend still passes the full suite and does not require/copy-execute Darwin code.
- Installed boundary: installed bootstrap can rerun using its managed helper data; installed validator handles binary safely; destination remains only `.opencode` and seeded `.memory`; no source-only build script is required.
- Independent reviewer: C parser bounds, errno/short-write/EINTR handling, fd lifetime, basename generation, signal cleanup, link flags across APFS/HFS+/network filesystems, universal binary provenance, and the inherited parent-move window.

### Risks and Unresolved Uncertainty

- Gatekeeper/quarantine/notarization behavior was not tested with an actually downloaded/quarantined release. Private byte materialization should remove source xattrs but is an inference; release policy needs real downloaded-artifact testing.
- Only macOS 15.6/APFS/arm64 and Node v26.4 were probed. The x86_64 slice, Rosetta, older supported macOS, HFS+/network volumes, and Developer-ID signing were not executed.
- No C helper was implemented or acceptance-validated. FFI proved syscall availability/semantics, not the proposed parser or full race suite.
- Basic `*at` calls date to OS X 10.10, but the final minimum macOS should follow the supported Node release floor and actual universal build/link tests rather than claim 10.10.
- A checked-in binary adds supply-chain/provenance obligations. Hashes detect inconsistency inside the bundle but do not authenticate an untrusted bundle; signed release checks are separate.
- Whole-install transactionality remains out of scope: after publication starts, disk-full/process failure can leave a partial install, as it can today. The manifest promise is capability failure before first managed/memory publication, not rollback of every runtime failure.

### Source List

- Repository: `.opencode/scripts/bootstrap-portable-harness.mjs:16-45,90-235,271-340`; `.opencode/portable.manifest.json:4-56`; `.opencode/scripts/portable-harness.test.mjs:49-186`; `.opencode/scripts/validate-portable-harness.mjs:17-66,106-130,220-243`; `.opencode/harness.manifest.json:58-67`; `.opencode/scripts/validate-harness.mjs:38-85,229-279`; `AGENTS.md:3-7`.
- Prior evidence: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/{researcher/root-researcher-001-descriptor-alias.md,planner/root-planner-002-remedy-options.md,validator/root-validator-003-diagnosis.md}`; portability `root-reviewer-016-final-review.md:38-59`, `portable-implementer-017-remediation-loop3.md:20-35`, and `root-reviewer-018-acceptance-review.md:45-61`.
- Local Apple manuals, macOS 15.6 SDK headers, and command probes listed under Work Performed (retrieved/executed 2026-08-04).
- Node official documentation (retrieved 2026-08-04): `https://nodejs.org/docs/latest-v24.x/api/fs.html`; `https://nodejs.org/docs/latest-v26.x/api/fs.html`; `https://nodejs.org/docs/latest-v26.x/api/child_process.html`; `https://nodejs.org/docs/latest-v26.x/api/ffi.html`; `https://nodejs.org/api/n-api.html`.

## Handoff

- Next role: `planner`, scoped to convert this recommendation into an ordered file/protocol/build/test contract, followed by security `reviewer` before implementation because native parser and parent-move semantics are high risk.
- Limitations: Research and host probes only; no implementation, integration, full helper prototype, cross-architecture run, downloaded-artifact Gatekeeper test, or acceptance validation. INDEX/delegation packet edits were not permitted by the researcher role.
- Risks: Prebuilt native supply chain, binary validator handling, protocol parser defects, macOS filesystem variation, helper residue after uncatchable termination, and overclaiming containment beyond the current before/after parent-identity checks.
