# Host-Preparation Revalidation — FAIL

## Findings (blocking first)

1. **BLOCKER — immutable preview/action binding is still incomplete** (`gate-implementation`, `gate-host-safety`). The original direct `OBSERVE_ONLY -> authorize` bypass now fails with `E_STATE`, but a fully ordered session accepted an input point at `(999999,999999)` and arbitrary expected-state IDs even though the preview could contain only an action name and no selector or expected-state binding. The session entered `ACTION_IN_FLIGHT`. `ProtocolSession.markPreviewed` has no representable immutable action-plan details beyond `actions`, and `request("input")` therefore cannot compare the selector or expected states to the approved preview. This contradicts the required immutable capture/preview/action-set/action binding.
2. **BLOCKER — capability mint omits required immutable activation bindings** (`gate-implementation`, `gate-host-safety`). An independently constructed control token minted successfully without capture, preview, action-set, or canary bindings. Attempting to add those complete fields failed with `E_CAPABILITY_BINDING`. The capability is one-use, process-local, consumed before spawn, and closes the former arbitrary capability values, but its canonical schema is still materially incomplete for the supplied acceptance criterion.
3. **BLOCKER — launcher accepts unsolicited semantically invalid output as successful completion** (`gate-implementation`, `gate-host-safety`). A fake child emitted one syntactically valid `close` response for session `bbbb…`, request `never-requested`, sequence `99`, without a hello or parent request, then exited zero. `launchCompanion` resolved `{ok:true}`. Thus output is line/schema bounded but not bound to a protocol session, request sequence, or outstanding operation. This reproduces the launcher lifecycle class after remediation and violates fail-closed unsolicited/malformed/early lifecycle handling.
4. **BLOCKER — evidence quotas remain forgeable under concurrent aliasing** (`gate-host-safety`). `createEvidenceRun` returns an unbranded data object and the lock is keyed by object identity. Concurrent 2-byte writes through the returned run and `structuredClone(run)` both fulfilled under `maxBytes:3`; the retained run contained 4 bytes. Same-object serialization fixed the original reproduction, but a clone bypasses atomic cumulative accounting.
5. **BLOCKER — native capture/input preparation is absent rather than merely unvalidated** (`gate-implementation`, `gate-host-safety`). Static comparison confirms matching version `1.0`, line limit `98304`, named operations/actions, duplicate-tree checks, and terminal `E_OPERATION_UNSUPPORTED`; the old `authorize:{accepted:true}` behavior is closed. However `Capture.cs` and `Input.cs` explicitly return `E_CAPTURE_UNVERIFIED` and `E_INPUT_UNVERIFIED`, and `Protocol.cs` terminally rejects every native operation. The approved planner placed implementation of documented WGC/D3D11/WIC and bounded `SendInput` in the preparation deliverable; its future ladder deferred build/sign/place and host checks, not implementation of those operations. On that contract, this is a gate blocker, while compilation and host behavior remain separate residual risks.
6. **Documentation discrepancy.** `windows-host-preflight.md` says cleanup reports an opaque retained ID, while the remediated implementation and acceptance contract require an exact absolute retained/quarantine path. The implementation now returns the absolute path; the operator documentation is stale.

**Acceptance decision: FAIL.** The sole remediation cycle did not close every original blocker class. Partial preparation is not accepted.

## Gate Matrix

| Gate | Decision | Command-backed evidence |
| --- | --- | --- |
| `gate-implementation` | **FAIL** | 87/87 tests pass, but independent ordered-session, capability, and unsolicited-child probes produced the blocking results above; native operations remain unimplemented. |
| `gate-migration` | **PASS** | Baseline 71/71 and candidate 87/87 pass with no failures/skips. Closed manifest comparison reported `baselineFiles:51`, `candidateFiles:89`, `missing:[]`, and only the five expected baseline integration files changed. |
| `gate-host-safety` | **FAIL** | Unpreviewed selector/state injection, incomplete capability binding, unsolicited launcher success, and cloned-run 4-byte/3-byte quota bypass are direct adversarial failures. |
| `gate-package` | **PASS** | `npm ls --all --json` is root-only. Dry-run pack has exactly 56 reviewed entries, no bundles, tests, binaries, evidence, credentials, build output, or traces. Package is private and has no lifecycle/publication scripts or dependencies. |
| `gate-no-live` | **PASS for this preparation execution** | `verify:no-live` returned `NO_LIVE_OK files=42`; inventory had 89 regular files, zero symlinks/binaries; no Windows executable, BlueStacks, ADB, capture, input, network request, install, service, or host mutation was performed. This does not grant activation authority. |

## Original-Attack Closure Matrix

| Original validator attack | Result |
| --- | --- |
| Direct protocol state bypass / arbitrary prohibited semantic values | **Partially closed.** Direct authorize is `E_STATE`; prohibited action/mutation/negative/zero values reject. A valid but unpreviewed point and arbitrary expected states still dispatch. |
| Handshake-free / incomplete transcript and invalid canary fixture | **Closed in reproduced suite.** Observe/canary fixtures validate; malformed, replay, partial, identity, correlation, and stale fixtures reject. |
| Invalid capability mint / replay | **Partially closed.** Former invalid digest/run/capability/extra-field forms reject and replay is consumed; required capture/preview/action-set/canary bindings are absent from the mint contract. |
| Launcher lifecycle omissions | **Partially closed.** Exact path/argv/no shell, token consumption, timeout/abort, byte/line bounds, child error/nonzero/signal/partial/early exit tests pass. Unsolicited close output is accepted as success. |
| Cumulative evidence overflow | **Not closed.** Same-object race rejects one write; cloned run aliases bypass the object-keyed lock. |
| Cleanup retained-path omission | **Closed in implementation.** The regression returns an exact absolute quarantine path. Documentation still says opaque ID. |
| Duplicate-key acceptance / supplied-path leakage | **Closed in reproduced attacks.** Recursive duplicates and structural bounds reject; all seven preparation command probes emitted no supplied executable/evidence/config/input canary. |
| C# authorization drift | **Authority grant closed, deliverable incomplete.** Unsupported operations are terminal, but capture/input implementation and full operation-body parity are absent. |

## Metadata and Input Contract

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-revalidate-host-preparation-006`
- scopeKey: `preparation-validation`
- role: `validator`
- artifactId: `root-validator-006-host-revalidation`
- createdAt: `2026-08-21`
- taskMode: `integration-check`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Inputs received: Contract-complete fresh packet; changed-file roots; verification criteria and commands; normalized specification; planner, failed validator, and remediation traces; baseline/candidate relationship; schema contracts; skip policy; risk areas; and final acceptance standard.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; candidate: `/home/joshl/projects/nba2k27-myplayer`; baseline: `/tmp/opencode/nba2k27-myplayer`.

## Work Performed and Command Evidence

No candidate implementation file was modified. Only this required validator trace was created. Temporary external roots were owner-only and removed.

### Baseline, syntax, tests, and package

- `node --version && node --check src/nba2k27-myplayer/index.mjs && node --check src/nba2k27-myplayer/cli.mjs && node --test test/nba2k27-myplayer/*.test.mjs` in candidate: exit 0 on Node `v24.14.1`; **87 pass, 0 fail, 0 skipped**.
- The equivalent baseline syntax/full-test command: exit 0; **71 pass, 0 fail, 0 skipped**.
- `npm run test:host && npm run check:host && npm run verify:no-live && npm run verify:pack`: exit 0; **16/16** focused tests, `NO_LIVE_OK files=42`, `PACK_OK entries=56`.
- `npm ls --all --json`: exit 0; only `nba2k27-myplayer@0.0.0`.
- `npm pack --dry-run --json`: exit 0; 56 entries, 66,833 packed bytes, 280,569 unpacked bytes, no bundles. Every path was inspected.
- Baseline `npm ls` and pack: exit 0; root-only and accepted 37-entry inventory.
- Validator no-follow SHA-256 comparison: `baselineFiles=51`, `candidateFiles=89`, `missing=[]`; changed baseline paths are `data-contract.md`, `operator-safety.md`, `package.json`, `cli.mjs`, and `index.mjs`.

### Independent adversarial reproductions

- Ordered protocol probe: `originalDirectAuthorizeRejected:"E_STATE"`, then `unpreviewedPointAndStatesAccepted:true`, state `ACTION_IN_FLIGHT`.
- Capability schema probe: `incompleteBindingMinted:true`; adding `captureSha256`, `previewDigest`, `actionSetDigest`, and `canaryDigest` returned `E_CAPABILITY_BINDING`.
- Fake launcher lifecycle probe: an unsolicited close response without handshake/request resolved `acceptedUnsolicitedClose:true` and `{ok:true,stdoutBytes:198,stderrBytes:0}`. No executable was run.
- Evidence alias-race probe in an isolated mode-0700 root: both writes fulfilled; names `one,two`; `bytes:4`, `configuredMaxBytes:3`, `bypass:true`.
- Closed JSON matrix: top/nested/array-nested duplicates returned `E_DUPLICATE_KEY`; trailing/depth/key-count/array-count/string bounds returned `E_JSON_TRAILING`, `E_DEPTH`, `E_KEYS`, `E_ARRAY_ITEMS`, and `E_STRING_BYTES`.
- Preparation CLI canary matrix over config validation, status, cleanup, malformed transcript, and all three fake commands: no stdout/stderr contained the supplied `PRIVATE_PATH_CANARY_7f91`; invalid transcript/fake inputs exited 2 with stable codes.
- Export probe: root and CLI launcher/mint values were `undefined`; package deep import returned `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- C#/Node source comparison: version/line/operation/action constants match and terminal unsupported is present; capture/input are explicitly unsupported; authorize capability items, input selector, and mutation class are not fully validated by the C# body parser.
- Recursive inventory/security scan: 89 files, zero links, zero binary/NUL files. Apparent credential hits were variable names only. Runtime source has no network/listener/ADB/PowerShell/service import; launcher/mint references occur only in their internal host files.
- `ss -lntup` was captured as a sentinel snapshot. Existing ambient local listeners were present before any live activity claim and were not attributed to this package; no package command opened a listener.

## Schema and Coherence Results

- Role packet and trace path satisfy the validator contract; routing metadata is correctly absent.
- Config/schema and CLI closed-JSON parsing reject unknowns, recursive duplicates, malformed/trailing/excessive forms, and package-contained evidence roots independent of cwd.
- Protocol record schemas close primitive values and operation names, but the parent-side preview schema is too weak to bind the actual selector and expected state transition.
- Capability canonicalization is closed but canonicalizes an incomplete authority set.
- Launcher framing validation is not integrated with `ProtocolSession`; syntactically valid unsolicited records can constitute successful completion.
- Vault accounting is cumulative only among calls sharing the exact returned object identity.
- C# source is a terminal unsupported declaration, not the operation implementation specified by the approved preparation plan.
- Package exports/bin/scripts and pack inventory are coherent with offline preparation and expose neither mint nor launcher.

## Security and Activation Findings

- **No-live:** no host/native/live/network operation occurred. Tests used injected fake EventEmitters and synthetic non-executable bytes only.
- **Activation blockers:** preview/action authority, complete capability bindings, launcher session lifecycle, evidence quota atomicity, and native operation implementation must not be treated as activation-ready.
- **Privacy:** reproduced host CLI output/error paths are redacted and closed; no supplied canary leaked.
- **Filesystem:** ordinary owner/mode/symlink/hard-link/replacement and absolute cleanup-path regressions pass, but cloneable run handles defeat concurrent quota serialization.
- **Package:** private, dependency-free, no lifecycle/publication hooks, no credential or generated/live artifact packed.

## Skipped / Prohibited Checks and Residual Risk

- `dotnet --list-sdks` returned `command not found`; no offline C# compile was available and no download was attempted.
- Windows build/sign/place, real launcher invocation, WSL termination/orphan behavior, process/window discovery, BlueStacks/NBA 2K27 calibration, capture, input, account/credential access, ADB, network, service, PowerShell, install, and global configuration were prohibited and not performed.
- Cross-UID mutation was unavailable without privilege. Current-user symlink/mode/replacement/race probes were performed.
- Even after software remediation, Windows API/build correctness, WSL path and termination behavior, DPI/WGC/foreground/UIPI behavior, and BlueStacks compatibility require separately approved staged host validation.

## Remediation List

The normalized budget permits no further remediation cycle for this scoped work unit. For any explicitly approved new scope:

1. Bind the exact selector/key primitive, expected pre/post state, mutation class, source capture, target/profile, preview, action set, run/session, canary stage, approval, and shared budgets into one immutable preview/authorization contract and compare it before charging/dispatch.
2. Extend capability mint/consume canonical bindings to the complete activation authority set while preserving process branding, expiry, one use, and pre-spawn consumption.
3. Integrate launcher output with a concrete protocol session/outstanding-request lifecycle; reject handshake-free, unsolicited, wrong-session/sequence/request/operation, and incomplete terminal output.
4. Brand evidence run handles process-locally or lock/account by verified filesystem identity, and recheck cumulative quota atomically so cloned/forged aliases cannot race.
5. Implement the planner-required native capture/input boundary before claiming preparation completion, while retaining terminal unsupported behavior until separately built and validated.
6. Update cleanup documentation to state exact absolute retained original/quarantine path reporting.

## Output Contract and Handoff

- Outputs: Findings-first final integration decision, original-attack closure matrix, per-gate decisions, command outputs, schema/coherence results, security/activation findings, remediation list, prohibited checks, and staged residual risks.
- Evidence: Independent commands and direct source inspection above; lifecycle/progress artifacts were treated only as context, not acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/validator/root-validator-006-host-revalidation.md`
- Next role: Parent orchestration for failed final synthesis; the sole remediation cycle is exhausted.
- Limitations: Linux/offline/fake/static validation only. No native build or live host claim is supported.
- Risks: Incomplete authority binding, unsolicited launcher acceptance, quota race, absent native implementation, and all deferred host compatibility risks.
