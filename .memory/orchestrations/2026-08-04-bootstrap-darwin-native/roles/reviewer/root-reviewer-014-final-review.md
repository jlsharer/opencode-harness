# Darwin Native Bootstrap Final Defect Review

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `reviewer`
- artifactId: `root-reviewer-014-final-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Final remediation-loop defect review after `root-implementer-012-remediation-loop2.md`; verify closure of activation signal gaps, nondeterministic cleanup tests, and exact protocol-bound inconsistency; re-audit the complete uncommitted Darwin implementation for security, correctness, portability, fail-before-publication, parser/memory, signal, hash/manifest, and Linux regressions; do not edit implementation.
- Required context present: Orchestration ID, prior reviewer findings, loop-2 implementer artifact, complete current changed implementation, intended behavior, accepted pinned-parent limitation, test expectations, and routing status were present.
- routingMetadataStatus: `absent`. Resolved routing context remains `agent=null, model=null, variant=null, source=unresolved`; caller routing labels were absent and none were invented.

## Work Performed

- Summary: Read the loop-2 implementation trace, prior remediation review, complete current bootstrap/C/build/test/manifest/validator/documentation surfaces, orchestration index, and current diffs; traced signal coordinator lifecycle and error precedence, parser allocation/bounds/free paths, root/parent identity and publication ordering, activation trust and cleanup, hard-link/rename semantics, signing/hash propagation, and Linux backend retention; independently reran focused and full checks.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/{implementer/root-implementer-012-remediation-loop2.md,reviewer/root-reviewer-010-remediation-review.md}`; orchestration `INDEX.md`; `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/bootstrap/native/darwin-portable-fs.universal` metadata; `.opencode/scripts/{bootstrap-portable-harness.mjs,build-darwin-portable-fs.mjs,darwin-portable-fs.test.mjs,portable-harness.test.mjs,validate-portable-harness.mjs,validate-harness.mjs}`; `.opencode/{portable.manifest.json,harness.manifest.json}`; `opencode-harness.design.md`; current Git status/diff.
- Files changed: This reviewer trace only. Reviewer permissions did not permit `INDEX.md`; no implementation was edited.
- Commands:
  - `git diff --check` and six `node --check` entry points — passed.
  - `node --test .opencode/scripts/darwin-portable-fs.test.mjs` — 31/31 passed.
  - Three consecutive `node --test .opencode/scripts/portable-harness.test.mjs` runs — each passed 22 with 1 accepted pinned-parent skip and no failures.
  - `node .opencode/scripts/build-darwin-portable-fs.mjs --check` — exact reproducible build passed with SHA-256 `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`, `arm64`/`x86_64`, macOS 11.0, and all-slice ad-hoc/no-Team-ID state.
  - `codesign --verify --strict --all-architectures`, `shasum -a 256`, and `lipo -archs` — passed/matched.
  - Portable and source validators — passed; existing module-type warnings were unrelated and non-failing.

## Output Contract

- Outputs: Final findings statement, remediation closure evidence, open questions, verdict, residual risk, concise change summary, and artifact path.
- Evidence: Complete current source inspection plus independent repeated command evidence on Darwin arm64/APFS. Review evidence does not replace validator/artifact-verifier acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/reviewer/root-reviewer-014-final-review.md`.

### Findings

**No security, correctness, portability, cleanup, parser/memory, manifest/hash, or Linux regression findings remain in the reviewed current diff.**

### Prior Finding Closure

1. **Activation signal gaps — closed.** One coordinator is created before activation at `.opencode/scripts/bootstrap-portable-harness.mjs:561-567`, retains handlers and a keepalive for the entire lifecycle (`:85-140`), tracks/terminates/reaps at most one child (`:93-123,143-190`), preserves a pending signal through activation and final cleanup (`:259-287,587-598`), and then restores signal termination semantics (`:634-640`). Deterministic tests cover after-directory creation, between helper runs, active-helper execution, and final cleanup at `.opencode/scripts/portable-harness.test.mjs:248-306`; all passed repeatedly.

2. **Nondeterministic global cleanup assertions — closed.** Test-only validated invocation IDs produce unique activation prefixes (`bootstrap-portable-harness.mjs:252-257,267`), and assertions filter only the matching prefix (`portable-harness.test.mjs:47-51,214-225,248-306`). Three full normal-concurrency runs passed without interference.

3. **Exact frame-bound inconsistency — closed.** JS rejects totals `>= 256 MiB` before allocation (`bootstrap-portable-harness.mjs:193-198`). C documents the same exclusive limit, rejects a declared exact/greater boundary after the header, and rejects final lengths at the same boundary (`.opencode/bootstrap/native/darwin-portable-fs.c:29-30,282-305,345-352`). The low-cost exact-boundary test is at `.opencode/scripts/darwin-portable-fs.test.mjs:110-142` and passed.

4. **Earlier identity, activation environment, parser coverage, Linux alias, and signing findings remain closed.** The exact BigInt target identity is validated and sent unchanged (`bootstrap-portable-harness.mjs:516-530,578`); helper execution uses a fixed verified root-owned sticky parent and empty environment (`:145-149,259-278`); parser/syscall tests pass 31 cases; Linux retains `/proc/self/fd` then `/dev/fd` (`:55,611-613`; `.opencode/portable.manifest.json:10-16`); and both Mach-O slices reproduce and verify as ad-hoc/no Team ID.

5. **No active contract drift.** The source binary, portable manifest (`.opencode/portable.manifest.json:21-30`), bootstrap (`bootstrap-portable-harness.mjs:59-66`), and installed validator use SHA-256 `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`; current architecture, protocol, minimum-OS, signing, backend, preflight, and limitation values agree. Older values occur only in superseded historical traces.

### Open Questions

- None within the reviewed implementation scope. Cross-host/release-channel evidence remains a validation and artifact-verification concern rather than a code-review defect.

### Verdict

**Review pass: no remaining defect finding.** The loop-2 changes close all findings from `root-reviewer-010-remediation-review.md` without an observed new defect. Final orchestration acceptance still requires current independent validator and artifact-verifier evidence for the regenerated binary.

### Residual Risk

- Accepted concurrent pinned-parent relocation can move publication outside the root between reachability check and mutation; this implementation intentionally detects rather than atomically prevents that case.
- Runtime failures after operation zero can leave a partial install. `SIGKILL`, kernel failure, and power loss can leave published files, exact temporary residue, empty directories, or activation residue.
- Real Intel hardware, Linux host, oldest supported macOS, non-APFS filesystems, and downloaded/quarantined release behavior were not exercised by this reviewer.
- Ad-hoc signing and in-bundle SHA-256 consistency do not authenticate the publisher, provide Developer ID identity, establish notarization, or make quarantined distribution Gatekeeper-ready.
- Same-effective-UID/root attackers remain outside the documented private activation-path substitution threat model.

### Change Summary

- The complete change adds a universal Darwin descriptor-relative helper and closed protocol/backend contract, secure private activation, exact root binding, all-parent preflight and hard-link no-clobber publication, lifecycle-wide signal cleanup, reproducible all-slice signing/hash verification, binary-safe validation, expanded race/parser/cleanup tests, restored Linux aliases, and scoped security/release documentation.

## Handoff

- Next role: `validator` and `artifact-verifier` for final loop-2 evidence on the regenerated binary; reviewer found no implementation blocker.
- Limitations: Darwin arm64/APFS review only; no implementation edits, Linux/real-Intel/old-macOS/non-APFS/quarantined-host runs, exhaustive fuzzing, or uncatchable-failure proof. `INDEX.md` was not updated because reviewer permissions did not allow it.
- Risks: Only the documented residual risks above remain; no new defect was identified.
