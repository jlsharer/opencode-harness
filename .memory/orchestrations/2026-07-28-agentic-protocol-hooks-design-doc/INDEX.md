# 2026-07-28-agentic-protocol-hooks-design-doc

## Scope

- Request: Create a design document containing the accepted agentic protocol hook design, modified so the protocol registry has a deterministic hierarchy and consistent protocol load/injection order within each hook.
- Allowed edit scope: `opencode-harness.design.md`, `.memory/INDEX.md`, and `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/` artifacts.
- Non-goals: Do not implement runtime hook/plugin code. Do not add provider transport or harness policy to `opencode.json`. Do not introduce runtime dependencies on `.agents/`, `.codex/`, or `.claude` paths.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none supplied by caller.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Delegation skill: `.opencode/skills/delegation-orchestrator/SKILL.md`
- Workflows: `.opencode/workflows/delegation-workflow.md`, `.opencode/workflows/validation-workflow.md`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `root-research`:
  - scope: Inspect prior design artifacts and existing root design doc structure.
  - dependsOn: none
  - parallelizableWith: none
  - requiredRoles: researcher
  - status: complete

- `root-plan`:
  - scope: Plan exact document section placement and registry hierarchy/order content.
  - dependsOn: `root-research`
  - parallelizableWith: none
  - requiredRoles: planner
  - status: complete

- `root-implementation`:
  - scope: Edit design doc and memory index/artifacts according to plan.
  - dependsOn: `root-plan`
  - parallelizableWith: none
  - requiredRoles: implementer
  - status: complete

- `root-validation`:
  - scope: Run harness validation and verify doc/memory consistency.
  - dependsOn: `root-implementation`
  - parallelizableWith: none
  - requiredRoles: validator
  - status: complete

## Sub-Workflows

- `root`:
  - parent: none
  - goal: Add accepted hook design and hierarchical protocol registry ordering to the harness design document.
  - acceptanceCriteria: Design doc includes hook architecture, OpenCode/Claude boundary, pre/post timing, telemetry, Playwright examples, hierarchical registry load/injection ordering, and validation passes.
  - remediationLoopsUsed: 0
  - status: complete

## Delegation Packets

- `root-researcher-001-doc-target`: complete
- `root-planner-002-doc-plan`: complete
- `root-implementer-003-design-doc`: complete
- `root-validator-004-final`: complete

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-doc-target`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`
- `planner`:
  - `root-planner-002-doc-plan`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/planner/root-planner-002-doc-plan.md`
- `implementer`:
  - `root-implementer-003-design-doc`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/implementer/root-implementer-003-design-doc.md`
- `integrator`: none required unless validation finds cross-artifact inconsistencies
- `validator`:
  - `root-validator-004-final`: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/validator/root-validator-004-final.md`
- `reviewer`: none required for document-only implementation unless validation or implementation identifies behavioral risk requiring review
- `synthesizer`: none required unless role outputs conflict
- `artifact-verifier`: none required

## Validation Evidence

- Commands: `node .opencode/scripts/validate-harness.mjs`; `git status --short && git diff --name-only`; `git diff --cached --name-only && git diff --stat && git diff --cached --stat`; Node content/order assertion for `opencode-harness.design.md`; routing metadata grep/read checks.
- Results: final harness validation passed after `.memory/INDEX.md` remediation; design-doc ordering/content, memory artifact/index completeness, routing status, and security/activation posture passed.
- Skipped checks: runtime hook/plugin/live-provider/Claude behavior checks skipped because this was a design-document-only task with no runtime hook artifacts added.

## Decisions

- Accepted decisions: design-document update accepted for current scope after final validator evidence.
- Remaining risks: unrelated worktree changes are present outside this task; future runtime implementation requires separate validation of OpenCode hook semantics, classifier/noise behavior, and ledger privacy/retention.
