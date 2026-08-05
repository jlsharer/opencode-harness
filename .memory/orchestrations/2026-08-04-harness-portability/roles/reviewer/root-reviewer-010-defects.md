# Defect Review: Harness Portability

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `reviewer`
- artifactId: `root-reviewer-010-defects`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Integrated git changes, orchestration context and predecessor traces, approved portability plan and acceptance matrix, intended source/portable profile boundaries, prioritized security and correctness risks, focused-check permission, and the required trace path.
- Required context present: `orchestrationId`, diff/changed paths, intended behavior, risk areas, test expectations, review scope, planner matrix, and routing metadata status were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented. Implicit preflight is unavailable because the ignored custom override is invalid.

## Work Performed

- Summary: Reviewed all changed and newly added profile, bootstrap, validator, routing, manifest, plugin, documentation, contract, and orchestration artifacts from a defect-first stance. Traced bootstrap path and write behavior, portable validation boundaries, routing semantics and fail-closed tests, manifest/reference checks, memory seeding, and source inventory enforcement against the planner matrix. Ran focused tests and a temporary corruption probe without editing implementation files.
- Files read: Git diff and status; orchestration index; planner, implementer/integrator evidence as relevant; portable/source manifests; bootstrap, portable validator, source validator, and E2E scripts; routing fixtures, schema, policy, loader, plugin enforcement, and tests; lifecycle plugin; portable memory seed; changed workflow/guidance; role contract and trace schema.
- Files changed: This reviewer trace artifact only.
- Commands:
  - `git status --short && git diff --stat && git diff --name-only && git diff --cached --name-only`
  - Focused `git diff` inspection and `git diff --check`
  - `node --test .opencode/scripts/portable-harness.test.mjs`
  - `node --test .opencode/routing/routing-policy.test.mjs`
  - Temporary foreign install followed by replacement of `harness-model-routing.local.example.json` with `{}` and execution of the installed portable validator; temporary directory removed.

## Output Contract

- Outputs: Four blocking findings, one nonblocking documentation finding, open questions, residual risk, concise change summary, check results, and trace artifact path.
- Evidence: Findings are grounded in exact implementation lines and a command-backed false-pass probe. The normal E2E and routing suites pass, but they do not exercise the identified races and the portable validator accepted a corrupted enabled-local fixture.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-010-defects.md`.

### Findings

1. **HIGH — BLOCKING — Mutable destination ancestors permit symlink-escape writes after preflight.** `.opencode/scripts/bootstrap-portable-harness.mjs:113-115` and `:125-127` reject symlinks only during planning, but writes happen later at `:134`; `atomicWrite` then performs recursive `mkdir`, creates the temporary file, and renames by pathname at `:88-93` without revalidating or pinning parent directories. A destination ancestor can be replaced with a symlink between those phases, causing managed or memory writes to land outside `targetReal`. The existing collision test at `.opencode/scripts/portable-harness.test.mjs:100-115` covers only a static regular-file collision and provides no ancestor-swap/symlink-race case.

2. **HIGH — BLOCKING — Default no-clobber and memory non-overwrite are check-then-rename races.** For `allowOverwrite:false`, `.opencode/scripts/bootstrap-portable-harness.mjs:92-93` checks that the destination is absent and then uses `rename`, which replaces a file created after the check. This affects both ordinary missing managed files (`:117`) and all missing memory seeds (`:128`), so a concurrent destination write can be silently clobbered even without `--overwrite-managed`, directly violating both default collision behavior and the unconditional memory non-overwrite contract. Tests at `.opencode/scripts/portable-harness.test.mjs:85-115` verify only non-concurrent preservation.

3. **HIGH — BLOCKING — The portable bundle embeds the source developer's absolute path and exempts the embedding file from scanning.** `.opencode/portable.manifest.json:75` contains `/home/joshl/projects/opencode-harness`; because the manifest is managed (`:40`), bootstrap copies that machine-local path into every destination. `.opencode/scripts/validate-portable-harness.mjs:157-160` explicitly skips the manifest, so validation cannot report this leak. The scanner is also an exact-token check, meaning unrelated build paths such as `/home/other-user/...` or `/Users/...` are not detected. This conflicts with the no-source-absolute-path rule and the portable workflow's machine-local-path scan requirement.

4. **MEDIUM — BLOCKING — Installed portable validation can pass with a malformed enabled-local fixture.** `.opencode/scripts/validate-portable-harness.mjs:133-153` reads and semantically checks only the neutral routing example; it never reads `.opencode/routing/harness-model-routing.local.example.json`, despite that file being managed and the installed workflow requiring explicit enabled-local parsing/semantics. In a temporary fresh install, replacing the local fixture with `{}` still produced `Portable OpenCode harness validation passed`. The E2E negative coverage at `.opencode/scripts/portable-harness.test.mjs:117-131` checks only unsafe manifest paths and forbidden references, so this false-success path is untested.

5. **LOW — NONBLOCKING — Source design incorrectly says non-force native role overrides cannot configure startup agents.** `opencode-harness.design.md:130` states that “only force mode is eligible for startup agent configuration,” but `.opencode/plugin-modules/role-model-routing-enforcement.js:31-45` deliberately includes non-null native `roleOverrides` in the non-force assignment plan and mutates those agents after preflight. `.opencode/routing/routing-policy.test.mjs:636-645` confirms that behavior. The documentation can therefore mislead operators about enabled routing semantics even though runtime and tests agree.

### Open Questions

- Does the bootstrap threat model require safety against concurrent mutation by another process sharing destination permissions? The requested TOCTOU and symlink guarantees imply yes; if not, that limitation must be made explicit rather than claiming preflight/no-overwrite safety.
- Is whole-install rollback intentionally outside scope as stated by the planner, or should write-time failures leave a recoverable transaction record? Current per-file rename avoids torn individual files but can still leave a partially installed tree after a later write failure.

### Residual Risk

- Force routing preflight, neutral/advisory behavior, invalid-custom fail-closed behavior, and current manifest inventories have substantial passing tests, but live OpenCode/provider activation was not exercised.
- Whole-install atomicity is not implemented; even after race defects are addressed, interruption between per-file writes remains a documented rollback/VCS risk unless requirements change.
- Exact-token forbidden-reference scanning cannot establish absence of secrets or arbitrary machine-local paths without a broader detection policy.

### Change Summary

- The integration introduces a 43-file portable-core manifest, dependency-free bootstrap and installed validator, four non-overwriting memory seeds, foreign-repository E2E coverage, neutral and explicit local routing fixtures, routing-policy/schema updates, source inventory enforcement, and source/portable guidance separation.
- Normal focused checks passed: portable E2E `6/6`, routing policy `36/36`, and `git diff --check`. A targeted corruption probe exposed the portable-validator false pass described above.

## Handoff

- Next role: Owning implementer remediation for blocking findings, then reviewer/validator and artifact-verifier checks per the DAG.
- Limitations: Review only; no implementation files were edited, no final acceptance was performed, and no live OpenCode restart, provider, network, or ignored custom routing content was exercised. Race findings are based on direct control-flow/API semantics rather than an orchestrated adversarial race reproducer.
- Risks: Acceptance should remain blocked until destination race/clobber behavior, source-path leakage, enabled-local installed validation, and corresponding regression tests are remediated and independently validated.
