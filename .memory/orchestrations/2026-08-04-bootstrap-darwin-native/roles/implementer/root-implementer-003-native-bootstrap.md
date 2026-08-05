# Darwin-Native Portable Bootstrap Implementation

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `implementer`
- artifactId: `root-implementer-003-native-bootstrap`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Implement the approved Darwin-native portable bootstrap plan at its assigned native helper, build/test, bootstrap, manifest, validator, source inventory, portable test, design documentation, trace, and permitted index paths; preserve Linux behavior and unrelated worktree changes; use no external npm dependency; run implementer self-checks but leave final acceptance to validator.
- Required context present: `orchestrationId`, approved research and plan artifacts, exact target scope, schema and role contracts, preservation requirements, verification commands, accepted pinned-parent rename limitation, handoff requirements, and routing status were supplied.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented. Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Added a libc-only C protocol-v1 helper and reproducible two-slice Darwin build; generated and hashed the universal Mach-O; added private materialization, integrity/self-test, bounded transport/timeout, root identity, all-parent preflight, and Darwin dispatch to bootstrap while retaining Linux `/proc/self/fd`; updated closed portable/source inventories, binary-safe validators, focused tests, counts, and honest security/release documentation.
- Files read: Approved researcher and planner traces in full; memory protocol/template; implementer role contract and trace schema; bootstrap, portable/source manifests, portable/source validators, portable tests, design document, and implementer agent permissions.
- Files changed: `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/bootstrap/native/darwin-portable-fs.universal`; `.opencode/scripts/build-darwin-portable-fs.mjs`; `.opencode/scripts/darwin-portable-fs.test.mjs`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/portable.manifest.json`; `.opencode/harness.manifest.json`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/validate-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; `opencode-harness.design.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md`; this trace artifact.
- Commands/checks: Initial `--update` build failed because direct clang discovery lacked an SDK sysroot; build tooling was corrected to use `xcrun --sdk macosx --show-sdk-path`. Subsequent `--update` generated the final universal artifact. Final checks: six `node --check` entry points passed; `node .opencode/scripts/build-darwin-portable-fs.mjs --check` passed with SHA-256 `8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50`, `arm64`/`x86_64`, macOS 11.0, and linker ad-hoc/no-Team-ID state; focused native tests passed 3/3; portable E2E passed 15 with 1 explicit limitation skip; portable validator passed; source validator passed. `file`, `lipo`, `otool -L`, SHA-256, and `codesign -dv` probes confirmed universal slices, libc-only linkage, and ad-hoc signature provenance.

## Output Contract

- Outputs: Checked-in native source and universal binary; source-only deterministic build/native-test tooling; portable manifest v2 backend contract and exact hash; Darwin fail-closed bootstrap path; binary-safe installed/source validation; focused native and portable coverage; source inventory and design guidance; orchestration trace/index.
- Evidence: Build parity, helper self-test, real Darwin bootstrap installs/reruns/no-clobber/overwrite, fail-before-publication seams, binary corruption rejection, portable E2E, installed validation, and source QA all produced command-backed passing results. The tests and docs explicitly avoid claiming atomic confinement against a concurrent pinned-parent rename.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/implementer/root-implementer-003-native-bootstrap.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md`; approved researcher/planner traces.
- changedFiles: The 13 paths listed under Work Performed.
- rationale: Use a standalone universal libc helper to expose Darwin `*at` primitives without npm, Node ABI/FFI, runtime compiler, shell, or PATH dependencies; make integrity/protocol/backend expectations closed and independently validated.
- schemaOrBoundaryChoices: Portable manifest schema is `2.0.0`; C source and universal helper are portable-managed runtime/audit dependencies; build and native focused test scripts remain source-only; binary is excluded only from text-reference scanning and instead receives exact hash/FAT checks; signing is declared as linker ad-hoc with no Team ID.
- commandsRun: Final assigned syntax/build/test/validator commands passed as summarized above.
- handoffNotes: Integrator should verify the repeated hash/capability/inventory strings remain identical. Reviewer should inspect C bounds, fd/error cleanup, link/rename semantics, child timeout/response handling, and the accepted relocation window. Validator/artifact-verifier must independently rerun acceptance and capture generated binary evidence before acceptance.
- knownLimitations: Tested on macOS 15.6 arm64/APFS only. No real x86_64 host, oldest-supported macOS, Linux-host regression run, HFS+/network filesystem, downloaded/quarantined release, Developer ID/notarization, SIGKILL residue, or deterministic concurrent-parent-move publication proof was run here. The portable E2E explicitly skips that accepted Darwin limitation case; documentation and manifest state the inherited race-detecting limitation.

## Handoff

- Next role: `integrator`, then independent `reviewer`, `validator`, and `artifact-verifier` as assigned by orchestration.
- Limitations: Implementer self-checks are not final acceptance evidence. Cross-host/platform/release-channel gates listed above remain unverified, and the universal payload is only linker ad-hoc signed.
- Risks: C parser/syscall defects, filesystem-specific `linkat` behavior, checked-in binary provenance, partial publication after operation zero, uncatchable-signal residue, and concurrent pinned-parent relocation outside the target remain review/validation concerns.
