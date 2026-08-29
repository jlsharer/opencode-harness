# Standalone Integration Implementation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-034-integration`
- createdAt: `2026-08-21`
- taskMode: `integration`
- delegationTaskId: `dt-integrate-standalone-036`
- scopeKey: `standalone-integration`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh integration packet naming the three approved planner artifacts, four accepted validator artifacts, standalone target, assigned trace, schema and preservation requirements, style constraints, commands, and handoff requirements.
- Required context present: Yes. `dispatchKind` was `fresh`; selected `taskMode` was `integration`; edits were bounded to `/tmp/opencode/nba2k27-myplayer/` and this trace.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Integrated the accepted contract, optimizer, offline oracle/report, and fake/injected UI branches behind a side-effect-free public index and thin bounded CLI. Added private package boundaries, complete deterministic fixtures, an end-to-end integration suite, and operator/data/optimization documentation. Preserved offline-only authority and changed one accepted optimizer line only after the integrated winner path demonstrated an incompatibility with the accepted report validator.
- Files read: Supplied planner/validator chain; role contract; trace schema; memory protocol; package metadata; all component APIs needed for stitching; existing tests; accepted request/replay fixtures.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/package.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/index.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/cli.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/run.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/integration.test.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/observation-valid.json`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/manual-worksheet-input.json`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/manual-import-input.json`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/report-valid.json`
  - `/tmp/opencode/nba2k27-myplayer/docs/nba2k27-myplayer/operator-safety.md`
  - `/tmp/opencode/nba2k27-myplayer/docs/nba2k27-myplayer/data-contract.md`
  - `/tmp/opencode/nba2k27-myplayer/docs/nba2k27-myplayer/optimization.md`
  - this trace artifact.
- Stitching change: A real replay optimization reached the accepted winner branch, but `run.mjs` marked the sole selected baseline as `scoreNearTie:true`; the accepted report validator correctly rejected a winner carrying any near-tie marker (`E_REPORT_WINNER_NEAR_TIE`). `buildResult` now emits no score-near-tie IDs when the already-established decision is `winner`. The new deterministic end-to-end integration test covers this exact path; the focused optimizer suite remained 15/15 and the full suite remained green.
- Boundary choices: CLI reads use no-follow handles, regular-file and 1 MiB bounds; explicit outputs use no-follow owner-mode handles and a 2 MiB bound. Errors expose only stable codes and bounded JSON pointers. Replay has no volatile exclusions. No CLI path instantiates a host adapter. `BlueStacksUiOracle` and `FakeHostAdapter` are exports for injected/fake contract use only.

## Commands and Results

1. `node --check src/nba2k27-myplayer/index.mjs` and `node --check src/nba2k27-myplayer/cli.mjs` — exit 0, no syntax output.
2. `node --test test/nba2k27-myplayer/*.test.mjs` — exit 0; **71 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo**. This includes 5 new integration tests; accepted bootstrap, optimizer, oracle/report, and UI suites remain passing.
3. Representative CLI sequence — all exit 0:
   - `validate-request --input .../request-user-state-valid.json` returned `ok:true` for `two-way-wing-state-a`.
   - `validate-observation --input .../observation-valid.json` returned `ok:true` for `observation-first`.
   - `optimize --oracle replay --dry-run --request ... --replay ...` returned a schema/semantic-valid deterministic winner report with one hard-feasible candidate and `queriesUsed:2`; repeated bytes deep-equal the committed `report-valid.json` fixture.
   - `replay --manifest .../baseline.json --assert-deterministic` returned the two ordered observation IDs and `volatileFieldsExcluded:[]`.
   - `manual-worksheet --dry-run --input .../manual-worksheet-input.json` returned deterministic candidate/context/version hashes and five bounded observation steps.
   - `manual-import --dry-run --input .../manual-import-input.json` returned a schema-valid manual-capture observation bound to hashed synthetic evidence.
4. Prohibited import/path/package inventory Node probe plus `npm ls --all --json` — exit 0; 33 source files, zero prohibited authority/path matches, zero forbidden dependency/lifecycle keys, zero symlinks; dependency tree contains only `nba2k27-myplayer@0.0.0`.
5. `npm pack --dry-run --json` — exit 0; private package preview contains **37 files**, 43,942 packed bytes, 203,171 unpacked bytes, no bundled dependencies. Package contents are exactly package metadata, 3 docs, and 33 source/schema files; tests and synthetic fixtures are intentionally excluded by `files`.
6. `chmod 755 src/nba2k27-myplayer/cli.mjs` — CLI bin is executable; pack preview reports mode 0755.

## Output Contract

- Outputs: Stable public exports; bounded six-subcommand CLI; deterministic offline optimization/replay/manual flows; package metadata; complete integration fixtures and tests; exact-limit documentation; and this implementation trace.
- Evidence: Syntax passes, 71/71 tests pass, every representative CLI command succeeds, prohibited-authority inventory is empty, dependency inventory is root-only, and dry-run packaging succeeds with the expected 37-file package surface.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-034-integration.md`; supplied accepted planner and validator artifacts.
- changedFiles: Files changed list above.
- rationale: Provide one deterministic standalone boundary over accepted modules without adding authority, dependencies, persistence defaults, or unsupported mechanics claims.
- schemaOrBoundaryChoices: Closed accepted schemas remain authoritative; CLI adapters conservatively return unknown for unsupported predicates, validate generated reports, use canonical JSON, and expose fake/injected UI only through library exports.
- commandsRun: Commands and Results above.
- knownLimitations: The CLI directly evaluates only position, body-range, and attribute-range hard predicates plus numeric soft objectives; other schema-valid resource predicates remain unknown. The custom schema validator is a declared subset. Fixtures are synthetic and establish no current game mechanics. No live host capability exists or was tested.

## Handoff

- Next role: Fresh independent `validator` in `integration-check` or `validation` mode.
- Limitations: No live app/emulator, host transport, UI input, network, credentials, ambient config, publication, Git operation, or harness implementation file was touched. Tests are not included in the publishable package preview. The standalone target has no Git baseline.
- Risks: Preserve the winner/near-tie stitching regression, explicit replay-only CLI authority, no-follow bounded I/O, fake-only UI language, and package lifecycle/dependency exclusions.
- Exact final validator commands:
  1. `node --check src/nba2k27-myplayer/index.mjs`
  2. `node --check src/nba2k27-myplayer/cli.mjs`
  3. `node --test test/nba2k27-myplayer/*.test.mjs`
  4. `node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-user-state-valid.json`
  5. `node src/nba2k27-myplayer/cli.mjs validate-observation --input test/nba2k27-myplayer/fixtures/synthetic/observation-valid.json`
  6. `node src/nba2k27-myplayer/cli.mjs optimize --oracle replay --dry-run --request test/nba2k27-myplayer/fixtures/synthetic/request-user-state-valid.json --replay test/nba2k27-myplayer/fixtures/replay/baseline.json`
  7. `node src/nba2k27-myplayer/cli.mjs replay --manifest test/nba2k27-myplayer/fixtures/replay/baseline.json --assert-deterministic`
  8. `node src/nba2k27-myplayer/cli.mjs manual-worksheet --dry-run --input test/nba2k27-myplayer/fixtures/synthetic/manual-worksheet-input.json`
  9. `node src/nba2k27-myplayer/cli.mjs manual-import --dry-run --input test/nba2k27-myplayer/fixtures/synthetic/manual-import-input.json`
  10. Repeat the prohibited import/path/package inventory check and `npm ls --all --json`.
  11. `npm pack --dry-run --json`
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-034-integration.md`.
