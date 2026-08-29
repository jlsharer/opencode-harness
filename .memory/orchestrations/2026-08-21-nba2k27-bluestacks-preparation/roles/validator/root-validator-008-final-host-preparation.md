# Final Host-Preparation Integration Check — FAIL

## Findings (blocking first)

1. **BLOCKER — launcher hello identity is not pinned or capability-bound** (`gate-implementation`, `gate-host-safety`). An independent fake-child attack returned the configured image SHA-256 but deliberately wrong `buildId`, final-image-path digest, signer digest, integrity, Windows build, DPI mode, PID, and creation time. `launchCompanion` accepted the hello, sent close, and resolved `{ok:true}`. The launcher calls `ProtocolSession.acceptHello` without `expectedIdentity`, so only the image hash is compared. This directly violates the research/planner requirement to compare every pinned startup identity and the final criterion for complete capability binding and strict hello correlation.
2. **BLOCKER — the Node preview still is not derived from an actual immutable preview or recognized states** (`gate-implementation`, `gate-host-safety`). `markPreviewed` accepts exactly `{semanticAction}`; it hard-codes Escape for `navigateBack`, constructs `expectedPreState` from the first 16 characters of the capture hash, and constructs `expectedPostState` from a hash. It receives no highlighted selector, recognition evidence/cues, or expected-state observations. Mutation attacks against the resulting object now reject, but the accepted selector/states are synthesized rather than preview-derived. Thus the exact prior selector/state authority class is narrowed, not closed to the supplied acceptance standard.
3. **BLOCKER — dormant native capture is not a usable protocol capture and asserts freshness/provenance it does not establish** (`gate-implementation`, `gate-host-safety`). `Capture.Read` obtains BGRA bytes, but `Protocol.cs` returns no bytes, chunks, dimensions, byte count, pixel format, capture timestamps, or content rectangle. It merely echoes the caller's barrier and unconditionally returns `fresh=true`. There is no `captureChunk`, base64, or `capture.Bytes` transport. The synchronous BitBlt path has no frame timestamp/freshness barrier and cannot provide the screenshot required by the adapter/evidence contract.
4. **BLOCKER — dormant native input is not bound to preview/approval/action-set/canary authority** (`gate-implementation`, `gate-host-safety`). Native `authorize` stores only `planDigest`, action/query counts, and expiry. It validates but does not retain/compare `approvalDigest`, `previewDigest`, `actionSetDigest`, target/profile/geometry, or an exact approved selector/state transition. Native `input` therefore accepts any schema-valid semantic action, point/key selector, expected states, and mutation class sharing the stored plan/capture values. `Input.Dispatch` maps such points and calls `SendInput`; this is actual authority, not a terminal unsupported declaration. It also permits the normalized endpoint `1,000,000`, which maps to the exclusive right/bottom client boundary rather than an in-client pixel. The implementation does not perform a post-`SendInput` identity/focus/geometry check or a fresh two-cue canary observation.
5. **BLOCKER — native discovery/identity and cancellation remain materially below the selected boundary** (`gate-implementation`, `gate-host-safety`). `Identity.Discover` ambiently enumerates up to 32 visible top-level windows and hashes each accessible process image without an exact configured process/window constraint. Target identity omits final image path, signer, DWM cloak/frame state, and explicit monitor/DPI values from the bound record. `Program` handles requests synchronously, so it cannot read a `cancel` while capture/input is blocked; `cancel` has no successful handling branch. These contradict exact identity revalidation, no ambient discovery, and bounded deadline/cancellation requirements.
6. **BLOCKER — Windows parity tests are token-presence checks, explicitly disallowed by the final gate** (`gate-implementation`, `gate-host-safety`). Independent inspection found the two Windows tests perform 11 `assert.match` and one `assert.doesNotMatch` checks over concatenated source text; they do not compile, parse, execute, or semantically model C#. Consequently all 90 tests pass while findings 3–5 remain. No offline compiler was installed, so compilation was honestly skipped, but the required meaningful static parity checks were not supplied. The project also sets `AllowUnsafeBlocks=false` while using many source-generated `LibraryImport` declarations, an unresolved compile-contract risk.
7. **BLOCKER — operator protocol documentation is stale and contradicts the shipped source** (`gate-implementation`). `host-companion-protocol.md` still says the Windows source “fails capture and input closed.” The remediated source now invokes BitBlt and `SendInput`. This is a security-significant activation description, not a cosmetic discrepancy.

**Acceptance decision: FAIL.** Migration, packaging, and no-live execution pass, but required implementation and host-safety gates fail. Offline preparation is not accepted as complete, and no live activation authority or BlueStacks compatibility is established.

## Exact Prior-Attack Closure Matrix

| Prior attack/finding | Final result |
| --- | --- |
| Direct `OBSERVE_ONLY -> authorize`, arbitrary semantic values, handshake-free/incomplete transcript, invalid canary fixture | **Closed in reproduced tests.** Direct predecessor violations reject; valid fixtures pass; malformed/replay/partial/stale/correlation fixtures reject. |
| Preview selector/expected-state injection | **Partially closed.** Caller mutation rejects, but the API accepts no actual preview selector/cues/states and synthesizes them from action/capture hashes. Finding 2 blocks. |
| Invalid/incomplete capability fields and replay | **Closed for the represented field matrix.** Every control field deletion rejects; tokens are opaque, one-use, and consumed pre-spawn. Hello identity is not bound/checked, so the broader complete-binding gate remains failed by finding 1. |
| Unsolicited/early/duplicate/extra/partial/malformed/timeout/abort/error/nonzero/signal launcher output | **Closed for tested transcript forms.** The focused fake suite rejects these forms. A semantically wrong but structurally valid hello identity is accepted, so strict hello lifecycle is not closed. |
| Cumulative quota race through cloned/forged/stale evidence handles | **Closed in independent reproduction.** Results were `fulfilled`, `E_VAULT_HANDLE`, `E_VAULT_HANDLE`; stale replacement returned `E_VAULT_IDENTITY`. |
| Cleanup failure returned only opaque ID | **Closed.** Regression requires an exact absolute original/quarantine path. |
| Duplicate JSON, unknown fake fields, path-canary leakage | **Closed in reproduced CLI/tests.** Stable redacted errors and no canary output. |
| Unconditional unsupported C# capture/input | **Replaced, but not closed acceptably.** Source now invokes native operations, yet capture is not transported/freshness-proven and input authority is not preview/approval-bound. |
| Cleanup documentation discrepancy | **Closed.** Preflight now documents exact absolute retained paths. |

## Full Gate Matrix

| Gate | Decision | Evidence |
| --- | --- | --- |
| `gate-research` | **PASS** | Research selects one exact-path, inherited-stdio, nonresident companion and clearly records unresolved host assumptions with Microsoft/BlueStacks citations. |
| `gate-plan` | **PASS** | Planner supplies exact protocol, security, retention, native, package, test, rollback, and staged-activation contracts. Implementation divergence does not retroactively fail the plan. |
| `gate-implementation` | **FAIL** | 90/90 tests pass, but findings 1–7 contradict required changed behavior and native preparation. |
| `gate-migration` | **PASS** | Baseline 71/71 and candidate 90/90 pass. Manifest: baseline 51 files, candidate 89, no missing baseline files, only five intended baseline integration files changed, no symlinks/NUL binaries. |
| `gate-host-safety` | **FAIL** | Wrong hello identity is accepted; preview states are synthesized; native capture/input/discovery/cancel contracts are unsafe/incomplete; static tests are superficial. |
| `gate-package` | **PASS** | Private, dependency-free, no lifecycle/publication hooks; root-only `npm ls`; exactly 56 reviewed source/doc/package entries and no tests, config, evidence, binary, build output, credential, or trace. |
| `gate-no-live` | **PASS for this execution only** | No Windows/native process, host probe/change, BlueStacks/app/account operation, capture/input, ADB, network, service, install, publication, Git, or global config mutation occurred. Public root/CLI/deep-package routes cannot reach launcher/mint. |

## Metadata and Input Contract

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-final-validate-host-preparation-008`
- scopeKey: `preparation-validation`
- role: `validator`
- artifactId: `root-validator-008-final-host-preparation`
- createdAt: `2026-08-22`
- taskMode: `integration-check`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Inputs received: Contract-complete fresh packet; candidate/baseline relationship; normalized specification; research, planner, two prior validator, and final implementer traces; changed root; commands, risk areas, schema contracts, skip policy, and exhausted-budget acceptance standard.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; candidate: `/home/joshl/projects/nba2k27-myplayer`; baseline: `/tmp/opencode/nba2k27-myplayer`.

## Work Performed and Command Evidence

No candidate implementation file was modified. Only this required validator trace was created. Temporary owner-only fake/evidence roots were removed.

### Tests, syntax, baseline, and package

- Candidate syntax plus `node --test test/nba2k27-myplayer/*.test.mjs` on Node `v24.14.1`: exit 0; **90 pass, 0 fail, 0 skipped/todo**.
- `npm run test:host && npm run check:host && npm run verify:no-live && npm run verify:pack`: exit 0; **19/19** focused tests; `NO_LIVE_OK files=42`; `PACK_OK entries=56`.
- Baseline syntax/full tests: exit 0; **71 pass, 0 fail, 0 skipped**. Baseline package inventory remains 37 entries.
- Validator no-follow SHA-256 manifest: `baselineFiles=51`, `candidateFiles=89`, `missing=[]`, `symlinks=[]`, `nulFiles=[]`; changed baseline paths are `data-contract.md`, `operator-safety.md`, `package.json`, `cli.mjs`, and `index.mjs`.
- `npm ls --all --json`: exit 0; only `nba2k27-myplayer@0.0.0`.
- `npm pack --dry-run --json`: exit 0; exactly 56 entries, 71,225 packed bytes, 301,626 unpacked bytes, no bundles. Every packed path was inspected.

### Independent adversarial evidence

- **Wrong-identity launcher attack (fake spawn only):** configured build ID `synthetic-test-only`; fake returned `ATTACK-WRONG-BUILD`, final path digest `ff…`, signer `ee…`, integrity `untrusted`, wrong Windows/DPI/PID/creation values, but matching image hash. Result: `accepted:{ok:true,stdoutBytes:772,stderrBytes:0}`.
- **Evidence handle attack:** concurrent genuine/clone/forged writes returned `fulfilled`, `E_VAULT_HANDLE`, `E_VAULT_HANDLE`; stale same-path replacement returned `E_VAULT_IDENTITY`.
- **Public reachability:** root launcher/mint and CLI launcher were `undefined`; package deep import returned `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- **CLI matrix:** valid config/observe transcript and fake preflight exited 0; malformed transcript exited 2 with `E_DUPLICATE_KEY`; `live`, `capture`, and `adb` exited 2 with `E_COMMAND`; executable-path flag exited 2 with `E_FLAG`; no supplied path canary appeared.
- **Native semantic extraction:** authorize block stores only plan/budgets/expiry; input compares only plan/capture/sequence/deadline before `SendInput`; protocol capture transport has no chunks/base64/frame bytes/dimensions/timestamps/pixel format/byte count and sets `fresh=true` while echoing the barrier.
- **Static-test quality:** 11 regex-presence and one regex-absence assertion; no compiler, parser, semantic model, or native execution.
- **Authority scan:** runtime Node has no network/listener/ADB/PowerShell/service authority. Native source has no listener/network/ADB/service/PowerShell/clipboard/child process, but does contain ambient `EnumWindows` discovery and `SendInput` authority.

## Schema, Protocol, and Coherence Results

- Closed JSON/config parsing, duplicate/unknown/size/depth rejection, package-contained vault-root rejection, transcript structural bounds, and public export boundaries pass.
- Node protocol constants and C# strings agree superficially on version, line limit, operation names, and selector vocabulary.
- Node launcher does not compare config/capability pins to all hello identity fields.
- Node preview closure is canonical after construction, but construction has no actual preview/recognizer input.
- Native wire result cannot convey captured pixels and cannot prove freshness. Native authorization does not preserve the immutable authority represented by Node's preview/capability fields.
- C# source contract tests prove only token presence/absence and therefore do not establish semantic parity.
- Documentation incorrectly describes the now-active dormant native capture/input paths as terminally unsupported.

## Security and Activation Findings

- **No-live result:** only Node, npm, fake EventEmitter children, synthetic non-executable bytes, and owner-only Linux temporary roots were used. No host/native action occurred.
- **Activation blockers:** hello identity pinning, true preview/state derivation, capture transport/provenance/freshness, native approval/action binding, exact target identity/discovery, cancelability, and meaningful native verification all remain blocking.
- **Evidence security:** cloned/forged/stale handles and tested count/byte serialization now fail closed; cleanup discloses only the required exact retained path. Same-UID recursive-cleanup replacement remains a residual filesystem race requiring future review.
- **Privacy/package:** tested CLI errors are stable and redacted; no sensitive/generated artifact is packed.
- **Public authority:** launcher/capability mint remain unexported and unreachable through package/CLI defaults. Direct source imports remain possible to code already inside the package trust boundary, but no default path imports them.

## Skipped and Prohibited Checks

- `dotnet --list-sdks` precheck: `DOTNET_UNAVAILABLE`; `csc` precheck: `CSC_UNAVAILABLE`. No compiler download or native build was attempted. This is the only permitted offline skip; C# build/ABI correctness remains unverified.
- Prohibited and not performed: Windows build/sign/place, real launcher, WSL termination/orphan check, host inventory/discovery, BlueStacks/NBA 2K27 calibration, capture, input, accounts/credentials, network, ADB, PowerShell, service/listener, install, Git/publication, or global configuration.

## Residual Risk and Staged Next Actions

Offline/fake success cannot establish Windows API behavior, BlueStacks HWND/render topology, WGC/GDI suitability, DPI/client mapping, UIPI/focus behavior, termination propagation, signer/ACL correctness, or application compatibility. If a new explicitly approved scope is opened, retain the staged order: (1) repair and independently validate source contracts; (2) authorized exact-toolchain build/sign/place without launch; (3) read-only exact-identity hello/discovery preflight; (4) operator-selected calibration; (5) capture-only freshness/provenance canary; (6) one preview-bound reversible input canary followed by mandatory stop. Each stage requires fresh approval and cannot infer the next.

## Remediation List

The eight-leaf orchestration budget is exhausted; this list is for a newly authorized scope only.

1. Bind and compare every configured/capability startup identity field in launcher hello, including build, final path, signer policy, integrity/DPI expectations, and invocation/session identity.
2. Require a real immutable preview artifact with recognized pre/post cues and exact selector/key derivation; do not synthesize state IDs solely from hashes/action names.
3. Define and implement actual bounded capture payload transport with dimensions, byte count/hash, pixel format/content rectangle, pre/post identity, monotonic/frame timestamps, and a proved post-barrier freshness condition.
4. Make native authorization retain and compare the complete target/profile/geometry/capture/preview/action-set/plan/approval/canary/budget binding before charging and dispatching one exact input; enforce in-client coordinates and post-dispatch checks.
5. Replace ambient discovery with the approved bounded exact-selection flow and complete process/window identity fields; implement workable deadlines/cancellation or fail the operation closed.
6. Replace token-string Windows tests with semantic source analysis/parity fixtures and an offline build when an installed compiler exists; resolve the `LibraryImport`/unsafe build contract.
7. Correct protocol/operator documentation to describe the shipped dormant implementation and its unverified status accurately.

## Output Contract and Handoff

- Outputs: Findings-first final integration decision, exact prior-attack closure matrix, seven-gate matrix, command outputs, schema/native/package/security evidence, skip disclosure, remediation, residual risk, and staged activation boundary.
- Evidence: Independent command runs and direct semantic source inspection above; lifecycle/progress artifacts were context only and not acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/validator/root-validator-008-final-host-preparation.md`
- Next role: Parent orchestration for final failed synthesis. No remediation/delegation is permitted within the exhausted budget.
- Limitations: Linux/offline/fake/static validation only; no compiler or live host authority was available or authorized.
- Risks: Incorrect hello identity acceptance, synthetic preview states, unusable/unproven native capture, under-bound native input, ambient/incomplete identity discovery, nonfunctional cancellation, superficial C# tests, stale security documentation, and all deferred host compatibility risks.
