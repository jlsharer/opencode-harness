# Bootstrap Descriptor Alias Independent Validation

## Metadata

- orchestrationId: `2026-08-04-bootstrap-descriptor-alias`
- role: `validator`
- artifactId: `root-validator-003-diagnosis`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `changedFiles` (no source changes; researcher and planner traces only), five diagnosis claims, focused commands, role/trace schema contracts, expected Node module-type warning, and the standard that every claim needs independent command-backed evidence before the diagnosis can be accepted.
- Required context present: `orchestrationId`, changed-file status, verification criteria, commands to run, schema contracts, acceptance standard, routing status, exact trace path, reported target, and prohibition on source edits were present.
- routingMetadataStatus: `absent`. Caller routing metadata labels were absent and none were invented.
- Resolved routing: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Reviewed the researcher and planner artifacts, independently traced bootstrap ordering, reproduced the reported failure, probed both descriptor aliases on the current macOS host, compared fresh writable targets with and without a trailing slash, checked the reported target and dry-run, and ran focused/full tests plus both validators. No source code was edited.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/researcher/root-researcher-001-descriptor-alias.md`; `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/planner/root-planner-002-remedy-options.md`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/protocols/memory-management.md`.
- Files changed: This validator trace only; no harness source or implementation files. The separate validation artifact and orchestration index writes were denied by role edit permissions.
- Commands: Exact command/result summaries are retained below because a separate validation artifact could not be written.

## Output Contract

- Outputs: Pass/fail matrix, command outputs, schema results, security and activation findings, remediation list, limitations, and acceptance decision.
- Evidence: Independent macOS 15.6 (Darwin 24.6.0), Node v26.4.0 command evidence. All five requested diagnosis claims pass; current macOS bootstrap acceptance remains failed.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/validator/root-validator-003-diagnosis.md`.

### Pass/Fail Matrix

| Claim | Result | Independent evidence |
|---|---|---|
| 1. Failure is before file publication | **PASS** | Two fresh targets started and ended with `[]`; both exited 1 at alias discovery. Control flow fails at bootstrap line 323 before parent preparation/publication at lines 326-330. The forced-unavailable test also passed with an empty target. |
| 2. `/proc/self/fd` is absent/unusable on stock macOS | **PASS** | `platform=darwin`, Darwin `24.6.0`; `existsSync('/proc/self/fd')=false`; descriptor opens, child `mkdir`, and `chdir` all failed `ENOENT`. |
| 3. `/dev/fd/<directory-fd>` cannot be traversed to children even when duplication works | **PASS** | `open('/dev/fd/11', O_RDONLY)` passed, matched device/inode, and reported a directory; `O_DIRECTORY` failed `ENOTDIR`, child `mkdir` failed `ENOENT`, and `chdir` failed `ENOTDIR`. |
| 4. Target spelling/trailing slash/ordinary permissions are not the cause | **PASS** | Reported target is a real non-symlink directory, mode `755`, R/W access passed, and dry-run exited 0. Independent mode-`755` empty targets with and without a trailing slash failed identically and remained empty. |
| 5. Current relevant tests/validator status | **PASS** (status established) | Focused suite: 1 pass/1 fail—forced unavailability passes, real fresh install fails. Full portable suite: 2 pass/13 fail, predominantly because bootstrap cannot install. Portable and source validators both exit 0, showing they validate static contracts rather than macOS alias usability. |

### Exact Commands and Results

1. `node .opencode/scripts/bootstrap-portable-harness.mjs --target ../project-open-court/`
   - Exit `1`.
   - stderr: `Portable harness bootstrap failed: no usable descriptor-directory alias; tried /proc/self/fd, /dev/fd; capability contract requires fail-before-file-publication`.
2. Dependency-free `node -e` alias probe using a temporary open directory descriptor:
   - Host: `platform=darwin release=24.6.0 node=v26.4.0 fd=11`.
   - `/proc/self/fd`: `aliasExists=false`; `O_DIRECTORY` open, `O_RDONLY` open, child `mkdir`, and `chdir` all failed `ENOENT`.
   - `/dev/fd`: `aliasExists=true`; `O_DIRECTORY` open failed `ENOTDIR`; `O_RDONLY` open passed with `sameIdentity=true isDirectory=true`; child `mkdir` failed `ENOENT`; `chdir` failed `ENOTDIR`.
3. Dependency-free `node -e` fresh-target harness invoking bootstrap against mode-`755`, R/W-accessible targets:
   - No slash: `before=[] exit=1 after=[]`.
   - Trailing slash: `before=[] exit=1 after=[]`.
   - Both emitted the exact no-usable-alias diagnostic and were removed after evidence capture.
4. Dependency-free `node -e` `lstat`/`realpath`/`access` plus dry-run probe for `../project-open-court/`:
   - Resolved and canonical target paths matched; directory `true`; symlink `false`; mode `755`; R/W access `PASS`. The machine-local absolute path is intentionally not retained in memory.
   - Dry-run exit `0`: `created/updated=43, memory-created=4, unchanged=0, collisions=0, write-safety=not-exercised`.
5. `node --test --test-name-pattern='fresh foreign repository installs|descriptor capability unavailability' .opencode/scripts/portable-harness.test.mjs`
   - Exit `1`; tests `2`, pass `1`, fail `1`.
   - Forced descriptor unavailability passed; real fresh install failed with the exact alias diagnostic.
6. `node --test .opencode/scripts/portable-harness.test.mjs`
   - Exit `1`; tests `15`, pass `2`, fail `13`.
   - Most failures are direct no-alias failures or cascades from the absent fresh installation, not 13 independent causes.
7. `node --check .opencode/scripts/bootstrap-portable-harness.mjs`
   - Exit `0`; no output.
8. `node .opencode/scripts/validate-portable-harness.mjs --root .`
   - Exit `0`; `Portable OpenCode harness validation passed`.
   - Expected unrelated `MODULE_TYPELESS_PACKAGE_JSON` warning for `.opencode/plugins/index.js`.
9. `node .opencode/scripts/validate-harness.mjs`
   - Exit `0`; `OpenCode harness validation passed`.
   - Expected unrelated `MODULE_TYPELESS_PACKAGE_JSON` warning for `role-model-routing-enforcement.js`.

### Schema Results

- **PASS** — Validator input/output fields required by `.opencode/contracts/role-io-contracts.json` are represented in this trace.
- **PASS** — Trace uses the required metadata, input contract, work performed, output contract, and handoff structure from `.opencode/schemas/memory-trace-artifact.schema.json`; routing status is the allowed value `absent`.
- **PASS** — Caller-supplied resolved routing is recorded verbatim as context; no routing labels or values were invented.
- **PASS with incompatibility finding** — Both static validators pass, but neither proves host descriptor-alias activation.

### Security and Activation Findings

- The bootstrap fails closed on this host. It does not silently switch to weaker pathname publication, and no managed file was published in the fresh-target proofs.
- The required activation primitive is unavailable: neither declared alias offers Linux-style descriptor-relative descendant traversal on this macOS host.
- `/dev/fd` descriptor duplication is not equivalent to pathname traversal beneath the duplicated descriptor. Removing `O_DIRECTORY` would only move the failure to the first child operation.
- Static validator success is not an activation boundary and does not override the failing macOS E2E evidence. No lifecycle hook was used as acceptance evidence.

### Remediation List

Current macOS portable acceptance is **FAIL**. Before claiming macOS support:

1. Choose and document one security contract: true Darwin dirfd-relative native operations, an explicitly weaker compatibility mode with its TOCTOU risk, or explicit macOS non-support.
2. Synchronize bootstrap behavior, portable manifest capability data, validator expectations, and macOS-realistic E2E tests.
3. Rerun successful fresh-install and adversarial publication tests on macOS and regression tests on Linux. Do not treat the forced-unavailable test or static validators as proof of macOS usability.

No fixes were implemented.

### Acceptance Decision

- Diagnosis claims: **PASS (5/5)**.
- Current stock-macOS bootstrap compatibility: **FAIL**.
- Current static source/portable validation: **PASS**, but insufficient for host activation acceptance.

## Handoff

- Next role: Decision owner or `synthesizer` to select the security/support branch; implementation must precede any post-fix validation.
- Limitations: One macOS 15.6 / Darwin 24.6.0 APFS host with Node v26.4.0; no Linux rerun, cross-version macOS matrix, native prototype, or fix validation. Full-suite failures include cascading missing-install failures and should not be counted as 13 independent defects. Separate validation/index artifacts could not be written under validator permissions.
- Risks: Advertising the passing static validators as portable acceptance would conceal a real host activation failure. A pathname fallback would weaken the previously selected ancestor-race guarantee.
