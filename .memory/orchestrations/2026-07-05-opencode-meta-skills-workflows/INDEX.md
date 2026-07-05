# 2026-07-05-opencode-meta-skills-workflows

## Scope

- Request: Create meta skills for creating/updating OpenCode skills and workflow guidance while following documented OpenCode standards.
- Allowed edit scope: `.opencode/skills/opencode-skill-authoring/SKILL.md`; `.opencode/skills/opencode-workflow-guidance/SKILL.md`; this orchestration index; implementer and integrator trace artifacts; `.memory/INDEX.md` for orchestration indexing when assigned.
- Non-goals: Editing `opencode.json`, agents, commands, plugins, routing, manifests, `.agents/`, `.codex/`, or unrelated files.

## Routing Metadata

- routingMetadataStatus: absent
- Preserved labels, if present: none; caller-supplied routing metadata was absent and no routing values were invented.

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `root-researcher-001-standards`:
  - scope: Identify official OpenCode standards for skills and workflow-like assets.
  - dependsOn: none
  - parallelizableWith: none
  - requiredRoles: `researcher`
  - status: referenced by planner; trace artifact not present in current tree during implementation.
- `root-planner-002-meta-skills`:
  - scope: Plan minimal file contracts for two meta skills.
  - dependsOn: `root-researcher-001-standards`
  - parallelizableWith: none
  - requiredRoles: `planner`
  - status: complete
- `root-implementer-003-meta-skills`:
  - scope: Create two skill files and implementation memory artifacts within allowed paths.
  - dependsOn: `root-planner-002-meta-skills`
  - parallelizableWith: none
  - requiredRoles: `implementer`
  - status: complete pending integration and validation
- `root-integrator-004-meta-skills`:
  - scope: Check cross-file consistency and boundary adherence.
  - dependsOn: `root-implementer-003-meta-skills`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: complete; cross-file consistency checked and memory index gap remediated
- `root-implementer-005-remediate-workflow-skill`:
  - scope: Remediate runtime skill wording that triggered the prior-projection reference guardrail.
  - dependsOn: `root-integrator-004-meta-skills`
  - parallelizableWith: none
  - requiredRoles: `implementer`
  - status: complete; skill blocker remediated; top-level memory index update needed for new trace artifact
- `root-integrator-006-index-remediation`:
  - scope: Index the remediation implementer trace artifact and record integration remediation evidence.
  - dependsOn: `root-implementer-005-remediate-workflow-skill`
  - parallelizableWith: none
  - requiredRoles: `integrator`
  - status: complete; memory indexes updated for remediation trace artifact
- `root-validator-007-final`:
  - scope: Run command-backed acceptance checks.
  - dependsOn: `root-integrator-006-index-remediation`
  - parallelizableWith: none
  - requiredRoles: `validator`
  - status: complete; final validation accepted
- `root-reviewer-008-meta-skills`:
  - scope: Review final changed files for defects, misleading guidance, regressions, or missing tests/evidence.
  - dependsOn: `root-integrator-006-index-remediation`
  - parallelizableWith: `root-validator-007-final`
  - requiredRoles: `reviewer`
  - status: complete; one missing validator evidence/index consistency issue reported

## Sub-Workflows

- `root`:
  - parent: none
  - goal: Add OpenCode meta skills for skill authoring and workflow guidance.
  - acceptanceCriteria: Required files exist, frontmatter/path contracts match, content covers requested standards and boundaries, harness validation passes, validator evidence is recorded before acceptance.
  - remediationLoopsUsed: 1
  - status: validation accepted

## Delegation Packets

- `root-implementer-003-meta-skills`: Implementer packet supplied by user in current turn.
- `root-implementer-005-remediate-workflow-skill`: Remediation packet supplied by user after integrator blocker.
- `root-integrator-006-index-remediation`: Remediation packet supplied by user after validation found the new implementer remediation trace artifact missing from `.memory/INDEX.md`.

## Role Trace Artifacts

- `researcher`:
  - `root-researcher-001-standards`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/researcher/root-researcher-001-standards.md`
- `planner`:
  - `root-planner-002-meta-skills`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/planner/root-planner-002-meta-skills.md`
- `implementer`:
  - `root-implementer-003-meta-skills`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/implementer/root-implementer-003-meta-skills.md`
  - `root-implementer-005-remediate-workflow-skill`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/implementer/root-implementer-005-remediate-workflow-skill.md`
- `integrator`:
  - `root-integrator-004-meta-skills`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/integrator/root-integrator-004-meta-skills.md`
  - `root-integrator-006-index-remediation`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/integrator/root-integrator-006-index-remediation.md`
- `validator`:
  - `root-validator-007-final`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/validator/root-validator-007-final.md`
- `reviewer`:
  - `root-reviewer-008-meta-skills`: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/reviewer/root-reviewer-008-meta-skills.md`
- `synthesizer`:
  - none assigned
- `artifact-verifier`:
  - none assigned

## Validation Evidence

- Commands: `node .opencode/scripts/validate-harness.mjs`
- Results: implementer self-check failed because `.memory/INDEX.md` did not index `orchestrations/2026-07-05-opencode-meta-skills-workflows/INDEX.md`; integrator was assigned `.memory/INDEX.md` and added the missing orchestration and role artifact links. Integrator rerun then exposed the existing researcher artifact index gap, which was also fixed. Integrator then identified a runtime skill wording blocker in `.opencode/skills/opencode-workflow-guidance/SKILL.md`; implementer remediation reworded the runtime skill text, and `node .opencode/scripts/validate-harness.mjs` passed with only the existing Node module-type warning immediately after the skill edit. After the required remediation trace artifact was added, rerunning validation failed because `.memory/INDEX.md` did not index `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/implementer/root-implementer-005-remediate-workflow-skill.md`; integrator remediation added that top-level index entry and indexed its own trace artifact. Integrator remediation reran `node .opencode/scripts/validate-harness.mjs`, which passed with only the existing Node module-type warning for `.opencode/plugins/index.js`. Final validator checks passed and are recorded in `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/validation/root-validator-007-final.md`.
- Skipped checks: none
- Evidence artifacts:
  - `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/validation/root-validator-007-final.md`

## Decisions

- Accepted decisions: Use two project skills; do not create `.opencode/workflows/*.md`; do not register skills in `opencode.json`.
- Remaining risks: Workflow guidance must continue to avoid claiming native workflow schema support; non-blocking Node module-type warning remains for `.opencode/plugins/index.js`.
