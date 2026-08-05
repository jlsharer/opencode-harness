# Final Remediation Review Loop 2

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `reviewer`
- artifactId: `root-reviewer-016-final-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation-loop 2 request; `portable-implementer-015-remediation-loop2.md`; prior reviewer traces and findings; current worktree; original portability/security goals and planner matrix; adversarial-probe permission; and required reviewer trace path.
- Required context present: `orchestrationId`, changed paths, intended behavior, all prior findings, original risk areas, test expectations, review scope, and routing metadata status were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented. The ignored invalid custom override was not used as acceptance input.

## Work Performed

- Summary: Re-reviewed loop-2 changes to root identity binding, exact installed inventory, machine-path scanning, write capabilities, hard-link probing, descriptor mode, and canonical-revalidation fallback. Reassessed original bootstrap, memory, leakage, validator, routing, force, manifest, and test risks. Ran all focused suites and a fresh forward-slash UNC corruption probe. No implementation files were edited.
- Files read: Loop-2 implementer trace; prior reviewer traces; current bootstrap, portable validator, E2E suite, manifest, source validator/manifest; routing fixtures/policy/loader/plugin/tests/schema; portable workflow/guidance; corrected source design; contracts and trace schema.
- Files changed: This reviewer trace artifact only.
- Commands:
  - `git status --short`, `git diff --stat`, focused diff inspection, and `git diff --check`
  - `node --test .opencode/scripts/portable-harness.test.mjs`
  - `node .opencode/scripts/validate-portable-harness.mjs --root .`
  - `node --test .opencode/routing/routing-policy.test.mjs`
  - `node .opencode/scripts/validate-harness.mjs`
  - Temporary installed-tree probe appending `//server/share/opencode-harness/secret` to a managed agent before portable validation.
  - Focused repository scan for developer-specific home/worktree strings.

## Output Contract

- Outputs: Four blocking findings, loop-2 closure assessment, open questions, residual risk, concise change summary, check evidence, explicit acceptance status, and trace path.
- Evidence: Normal suites pass and prior exact inventory/drive-letter/backslash-UNC cases are fixed. Direct control-flow inspection identifies pre-anchor probe side effects and a documented but still exploitable fallback window. A temporary forward-slash UNC probe produced a false-success portable validation.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-016-final-review.md`.

### Findings

1. **HIGH — BLOCKING — The hard-link capability probe reopens the target by pathname and writes before descriptor anchoring, leaving the root-replacement escape partially open.** `.opencode/scripts/bootstrap-portable-harness.mjs:298-300` checks target identity and then calls `probeHardLinks(targetReal)`; that probe creates, links, and removes files through mutable pathnames at `:217-228`. Only afterward does descriptor mode open and verify the root handle at `:303-306`. Replacing the target or an intermediate ancestor between `:298` and `:300` can redirect probe writes and cleanup outside the inspected target. A later handle mismatch stops managed files but cannot undo those outside-tree side effects. Tests at `.opencode/scripts/portable-harness.test.mjs:138-154` replace the root before the `:298` check and therefore do not cover this interval.

2. **HIGH — BLOCKING — The cross-platform fallback knowingly reintroduces a publication-time ancestor escape.** `fallbackAtomicWrite` verifies pathname identities at `.opencode/scripts/bootstrap-portable-harness.mjs:202-205`, then publishes by pathname at `:206-209`, and checks again only at `:211`. In that interval, a parent containing the completed temporary file can be renamed outside the target and the original pathname replaced with a symlink to the moved parent; both temporary and destination pathnames then resolve to the moved directory, so publication occurs outside the target before the post-check reports failure. The test at `.opencode/scripts/portable-harness.test.mjs:156-175` inserts a symlink before fallback traversal and does not exercise a swap after temporary creation. The portable manifest merely names the fallback at `.opencode/portable.manifest.json:10`, and the runtime warning at bootstrap `:313` does not disclose that its traversal guarantee is weaker; the limitation currently appears only in the non-portable implementer trace.

3. **MEDIUM — BLOCKING — Forward-slash UNC paths remain undetected.** `.opencode/scripts/validate-portable-harness.mjs:233-239` detects drive paths and backslash UNC paths, but not Windows-accepted `//server/share/...` UNC syntax. In a fresh installed tree, appending `//server/share/opencode-harness/secret` to a managed agent still produced `Portable OpenCode harness validation passed`. The new test at `.opencode/scripts/portable-harness.test.mjs:223-239` covers only a drive path and a backslash UNC value.

4. **MEDIUM — BLOCKING — The hard-link “preflight” checks only the target-root filesystem, not every destination filesystem, so its fail-before-write capability claim can still produce partial installs.** `.opencode/scripts/bootstrap-portable-harness.mjs:300` probes only `targetReal`, while actual publication occurs in managed and memory parent directories at `:144` and `:208`. Existing `.opencode` or `.memory` mount points may reside on filesystems with different hard-link support. The root probe can pass, managed writes can begin, and a later destination-local `link` can fail after partial installation. No test covers distinct destination filesystems or verifies that all publication locations are capability-checked before the first managed/memory write.

### Loop-2 Closure Assessment

- Prior root identity finding: **partially fixed**. Device/inode checks and deterministic root/intermediate replacement tests are meaningful, but finding 1 leaves pre-anchor probe side effects.
- Prior independent inventory finding: **fixed**. `.opencode/scripts/validate-portable-harness.mjs:17-65,105-128` independently encodes and checks the exact 43 managed files, four seeds, and write capability object; removal coverage at `.opencode/scripts/portable-harness.test.mjs:210-221` is meaningful. Current manifest and validator inventories agree.
- Prior Windows path finding: **partially fixed**. Generic drive and decoded backslash-UNC checks now fail as expected, but finding 3 remains.
- Prior platform rejection finding: **partially fixed**. Other platforms now have an executable fallback and visible mode output rather than unconditional rejection, but finding 2 shows that fallback does not meet the original traversal/TOCTOU safety goal, and its reduced guarantee is not documented in portable operator guidance.
- Earlier no-clobber, memory non-overwrite, local-fixture validation, literal developer-path leakage, neutral/enabled routing, invalid-custom fail-closed, force preflight, and source-design findings remain fixed in the inspected worktree.

### Open Questions

- Is a race-prone fallback acceptable for non-descriptor platforms, or must bootstrap fail closed when strong traversal safety is unavailable? The original security priorities do not establish permission to weaken traversal guarantees.
- Are separate `.opencode` or `.memory` mount points supported? If not, that filesystem constraint needs an explicit portable contract and pre-write enforcement.

### Residual Risk

- Current portable artifacts contain no developer-specific home/worktree path found by focused scanning. `/proc/self/fd` and `/dev/fd` are intentional platform capability identifiers, not private workstation paths.
- Whole-install transactionality remains outside scope; process termination can leave incomplete installation or hidden temporary/probe files.
- Darwin descriptor traversal and real Windows fallback execution remain untested in this Linux environment.
- Live OpenCode restart, provider transport, network, endpoint health, and model execution remain outside this review.

### Change Summary and Checks

- Loop 2 added root device/inode binding, deterministic replacement tests, exact validator-owned inventory/seeds, capability declarations, broader Windows scanning, hard-link probing, and a warning-bearing fallback.
- Results: portable E2E `13/13` passed; routing policy `36/36` passed; current portable and source validators passed; `git diff --check` passed.
- Adversarial result: a managed forward-slash UNC source path incorrectly passed portable validation.
- **Acceptance status: BLOCKED** by findings 1-4.

## Handoff

- Next role: Scoped remediation implementer(s), followed by another reviewer loop and independent validator/artifact-verifier evidence.
- Limitations: Review only; no implementation files were edited. Narrow race findings are grounded in direct pathname/API ordering rather than timing-dependent external exploit processes. Cross-filesystem hard-link behavior was not mounted/probed in this environment.
- Risks: Acceptance now would retain outside-target probe/fallback windows, incomplete UNC leakage detection, and a capability preflight that can fail only after partial publication on mixed filesystems.
