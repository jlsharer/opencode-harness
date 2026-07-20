# 2026-07-16-playwright-dynamic-ui-automation-framework

## Scope

- Request: Design a robust, optimized Playwright framework that can dynamically build UI automation for any given website, with or without access to the underlying source code.
- Allowed edit scope: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/` for orchestration evidence only.
- Non-goals: Implement a production framework in this repository; target one specific website only; rely on website source-code access; bypass website terms, authentication controls, anti-bot systems, or consent boundaries.
- Acceptance criteria: Produce a validated architecture/design covering dynamic discovery, selector strategy, source/no-source operation, test generation, reliability, performance, observability, extensibility, governance, and adoption path.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none supplied by caller.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Delegation skill: `.opencode/skills/delegation-orchestrator/SKILL.md`
- Delegation workflow: `.opencode/workflows/delegation-workflow.md`
- Validation workflow: `.opencode/workflows/validation-workflow.md`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `root-research`:
  - scope: Playwright framework capabilities, constraints, and industry patterns for source/no-source UI automation.
  - dependsOn: none
  - parallelizableWith: none
  - requiredRoles: `researcher`
  - status: completed

- `root-plan`:
  - scope: Architecture, modules, sequencing, and acceptance gates for the requested framework design.
  - dependsOn: `root-research`
  - parallelizableWith: none
  - requiredRoles: `planner`
  - status: completed after remediation loop 1

- `root-review`:
  - scope: Defect- and risk-focused review of the proposed framework design.
  - dependsOn: `root-plan`
  - parallelizableWith: none
  - requiredRoles: `reviewer`
  - status: completed after remediation review loop 1

- `root-synthesis`:
  - scope: Consolidate research, plan, and review into final accepted framework design decisions.
  - dependsOn: `root-plan`, `root-review`
  - parallelizableWith: none
  - requiredRoles: `synthesizer`
  - status: completed

- `root-integration`:
  - scope: Cross-artifact consistency for index, role traces, delegation packets, and decision record.
  - dependsOn: `root-synthesis`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: completed

- `root-validation`:
  - scope: Validate orchestration artifacts and final design evidence before acceptance.
  - dependsOn: `root-integration`
  - parallelizableWith: none
  - requiredRoles: `validator`
  - status: completed after remediation loop 2

## Sub-Workflows

- `root`:
  - parent: none
  - goal: Framework design only.
  - acceptanceCriteria: Research-backed, planned, reviewed, synthesized, and validated design with concrete evidence.
  - remediationLoopsUsed: 1 planner remediation loop; 1 reviewer remediation review loop.
  - status: active

## Delegation Packets

- `root-researcher-001-framework-research`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-researcher-001-framework-research.md`
- `root-planner-002-framework-architecture`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-planner-002-framework-architecture.md`
- `root-reviewer-003-framework-risks`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-reviewer-003-framework-risks.md`
- `root-synthesizer-004-final-design`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-synthesizer-004-final-design.md`
- `root-integrator-005-artifact-consistency`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-integrator-005-artifact-consistency.md`
- `root-validator-006-final-evidence`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/delegation-packets/root-validator-006-final-evidence.md`

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-framework-research`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md`
- `planner`:
  - `root-planner-002-framework-architecture`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`
- `implementer`:
  - not required; design-only workflow.
- `integrator`:
  - `root-integrator-005-artifact-consistency`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/integrator/root-integrator-005-artifact-consistency.md`
- `validator`:
  - `root-validator-006-final-evidence`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/validator/root-validator-006-final-evidence.md`
- `reviewer`:
  - `root-reviewer-003-framework-risks`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/reviewer/root-reviewer-003-framework-risks.md`
- `synthesizer`:
  - `root-synthesizer-004-final-design`: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/synthesizer/root-synthesizer-004-final-design.md`
- `artifact-verifier`:
  - not required; no generated runtime artifact or renderable output requested.

## Validation Evidence

- Commands: `node .opencode/scripts/validate-harness.mjs`
- Results: PASS; exit code 0; `OpenCode harness validation passed`. Evidence: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/validator/root-validator-006-final-evidence.md`
- Skipped checks: No Playwright runtime tests, lint, or typecheck were run because this was a design-only orchestration with no framework implementation.

## Decisions

- Accepted decisions: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/decisions/final-playwright-framework-design.md` accepted after validator evidence.
- Remaining risks: no-source arbitrary-site automation remains probabilistic; target-specific authorization, data policy, model/provider policy, and numeric profile settings must be confirmed before implementation.
