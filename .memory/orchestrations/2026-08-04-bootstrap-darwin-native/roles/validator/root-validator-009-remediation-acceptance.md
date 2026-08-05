# Darwin Native Bootstrap Remediation Acceptance

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `validator`
- artifactId: `root-validator-009-remediation-acceptance`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation-loop implementation and `root-implementer-008-remediation-loop1.md`; current changed files; prior orchestration evidence; requested full acceptance rerun emphasizing snapshot binding, trusted/sanitized activation, signal coordination, protocol/failure coverage, Linux aliases, all-slice signing, integrity failures, fresh bootstrap, validators, and reproducibility.
- Required context present: `orchestrationId`, changed files, verification criteria, commands, closed schema/manifest contracts, expected warnings, acceptance standard, skipped-check policy, routing status, and permitted trace/index scope were present.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented. Resolved routing context supplied by caller remains `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Independently inspected remediation code and tests, reran all syntax/build/native/portable/validator gates, directly verified both architecture signatures and trusted activation-parent metadata, executed an exact fresh bootstrap and installed validator, proved dry-run emptiness and missing/corrupt-helper prepublication failure, and confirmed no activation-directory residue.
- Files read: `root-implementer-008-remediation-loop1.md`; orchestration `INDEX.md`; prior role evidence; role contract, trace schema, and memory protocol; C helper; bootstrap/build/native-test/portable-test/portable-validator/source-validator scripts; portable/source manifests; design documentation; Git status/diff.
- Files changed: This validator trace only. No implementation file was edited. Validator permissions do not permit `INDEX.md`; the orchestration owner must add this artifact link.
- Commands: Exact gates and result summaries are recorded below. One initial composite temporary-target command used zsh's read-only variable `status` after the fresh bootstrap/dry-run had passed; the negative-case continuation was rerun with `rc`, passed, and all temporary state was removed.

## Output Contract

- Outputs: Remediation PASS/FAIL matrix, command outputs, schema results, security/activation findings, remediation list, residual limitations, and acceptance decision.
- Evidence: Syntax and diff checks passed; native tests passed 30/30; portable E2E passed 18 with one accepted-limitation skip; both validators passed; reproducible build and exact hash passed; all-architecture and per-slice signatures passed; direct fresh/dry/integrity checks passed with zero activation residue.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/validator/root-validator-009-remediation-acceptance.md`; orchestration `INDEX.md` requires an owner update.

### PASS/FAIL Matrix

| Gate | Result | Evidence |
|---|---|---|
| Syntax and diff hygiene | PASS | Six `node --check` commands and `git diff --check` exited 0 without output. |
| Split-snapshot closure | PASS | Bootstrap carries the exact preflight BigInt `dev/ino` through canonical identity comparison into the helper request; deterministic between-snapshot replacement failed with both original and replacement roots empty. |
| Trusted activation parent | PASS | `/private/var/tmp` resolved exactly and was `root`, mode `drwxrwxrwt`/`0777` with sticky bit; bootstrap enforces root ownership/sticky directory and uses a private `mkdtemp` child. |
| Sanitized execution environment | PASS | Helper spawn uses an empty environment; poisoned `TMPDIR` and `DYLD_*` test passed and attacker temp remained unused. |
| Signal termination/reaping/cleanup | PASS | Direct helper SIGTERM and parent-bootstrap SIGTERM tests passed; timeout/output-overflow tests killed/reaped before publication; activation baseline returned to zero. |
| Expanded protocol/failure tests | PASS | Native suite passed 30/30, including malformed headers, bounds, reserved/trailing/truncated frames, unsafe/NUL/invalid UTF-8/duplicate paths, identity mismatch, syscall publication, preflight cleanup, forced write/rename cleanup, and termination. |
| Portable E2E | PASS | 18 passed, 0 failed, 1 expected skip for the accepted pinned-parent relocation limitation. |
| Linux candidate contract | PASS by inspection | Manifest/bootstrap/installed validator restore ordered candidates `['/proc/self/fd', '/dev/fd']`; Linux descriptor-relative implementation and Linux-specific assertions/failure seam remain. No Linux host was available. |
| All-architecture signing | PASS | `codesign --verify --strict --all-architectures` passed; both `arm64` and `x86_64` reported `Signature=adhoc` and `TeamIdentifier=not set`. |
| Reproducible build | PASS | Exact committed bytes reproduced with SHA-256 `50b795693a854dc4b5051bd6afe96cc63628aea7ecd5649ce5fe17c9678686dc`, `arm64,x86_64`, macOS 11.0, and all-slice ad-hoc signing. |
| Missing/corrupt helper | PASS | Both installed-source cases failed before publication and left destination targets empty. |
| Exact fresh bootstrap | PASS | Reported `created/updated=45, memory-created=4, unchanged=0, collisions=0, write-safety=darwin-native-race-detecting`; installed validator passed. |
| Dry-run | PASS | Reported 45 managed/4 memory and `write-safety=not-exercised`; target remained empty. |
| Portable validator | PASS | `Portable OpenCode harness validation passed`. |
| Source validator | PASS | `OpenCode harness validation passed`. |
| Schema/inventory/hash propagation | PASS | Closed portable v2 and source inventories passed; current hash appears consistently in manifest, bootstrap, and installed validator; obsolete hash remains only in superseded historical traces. |

### Commands and Results

1. `node --check` for bootstrap, build, native test, portable test, portable validator, and source validator, followed by `git diff --check` — exit 0, no output.
2. `node --test .opencode/scripts/darwin-portable-fs.test.mjs` — 30 passed, 0 failed/skipped.
3. `node --test .opencode/scripts/portable-harness.test.mjs` — 18 passed, 0 failed, 1 expected skip.
4. `node .opencode/scripts/validate-portable-harness.mjs --root .` — passed; emitted the expected non-fatal Node module-type warning.
5. `node .opencode/scripts/validate-harness.mjs` — passed; emitted the expected non-fatal Node module-type warning.
6. `node .opencode/scripts/build-darwin-portable-fs.mjs --check` — passed with the exact hash/architectures/minimum-OS/signing values above.
7. `/usr/bin/codesign --verify --strict --all-architectures .opencode/bootstrap/native/darwin-portable-fs.universal` — exit 0. Per-architecture `codesign -dvvv --arch arm64|x86_64` confirmed ad-hoc/no-Team-ID for both slices.
8. `/usr/bin/lipo -archs ...`, `/usr/bin/shasum -a 256 ...`, and `/usr/bin/stat -f '%Su %Sp %OLp %N' /private/var/tmp` — `x86_64 arm64`; expected SHA-256; `root drwxrwxrwt 777 /private/var/tmp`.
9. Safe temporary sequence under `/var/folders/.../T/opencode`: exact fresh bootstrap, installed validator, dry-run/empty assertion, two installed source profiles, one-byte helper corruption and helper removal, expected-failure invocation against separate empty targets, activation-directory baseline comparison, and cleanup — all implementation assertions passed. Corrupt case reported `Darwin native helper SHA-256 does not match the portable manifest`; missing case reported `managed source is not a regular file`; activation baseline and after-count were both zero.
10. `git status --short`, `git diff --stat`, `git diff --name-only`, scoped reads/searches, and repeated hash/alias/signing searches — current implementation and remediation contracts were consistent.

### Schema Results

- Portable manifest remains closed at `2.0.0`/`portable-core`; current helper hash, protocol, exact architectures, macOS floor, all-slice signing label, Linux aliases, safety labels, preflight behavior, and accepted parent-relocation limit agree with bootstrap and installed validator.
- Source manifest and source validator preserve native runtime versus source-only build/test classifications. Portable installation remains limited to managed `.opencode` files and minimal seeded `.memory`.
- This trace contains all validator output-contract elements and required trace fields at the required role path.
- Routing metadata remains absent without invented caller routing labels.

### Security and Activation Findings

- Split-snapshot defect is closed for the tested race: the exact BigInt identity captured before canonicalization is the identity compared after canonicalization and sent to the native helper.
- Activation is rooted in an exact root-owned sticky system directory, materialized into a private directory, hash-verified before and after materialization, self-tested, launched by absolute path without a shell, and executed with an empty environment.
- Parent signal handlers terminate the helper, wait for close/reaping, remove coordination handlers, and only then re-raise the parent signal; deterministic SIGTERM, timeout, and output-overflow paths left no target publication or activation residue.
- All Mach-O slices are explicitly signed and independently verified as ad-hoc/no-Team-ID. This is integrity/provenance metadata, not publisher authentication or notarization.
- Lifecycle hooks were not used as acceptance evidence.

### Remediation List

- Implementation remediation: none from this validator rerun.
- Orchestration owner: add `roles/validator/root-validator-009-remediation-acceptance.md` to `INDEX.md`; validator permissions deny that edit.
- Release-matrix follow-up: run the same suite on Linux, real Intel macOS, and the oldest supported macOS before claiming those host executions.

### Acceptance Decision and Residual Limitations

- **PASS** for remediation loop 1 on the tested Darwin arm64/APFS host.
- Residual limitations: Linux was inspection-only; no real x86_64 execution, macOS 11.0 host, non-APFS filesystem, downloaded/quarantined distribution, Developer ID/notarization, helper/parent SIGKILL, kernel failure, or power-loss cleanup was exercised. Same-effective-uid/root attackers remain outside the private activation substitution threat model. The accepted pinned-parent relocation window and possible post-publication partial state remain.

## Handoff

- Next role: Orchestration owner to index this trace, then reviewer/artifact-verifier rerun or final synthesis as required.
- Limitations: Host execution was Darwin arm64/APFS. Linux preservation and x86_64 execution properties were established only through code/static artifact evidence, except that the x86_64 slice was reproducibly built and signature-verified.
- Risks: Accepted concurrent pinned-parent relocation, uncatchable termination residue, filesystem-specific hard-link behavior, partial post-publication state, and unauthenticated ad-hoc distribution remain.
