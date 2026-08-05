# Bootstrap Descriptor Alias Research Trace

## Metadata

- orchestrationId: `2026-08-04-bootstrap-descriptor-alias`
- role: `researcher`
- artifactId: `root-researcher-001-descriptor-alias`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Scoped request to diagnose the reported macOS bootstrap failure; relevant bootstrap, manifest, tests, validators, history, and docs; permission to reproduce or inspect host filesystem behavior; no source edits; exact orchestration and trace paths.
- Required context present: `orchestrationId`, scoped question, source constraints, current-host freshness requirement, downstream diagnosis needs, relevant paths, and routing status were supplied.
- routingMetadataStatus: `absent`. Caller routing metadata labels were absent and none were invented.
- Resolved routing: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Traced manifest validation and bootstrap control flow, reproduced the failure against the reported target and a fresh temporary APFS directory, isolated both declared aliases with direct Node probes, consulted the host `fd(4)` manual, ran the focused fresh-install E2E case, and reviewed prior portability remediation/acceptance history.
- Files read: `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/portable.manifest.json`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `AGENTS.md`; `opencode-harness.design.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/protocols/memory-management.md`; trace/index templates; prior portability implementer/reviewer traces and orchestration index.
- Files changed: This trace only; no source files were edited. Role permissions blocked the requested orchestration index and delegation-packet writes.
- Commands/checks:
  - `node .opencode/scripts/bootstrap-portable-harness.mjs --target ../project-open-court/` — reproduced exit 1 and the exact diagnostic.
  - Same command with `--dry-run` — passed preflight and reported 43 managed plus four memory operations; descriptor publication was not exercised.
  - Direct Node alias probes on macOS 15.6 / Node v26.4.0 — `/proc/self/fd/<fd>` failed `ENOENT`; `/dev/fd/<fd>` with `O_RDONLY|O_DIRECTORY` failed `ENOTDIR`.
  - Follow-up probe — `/dev/fd/<fd>` with `O_RDONLY` duplicated the target directory and matched device/inode, but descendant `mkdir` failed `ENOENT`; `chdir('/dev/fd/<fd>')` failed `ENOTDIR`.
  - Fresh temporary APFS target bootstrap — same diagnostic, exit 1, target remained empty.
  - `node --test --test-name-pattern='fresh foreign repository installs' .opencode/scripts/portable-harness.test.mjs` — failed at test line 49 with the same diagnostic.
  - `node --check .opencode/scripts/bootstrap-portable-harness.mjs` — passed.
  - `node .opencode/scripts/validate-portable-harness.mjs --root .` — passed; it validates the declared object, not host usability.
  - `MANPAGER=cat man 4 fd` — documented `/dev/fd/#` as descriptor files whose open duplicates an existing descriptor.
  - `git log`, `git blame`, and focused history inspection — current implementation originated in commit `02ce120`; prior Linux acceptance left `/dev/fd` unexercised.

## Output Contract

- Outputs: Cited findings, source list, implementation implications, risks, unresolved questions, and recommended next role.
- Evidence: Direct evidence and inference are distinguished below.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/researcher/root-researcher-001-descriptor-alias.md`.

### Cited Findings

1. **Exact check (direct).** Bootstrap opens and identity-checks the target at `.opencode/scripts/bootstrap-portable-harness.mjs:316-321`, calls alias discovery at `:322`, and emits the diagnostic when discovery returns `null` at `:323`. In discovery, `/proc/self/fd` fails the candidate open at `:170` with `ENOENT`; `/dev/fd` fails that `open(alias/fd, O_RDONLY|O_DIRECTORY)` with `ENOTDIR`. The catch at `:176-177` hides each cause and exhausts the list.
2. **Why `/dev/fd` is unusable (direct plus inference).** Host `fd(4)` defines `/dev/fd/#` as descriptor duplication. Plain `O_RDONLY` open returned a matching directory handle, but `/dev/fd/<fd>/<child>` was not traversable and `chdir` failed. **Inference:** Darwin `/dev/fd` is not the Linux procfs magic-link pathname primitive assumed by `descriptorPath()` (`:90-92`) and descendant operations (`:95-103,139-153,187-204`). Removing `O_DIRECTORY` only moves failure to descendant creation at `:172`; it is not a fix.
3. **Fail-closed behavior matches the current contract (direct).** The manifest requires descriptor-relative hard-link publication and fail-before-file-publication (`.opencode/portable.manifest.json:4-11`); bootstrap requires that exact object (`bootstrap:23-45`) and the validator duplicates it (`validate-portable-harness.mjs:61-66,106-130`). The temporary target remained empty, matching `portable-harness.test.mjs:164-169`. The portability assumption is defective; this failure behavior is intentional under that assumption.
4. **Not target path/permissions (direct plus inference).** The reported target is an existing writable real directory and dry-run succeeds. An unrelated fresh writable APFS target fails identically. Failure precedes destination-parent setup and hard-link probes (`bootstrap:323` before `:326` and `:187-198`). **Inference:** contents, trailing slash, target permissions, and hard-link support do not cause this diagnostic.
5. **Coverage gap (direct).** Fresh install expects an alias (`portable-harness.test.mjs:49-54`) and fails on this Mac. Forced unavailability (`bootstrap:161-163`; test `:164-169`) does not emulate Darwin. Validation checks manifest text only. Prior final history explicitly records Linux `/proc/self/fd` selection and untested `/dev/fd` (`portable-implementer-017-remediation-loop3.md:23,35`; prior orchestration `INDEX.md:222`).
6. **Smallest plausible direction (inference, diagnosis only).** Alias order or flags cannot fix descendant traversal. The smallest compatibility-oriented direction is a declared macOS non-descriptor mode, such as the earlier canonical identity-revalidation plus hard-link fallback (`portable-implementer-015-remediation-loop2.md:20,27,35`), with manifest/validator/macOS E2E changes. But prior review rejected that fallback for a publication-time ancestor race (`root-reviewer-016-final-review.md:42,53,58`), and loop 3 removed it (`portable-implementer-017-remediation-loop3.md:20,27`). If the strong guarantee is non-negotiable, the correct direction is larger: real Darwin `openat`/`mkdirat`/`linkat`/`renameat`/`unlinkat` via a native helper/API, or explicitly declare macOS unsupported.

### Source List

- `.opencode/scripts/bootstrap-portable-harness.mjs:23-45,90-103,139-204,271-340`.
- `.opencode/portable.manifest.json:4-11`.
- `.opencode/scripts/portable-harness.test.mjs:49-75,164-186`.
- `.opencode/scripts/validate-portable-harness.mjs:61-66,106-130`.
- Prior traces: `portable-implementer-015-remediation-loop2.md:20-35`, `root-reviewer-016-final-review.md:38-59`, `portable-implementer-017-remediation-loop3.md:20-35`, and prior orchestration `INDEX.md:219-222`.
- macOS 15.6 local `fd(4)` manual and host probes recorded above.

### Implementation Implications

- Do not change only line 170; descendant pathname operations still fail.
- Any compatibility change must update bootstrap, manifest capability data, validator expectations, and macOS E2E coverage together.
- Preserve fail-before-publication evidence for the selected mode and all destination parents.

### Risks and Unresolved Questions

- Restoring fallback weakens the ancestor-race guarantee; native `*at` support adds build/distribution complexity and conflicts with built-ins-only direction.
- Dropping macOS preserves the present guarantee but does not satisfy the use case.
- Unresolved: portability versus the current adversarial-race guarantee; no accepted macOS-specific tradeoff is documented.

## Handoff

- Next role: `planner`, to choose an explicit capability/security contract before implementation.
- Limitations: One macOS 15.6 / Node v26.4.0 APFS host; no fix, full suite, native prototype, post-fix validation, or acceptance. The requested orchestration index and delegation packet could not be written under researcher edit permissions.
- Risks: Continuing to treat `/dev/fd` as Linux-like will fail on stock macOS; fallback without an explicit threat-model decision reintroduces the documented TOCTOU risk.
