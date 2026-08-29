# Host-Preparation Integration Check — FAIL

## Findings (blocking first)

1. **BLOCKER — protocol/state/semantic validation is not fail closed** (`gate-implementation`, `gate-host-safety`). An independent Node probe advanced a fresh `ProtocolSession` directly from `OBSERVE_ONLY` through `authorize` to `ACTION_IN_FLIGHT`, without target binding, capture, preview, canary, valid approval digest, valid plan digest, bounded action, valid selector, or budget enforcement. The accepted input contained `semanticAction:"arbitrary"`, `mutationClass:"purchase"`, negative coordinates, and zero source sequence. A second probe showed `validateTranscript` accepts a lone, type-invalid `helloResult` with no client hello, and accepts an incomplete capture request at EOF. The purported `valid-canary.jsonl` fixture is itself rejected with `E_BODY_SHAPE`. These are direct contradictions of the closed protocol, order, approval, canary, and budget criteria.
2. **BLOCKER — capability and launcher lifecycle controls are incomplete** (`gate-implementation`, `gate-host-safety`). `mintRunCapability` accepted non-digest approval text, empty run ID, unknown `shell`/`network` capabilities, and an extra binding field. `launchCompanion` accepted that token and invoked injected spawn authority. The captured spawn options had neither timeout nor abort signal; the launcher contains no cumulative stdout/stderr enforcement, protocol/session lifecycle, cancellation, crash/EOF/partial-output handling, or exact-child termination. Root/CLI/package deep exports are closed, but direct filesystem import remains possible and the internal mint boundary does not validate the promised closed approval/capability contract.
3. **BLOCKER — evidence-vault limits and failure reporting violate the gate** (`gate-host-safety`). With `maxBytes:3`, two 2-byte writes both succeeded, proving the configured cumulative-byte budget is enforced only per file. A cleanup failure returned only `quarantine-…`, not the required absolute retained/quarantine path. Config validation accepted an evidence root inside the package when the CLI was invoked from another cwd, because exclusion is only `[process.cwd()]`. Hard-link and replacement probes did fail closed, but they do not cure these acceptance failures.
4. **BLOCKER — new CLI parsers are not closed and can leak supplied fake response data** (`gate-implementation`, `gate-host-safety`). `validate-host-config` accepted duplicate top-level `schemaVersion` keys. `action-preview` accepted unknown activation-shaped fields and emitted a fake response containing `secretPath:"/private/token"` verbatim. This violates duplicate/unknown rejection and path-leak criteria even though no host operation occurred.
5. **BLOCKER — Windows protocol source drifts from the approved closed contract** (`gate-host-safety`). Static review found no listener/network/ADB/service/PowerShell transport and capture/input intentionally return `E_*_UNVERIFIED`, but `Protocol.cs` does not enumerate/reject unknown or duplicate fields, does not implement nonce/session/order/deadline/correlation/approval/canary/budget state, and returns `authorize:{accepted:true}`. This is neither a coherent implementation of the approved protocol nor a fully fail-closed protocol declaration. No compatibility claim was made.
6. **Nonblocking handoff discrepancy.** The implementer trace says “all nine” host files while naming and shipping eight, and says several baseline host/oracle/security/state files changed although independent baseline comparison found only five baseline files changed. Direct migration evidence, not that inventory claim, was used for this decision.

## Gate Matrix

| Gate | Decision | Independent evidence |
| --- | --- | --- |
| `gate-implementation` | **FAIL** | 79/79 tests pass, but the state-bypass, malformed-handshake, invalid-fixture, permissive CLI, and unbounded-launcher probes contradict required changed behavior. |
| `gate-migration` | **PASS** | Candidate has all 51 baseline files; none missing. Only `package.json`, two existing docs, `cli.mjs`, and `index.mjs` differ; all are intentional integration files. The full legacy/new suite passes 79/79 with no skips. |
| `gate-host-safety` | **FAIL** | Protocol, capability, launcher, vault quota/reporting, CLI closure/redaction, and C# protocol findings above are command-backed. |
| `gate-package` | **PASS** | Private, dependency-free, no lifecycle hooks; `npm ls` is root-only; dry-run pack has exactly 56 reviewed source/doc/package paths and no test, binary, evidence, credential, build, or trace path. |
| `gate-no-live` | **PASS for this preparation run** | CLI/root/package-deep activation routes are absent; no Windows/BlueStacks/ADB/network/capture/input executable was run; source scan found no runtime network/listener authority. This does not waive the unsafe future-activation blockers. |

**Acceptance decision: FAIL.** All five gates were required; `gate-implementation` and `gate-host-safety` fail. Partial completion is not accepted.

## Metadata and Input Contract

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-validate-host-preparation-004`
- scopeKey: `preparation-validation`
- role: `validator`
- artifactId: `root-validator-004-host-preparation`
- createdAt: `2026-08-21`
- taskMode: `integration-check`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Inputs received: Contract-complete packet, changed destination, verification criteria/commands, normalized specification, planner and implementer traces, package/source/docs/companion contracts, baseline relationship, skip policy, and acceptance standard.
- Required context present: Yes.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; candidate: `/home/joshl/projects/nba2k27-myplayer`; baseline: `/tmp/opencode/nba2k27-myplayer`.

## Work Performed and Command Evidence

No candidate file was modified. Isolated temporary roots were removed. No network request, native host command, Windows executable, BlueStacks operation, ADB operation, capture, or input occurred.

### Core checks

- `node --version && node --check src/nba2k27-myplayer/index.mjs && node --check src/nba2k27-myplayer/cli.mjs && node --test test/nba2k27-myplayer/*.test.mjs`
  - Exit 0 on Node `v24.14.1`; **79 pass, 0 fail, 0 skipped**.
- `npm run test:host && npm run check:host && npm run verify:no-live && npm run verify:pack`
  - Exit 0; focused tests **8/8**; `NO_LIVE_OK files=42`; `PACK_OK entries=56`.
- `npm ls --all --json`
  - Exit 0; only `nba2k27-myplayer@0.0.0`.
- `npm pack --dry-run --json`
  - Exit 0; 56 entries, 59,281 packed bytes, 249,802 unpacked bytes, no bundles. Every path was inspected.
- Validator-owned recursive no-follow/hash comparison
  - `baselineFiles=51`, `candidateFiles=88`, `missing=[]`; five intentional baseline files differ.
- Independent all-command `runCli` matrix
  - All 13 valid invocations exited 0: six legacy commands plus config/transcript validation, three fake commands, evidence status, and evidence cleanup.
- Independent malformed/oversized/symlink/live/network/ADB/executable-flag matrix
  - Stable nonzero codes: `E_JSON_PARSE`, `E_INPUT_BOUNDS`, `E_INPUT_READ`, `E_COMMAND`, and `E_FLAG`; these particular failures leaked no supplied path.

### Adversarial probes

- Protocol/state probe using `ProtocolSession`, `decodeProtocolLine`, and `validateTranscript`
  - Output included `stateBypass:"ACTION_IN_FLIGHT"`, the prohibited arbitrary input body, and `handshakeFree:{ok:true,records:1}`.
- Fixture/EOF probe
  - `valid-canary.jsonl REJECTED E_BODY_SHAPE`; `stale-capture.jsonl {ok:true,records:1,terminal:false}`.
- Capability/launcher probe with an owner-only synthetic non-executable file and injected fake spawn
  - `arbitraryCapabilityAccepted:true`; spawn options had `shell:false` but `hasTimeout:false`, `hasAbortSignal:false`. No executable was started.
- Evidence cumulative quota probe in an isolated owner-only temp root
  - `configuredMaxBytes:3`, `actualBytesWritten:4`, `cumulativeQuotaBypassed:true`.
- Evidence cleanup-failure probe
  - `E_QUARANTINE_CONTENT`, relative opaque retained ID, `retainedIdIsAbsolute:false`.
- Evidence hard-link/replacement probe
  - Hard link retained fail closed with `E_QUARANTINE_CONTENT`; replaced run directory write failed `E_VAULT_IDENTITY`.
- Duplicate/config-containment/fake-output probe from `/tmp/opencode`
  - Duplicate config with package-inside evidence root exited 0. Unknown fake activation fields exited 0 and stdout reproduced `/private/token`.
- Export/reachability probe
  - Root has no launcher/mint; CLI has no launcher; package deep import failed `ERR_PACKAGE_PATH_NOT_EXPORTED`; direct filesystem import exposed `launchCompanion` as a function.
- Recursive inventory/authority scan
  - 88 files, zero symlinks, zero binaries. Hits were only documentation denials and test machinery (`verify-pack.mjs` legitimately invokes npm); runtime source had no network/listener/ADB/PowerShell/service import.

## Schema and Coherence Results

- Config JSON Schema is Draft 2020-12 and structurally closed; runtime object validation is also structurally closed after parse.
- The CLI JSON reader is not duplicate-key aware, so the closed object contract is bypassable before runtime validation.
- Protocol framing has useful byte/depth/key/string/integer checks, but operation results, hello identity types, handshake ordering, EOF completeness, semantic input fields, state transitions, approvals, and budgets are not closed.
- `valid-canary.jsonl` is incoherent with the implementation's own authorize-body schema.
- C# and Node share operation names and a 98,304-byte line ceiling, but C# does not implement the Node-side closure/state contract.
- Package exports/bin/scripts match documented offline routes; launcher and mint are absent from public exports.

## Security and Activation Findings

- **No-live evidence:** no live/native execution occurred, and no CLI or package export supplies launch authority.
- **Activation blocker:** the internal capability mint and launcher do not satisfy approval/capability/lifecycle bounds required before any later activation.
- **Filesystem:** symlink roots, insecure modes, hard links during cleanup, and run replacement fail closed; cumulative quotas, invariant external-root exclusion, cleanup path reporting, and stronger post-cleanup identity proof remain deficient.
- **Privacy:** ordinary CLI errors are redacted, but fake preparation output can reproduce arbitrary fixture fields and paths.
- **Native source:** source-only C#; no binary/listener/network/ADB/service/PowerShell/child process; DPI manifest and Win32 declarations are present; capture/input are explicitly unverified. Protocol parsing/state remains blocking.

## Package Result

- `private:true`; no dependency sections; no lifecycle/publication scripts.
- Exports are only `.` and `./cli`; bin is the offline CLI.
- Packed paths are restricted to `package.json`, `src/`, `docs/`, and `companion/windows/`.
- No test, compiled binary, evidence, host config, credential, build output, temp, or trace path was packed.

## Skipped / Prohibited Checks and Residual Risk

- `dotnet --list-sdks` precheck produced `DOTNET_UNAVAILABLE`; no C# build was attempted. This is an allowed honest skip, and native compile/API correctness remains residual risk.
- Windows build/sign/place, real launcher invocation, WSL process propagation, host discovery/change, BlueStacks/NBA 2K27 calibration, capture, input, accounts, credentials, and global configuration were prohibited and not performed.
- Cross-UID ownership mutation was not feasible without privilege. Current-user mode/symlink/hard-link/replacement checks were performed.
- Future WSL/Windows path identity, DPI mapping, WGC support, process/window drift, foreground/UIPI behavior, and BlueStacks compatibility remain unverified and must not be activated.

## Remediation List

1. Implement and adversarially test a closed protocol state machine: handshake order/types, terminal EOF/outstanding handling, operation-specific request/result schemas, allowlisted semantic actions/selectors, capture chunks, freshness, approvals, canary/continuation, and shared budgets.
2. Make capability minting validate exact closed bindings/digests/capabilities/run identity and ensure launch consumes all relevant bindings; add bounded child lifecycle, stdout/stderr, timeout, abort, EOF/crash, cancellation, partial-output discard, and exact-child termination controls.
3. Enforce vault cumulative bytes/counts, immutable package/workspace exclusions independent of cwd/caller options, and required absolute retained/quarantine-path reporting with identity-safe cleanup completion checks.
4. Use duplicate-key-aware JSON parsing for config and close/redact fake command input/output schemas.
5. Make the C# parser/protocol fail closed for duplicate/unknown/type/order/session/correlation/deadline/approval/budget violations, or reduce it to an explicit terminal unsupported response until that contract exists.
6. Correct the implementer inventory/file-count statements and add tests that reproduce every validator probe above.

## Output Contract and Handoff

- Outputs: Findings-first integration decision, per-gate matrix, command outputs, migration/schema/security/package/native-source results, skips, remediation, and activation handoff.
- Evidence: Independent commands and direct source inspection listed above; lifecycle/progress artifacts were not used as acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/validator/root-validator-004-host-preparation.md`
- Next role: Parent orchestration for failed-gate synthesis or a fresh bounded implementer remediation task; this validator did not implement fixes.
- Limitations: Linux/offline/fake/static validation only. The absence of an offline C# toolchain and prohibition on live/native checks prevent native or host claims.
- Risks: Protocol authorization bypass, malformed transcript acceptance, arbitrary capability binding, unmanaged child lifecycle, evidence quota overflow, privacy/path leakage, C#/Node drift, and all deferred host compatibility risks.
