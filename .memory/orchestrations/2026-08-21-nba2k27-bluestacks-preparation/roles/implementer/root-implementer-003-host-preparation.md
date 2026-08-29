# Durable Host Preparation Implementation

## Metadata

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- role: `implementer`
- artifactId: `root-implementer-003-host-preparation`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Fresh packet `dt-implement-host-preparation-003`, approved planner/research/validator artifacts, immutable baseline, durable destination, exact no-live scope, schema/preservation/verification requirements, and package expectations.
- Required context present: Yes. The baseline and supplied artifacts were readable; `/home/joshl/projects` existed and the destination was absent.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; durable implementation destination: `/home/joshl/projects/nba2k27-myplayer`.

## Work Performed

- Summary: Migrated the accepted package to the durable path with closed hash/type/mode fidelity, proved its 71-test/37-entry baseline, then added dependency-free offline host preparation: closed config and protocol, deterministic state/fake transport, opaque one-use launch capability and injected exact-path launcher, owner-only external evidence vault, preparation-only CLI, C# Windows source contract, docs, fixtures, package bounds, and Linux-only tests. No Windows executable, host, network, ADB, game, emulator, account, Git, publication, or global configuration operation occurred.
- Migration evidence: Source had 51 regular files and **18 recursive directories** (69 manifest entries), top-level `docs/`, `package.json`, `src/`, `test/`; SHA-256 manifest digest `706b58260da910fe73c1bad44df4af20eee8a8263520b927994de1f961345334`. Source/destination manifests matched exactly after copy. Baseline passed 71/71 tests and packed exactly 37 entries.
- Files read: supplied planner, researcher, validator, role contract/schema/protocol; all relevant baseline package, CLI, public index, adapter/oracle, approval/profile, docs, and tests.
- Files changed in durable destination (42):
  - Package/docs: `package.json`; `docs/nba2k27-myplayer/{data-contract.md,operator-safety.md,host-companion-protocol.md,windows-host-preflight.md}`.
  - JavaScript/schema: `src/nba2k27-myplayer/{cli.mjs,index.mjs}`; `src/nba2k27-myplayer/schemas/host-companion-config.schema.json`; all nine files under `src/nba2k27-myplayer/host/` (`protocol-v1.mjs`, `protocol-session.mjs`, `trusted-config.mjs`, `run-capability.mjs`, `companion-transport.mjs`, `stdio-companion-adapter.mjs`, `launch-companion.mjs`, `evidence-vault.mjs`).
  - Windows source: all eight reviewed source/build/doc files under `companion/windows/`.
  - Tests/tools: `test/nba2k27-myplayer/{host-protocol.test.mjs,host-authority.test.mjs,host-adapter-integration.test.mjs,evidence-vault.test.mjs,windows-contract.test.mjs,verify-no-live.mjs,verify-pack.mjs}` and eleven synthetic files under `test/nba2k27-myplayer/fixtures/host/`.
- Trace changed: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/implementer/root-implementer-003-host-preparation.md`.

## Schema and Boundary Choices

- Config is Draft 2020-12, closed, version `host-companion-config/1`, with explicit WSL/Windows paths, pinned digest/build/protocol, optional signer digests, target digests, DPI/calibration, lowerable maxima, and explicit external evidence root. There are no host identity defaults, environment/PATH/registry discovery, credentials, or network paths.
- Protocol is canonical bounded JSONL v1.0 with strict UTF-8/LF framing, duplicate-key/shape/depth/count/string/integer checks, nonce/session derivation, one outstanding request, exact sequence/correlation, closed operation bodies, replay rejection, deadlines, terminal uncertainty, preview/canary/continuation states, and stable code-only errors.
- The root export exposes pure validators, fake transport, adapter, and vault operations. It does not export `launch-companion.mjs` or `run-capability.mjs`. CLI does not import either and accepts only validation, fake preparation, and external-vault maintenance commands.
- Launch authority is physically isolated, validates an immutable config digest and opaque process-local one-use capability, rejects symlink components, hashes a current-user-owned one-link non-writable regular file by open identity, and calls only an explicitly injected spawn authority with fixed argv, `shell:false`, bounded stdio contract, and minimal environment. Tests supply a fake function and invoke no executable.
- Evidence requires an explicit pre-existing 0700 current-user root (a root-owned sticky `/tmp` ancestor is allowed only through that 0700 child), creates 0700 unpredictable runs and exclusive no-follow 0600 files, checks identity/link/mode/quota, caps TTL at 3,600 seconds, and performs identity-checked same-parent quarantine cleanup. Evidence is excluded from the package and temporary test roots were removed.
- The packet explicitly required C#; therefore the native companion is C#/.NET Windows source/project rather than the planner's earlier C++ inventory. It is source-only, stdio-only, nonresident, and deliberately returns unverified capture/input errors pending authorized Windows work.

## Commands and Results

1. Closed source manifest: reported 51 files, 18 recursive directories, digest above. The planner's asserted “exactly 4 directories” check failed because 4 was the top-level entry count, not the recursive directory count; no source defect was found.
2. Baseline `node --check ... && node --test test/nba2k27-myplayer/*.test.mjs && npm ls --all --json && npm pack --dry-run --json`: exit 0; 71 passed; dependency root only; 37 packed entries.
3. Migration copy plus source/destination no-follow manifest comparison: `MIGRATION_FIDELITY_OK entries=69 digest=706b...5334`.
4. Final syntax/full test command: exit 0; **79 passed, 0 failed, 0 skipped**.
5. `npm run test:host`: exit 0; 8/8 host/vault/Windows contract tests passed.
6. `npm run check:host`: exit 0.
7. `npm run verify:no-live`: `NO_LIVE_OK files=42`.
8. `npm run verify:pack`: `PACK_OK entries=56`.
9. `npm ls --all --json`: exit 0; only `nba2k27-myplayer@0.0.0`, no dependency tree.
10. `npm pack --dry-run --json`: exit 0; 56 entries, 59,281 bytes packed, 249,802 bytes unpacked, no bundles. Inventory is only `package.json`, reviewed `src/`, `docs/`, and `companion/windows/` source/project files; no tests, binaries, evidence, config, build output, keys, or traces.
11. Valid preparation CLI matrix: config validation, transcript validation, fake preflight, fake calibration, action preview, evidence status, and evidence cleanup all exited 0 with deterministic canonical JSON.
12. Malformed duplicate-key transcript, 64 MiB+ transcript, `live:true` fake fixture, and unknown live command all exited nonzero with stable redacted codes; temporary files/root were removed. No launcher import or host/network call was made.
13. Recursive inventory scan: `RECURSIVE_SCAN_OK files=88 symlinks=0 binaries=0`; changed inventory reported 42 destination paths. Credential-pattern scan found only the pre-existing synthetic redaction attack object in `ui-adapter.test.mjs`.

## Output Contract

- Outputs: Durable migrated implementation, closed preparation schemas/modules, internal authority boundary, fake companion/test suite, external vault, C# source contract, operator docs, package updates, migration and command evidence.
- Evidence: 79/79 full tests, 8/8 focused host tests, syntax/package/no-live/pack checks, valid and adversarial CLI matrix, source/destination manifest equality, recursive no-symlink/no-binary scan, and exact 56-entry pack output.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/implementer/root-implementer-003-host-preparation.md`.

## Handoff

- Next role: Independent `validator` in `validation` or `integration-check` mode.
- Validator attack commands: rerun every packet command; focus `node --test --test-name-pattern='protocol|session|config|launcher|vault|Windows' test/nba2k27-myplayer/*.test.mjs`; rerun the malformed/oversized/live/unknown CLI matrix; inspect all 56 dry-run pack paths; verify CLI/root imports cannot reach launcher/capability; attack duplicate keys, request replay/gaps/correlation/deadlines, opaque capability serialization/reuse/binding, symlink executable/vault roots, hard links, modes, quotas, TTL and quarantine identity; confirm process/network sentinel count remains zero.
- Plan deviations: (1) accepted the actual 18 recursive baseline directories instead of the planner's mistaken 4-directory assertion, while preserving all 51 source files and the closed manifest; (2) followed the controlling packet's C# requirement instead of the planner's C++ file list; (3) used `companion/windows/` and an SDK-style `.csproj` accordingly. No other scope expansion was made.
- Skipped checks: Windows compilation, signing, executable placement, real launcher invocation, WSL termination/orphan behavior, host discovery, BlueStacks/NBA 2K27 calibration, capture, input, and compatibility. They are prohibited/deferred, not passing evidence.
- Limitations: The C# capture/input implementation intentionally fails closed and does not establish native API correctness. The Linux tests establish preparation contracts and fake behavior only. Independent validator evidence remains required.
- Risks: The isolated launcher is sensitive and must remain absent from CLI/root exports. Same-user replacement races and future Windows/BlueStacks behavior remain outside this offline boundary.
