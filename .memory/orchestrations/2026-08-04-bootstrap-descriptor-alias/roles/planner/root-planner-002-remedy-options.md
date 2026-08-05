# Bootstrap Descriptor Alias Remedy Options

## Metadata

- orchestrationId: `2026-08-04-bootstrap-descriptor-alias`
- role: `planner`
- artifactId: `root-planner-002-remedy-options`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to derive the bootstrap capability/security contract and provide a concise diagnosis/remedy decision tree; no source edits; researcher evidence at `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/researcher/root-researcher-001-descriptor-alias.md`; exact planner artifact path; acceptance requires immediate/root cause, ineffective-workaround analysis, implementation choices, checks, limitations, and handoff guidance.
- Required context present: `orchestrationId`, approved goal, scope boundaries, research evidence, deliverable path, acceptance criteria, routing status, and resolved routing were supplied. The plan separates implementation branches that require an explicit threat-model decision.
- routingMetadataStatus: `absent`. Caller routing metadata labels were absent and none were invented.
- Resolved routing: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Converted the researcher evidence into the intended capability/security contract, a bounded remedy decision tree, branch-specific file contracts, dependency ordering, and executable future verification gates. No implementation or final validation was performed.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/researcher/root-researcher-001-descriptor-alias.md`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/portable.manifest.json`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/protocols/memory-management.md`; trace/index templates.
- Files changed: This planner trace only; no implementation files. Creation of the orchestration `INDEX.md` was attempted but denied by role edit permissions.
- Commands/checks: None. Existing command evidence is cited from the researcher trace and is not presented as planner validation.

## Output Contract

- Outputs: Ordered decision plan, exact known target paths and contracts, dependencies, verification gates, recommendation, and handoff notes.
- Evidence: Grounded in the researcher’s macOS 15.6 / Node v26.4.0 probes and focused test, plus the inspected source lines cited below. Direct evidence and design decisions are distinguished.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/planner/root-planner-002-remedy-options.md`; `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/researcher/root-researcher-001-descriptor-alias.md`.

### Concise Findings

**Intended contract.** The bootstrap does not merely copy by destination pathname. It pins the target and destination parents with directory descriptors, checks identities around publication, probes every destination parent before the first file is published, and publishes from a same-directory temporary using hard-link no-clobber semantics or rename for approved overwrite (`bootstrap-portable-harness.mjs:90-153,187-204,316-331`; `portable.manifest.json:4-11`). If that mechanism is unavailable, it deliberately exits before file publication (`bootstrap-portable-harness.mjs:322-323`; `portable-harness.test.mjs:164-169`). The security purpose is resistance to target/ancestor substitution and destination races, not ordinary writability checking.

**Immediate cause.** Alias discovery returns `null`: stock macOS has no usable `/proc/self/fd`, while Darwin `/dev/fd/<fd>` is a descriptor-duplication endpoint rather than a traversable directory pathname. The candidate open therefore fails (`ENOENT` then `ENOTDIR`) before destination-parent preparation or hard-link probing (`bootstrap-portable-harness.mjs:161-184,322-326`).

**Root cause.** The declared “portable” capability assumes that `/proc/self/fd` and `/dev/fd` provide equivalent Linux-style descendant traversal. Node’s pathname APIs are then used as a substitute for `openat`/`mkdirat`/`linkat`/`renameat`/`unlinkat` (`bootstrap-portable-harness.mjs:90-103,139-153,187-204`). That assumption is false on Darwin. The validator confirms only the exact declaration, not host usability (`validate-portable-harness.mjs:61-66,106-130`).

**Why common workarounds do not solve it.**

- Trailing slash: target spelling is normalized before descriptor discovery; the failure is alias semantics, not target parsing.
- Permissions: the reported and fresh APFS targets were writable, and failure occurs before destination-parent creation and hard-link probes.
- Creating `/proc`: a normal directory cannot synthesize the kernel-backed `/proc/self/fd/<fd>` descriptor namespace; mounting/emulating procfs would be an external host prerequisite, not portable bootstrap support.
- Removing `O_DIRECTORY`: the researcher proved that plain `O_RDONLY` can duplicate `/dev/fd/<fd>`, but `/dev/fd/<fd>/<child>` remains non-traversable; it merely moves failure to `mkdir`/descendant operations. Changing alias order or adding a slash has the same defect.

### Diagnosis / Remedy Decision Tree

1. **Is macOS support required?**
   - **No:** preserve the current strong contract, fail closed, and explicitly document/test macOS as unsupported. Do not advertise `/dev/fd` as a usable equivalent.
   - **Yes:** continue to question 2.
2. **Is the existing adversarial ancestor-race and fail-before-publication guarantee non-negotiable?**
   - **No:** restore a deliberately declared macOS compatibility mode using canonical-path identity revalidation plus same-directory hard-link publication. Accept and document the residual publication-time ancestor TOCTOU risk that caused the earlier fallback to be rejected. Do not describe this mode as descriptor-anchored or equivalent strength.
   - **Yes:** use real Darwin dirfd-relative `*at` operations through an approved native API/helper, while retaining pre-publication capability probes and fail-closed behavior. If native build/distribution is incompatible with the portable profile’s built-ins-only constraints, macOS must remain unsupported; pathname revalidation cannot satisfy this branch.

**Recommendation.** Make the threat-model decision explicit before implementation. For trusted local installs where macOS is mandatory, choose the compatibility mode and accurately weaken the declared guarantee. For an adversarial destination model, do not restore the fallback: approve a packaged native Darwin mechanism or declare macOS unsupported. There is no one-line flag or path-spelling fix that provides both stock-macOS compatibility and the present guarantee.

### Ordered Plan

1. **Decision gate — owner/synthesizer:** record one approved branch: unsupported Darwin, weaker compatibility mode, or strong native Darwin mode. Also decide whether built-ins-only distribution is mandatory. No implementation should begin before this gate.
2. **Contract design — implementer input:** update the capability declaration only after branch approval. Preserve current semantics for platforms with a traversable descriptor alias. Do not silently map weaker pathname revalidation to `descriptor-relative-same-directory-hard-link`.
3. **Bootstrap implementation — implementer:** alter selection/publication behavior only for the approved branch. Keep capability detection before destination-parent/file publication and ensure diagnostics identify unsupported versus weaker/strong selected mode.
4. **Validator and test integration — integrator:** make validator expectations and E2E assertions match the selected declared capability. Add Darwin-realistic coverage; the force-unavailable test alone is insufficient.
5. **Independent review — reviewer:** review race resistance, no-clobber behavior, partial-publication cleanup, manifest truthfulness, and native packaging boundaries if applicable.
6. **Acceptance — validator:** run the executable gates below on macOS and a supported Linux host. Validation evidence is required before acceptance.

### File Contracts

- `.opencode/scripts/bootstrap-portable-harness.mjs`: capability detection and publication implementation. It must fail before publication when the selected mode cannot operate; a compatibility branch must expose its weaker safety honestly; a strong branch must perform true dirfd-relative descendant operations rather than `/dev/fd` pathname traversal.
- `.opencode/portable.manifest.json`: source-of-truth capability declaration. Change only to a reviewed schema/meaning that distinguishes incompatible security modes; do not retain `/dev/fd` as an asserted traversable alias on Darwin.
- `.opencode/scripts/validate-portable-harness.mjs`: exact installed-profile contract. It must reject undeclared/unsupported capability shapes and agree with the manifest, but it must not be treated as proof that host publication primitives work.
- `.opencode/scripts/portable-harness.test.mjs`: E2E and adversarial regression contract. Cover successful supported-host install, real/representative Darwin selection, unavailable-capability empty target, all-parent preflight, no-clobber, parent/root replacement, and mode-specific safety claims.
- Documentation target to identify during implementation from existing bootstrap/user guidance: state supported hosts, safety mode, residual race (compatibility branch), and remediation. No new documentation path or native helper path is invented here because neither is established by the supplied evidence.
- Native strong branch only: helper/API source, build, packaging, manifest inventory, and invocation paths require a separate approved design before implementation; exact paths cannot be responsibly specified from current evidence.

### Dependencies and Assumptions

- Research precedes this plan. Branch choice precedes contract shape; contract shape precedes bootstrap/validator/test edits; implementation and integration precede review; validation precedes acceptance.
- The compatibility branch assumes users accept a documented ancestor-substitution window. It is not security-equivalent to the current contract.
- The native branch assumes an approved compilation/distribution mechanism can be added to `portable-core`; this conflicts with the reported built-ins-only direction until explicitly resolved.
- Unsupported-Darwin is the only currently evidenced way to preserve both existing code/distribution constraints and the strong guarantee without new native machinery.

### Verification Gates

Run after implementation, not as part of this planner task:

1. `node --check .opencode/scripts/bootstrap-portable-harness.mjs`
2. `node --test .opencode/scripts/portable-harness.test.mjs`
3. `node .opencode/scripts/validate-portable-harness.mjs --root .`
4. `node .opencode/scripts/validate-harness.mjs`
5. On stock macOS, bootstrap into a fresh writable APFS directory and verify the selected outcome: successful install with the honestly reported mode, or an explicit unsupported diagnostic with an empty target.
6. On Linux, bootstrap into a fresh directory and verify descriptor-anchored behavior remains selected and all race/no-clobber tests pass.
7. Compatibility branch: add and pass tests that expose the weaker claim; do not use passing path-identity checks as proof against the known publication-time ancestor race.
8. Native branch: add command-backed tests for each required dirfd-relative primitive, helper architecture/package activation, absent/incompatible helper fail-closed behavior, and no publication on every capability failure.

## Handoff

- Next role: `synthesizer` or decision owner to select the security/support branch; then a scoped `implementer`, `integrator`, `reviewer`, and `validator` sequence.
- Limitations: This is a plan and decision aid, not a fix or acceptance result. Evidence covers one macOS 15.6 / Node v26.4.0 APFS host. No native prototype, exact native packaging surface, cross-version macOS matrix, full test suite, or post-change validation exists. Exact new manifest/native formats remain intentionally undecided pending branch approval.
- Risks: A compatibility fallback can reintroduce the documented ancestor TOCTOU race; a native helper expands build, supply-chain, activation, and portable-profile scope; unsupported macOS leaves the requested use case unmet.
