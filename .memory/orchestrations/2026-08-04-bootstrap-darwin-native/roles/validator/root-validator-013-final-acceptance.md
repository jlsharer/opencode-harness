# Darwin Native Bootstrap Final Acceptance — Remediation Loop 2

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `validator`
- artifactId: `root-validator-013-final-acceptance`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Current implementation after `root-implementer-012-remediation-loop2.md`; changed-file set; complete acceptance gates; required repeated portable runs, 31-case native suite, lifecycle signal-gap cleanup, exact exclusive 256 MiB boundary, fresh bootstrap/installed validation, integrity failures, reproducibility, signatures, validators, syntax/diff, and current-hash consistency checks.
- Required context present: `orchestrationId`, changed files, verification criteria, commands, closed schema and manifest contracts, expected warnings, acceptance standard, skipped-check policy, routing status, permitted trace/index scope, and required hash were present.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented. Resolved routing context remains `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Independently inspected loop-2 implementation and evidence; reran syntax/diff, 31 native cases, three complete portable suites, both validators, reproducible build, all-slice signature/hash/architecture checks, and direct safe-target fresh/dry/missing/corrupt-helper checks; inspected lifecycle coordinator, exclusive frame-bound implementation, Linux preservation, and current hash propagation.
- Files read: `root-implementer-012-remediation-loop2.md`; orchestration `INDEX.md`; prior role evidence; memory protocol, validator contract, and trace schema; C helper; bootstrap/build/native-test/portable-test/portable-validator/source-validator scripts; portable/source manifests; design documentation; Git status/diff.
- Files changed: This validator trace only. No implementation file was edited. Validator permissions do not permit `INDEX.md`; the orchestration owner must add this artifact link.
- Commands: Exact command groups and results are summarized below.

## Output Contract

- Outputs: Final PASS/FAIL matrix, command outputs, schema/hash results, security and activation findings, remediation list, residual limits, and acceptance decision.
- Evidence: All current implementation gates passed. Native tests passed 31/31; each of three portable runs passed 22 with one accepted-limitation skip; both validators passed; exact committed bytes reproduced; all architecture signatures passed; direct fresh, dry-run, and integrity/prepublication checks passed without adding activation residue.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/validator/root-validator-013-final-acceptance.md`; orchestration `INDEX.md` requires an owner update.

### Final PASS/FAIL Matrix

| Gate | Result | Evidence |
|---|---|---|
| Syntax and diff hygiene | PASS | Six `node --check` commands plus `git diff --check` exited 0 without output. |
| Native helper suite | PASS | 31 passed, 0 failed/skipped. |
| Repeated portable suite | PASS | Three consecutive normal-concurrency runs: each 22 passed, 0 failed, 1 expected pinned-parent-limit skip. |
| Lifecycle-wide signal gaps | PASS | Active-helper SIGTERM plus signal-after-directory, between-helper-runs, and final-cleanup cases preserved SIGTERM semantics and removed each invocation's private activation directory. |
| Timeout/output cleanup | PASS | Helper timeout and output overflow terminated before publication and left no invocation-scoped activation directory. |
| Exclusive 256 MiB boundary | PASS | JS and C reject total frame length `>= 268435456`; exact-bound header case was rejected before target effects without allocating 256 MiB. Maximum representable valid contract length is 268,435,455 bytes. |
| Fresh exact bootstrap | PASS | `created/updated=45, memory-created=4, unchanged=0, collisions=0, write-safety=darwin-native-race-detecting`. |
| Installed validation | PASS | Fresh installed validator reported `Portable OpenCode harness validation passed`. |
| Dry-run | PASS | Reported 45 managed/4 memory with `write-safety=not-exercised`; target remained empty. |
| Missing/corrupt helper | PASS | Both failed before publication; both destination targets remained empty. |
| Reproducible build | PASS | Exact committed bytes reproduced with required hash, `arm64,x86_64`, macOS 11.0, and all-slice ad-hoc signing. |
| Signature verification | PASS | `codesign --verify --strict --all-architectures` passed; both slices were ad-hoc with no Team ID. |
| Portable validator | PASS | Passed with expected non-fatal Node module-type warning. |
| Source validator | PASS | Passed with expected non-fatal Node module-type warning. |
| Hash consistency | PASS | Binary, manifest, bootstrap, installed validator, build output, and implementer trace agree on `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`. |
| Linux contract preservation | PASS by inspection | Ordered aliases remain `/proc/self/fd`, `/dev/fd`; descriptor-relative Linux branch and Linux-specific test expectations/failure seam remain. Linux host execution was unavailable. |
| Routing/schema/portable boundary | PASS | Closed portable v2, exact inventories, role/trace alignment, neutral routing, binary handling, and source-only build/test classification passed validators. |

### Commands and Results

1. Six syntax checks and `git diff --check` — exit 0, no output.
2. `node --test .opencode/scripts/darwin-portable-fs.test.mjs` — 31 passed, including exact-exclusive-bound, malformed/bounds/path/identity, publication/cleanup, and direct helper termination cases.
3. `for run in 1 2 3; do node --test .opencode/scripts/portable-harness.test.mjs; done` — all three runs passed 22/23 with only the documented pinned-parent relocation skip.
4. `node .opencode/scripts/validate-portable-harness.mjs --root .` — passed.
5. `node .opencode/scripts/validate-harness.mjs` — passed.
6. `node .opencode/scripts/build-darwin-portable-fs.mjs --check` — `sha256=931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`, `architectures=arm64,x86_64`, `min-macos=11.0`, `signing=adhoc-all-slices-no-team-id`.
7. `codesign --verify --strict --all-architectures`, per-architecture `codesign -dvvv`, `lipo -archs`, and `shasum -a 256` — all passed; both slices ad-hoc/no-Team-ID; hash exact.
8. Safe temporary sequence under `/var/folders/.../T/opencode`: exact fresh bootstrap, installed validation, dry-run empty assertion, two installed source profiles, one-byte helper corruption, helper removal, separate expected-failure empty targets, activation-directory before/after comparison, and validator temp cleanup — all implementation assertions passed. Corrupt error: `Darwin native helper SHA-256 does not match the portable manifest`; missing error: `managed source is not a regular file`.
9. Current-content inspection/search — verified C early rejection at declared/actual total `>= MAX_FRAME`, JS `total >= 256 * 1024 * 1024`, lifecycle coordinator coverage, Linux aliases/branch, and exact current hash propagation.

### Schema and Hash Results

- Portable manifest remains closed at schema/profile `2.0.0`/`portable-core`; protocol remains v1 with an exclusive 256 MiB ceiling.
- Required hash is present in the three runtime/validation authorities: portable manifest, bootstrap, and installed validator. Source validator derives and checks it. The universal binary and reproducible build emitted the same hash.
- Portable/source inventory and native runtime versus source-only tooling classifications passed.
- This artifact supplies all validator output-contract elements and trace-schema fields at the required path. Routing metadata remains absent without invented labels.

### Security and Activation Findings

- PASS: One Darwin lifecycle coordinator is installed before private activation creation, remains through final cleanup, tracks at most one child, terminates/reaps active children, retains pending catchable signals through cleanup, disposes handlers once, and restores original signal termination semantics.
- PASS: Deterministic invocation-scoped tests cover every identified activation lifecycle gap and are isolated from concurrent processes. Three full-suite runs showed no current invocation residue or namespace interference.
- PASS: Trusted root-owned sticky activation parent, private materialization, exact hash recheck, absolute no-shell launch, empty helper environment, protocol/architecture self-test, timeout/output bounds, and final cleanup remain enforced.
- PASS: Exact 256 MiB declaration is rejected early in C after header input; JS and C use the same exclusive comparison.
- PASS: Missing/corrupt helper and capability/preflight failures occur before managed or memory publication in executed cases.
- Observation: The direct check saw an unchanged system-wide count of 18 before/after; a subsequent count was 17, indicating unrelated concurrent/transient activity. The remaining 17 invocation-labeled directories carry earlier process IDs. Every current invocation-scoped cleanup assertion passed and no current-prefix directory remained. Pre-existing directories were not removed to avoid altering unrelated/historical evidence.
- Lifecycle hooks were not treated as acceptance evidence.

### Remediation List

- Implementation remediation: none required by this validator rerun.
- Orchestration owner: add `roles/validator/root-validator-013-final-acceptance.md` to `INDEX.md`; validator permissions deny that edit.
- Operational cleanup: review/remove the 17 pre-existing stale `/private/var/tmp/opencode-portable-helper-*` directories when no related process needs them; they were not created by this final validation.
- Release matrix: execute on Linux, real Intel macOS, and oldest-supported macOS before claiming those host runs.

### Final Acceptance and Residual Limits

- **PASS** — final acceptance for the current remediation-loop-2 implementation on the tested Darwin arm64/APFS host.
- Residual limits: no Linux host execution, real x86_64 macOS execution, macOS 11.0 host, non-APFS filesystem, downloaded/quarantined distribution, Developer ID/notarization, SIGKILL, kernel failure, or power-loss cleanup. The accepted concurrent pinned-parent relocation window and possible post-publication partial state remain. Ad-hoc signing/hash consistency does not authenticate the publisher.

## Handoff

- Next role: Orchestration owner to index this final validator trace; artifact-verifier/reviewer final rerun or synthesis if required by the parent workflow.
- Limitations: Runtime evidence is Darwin arm64/APFS. The x86_64 slice was reproducibly built, statically inspected, and signature-verified but not executed on Intel hardware; Linux was inspection-only.
- Risks: Accepted pinned-parent relocation, uncatchable-failure residue, non-APFS hard-link behavior, post-publication partial state, and unauthenticated distribution remain.
