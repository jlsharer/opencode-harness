# 2026-07-18-linear-playwright-ir-skill

## Scope

- Request: Create an OpenCode skill that builds a Playwright script to manually test a Linear ticket, where the script is an intermediate representation that can later be converted into long-term UI automation at component, integration, or E2E level.
- Allowed edit scope: `.opencode/skills/linear-playwright-ir/SKILL.md` and `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/`.
- Non-goals: Do not add runtime dependencies, Playwright config, MCP config, or application test files. Do not modify `.agents/` or `.codex/` reference projections.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none supplied by caller.
- Routing resolver evidence: `/delegate-researcher`, `/delegate-planner`, `/delegate-implementer`, `/delegate-integrator`, `/delegate-validator`, and `/delegate-reviewer` resolved with `source: unresolved`, `agent: null`, `model: null`, `networkCalls: false`, and local fallback metadata from the resolver output.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Delegation skill: `.opencode/skills/delegation-orchestrator/SKILL.md`
- Skill-authoring skill: `.opencode/skills/opencode-skill-authoring/SKILL.md`
- Workflows: `.opencode/workflows/delegation-workflow.md`, `.opencode/workflows/validation-workflow.md`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `root-research`:
  - scope: Research skill-authoring constraints and reusable guidance for Linear-ticket Playwright manual-test IR scripts.
  - dependsOn: none
  - parallelizableWith: none
  - requiredRoles: researcher
  - status: completed

- `root-plan`:
  - scope: Plan exact skill path, content contract, acceptance gates, and trace artifacts.
  - dependsOn: `root-research`
  - parallelizableWith: none
  - requiredRoles: planner
  - status: completed

- `root-implement`:
  - scope: Create the skill file and implementer trace artifact.
  - dependsOn: `root-plan`
  - parallelizableWith: none
  - requiredRoles: implementer
  - status: completed

- `root-integrate-review`:
  - scope: Check skill/path/frontmatter consistency and defect risks.
  - dependsOn: `root-implement`
  - parallelizableWith: reviewer and integrator may run in parallel.
  - requiredRoles: integrator, reviewer
  - status: completed

- `root-validate`:
  - scope: Run harness validation and skill-specific acceptance checks.
  - dependsOn: `root-integrate-review`
  - parallelizableWith: none
  - requiredRoles: validator
  - status: completed; memory-index remediation confirmed and final harness validation passed

- `root-memory-index-remediation`:
  - scope: Index this orchestration in `.memory/INDEX.md`, add retained trace artifact links, and refresh memory evidence after the first validator blocker.
  - dependsOn: `root-validate`
  - parallelizableWith: none
  - requiredRoles: implementer
  - status: completed; validator rerun passed

## Sub-Workflows

- `root`:
  - parent: none
  - goal: Add a project OpenCode skill for producing Playwright-based Linear-ticket manual-test IR scripts.
  - acceptanceCriteria: Skill exists at `.opencode/skills/linear-playwright-ir/SKILL.md`; frontmatter is valid; instructions define inputs, script structure, IR annotations, conversion guidance, safety boundaries, and validation checklist; harness validation passes or skipped checks are justified.
  - remediationLoopsUsed: 1
  - status: accepted after validator rerun

## Delegation Packets

- `root-researcher-001-skill-contract`: completed
- `root-planner-002-skill-plan`: completed
- `root-implementer-003-skill-file`: completed
- `root-integrator-004-consistency`: completed
- `root-reviewer-005-defects`: completed
- `root-validator-006-final`: completed; failed harness validation on missing `.memory/INDEX.md` entry
- `root-implementer-007-memory-index-remediation`: completed; validator rerun passed
- `root-validator-008-final`: completed; harness validation passed; previous `.memory/INDEX.md` blocker confirmed remediated

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-skill-contract`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`
- `planner`:
  - `root-planner-002-skill-plan`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/planner/root-planner-002-skill-plan.md`
- `implementer`:
  - `root-implementer-003-skill-file`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/implementer/root-implementer-003-skill-file.md`
  - `root-implementer-007-memory-index-remediation`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/implementer/root-implementer-007-memory-index-remediation.md`
- `integrator`:
  - `root-integrator-004-consistency`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/integrator/root-integrator-004-consistency.md`
- `validator`:
  - `root-validator-006-final`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/validator/root-validator-006-final.md`
  - `root-validator-008-final`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/validator/root-validator-008-final.md`
- `reviewer`:
  - `root-reviewer-005-defects`: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/reviewer/root-reviewer-005-defects.md`
- `synthesizer`: none planned
- `artifact-verifier`: none planned

## Validation Evidence

- Commands: `node .opencode/scripts/validate-harness.mjs`; skill-specific frontmatter/body inspection; role-artifact inspection.
- Results: first validator artifact `root-validator-006-final` reported skill and role-artifact checks passed, but harness validation failed because `.memory/INDEX.md` did not index `orchestrations/2026-07-18-linear-playwright-ir-skill/INDEX.md`. Memory-index remediation was applied by `root-implementer-007-memory-index-remediation`.
- Results: final validator artifact `root-validator-008-final` confirmed the previous `.memory/INDEX.md` blocker is remediated, skill-specific checks remain passing, and latest `node .opencode/scripts/validate-harness.mjs` passes with a non-blocking Node module-type warning.
- Skipped checks: none reported by first validator artifact.

## Decisions

- Accepted decisions: accepted; final validator evidence passes required checks
- Remaining risks: non-blocking Node module-type warning for `.opencode/plugin-modules/role-model-routing-enforcement.js`.
