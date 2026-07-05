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

Current orchestration:

- `orchestrations/2026-07-05-opencode-memory-contracts/INDEX.md`

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
