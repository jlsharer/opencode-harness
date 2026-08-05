# Darwin Native Bootstrap Final Acceptance Validation

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `validator`
- artifactId: `root-validator-005-final-acceptance`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Current changed-file set; prior researcher, planner, implementer, and integrator artifacts; required syntax, native, portable, validator, reproducibility, fresh-bootstrap, dry-run, integrity, failure, prepublication, Linux-preservation, security, activation, and acceptance checks.
- Required context present: `orchestrationId`, changed files, verification criteria, exact commands, closed manifest/role/trace contracts, expected module-type warnings, acceptance standard, permitted trace/index edit scope, and residual-platform reporting requirements were present.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented. Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Independently inspected the current diff, prior role evidence, C helper, bootstrap dispatch, manifests, tests, and validators; ran every requested executable gate on Darwin arm64; exercised a fresh installed profile, dry-run, corrupt-helper and missing-helper fail-before-publication cases; inspected Linux branch preservation; and removed validator temporary targets.
- Files read: Prior artifacts and `INDEX.md`; memory protocol/template; role contract and trace schema; native C source/universal artifact metadata; build/native/portable/bootstrap/validator scripts; both manifests; design documentation; current Git status/diff.
- Files changed: This validator trace only. No implementation file was edited. Validator permissions denied the requested `INDEX.md` update, so the orchestration owner must add this artifact link.
- Commands: The exact commands and summarized outputs are recorded below.

## Output Contract

- Outputs: PASS/FAIL matrix, command outputs, schema results, security and activation findings, remediation list, skipped-platform record, residual risk, and final acceptance decision.
- Evidence: All locally executable gates passed. Native tests passed 3/3; portable E2E passed 15/16 with one intentional accepted-limitation skip; both validators passed; the universal build reproduced byte-for-byte; direct fresh bootstrap reported 45 managed and 4 memory files; dry-run left its target empty; missing/corrupt helper tests failed before destination publication.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/validator/root-validator-005-final-acceptance.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md` requires an orchestration-owner update.

### PASS/FAIL Matrix

| Gate | Result | Evidence |
|---|---|---|
| Six JavaScript syntax checks | PASS | All exited 0 with no output. |
| Darwin native helper tests | PASS | 3 passed, 0 failed/skipped. |
| Portable harness E2E | PASS | 15 passed, 0 failed, 1 expected skip for the accepted pinned-parent relocation limitation. |
| Portable validator | PASS | `Portable OpenCode harness validation passed`. |
| Source validator | PASS | `OpenCode harness validation passed`. |
| Reproducible universal build | PASS | Exact committed bytes reproduced; SHA-256 `8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50`; `arm64,x86_64`; macOS 11.0; linker ad-hoc/no Team ID. |
| Exact fresh bootstrap and installed validation | PASS | `created/updated=45, memory-created=4, unchanged=0, collisions=0, write-safety=darwin-native-race-detecting`; installed validator passed. |
| Dry-run | PASS | Reported 45 managed/4 memory, `write-safety=not-exercised`; target remained empty. |
| Failure/integrity/prepublication | PASS | E2E race/collision/symlink/root-identity/last-parent-probe/corrupted-installed-helper cases passed; direct corrupt and missing source-helper runs failed with empty targets. |
| Manifest/schema/inventory contracts | PASS | Closed portable v2 capabilities, exact 45-file inventory, binary hash/FAT slices, source classifications, role/trace alignment, routing preservation, and portable boundary passed both validators. |
| Linux path preservation | PASS by inspection/test retention | Linux-only `/proc/self/fd` dispatch and descriptor-relative functions remain; Linux assertions and failure seams remain in the portable suite. No Linux host execution was available. |
| Temporary target cleanup | PASS | Both validator-created safe temporary trees were removed after evidence capture. |

### Exact Commands and Results

1. `node --check .opencode/scripts/bootstrap-portable-harness.mjs && node --check .opencode/scripts/build-darwin-portable-fs.mjs && node --check .opencode/scripts/darwin-portable-fs.test.mjs && node --check .opencode/scripts/portable-harness.test.mjs && node --check .opencode/scripts/validate-portable-harness.mjs && node --check .opencode/scripts/validate-harness.mjs` — exit 0, no output.
2. `node --test .opencode/scripts/darwin-portable-fs.test.mjs` — 3 passed, 0 failed, 0 skipped.
3. `node --test .opencode/scripts/portable-harness.test.mjs` — 15 passed, 0 failed, 1 skipped; skip reason: `native pinned-parent relocation is covered by the documented race-detecting limitation`.
4. `node .opencode/scripts/validate-portable-harness.mjs --root .` — exit 0; `Portable OpenCode harness validation passed`.
5. `node .opencode/scripts/validate-harness.mjs` — exit 0; `OpenCode harness validation passed`.
6. `node .opencode/scripts/build-darwin-portable-fs.mjs --check` — exit 0; reproduced the exact hash/slices/minimum-OS/signing values shown in the matrix.
7. Fresh safe-target sequence: create two fresh directories under `/var/folders/.../T/opencode`, run `node .opencode/scripts/bootstrap-portable-harness.mjs --target "$base/fresh"`, run the installed validator with `--root "$base/fresh"`, run `node .opencode/scripts/bootstrap-portable-harness.mjs --target "$base/dry" --dry-run`, and assert the dry target is empty — all passed with the exact counts shown above.
8. Integrity sequence: bootstrap two temporary installed source profiles, corrupt one helper byte and remove the other helper, invoke each installed bootstrap against a separate empty target, and assert both targets remain empty — corrupt case reported `Darwin native helper SHA-256 does not match the portable manifest`; missing case reported `managed source is not a regular file`; both failed as required before publication.
9. `git status --short && git diff --stat && git diff --name-only` plus scoped `git diff`/content inspection — confirmed the native/bootstrap/manifests/validators/tests/docs and orchestration artifacts are the current change set; Linux dispatch remains isolated and preserved.

### Schema Results

- Portable manifest is closed at schema/profile `2.0.0`/`portable-core`; backend labels, protocol `1`, helper path/hash, exact architectures, macOS floor, signing label, preflight behavior, and parent-relocation limitation agree across producers and consumers.
- Source manifest classifies C/binary as portable native assets and build/native-test scripts as source-only; exact source and portable inventory checks passed.
- Role contract requires all validator input/output fields used here. This artifact contains every trace-schema section and required field and uses the required validator path.
- Routing metadata status is preserved as absent; no caller routing labels or invented values were added.

### Security and Activation Findings

- PASS: Bootstrap hashes the committed helper, materializes exact bytes in a private temporary directory at mode `0700`, rehashes them, invokes by absolute path without a shell, validates protocol/platform/native architecture, bounds child output/time, and removes activation storage in `finally`.
- PASS: The helper independently validates protocol bounds, UTF-8 normalized relative paths, duplicates, flags, target identity, no-follow component traversal, all-parent hard-link capability preflight, and same-parent no-clobber/explicit-overwrite publication.
- PASS: Integrity and activation failures occur before managed or memory publication in executed cases. Installed validation treats only the declared binary as binary and enforces its exact SHA-256/FAT architecture table.
- PASS with documented limit: The implementation truthfully remains race-detecting, not atomically confined beneath the root when an already pinned parent is concurrently relocated. Post-publication failures and uncatchable termination can leave partial state/residue. The hash establishes bundle consistency, not publisher authenticity.
- Expected warnings: Portable/source validation emitted Node `MODULE_TYPELESS_PACKAGE_JSON` warnings for ESM plugin files; they were non-fatal, pre-existing in scope, and do not affect bootstrap activation evidence.
- Lifecycle hooks were not treated as acceptance evidence.

### Remediation List

- Orchestration owner: add `roles/validator/root-validator-005-final-acceptance.md` to `INDEX.md`; validator permissions denied that edit.
- No implementation remediation is required for the locally validated Darwin arm64 implementation.
- Release-matrix follow-up, not a local failure: execute the same suite on real x86_64 macOS, the oldest supported macOS, and Linux; test downloaded/quarantined distribution and any claimed non-APFS filesystems before making those release-channel/platform claims.

### Acceptance Decision and Residual Risk

- **PASS** for the current Darwin native bootstrap implementation on the tested Darwin arm64/APFS host, with Linux behavior preserved by code/test inspection where host execution was unavailable.
- Residual untested platforms/channels: real x86_64 macOS, macOS 11.0, Linux runtime, HFS+/network filesystems, downloaded/quarantined artifacts, Developer ID/notarization, SIGKILL/power-loss residue, and deterministic execution of the accepted final-check-to-publication pinned-parent relocation window.

## Handoff

- Next role: Orchestration owner to index this trace; then `artifact-verifier` or final synthesis if release-matrix/generated-artifact evidence is required.
- Limitations: Validation ran on Darwin arm64/APFS only. Universal x86_64 presence and reproducibility were statically/build verified but not executed on real Intel hardware. Linux preservation was inspected against retained tests but not host-executed. `INDEX.md` could not be updated under validator permissions.
- Risks: The explicitly accepted parent-relocation window, partial publication after operation zero, uncatchable-signal residue, filesystem-specific hard-link behavior, and unauthenticated publisher provenance remain.
