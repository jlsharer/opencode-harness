# 2026-08-04-bootstrap-darwin-native

## Scope

- Request: Implement approved native Darwin support for portable bootstrap while preserving the existing Linux race-detecting contract and its pinned-parent rename limitation.
- Allowed edit scope: Native helper/build/test assets, portable bootstrap/manifests/validators/tests, source inventory/validator, design documentation, and this orchestration's role traces/index.
- Non-goals: External npm dependencies, runtime compilation, absolute atomic beneath-root claims, Developer ID signing/notarization, or final acceptance validation.

## Routing Metadata

- routingMetadataStatus: absent
- Caller routing labels were absent and no values were invented.
- Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research preceded planning; independent validator evidence is required before acceptance.
- `root-native-bootstrap`:
  - scope: Darwin native helper, portable dispatch, distribution, QA, tests, and documentation.
  - dependsOn: `root-researcher-001-native-options`, `root-planner-002-native-plan`, and caller acceptance of the scoped rename limitation.
  - parallelizableWith: none in this implementation work unit.
  - requiredRoles: `researcher`, `planner`, `implementer`, then `integrator`/`reviewer`/`validator` as orchestrated.
  - status: **FINAL PASS** on the tested Darwin arm64/APFS host; final reviewer, validator, artifact-verifier, and integration closeout complete.

## Sub-Workflows

- None recorded.

## Delegation Packets

- No retained delegation packet was supplied to this role.

## Role Trace Artifacts

- `researcher`:
  - `roles/researcher/root-researcher-001-native-options.md`
- `planner`:
  - `roles/planner/root-planner-002-native-plan.md`
- `implementer`:
  - `roles/implementer/root-implementer-003-native-bootstrap.md`
  - `roles/implementer/root-implementer-008-remediation-loop1.md`
  - `roles/implementer/root-implementer-012-remediation-loop2.md`
- `integrator`:
  - `roles/integrator/root-integrator-004-cross-artifact.md`
  - `roles/integrator/root-integrator-016-final-closeout.md`
- `validator`:
  - `roles/validator/root-validator-005-final-acceptance.md` (superseded by later security/artifact findings and final artifact `013`)
  - `roles/validator/root-validator-009-remediation-acceptance.md` (superseded by remediation-review findings and final artifact `013`)
  - `roles/validator/root-validator-013-final-acceptance.md` (**FINAL PASS**)
- `reviewer`:
  - `roles/reviewer/root-reviewer-006-security-review.md` (findings remediated in loop 1)
  - `roles/reviewer/root-reviewer-010-remediation-review.md` (findings remediated in loop 2)
  - `roles/reviewer/root-reviewer-014-final-review.md` (**PASS**, no remaining defect finding)
- `synthesizer`: none
- `artifact-verifier`:
  - `roles/artifact-verifier/root-artifact-verifier-007-universal-binary.md` (FAIL evidence remediated; superseded by final artifact `015`)
  - `roles/artifact-verifier/root-artifact-verifier-011-remediation-binary.md` (loop 1 PASS evidence; superseded by regenerated final artifact `015`)
  - `roles/artifact-verifier/root-artifact-verifier-015-final-binary.md` (**FINAL PASS**)

## Validation Evidence

- Commands: Initial and remediation-loop checks are recorded in implementer artifacts `003`, `008`, and `012`; final independent review, validation, and binary evidence are recorded in artifacts `014`, `013`, and `015` respectively.
- Results: **FINAL PASS** on Darwin arm64/APFS. Native tests passed 31/31; three portable E2E runs each passed 22 with 1 accepted-limitation skip; installed/source validators, exact reproducible build, both architecture signatures, strict all-architecture verification, private arm64/Rosetta execution, and two-generation installed bootstrap validation passed.
- Final binary SHA-256: `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`, consistent across binary, manifest, bootstrap, installed validator, private installed copies, and reproducible output.
- Cleanup closeout: 17 historical `/private/var/tmp/opencode-portable-helper-*-lifecycle-[0-2]-*` test activation directories were inspected, proven current-user-owned and inactive, verified empty or containing only the exact-hash mode-0700 helper, and removed; zero `opencode-portable-helper-*` directories remained immediately afterward.
- Skipped checks: Real x86_64 hardware, oldest-macOS, Linux-host execution, real downloaded quarantine/notarization, SIGKILL/power-loss cleanup, and non-APFS activation remain outside the tested acceptance matrix. The accepted concurrent pinned-parent rename case remains explicitly skipped rather than falsely claiming atomic confinement.

## Decisions

- Accepted decisions: Match the Linux descriptor-relative race-detecting contract and retain both `/proc/self/fd` and `/dev/fd`; package C source and a universal helper in portable-core; keep build/native-test tooling source-only; use protocol v1 with an exclusive 256 MiB frame limit; use one lifecycle-wide catchable-signal coordinator; use isolated test invocation prefixes; use root-owned sticky `/private/var/tmp` with an empty helper environment; explicitly ad-hoc sign and verify every slice.
- Remaining risks: Concurrent parent rename can move publication outside the root; post-publication failures can leave partial state; abrupt `SIGKILL`/power loss can defeat parent coordination and leave residue; ad-hoc signing/hash consistency does not authenticate the publisher or make the payload Gatekeeper-ready.
- Final state: Accepted implementation is unchanged during closeout; retained artifacts are indexed and final acceptance/binary evidence agrees on the recorded hash.
