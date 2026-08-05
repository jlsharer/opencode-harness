# Portable Bootstrap Remediation Trace

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `implementer`
- artifactId: `portable-implementer-012-remediation`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation loop 1 request, reviewer artifact `root-reviewer-010-defects`, four assigned portable implementation paths, optional implementer trace path, focused security/routing requirements, and verification commands.
- Required context present: Orchestration ID, blocking findings, allowed edit scope, preservation constraints, adversarial test requirements, verification gates, and routing metadata status were present.
- routingMetadataStatus: `absent`. No caller routing metadata was supplied or invented.

## Work Performed

- Summary: Removed the developer-specific absolute-path token; added generic machine-local/source-checkout absolute-path detection that scans the manifest as well as all other managed text; semantically and behaviorally validated both neutral and enabled-local fixtures and both no-provider plugin paths; replaced check-then-rename creation with descriptor-anchored temporary writes and atomic no-clobber hard-link publication; retained atomic rename only for explicit managed overwrite; and added deterministic managed, memory, ancestor-symlink, enabled-local corruption, and manifest-path adversarial tests.
- Files read: Reviewer findings, approved I4 plan, existing I4 implementation/trace, routing policy and fixtures, plugin entry/enforcement module, design wording near line 130, source validator, and memory/role contracts.
- Files changed: `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; this remediation trace.
- Commands: Three-script `node --check` (pass); `git diff --check` (pass); portable validator (pass); portable E2E (9/9 pass); routing policy tests (36/36 pass); source validator (pass).

## Output Contract

- Outputs: `changedFiles` are the four assigned I4 files and this trace. `rationale`: descriptor-relative parent traversal with no-follow directory opens prevents changed pathname ancestors from redirecting writes; hard-link publication provides kernel-enforced create-if-absent semantics for default managed and every memory write; only explicit managed replacement uses rename. `schemaOrBoundaryChoices`: the manifest remains the closed inventory but no longer embeds a workstation path; token declarations remain exempt from literal token matching while the manifest is included in generic absolute-path scanning; local routing acceptance now requires valid enabled, non-force, nonempty advisory behavior and a no-provider plugin no-op.
- Evidence: E2E reported 9 tests, 9 pass, 0 failures/skips/cancellations/todos, including deterministic concurrent destination creation for managed and memory outputs, write-time ancestor symlink insertion with an unchanged outside directory, malformed enabled-local rejection, and machine-local manifest-path rejection. Routing reported 36/36 pass. Both `Portable OpenCode harness validation passed` and `OpenCode harness validation passed` were produced. Syntax and whitespace checks exited 0.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/implementer/portable-implementer-012-remediation.md`; `.memory/orchestrations/2026-08-04-harness-portability/roles/reviewer/root-reviewer-010-defects.md`.
- handoffNotes: Reviewer/validator should rerun the focused races and inspect descriptor anchoring, no-clobber hard-link semantics, local-fixture corruption rejection, and manifest-inclusive machine-path scanning. The nonblocking wording at `opencode-harness.design.md:130` was not edited because that path is outside this remediation's permission; an authorized I5/documentation owner should state that non-force native role overrides can configure startup agents after preflight, while advisory local selectors do not.

## Handoff

- Next role: Reviewer, then validator and artifact-verifier under the existing DAG.
- Limitations: Node does not expose portable `openat` path APIs, so race-safe traversal uses opened directory descriptors through Linux `/proc/self/fd` or macOS `/dev/fd`; unsupported platforms fail closed. Linux procfs behavior was exercised here; macOS behavior was not available in this environment. No-clobber publication requires same-directory hard-link support. Whole-install atomicity remains outside scope; writes are atomic per file. A fully malicious same-identity process can mutate filesystem permissions and namespaces beyond any cooperative installer lock, but changed-path ancestors and destination creation are rechecked or handled atomically by the implemented descriptor-based operations.
- Risks: Typeless-package ESM warnings remain expected and no package metadata was introduced. Live OpenCode/provider activation and the ignored invalid custom routing file were not exercised. Restart OpenCode fully after accepting plugin/config-time changes.
