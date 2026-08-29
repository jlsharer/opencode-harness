# Host-Preparation Remediation Implementation

## Metadata

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-remediate-host-preparation-005`
- scopeKey: `durable-host-preparation`
- role: `implementer`
- artifactId: `root-implementer-005-host-remediation`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh implementation packet, approved planner trace, failed validator trace, exact durable destination, five command-backed blocker groups, preservation constraints, and verification commands.
- Required context present: Yes. Both supplied traces, the role contract/schema, and the durable destination were readable.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; implementation destination: `/home/joshl/projects/nba2k27-myplayer`.

## Work Performed

- Summary: Remediated only the failed host-preparation gates. Replaced permissive protocol parsing/state transitions, closed capability and launcher lifecycle contracts, made evidence accounting cumulative and serialized, closed/redacted host CLI ingestion, and changed the source-only C# companion from accepting authorization to a correlated terminal-unsupported boundary. Added regressions for every validator attack class while preserving all legacy behavior and package/no-live boundaries.
- Files read: supplied planner/validator traces; role contract and trace schema; relevant host runtime, CLI, package, fixture, test, and Windows companion source files.
- Files changed:
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/protocol-v1.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/protocol-session.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/trusted-config.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/run-capability.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/launch-companion.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/evidence-vault.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/cli.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/index.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Protocol.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Identity.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Program.cs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/host-protocol.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/host-authority.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/host-cli.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/evidence-vault.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/windows-contract.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/host/valid-observe.jsonl`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/host/valid-canary.jsonl`
- Commands:
  - `node --check src/nba2k27-myplayer/index.mjs && node --check src/nba2k27-myplayer/cli.mjs && node --test test/nba2k27-myplayer/*.test.mjs` — exit 0; 87 pass, 0 fail, 0 skipped.
  - `npm run test:host && npm run check:host && npm run verify:no-live && npm run verify:pack` — exit 0; 16 focused tests pass; `NO_LIVE_OK files=42`; `PACK_OK entries=56`.
  - `npm ls --all --json` — exit 0; root package only.
  - `npm pack --dry-run --json` — exit 0; exactly 56 reviewed source/doc/package entries, no bundles or prohibited artifacts.
  - Valid config plus valid observe/canary transcript CLI commands — exit 0; transcript counts 4 and 12.
  - Malformed transcript CLI command — expected exit 2 with stable `E_DUPLICATE_KEY` and no supplied path disclosure.

## Schema and Boundary Choices

1. The dependency-free recursive-descent JSON parser rejects duplicates at every object level, trailing bytes, bounds violations, and unsafe protocol numbers before semantic validation. Legacy offline CLI inputs retain bounded finite decimal support; host config/fake/protocol inputs use the stricter depth/key/string/array/integer limits.
2. Protocol records now have closed request and result schemas, a nonce- and executable-derived session ID, exact correlation, discovery-before-binding, immutable target/capture/preview/approval bindings, one-use approvals, reversible one-action canary, positive action/query budgets, terminal replay handling, and `ACTION_OUTCOME_UNKNOWN` after input dispatch uncertainty.
3. Capability tokens can only be minted from a process-branded immutable validated config and exact closed protocol/executable/invocation bindings. Observation cannot include input; control additionally requires target/profile/plan and positive budgets. Consumption compares the complete binding and occurs before injected spawn authority.
4. The launcher remains absent from root, CLI, and package exports. It invokes only the exact executable with fixed argv and `shell:false`, supplies abort and total timeout controls, bounds stdout line/total and stderr before growth, rejects malformed/partial/early/nonzero/signal/error output, closes stdin and terminates the exact child on failure, and preserves the first error. All tests use injected fake children and synthetic non-executable bytes.
5. Evidence writes serialize per run, rescan trusted regular files, and atomically compare cumulative existing-plus-proposed file/byte quotas. Cleanup reports the exact absolute source or quarantine path on retention and rechecks parent/quarantine identities and absence.
6. The unbuilt C# source implements closed framing, recursive duplicate/limit checks, exact hello/session/sequence/correlation and body closure, but intentionally returns a correlated terminal `E_OPERATION_UNSUPPORTED` for every native operation. It no longer accepts authorization. This is the safe remediation option until separately approved native implementation/build validation exists.

## Validator Finding Mapping

- Protocol/state bypass, handshake-free transcript, incomplete EOF, invalid canary fixture: closed parser/session/transcript implementation plus `host-protocol.test.mjs` and corrected observe/canary fixtures.
- Arbitrary capability and unmanaged launcher: branded closed mint/consume binding and fake lifecycle tests covering invalid/forged/replayed bindings, timeout, abort, output/stderr limits, malformed/partial output, child error/nonzero/signal/early exit, and cancellation.
- Cumulative evidence bypass, containment, retained-path omission: immutable package-root exclusion, serialized cumulative quota scans, race regression, and absolute quarantine-path regression.
- Duplicate config and fake output leak: duplicate-aware host CLI parsing, exact fake fixture schemas, closed summary output, and path non-disclosure attacks.
- C# drift/accepted authorization: closed source-only parser/correlation constants and terminal unsupported native operations, cross-checked statically against Node operation/version/line contracts.

## Output Contract

- Outputs: Changed-file inventory, remediation rationale, boundary choices, finding-to-regression map, command results, limitations, and fresh-validator handoff.
- Evidence: 87-test full suite, 16-test focused host suite, syntax checks, no-live scan, exact pack check, dependency tree, dry-run pack inventory, valid transcript/config commands, and malformed transcript rejection.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/implementer/root-implementer-005-host-remediation.md`

## Handoff

- Next role: fresh independent `validator` in `validation` or `integration-check` mode.
- Fresh-validator commands: rerun the validator's original adversarial probes; then run `node --check src/nba2k27-myplayer/index.mjs`, `node --check src/nba2k27-myplayer/cli.mjs`, `node --test test/nba2k27-myplayer/*.test.mjs`, `npm run test:host`, `npm run check:host`, `npm run verify:no-live`, `npm run verify:pack`, `npm ls --all --json`, `npm pack --dry-run --json`, and the three config/observe/canary CLI commands plus malformed transcript rejection from this trace.
- Limitations: C# was intentionally not compiled or executed because the toolchain was unavailable/prohibited; its native operations remain terminal unsupported. No Windows process, host probe/change, capture/input, BlueStacks/app/account action, network, ADB, PowerShell, credential, Git, publication, or harness source mutation occurred. Real child-process behavior remains a future separately approved host-validation gate; this work exercised injected fakes only.
- Risks: Windows API/build correctness, WSL termination propagation, host identity/DPI/WGC/foreground behavior, and BlueStacks compatibility remain unverified. Independent validator evidence is still required before acceptance.
