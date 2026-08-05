# Acceptance Review After Remediation Loop 3

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `reviewer`
- artifactId: `root-reviewer-018-acceptance-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Final remediation review request; `portable-implementer-017-remediation-loop3.md`; all prior reviewer findings; current worktree; original portability goals and planner matrix; focused adversarial-probe permission; and required reviewer trace path.
- Required context present: `orchestrationId`, current changed paths, intended remediation behavior, prior blocking findings, original security/correctness risks, test expectations, review scope, and routing metadata status were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent, so no routing labels or values were invented. The ignored invalid custom override was not used as acceptance input.

## Work Performed

- Summary: Re-reviewed loop-3 descriptor alias discovery, target binding, descriptor-relative per-parent setup/probing/publication, no-fallback behavior, failure cleanup, UNC detection, exact inventory, and manifest/validator capability agreement. Reassessed the original bootstrap, memory, leakage, installed-validator, routing, force-atomicity, source-boundary, and manifest-drift goals. Ran all relevant checks plus an independent installed-manifest capability mutation probe and a focused private-path scan. No implementation files were edited.
- Files read: Loop-3 implementer trace; all prior reviewer traces; current portable manifest, bootstrap, E2E suite, portable validator, source validator/manifest; routing fixtures, policy, schema, loader, plugins, and tests; corrected design/workflow/guidance; contracts and trace schema.
- Files changed: This reviewer trace artifact only.
- Commands:
  - `git status --short`, `git diff --stat`, focused diff inspection, and `git diff --check`
  - Three portable-script `node --check` commands
  - `node --test .opencode/scripts/portable-harness.test.mjs`
  - `node .opencode/scripts/validate-portable-harness.mjs --root .`
  - `node --test .opencode/routing/routing-policy.test.mjs`
  - `node .opencode/scripts/validate-harness.mjs`
  - Temporary installed-tree probe changing `writeCapabilities.unavailableBehavior` to `fallback`; installed validation rejected it as expected.
  - Focused scan for developer-specific home/worktree, drive, and UNC strings in portable artifacts.

## Output Contract

- Outputs: No-issue statement, prior-blocker closure assessment, open questions, residual risk, concise change summary, check evidence, explicit acceptance status, and trace path.
- Evidence: Direct control-flow inspection shows capability discovery and hard-link probing are descriptor-relative, target identity is checked before and after root opening, every retained destination parent is opened and probed before publication, and no pathname fallback remains. Fifteen E2E cases and independent capability mutation evidence support those conclusions.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-018-acceptance-review.md`.

### Findings

- **No HIGH or MEDIUM defects found. No blocking reviewer finding remains.**

### Prior Blocker Closure

1. **Descriptor-relative capability probing and target binding — fixed.** The target is identity-checked before opening and the opened handle is identity-checked before side effects at `.opencode/scripts/bootstrap-portable-harness.mjs:316-323`. Alias discovery creates/opens/removes its probe through the bound descriptor at `:161-185`. Root replacement before and after open is covered at `.opencode/scripts/portable-harness.test.mjs:139-162`.
2. **All destination parent/filesystem capability preflight — fixed.** Every unique actual parent is opened from the pinned root and retained; each parent receives a descriptor-relative same-directory hard-link probe before the publication loop at `.opencode/scripts/bootstrap-portable-harness.mjs:207-235,326-330`. The later-parent failure test at `.opencode/scripts/portable-harness.test.mjs:180-186` verifies no files remain when `.memory` preflight fails after earlier probes.
3. **Fallback escape — fixed by removal.** No path-based publication fallback remains. Missing descriptor capability fails before destination setup/publication at `.opencode/scripts/bootstrap-portable-harness.mjs:322-323`; `.opencode/scripts/portable-harness.test.mjs:164-169` proves an empty target on forced unavailability.
4. **Probe cleanup and parent replacement — fixed for exercised failures.** Descriptor probe artifacts are removed in `finally` blocks at `.opencode/scripts/bootstrap-portable-harness.mjs:178-182,191-198`; newly created empty destination directories are removed in reverse depth on preflight failure at `:201-204,230-233`. Parent replacement before probing produces no file publication in `.opencode/scripts/portable-harness.test.mjs:171-178`.
5. **Forward-slash UNC leakage — fixed.** `.opencode/scripts/validate-portable-harness.mjs:234-241` covers drive, backslash UNC, forward-slash UNC, Unix home, and source-checkout forms in raw and decoded JSON strings. `.opencode/scripts/portable-harness.test.mjs:234-255` covers all three Windows forms.
6. **Manifest/validator capability agreement and inventory drift — fixed.** `.opencode/portable.manifest.json:4-12` and the independent validator contract at `.opencode/scripts/validate-portable-harness.mjs:61-66,106-130` agree exactly. The independent mutation probe rejected fallback semantics, and removal coverage continues to reject inventory shrinkage.
7. **Original goals — no regression found.** Managed and memory no-clobber, explicit managed overwrite, memory/history preservation, source-root independence, no orchestration copy, neutral and enabled-local semantics, invalid custom fail-closed, force preflight atomicity, local corruption rejection, source/portable manifest boundaries, and trace alignment remain covered and passing.

### Open Questions

- None blocking. Operator/platform support is now capability-based rather than OS-name based: systems without a usable declared descriptor alias or same-directory hard links intentionally fail before file publication.

### Residual Risk

- Whole-install transactionality remains outside scope after successful capability preflight. Process termination can leave empty setup directories, hidden temporary/probe files, or a partially published install.
- A directory descriptor intentionally remains bound to the originally opened target inode if that inode is renamed by a same-identity concurrent process; the implementation does not attempt filesystem locking against an actor already able to rename/delete the target.
- `/dev/fd` behavior was not independently exercised on macOS in this Linux environment; dynamic capability discovery fails closed if it is unusable.
- Current portable artifacts contain no developer-specific home/worktree string found by focused scanning. Declared `/proc/self/fd` and `/dev/fd` values are generic capability aliases, not private machine paths.
- Live OpenCode restart, provider transport, network, endpoint health, and model execution remain outside reviewer checks. Validator and artifact-verifier evidence is still required for orchestration acceptance.

### Change Summary and Checks

- Loop 3 removed fallback publication, added dynamically proven descriptor aliases, pinned all destination parents, preflighted every parent filesystem before publication, added cleanup and race tests, completed UNC scanning, and synchronized the manifest/validator capability contract.
- Results: portable E2E `15/15` passed; routing policy `36/36` passed; portable validator passed; source validator passed; syntax checks and `git diff --check` passed.
- Adversarial capability mutation was rejected as expected; focused private-path scan found no current source-machine leak.
- **Acceptance status: UNBLOCKED by reviewer.** This is a review disposition, not a substitute for required validator and artifact-verifier acceptance evidence.

## Handoff

- Next role: Independent validator and artifact-verifier, followed by orchestration acceptance decision.
- Limitations: Review only; no implementation files were edited. macOS capability behavior, process-kill cleanup, separate live filesystems, providers, and network were not independently exercised beyond deterministic capability/failure tests.
- Risks: Remaining risks are documented operational/interruption and environment-capability risks rather than identified high/medium implementation defects.
