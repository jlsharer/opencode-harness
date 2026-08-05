# Darwin Native Bootstrap Security and Regression Review

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `reviewer`
- artifactId: `root-reviewer-006-security-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Review the complete current uncommitted Darwin-native bootstrap implementation and prior researcher/planner/implementer/integrator evidence from a defect-first security and regression stance; prioritize protocol/parser exploitation, descriptor containment races beyond the accepted pinned-parent relocation limit, fail-before-publication, temporary executable integrity/permissions/cleanup, no-clobber, manifest/hash drift, compatibility, Linux regressions, and missing tests; do not edit implementation.
- Required context present: `orchestrationId`, changed paths/diff, intended behavior, risk areas, test expectations, accepted concurrent pinned-parent rename limitation, role artifacts, and routing status were present. Final validator/artifact-verifier evidence was not present and was not required to conduct this review.
- routingMetadataStatus: `absent`. Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`. No caller routing labels were invented.

## Work Performed

- Summary: Read all supplied role artifacts, the complete changed implementation and documentation surfaces, and current diffs; reviewed the C frame parser, descriptor traversal/publication/cleanup, Node transport and helper activation, manifests, validators, build tooling, native/portable tests, and Linux dispatch; ran focused non-acceptance checks and recorded security/regression findings without changing implementation.
- Files read: Researcher, planner, implementer, and integrator artifacts; orchestration index; memory protocol/template; reviewer role contract and trace schema; `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/bootstrap/native/darwin-portable-fs.universal` metadata; `.opencode/scripts/{bootstrap-portable-harness.mjs,build-darwin-portable-fs.mjs,darwin-portable-fs.test.mjs,portable-harness.test.mjs,validate-portable-harness.mjs,validate-harness.mjs}`; `.opencode/{portable.manifest.json,harness.manifest.json}`; `opencode-harness.design.md`; complete current Git diff/status.
- Files changed: This reviewer trace only. Reviewer permissions did not permit updating the orchestration `INDEX.md`; no implementation file was edited.
- Commands/checks:
  - `git status --short`, `git diff --stat`, `git diff --name-only`, implementation diff inspection, and `git diff --check`.
  - `node --check` for bootstrap, build, native test, portable test, and portable validator entry points (passed).
  - `node --test .opencode/scripts/darwin-portable-fs.test.mjs` (3/3 passed).
  - `node --test .opencode/scripts/portable-harness.test.mjs` (15 passed, 1 accepted-limitation skip).
  - `node .opencode/scripts/build-darwin-portable-fs.mjs --check` (passed).
  - `shasum -a 256`, `file`, `lipo -archs`, and `codesign -dv` on the universal helper (hash matched; `x86_64` and `arm64`; linker ad-hoc/no Team ID).

## Output Contract

- Outputs: Severity-ordered findings with exact references, open questions, residual risk, concise change summary, checks, and handoff guidance.
- Evidence: Findings are grounded in the current source and test lines. Passing checks establish only the exercised cases and do not resolve the reported race, activation-environment, parent-termination, Linux fallback, or coverage defects.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/reviewer/root-reviewer-006-security-review.md`.

### Findings

1. **High — The Darwin root identity can be attacker-selected in a race between the two preflight snapshots.** `.opencode/scripts/bootstrap-portable-harness.mjs:408-411` takes a Number-valued `targetIdentity`, then a separate BigInt-valued `targetProtocolIdentity`, but validates `targetStat` only against the first snapshot. The Darwin request later binds the helper to the unvalidated second snapshot at `:456`, and the helper faithfully accepts that supplied identity at `.opencode/bootstrap/native/darwin-portable-fs.c:367-374`. A concurrent actor can replace the target directory after line 409 but before line 410; line 411 still validates the old snapshot while the helper is instructed to accept and publish into the replacement. This is a root-substitution/identity-binding defect distinct from the accepted window in which an already pinned destination parent is renamed after a reachability check. Existing race tests move the target only after helper activation (`.opencode/scripts/portable-harness.test.mjs:139-162`) and do not exercise the split-snapshot window.

2. **Medium — Hash verification does not control the environment or path used for either helper execution.** `runChild` inherits the complete environment at `.opencode/scripts/bootstrap-portable-harness.mjs:79-82`, so the ad-hoc, non-hardened helper is launched with caller-controlled Darwin loader variables such as `DYLD_INSERT_LIBRARIES`; hash and self-test checks do not establish that only the hashed code executes. In addition, activation trusts environment-derived `os.tmpdir()` at `:164`, verifies the pathname bytes at `:167-171`, returns that pathname, and reopens it for the real request only at `:457`. If a more-privileged invocation inherits an attacker-controlled/writable `TMPDIR` parent, that parent owner can rename the supposedly private activation directory and substitute the executable after verification despite the child directory/file modes. The design claims no environment-controlled production behavior and an exact private helper copy (`opencode-harness.design.md:43-45`), but the launcher does not enforce that claim. This requires an untrusted inherited environment or activation parent; standard sticky `/tmp` limits the directory-substitution variant, but not loader-variable inheritance.

3. **Medium — Parent termination is not coupled to helper termination/waiting, so publication can continue and activation residue can remain.** `runChild` handles only child events and an internal timeout (`.opencode/scripts/bootstrap-portable-harness.mjs:79-109`); it installs no parent `SIGINT`/`SIGTERM`/exit coordination. The activation directory is removed only by the ordinary async `finally` at `:445-462`. If only the Node parent is terminated while the helper is processing a request, the child can continue publishing independently and the parent cannot execute that cleanup. This violates the planner's explicit terminate/wait/remove contract and means an operator-requested abort can still mutate the destination. Neither `.opencode/scripts/darwin-portable-fs.test.mjs:22-65` nor the portable suite tests parent-only termination.

4. **Medium — The parser/syscall suite is far narrower than the approved security gate and leaves the highest-risk native surface effectively untested.** The focused native suite contains only self-test, one bootstrap no-clobber/overwrite/rerun flow, and a three-byte malformed request (`.opencode/scripts/darwin-portable-fs.test.mjs:22-65`). It does not exercise wrong version/flags/declared length, trailing frames, reserved bytes, oversized counts/path/content, duplicate/absolute/dot-dot/NUL/invalid-UTF-8 paths, integer boundaries, identity mismatch, close/write/link/rename failures, created-directory cleanup, helper timeout/output overflow, parent-only termination, SIGKILL residue, or deterministic relocation synchronization required by the planner (`.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/planner/root-planner-002-native-plan.md:54,67-71,105-117`). The current parser inspection did not reveal an immediate memory-corruption primitive, but the passing 3-test suite is insufficient regression evidence for a 256 MiB C parser and filesystem mutator.

5. **Low — Linux loses the previously declared `/dev/fd` fallback without a Linux-host regression result.** The prior implementation tried both aliases; the new manifest retains only `/proc/self/fd` at `.opencode/portable.manifest.json:10-15`, and bootstrap uses only that closed list at `.opencode/scripts/bootstrap-portable-harness.mjs:475-477`. Linux environments exposing a usable `/dev/fd` alias but not the literal `/proc/self/fd` path now fail before publication rather than bootstrap. The portable test hard-codes `/proc/self/fd` in its expected output at `.opencode/scripts/portable-harness.test.mjs:53`, and all recorded implementation/integration runs were Darwin, so no Linux host established that this compatibility reduction is harmless. This may be an intentional contract narrowing, but it conflicts with the handoff statement to preserve existing Linux behavior unless explicitly accepted.

### Open Questions

- Is the bootstrap expected to be safe when launched through `sudo`, CI, or another privilege boundary with an inherited `TMPDIR`/`DYLD_*` environment? If yes, finding 2 is an integrity blocker; if no, the trusted-environment precondition needs to be explicit and release-tested.
- Was removal of Linux `/dev/fd` deliberately accepted, or should Linux retain every previously usable descriptor alias while Darwin uses only the native backend?
- What mechanism/test is intended to guarantee parent-only termination stops the helper before further publication? Foreground process-group behavior is not sufficient for direct `kill(parentPid, SIGTERM)` and service-manager cases.
- Will remediation add deterministic synchronization around the two root identity snapshots, or eliminate the second independently trusted snapshot?

### Residual Risk

- Accepted: an already pinned parent can be moved outside the root between a reachability check and mutation; post-publication failures can leave partial state; SIGKILL/power loss can leave destination residue.
- Unverified: real x86_64 hardware, oldest supported macOS, Linux host, HFS+/network filesystems, downloaded/quarantined distribution, Developer ID/notarization, and publisher authenticity.
- The helper-created-directory `mkdirat`/`openat` interval (`.opencode/bootstrap/native/darwin-portable-fs.c:180-195`) still permits concurrent replacement before the new parent is pinned; this appears bounded by the accepted adversarial directory-rename model but deserves deterministic race coverage because cleanup records the created name/fd separately (`:148-165,293-303`).
- The manifest/hash, universal slices, current-host reproducible build, no-clobber flow, ordinary activation cleanup, and current Darwin test cases were consistent in this review.

### Change Summary

- Adds a universal Darwin libc helper and protocol-v1 batch publisher, private materialization/self-test/dispatch, closed backend/hash metadata, binary-safe validators, release build tooling, native/portable tests, source inventory, and scoped security documentation while narrowing Linux alias declaration to `/proc/self/fd`.

## Handoff

- Next role: `implementer` for remediation of findings 1-4 and an explicit decision on finding 5, then `validator` and `artifact-verifier`; no acceptance is recommended from this review.
- Limitations: Review ran on Darwin arm64/APFS and did not edit implementation, fuzz the full 256 MiB protocol space, run Linux/real x86_64/old-macOS hosts, or perform downloaded/quarantined and privilege-boundary tests. Existing checks are review evidence, not final acceptance validation. `INDEX.md` was not updated because reviewer edit permissions did not allow it.
- Risks: Root substitution, environment/path-based helper integrity bypass, orphaned publication after parent termination, under-tested parser/syscall cleanup, and Linux fallback regression remain open.
