# Harness Memory Index

This directory is project-owned memory for OpenCode harness orchestration. It is not a native OpenCode state store; it is exposed through `AGENTS.md` and `opencode.json` instructions so agents can use one consistent memory protocol.

## Static Memory

- `protocols/memory-management.md` - project memory rules, levels, indexing, and retention expectations.
- `references/opencode-refs.md` - OpenCode documentation URL inventory and short descriptions.
- `templates/orchestration-index.md` - template for per-orchestration memory indexes.
- `templates/role-trace-artifact.md` - template for role-level trace artifacts.

## Orchestration Memory

Use `.memory/orchestrations/<orchestration-id>/` for generated orchestration memory. Each orchestration directory should contain:

- `INDEX.md` - scope, inputs, routing metadata status, role artifact links, validation evidence links, and final decisions.
- `delegation-packets/` - delegated prompts or packet summaries when retained.
- `roles/<role>/<artifact-id>.md` - trace artifacts for role work.
- `validation/` - validator or artifact-verifier command evidence.
- `decisions/` - synthesis outputs and accepted final decisions.

Current orchestrations:

- `orchestrations/2026-07-05-opencode-memory-contracts/INDEX.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/INDEX.md`

Current orchestration trace artifacts:

- `orchestrations/2026-07-05-opencode-memory-contracts/roles/researcher/handoff-summary.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/planner/handoff-summary.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/synthesizer/handoff-summary.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/implementer/handoff-summary.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/implementer/plugin-autoload-adjustment.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/implementer/delegate-orchestration-command.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/roles/integrator/handoff-summary.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/validation/implementer-self-checks.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/validation/integrator-checks.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/validation/plugin-autoload-adjustment-checks.md`
- `orchestrations/2026-07-05-opencode-memory-contracts/validation/delegate-orchestration-command-checks.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/researcher/root-researcher-001-standards.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/planner/root-planner-002-meta-skills.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/implementer/root-implementer-003-meta-skills.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/implementer/root-implementer-005-remediate-workflow-skill.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/integrator/root-integrator-004-meta-skills.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/integrator/root-integrator-006-index-remediation.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/validator/root-validator-007-final.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/validation/root-validator-007-final.md`
- `orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/reviewer/root-reviewer-008-meta-skills.md`
