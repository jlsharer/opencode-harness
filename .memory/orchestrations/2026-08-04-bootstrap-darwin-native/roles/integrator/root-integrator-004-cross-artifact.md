# Darwin Native Bootstrap Cross-Artifact Integration

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `integrator`
- artifactId: `root-integrator-004-cross-artifact`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Audit and integrate the Darwin-native implementation across the C source/universal binary, approved build tooling, bootstrap protocol/hash/constants, portable and source manifests, installed/source validators, tests, documentation, portable boundary, prior role artifacts, and orchestration index; preserve unrelated changes and do not perform final acceptance.
- Required context present: `orchestrationId`, changed artifacts, exact path relationships, closed-manifest expectations, bootstrap/build/test/validation workflow contracts, accepted Linux-matching race-detecting contract, accepted concurrent pinned-parent rename limitation, known release/host risks, trace requirements, and routing status were supplied.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented. Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Read the researcher, planner, and implementer traces; audited current diffs and the complete native/bootstrap/manifest/validator/test surfaces; compared repeated paths, protocol values, hash, architecture/OS/signing metadata, safety labels, file counts, inventory classifications, and documented boundaries; added the missing release-build linkage assertion; updated this orchestration index; and ran focused integration checks without making an acceptance decision.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/{researcher/root-researcher-001-native-options.md,planner/root-planner-002-native-plan.md,implementer/root-implementer-003-native-bootstrap.md}`; orchestration `INDEX.md`; memory protocol/templates; integrator role contract and trace schema; `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/bootstrap/native/darwin-portable-fs.universal` metadata; `.opencode/scripts/{build-darwin-portable-fs.mjs,darwin-portable-fs.test.mjs,bootstrap-portable-harness.mjs,portable-harness.test.mjs,validate-portable-harness.mjs,validate-harness.mjs}`; `.opencode/{portable.manifest.json,harness.manifest.json}`; `opencode-harness.design.md`; current Git status/diff.
- Files changed: `.opencode/scripts/build-darwin-portable-fs.mjs`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md`; this trace artifact. The C source and checked-in universal binary were not changed or regenerated.
- Commands/checks:
  - Inspected `git status --short`, `git diff --stat`, and current diffs without modifying unrelated worktree changes.
  - Searched repeated helper path/hash/backend labels/schema/minimum-OS values across JSON, MJS, C, Markdown, and role traces.
  - Probed the committed artifact with `shasum -a 256`, `file`, `lipo -archs`, and `otool -L`.
  - Ran `node --check .opencode/scripts/build-darwin-portable-fs.mjs`.
  - Ran `node .opencode/scripts/build-darwin-portable-fs.mjs --check`.
  - Ran `node --test .opencode/scripts/darwin-portable-fs.test.mjs` and `node --test .opencode/scripts/portable-harness.test.mjs`.
  - Ran `node .opencode/scripts/validate-portable-harness.mjs --root .` and `node .opencode/scripts/validate-harness.mjs` as focused integration checks, not final acceptance evidence.

## Output Contract

- Outputs: Path consistency notes, manifest coverage notes, cross-file issue/fix record, consistency matrix, focused check results, residual risks, and handoff guidance.
- Evidence: The committed helper hash is `8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50`; build parity passed for `arm64` and `x86_64` with macOS 11.0; `otool -L` reports only `/usr/lib/libSystem.B.dylib` for both slices; focused native tests passed 3/3; portable E2E passed 15 with the one accepted Darwin relocation-limit skip; both validators passed. These are integration self-checks and do not replace validator/artifact-verifier acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/integrator/root-integrator-004-cross-artifact.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md`.

### Path Consistency Notes

- The helper source and binary use the same canonical paths in research/plan/implementation traces, both manifests, bootstrap, both validators, build/test tooling, and design guidance: `.opencode/bootstrap/native/darwin-portable-fs.c` and `.opencode/bootstrap/native/darwin-portable-fs.universal`.
- Build and focused native-test commands consistently use `.opencode/scripts/build-darwin-portable-fs.mjs` and `.opencode/scripts/darwin-portable-fs.test.mjs`; only the source manifest owns them.
- Installed bootstrap rerun resolves its source root from the installed script and can read both portable-managed native assets. Installed validation does not depend on `AGENTS.md`, `opencode-harness.design.md`, source validator/inventory, build tooling, native focused tests, or orchestration history.

### Manifest Coverage Notes

- Portable manifest v2 contains exactly the C source and universal helper as new managed assets; its managed count is 45 and installed-plus-memory unchanged count is 49, matching E2E assertions.
- Source manifest contains the C source, universal binary, build script, and native test with distinct runtime/source-release classifications; source validator checks those classifications and rejects build/test leakage into portable-core.
- Helper path, protocol `1`, hash, `arm64`/`x86_64`, macOS `11.0`, signing label, backend safety labels, Linux `/proc/self/fd`, preflight behavior, and pinned-parent relocation limitation agree among manifest, bootstrap, validators, build output, tests, C comments, and documentation.
- Only the exact native binary is exempt from UTF-8/forbidden-reference scanning; its C source remains text-scanned and the binary receives regular-file, hash, FAT/slice, bounds, and architecture checks.

### Consistency Matrix

| Contract | Producer/authority | Consumers/evidence | Result |
|---|---|---|---|
| Native paths | portable/source manifests | bootstrap, build/test scripts, validators, docs | Consistent |
| Protocol | C `PROTOCOL_VERSION=1` | manifest, bootstrap request/response/self-test, validators | Consistent |
| Binary identity | approved build output | manifest/bootstrap/portable validator/source validator | Same SHA-256 |
| Artifact shape | build (`arm64`, `x86_64`, macOS 11.0) | FAT validators, self-test, docs | Consistent |
| Native linkage/signing | build tool | source QA and design provenance | libSystem-only; linker ad-hoc/no Team ID |
| Backend routing labels | portable manifest | bootstrap output and E2E | Linux and Darwin labels agree |
| Inventory boundary | portable vs source manifests | exact validators and installed E2E | Build/native-test tooling remains source-only |
| Safety limitation | manifest capability | C comments, tests, design, role traces | Race-detecting; no atomic beneath-root claim |

### Cross-File Issues and Fixes Applied or Requested

- Fixed: The plan and design treated libc-only linkage as a build/release contract, but the approved build script checked deployment target, slices, signature, self-test, and reproducibility without enforcing linkage. Added an `otool -L` assertion requiring exactly one `libSystem` dependency per slice. `--check` passes and the checked-in binary did not need regeneration.
- Fixed: Updated the orchestration index from pending integration to the exact integrator artifact path and widened its trace/index wording to include assigned role traces rather than only the implementer trace.
- No other path, hash, protocol, manifest, label, count, documentation, or portable-boundary mismatch was found. No C/manual binary edit was made, and unrelated changes were preserved.

### Residual Risks and Follow-Up Checks

- Independent reviewer should still inspect C parser bounds, errno fidelity, descriptor and created-directory cleanup, hard-link/rename semantics, child timeout/output behavior, and the accepted final reachability-check-to-publication relocation window.
- Validator/artifact-verifier must provide independent acceptance and generated-artifact evidence. This role did not accept the implementation.
- Real x86_64 hardware, oldest supported macOS, Linux host regression, non-APFS filesystems, downloaded/quarantined release behavior, Developer ID/notarization, deterministic concurrent-parent relocation, SIGKILL/power-loss residue, and publisher authenticity remain unverified.
- Focused checks emitted existing Node module-type warnings during plugin validation; they did not fail validation and were outside this integration scope.

## Handoff

- Next role: `reviewer`, followed by independent `validator` and `artifact-verifier` before acceptance.
- Limitations: Integration was executed on Darwin arm64 and did not establish cross-host acceptance. The native focused suite is narrower than the planner's complete future acceptance matrix; passing results are not a substitute for independent validation. No checked-in binary regeneration was necessary.
- Risks: Native parser/syscall defects, filesystem-specific hard-link behavior, partial publication after operation zero, uncatchable-signal residue, concurrent pinned-parent relocation outside the target, and unauthenticated checked-in binary provenance remain.
