# Portable Bootstrap Remediation Loop 3 Trace

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `implementer`
- artifactId: `portable-implementer-017-remediation-loop3`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Final allowed I4 remediation request, reviewer trace `root-reviewer-016-final-review`, four assigned portable files, required trace path, explicit no-fallback direction, capability/probe/filesystem requirements, adversarial test requirements, and full verification gates.
- Required context present: Orchestration ID, all blocking findings, exact allowed scope, required fail-closed semantics, preservation requirements, tests, and routing metadata status were supplied.
- routingMetadataStatus: `absent`. No caller routing metadata was present or invented.

## Work Performed

- Summary: Removed the path-based publication fallback entirely. Bootstrap now opens and identity-binds the target before side effects, dynamically proves a declared descriptor-directory alias through descriptor-relative directory creation/open/removal, fails before destination setup when no alias works, securely opens or creates every actual destination parent, descriptor-relatively probes same-directory hard links in every parent before any managed or memory publication, retains those exact parent handles for publication, and cleans newly created empty directories after capability-preflight failures where they remain safely reachable. Added forward-slash UNC detection and deterministic root-after-open, probe-interval parent replacement, unavailable-capability, and later-destination probe failure tests.
- Files read: Final reviewer trace, prior remediation traces, current portable manifest/bootstrap/validator/E2E, routing tests and fixtures, source validator, and role/memory contracts.
- Files changed: `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; this remediation trace.
- Commands: Three-script `node --check` and `git diff --check` (pass); portable E2E (15/15 pass); portable validator (pass); routing tests (36/36 pass); source validator (pass); source-tree bootstrap capability probe (pass, selected `/proc/self/fd`, 47 unchanged).

## Output Contract

- Outputs: `changedFiles` are the four assigned I4 files and this trace. `rationale`: no file publication path is retained unless it is rooted through a dynamically verified directory-descriptor alias and a preflighted destination-parent handle; absence of this capability is a hard failure rather than reduced safety. `schemaOrBoundaryChoices`: the manifest contract now declares descriptor-relative same-directory hard-link publication, ordered alias candidates, all-parent preflight, and fail-before-file-publication behavior; the installed validator independently requires that exact capability object. Raw and decoded text scanning now recognizes drive, backslash UNC, and forward-slash UNC forms.
- Evidence: E2E reported 15 tests, 15 pass, 0 failures/skips/cancellations/todos. Deterministic probes show unavailable descriptor aliases leave the target empty; target replacement after root open causes identity failure before setup; parent replacement between setup and hard-link probing publishes no files; a simulated `.memory` parent capability failure occurs after earlier `.opencode` probes yet before any file publication and cleans all safely reachable created directories; managed and memory create races remain no-clobber; explicit managed overwrite remains covered. Routing reported 36/36 pass. Portable and source validators printed their exact success lines.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/implementer/portable-implementer-017-remediation-loop3.md`; `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-016-final-review.md`.
- handoffNotes: Reviewer/validator should inspect dynamic alias proof, target identity checks before and after root opening, retained preflighted parent handles, descriptor-relative per-parent probes, no-fallback failure, cleanup ordering, independent capability validation, and forward-slash UNC coverage. The ignored custom routing file was not read or modified.

## Handoff

- Next role: Final reviewer/validator and artifact-verifier under the approved DAG; this was I4 remediation loop 3 of 3.
- Limitations: Strong publication requires Node to expose `O_DIRECTORY` and `O_NOFOLLOW`, at least one declared alias to resolve an opened directory descriptor, and same-directory hard links in every actual destination parent. These are runtime capabilities, not OS-name assumptions. This Linux environment dynamically selected `/proc/self/fd`; `/dev/fd` was not selected or independently exercised. If no alias works, bootstrap fails before creating destination directories or publishing managed/memory files. Capability preflight may create destination directories; on failure it removes newly created empty directories in reverse depth where they remain reachable from the pinned root. Directories maliciously moved away during a test/race are not chased or deleted outside the pinned target. Whole-install transactionality remains outside scope after successful capability preflight.
- Risks: Process termination after capability preflight can leave empty setup directories or hidden temporary files, and interruption after publication begins can leave a partial install. Typeless-package ESM warnings remain expected. Live providers/network and the ignored invalid custom routing override were not exercised. OpenCode requires a full restart after accepted config-time/plugin changes.
