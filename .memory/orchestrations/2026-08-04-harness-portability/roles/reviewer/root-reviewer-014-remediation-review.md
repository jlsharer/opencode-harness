# Remediation Review Loop 1

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `reviewer`
- artifactId: `root-reviewer-014-remediation-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation-loop request; prior reviewer findings; `portable-implementer-012-remediation.md`; `source-implementer-013-doc-remediation.md`; current worktree diff; original portability goals, risk areas, and planner acceptance matrix; focused-probe permission; and required trace path.
- Required context present: `orchestrationId`, changed paths, intended remediation behavior, original and follow-up risk areas, test expectations, prior findings, review scope, and routing metadata status were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent, so no routing labels or values were invented. Implicit routing preflight remains unavailable because the ignored custom override is invalid.

## Work Performed

- Summary: Re-reviewed the remediated bootstrap, E2E suite, portable validator, manifest, routing behavior, source validator, and corrected design. Traced descriptor-relative traversal, hard-link publication, overwrite and cleanup behavior, root-handle acquisition, manifest authority, machine-path detection, and platform gates. Reran normal suites and executed temporary manifest-drift and Windows-path false-pass probes. No implementation files were edited.
- Files read: Prior reviewer trace; both remediation traces; bootstrap, portable E2E, portable validator, portable/source manifests and source validator; routing policy, fixtures, loader, plugins, tests, and schema; corrected design; orchestration contracts/schema and relevant workflow guidance.
- Files changed: This reviewer trace artifact only.
- Commands:
  - `git status --short`, `git diff --stat`, focused diff inspection, and `git diff --check`
  - `node --test .opencode/scripts/portable-harness.test.mjs`
  - `node .opencode/scripts/validate-portable-harness.mjs --root .`
  - `node --test .opencode/routing/routing-policy.test.mjs`
  - `node .opencode/scripts/validate-harness.mjs`
  - Temporary installed-tree probe removing `routing-policy.test.mjs` from both manifest and disk before portable validation.
  - Temporary installed-tree probe appending `C:\\src\\opencode-harness\\secret` to a managed agent before portable validation.

## Output Contract

- Outputs: Four blocking findings, prior-finding closure matrix, open questions, residual risk, concise remediation summary, command results, explicit acceptance status, and trace path.
- Evidence: Normal suites pass and directly cover child-ancestor symlink insertion, managed/memory create races, and local-fixture corruption. Direct control-flow inspection found an unpinned target-root acquisition race and an explicit unsupported-platform gate. Two temporary corruption probes produced false-success portable validation for manifest drift and a Windows machine-local source path.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-014-remediation-review.md`.

### Findings

1. **HIGH — BLOCKING — The target root is still opened by a mutable pathname after preflight, so replacing the target or one of its ancestors can redirect every descriptor-anchored write.** `.opencode/scripts/bootstrap-portable-harness.mjs:162-168` records path-based state, performs the full preflight, and only opens `targetReal` at `:202`. `O_NOFOLLOW` protects only the final component from being a symlink; there is no `fstat` comparison with the originally inspected target and no canonical identity check after open. Between preflight and `open`, an attacker can replace the target with another real directory, or replace an intermediate ancestor with a symlink leading to a same-named directory outside the original tree. Subsequent traversal is safely anchored—but to the wrong root. The test at `.opencode/scripts/portable-harness.test.mjs:130-136` inserts only a child `.opencode` symlink and does not exercise target-root or target-ancestor replacement.

2. **MEDIUM — BLOCKING — Portable manifest drift remains self-authorizing and passes both installed and source-equivalent validation.** `.opencode/scripts/validate-portable-harness.mjs:56-76` checks only the paths declared by the current manifest for shape/safety, and `:187` requires only those declared files; it has no canonical closed inventory. Removing `.opencode/routing/routing-policy.test.mjs` from `.opencode/portable.manifest.json:4-47` and deleting that file from a fresh install still printed `Portable OpenCode harness validation passed`. Because source QA invokes the same validator against a source tree where omitted portable files remain as tolerated extras, this drift is not reliably caught there either. Existing negative tests at `.opencode/scripts/portable-harness.test.mjs:138-169` mutate path safety, references, local routing, and machine paths but never remove a required inventory entry.

3. **MEDIUM — BLOCKING — Machine-local path detection remains incomplete for common Windows source checkouts.** `.opencode/scripts/validate-portable-harness.mjs:170-175` recognizes Windows absolute paths only under `Users` or `Documents and Settings`; its checkout-name rule is Unix-only. In a fresh install, appending `C:\\src\\opencode-harness\\secret` to a managed agent still yielded `Portable OpenCode harness validation passed`. The current portable artifacts no longer contain the prior developer path, but the claimed generic source-checkout leakage defense and its tests do not cover this valid machine-local form.

4. **MEDIUM — BLOCKING — Bootstrap portability is now restricted to Linux procfs and an unverified macOS descriptor path, with every other Node platform rejected.** `.opencode/scripts/bootstrap-portable-harness.mjs:10` defines descriptor roots only for Linux and Darwin, and `:164` unconditionally fails on Windows and other platforms; no approved plan or portable-profile contract introduced that platform restriction. No test covers Darwin, Windows, or a filesystem without same-directory hard-link support, while publication requires `link` at `:142`. This is a destination-portability regression unless the supported-platform contract is explicitly narrowed and accepted.

### Prior Finding Closure Matrix

- Prior HIGH destination child-ancestor symlink escape: **partially fixed**. Descriptor-pinned child traversal and the `.opencode` insertion test are meaningful, but finding 1 leaves target-root acquisition exploitable.
- Prior HIGH default/memory no-clobber race: **fixed for supported filesystems**. Hard-link create-if-absent at `.opencode/scripts/bootstrap-portable-harness.mjs:141-143` is kernel-atomic, and `.opencode/scripts/portable-harness.test.mjs:117-128` meaningfully covers both managed and memory destinations. Explicit managed overwrite still uses replacement semantics only when requested.
- Prior HIGH embedded developer path: **literal leak fixed; completeness not fully fixed**. The path is absent from current portable artifacts and the manifest is now scanned, but finding 3 shows a remaining detector gap.
- Prior MEDIUM enabled-local false pass: **fixed**. `.opencode/scripts/validate-portable-harness.mjs:136-162` validates local semantics and no-provider plugin behavior; `.opencode/scripts/portable-harness.test.mjs:155-162` meaningfully proves `{}` corruption fails.
- Prior LOW design contradiction: **fixed**. `opencode-harness.design.md:131-133` now distinguishes advisory local selectors, preflighted non-force native overrides, and atomic force behavior.

### Open Questions

- Is portable-core intentionally supported only on Linux and macOS with descriptor-directory and hard-link facilities? If so, the manifest/bootstrap/docs and acceptance matrix need an explicit platform/filesystem contract rather than an implementation-only failure.
- Is the exact 43-file portable inventory intended to be an executable invariant? The planner and workflow call it closed; current validators treat the manifest itself as the sole authority.

### Residual Risk

- Whole-install transactionality remains intentionally out of scope. Per-file publication is atomic, but interruption or a later write failure can leave an incomplete install and stale hidden temporary files after process termination.
- Source-file reads remain pathname-based after source realpath checks, but the source bundle is treated as trusted input; no stronger source mutation threat model was established.
- Neutral/advisory routing, invalid-custom fail-closed behavior, force preflight atomicity for ordinary configuration objects, memory preservation, source independence, and current inventory consistency passed focused checks. Live OpenCode/provider/network behavior remains untested.

### Change Summary and Checks

- Remediation removed the committed workstation path, added broader path scanning and local-fixture validation, replaced no-clobber rename with hard-link publication, anchored child traversal to directory descriptors, added race/corruption tests, and corrected routing documentation.
- Results: portable E2E `9/9` passed; routing policy `36/36` passed; portable validator passed on the current tree; source validator passed; `git diff --check` passed.
- Adversarial results: removing a required portable inventory entry and file incorrectly passed; a managed `C:\\src\\opencode-harness\\secret` reference incorrectly passed.
- **Acceptance status: BLOCKED** by findings 1-4.

## Handoff

- Next role: Scoped remediation implementer(s), followed by another reviewer loop and independent validator/artifact-verifier evidence.
- Limitations: Review only; no implementation files were edited. Root replacement was established from direct pathname/descriptor semantics rather than a timing-dependent exploit process. Darwin and Windows execution were unavailable in this Linux environment.
- Risks: Acceptance before remediation could permit writes to a substituted root, silently shrink the portable bundle, miss Windows source-path leakage, or ship a bootstrap that fails on otherwise supported Node destinations.
