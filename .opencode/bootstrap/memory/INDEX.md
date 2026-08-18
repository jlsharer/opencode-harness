# Harness Memory Index

This directory is project-owned memory for OpenCode harness orchestration. It is not a native OpenCode state store or an external service.

## Static Memory

- `protocols/memory-management.md` - project memory rules, levels, indexing, and retention expectations.
- `templates/orchestration-index.md` - template for per-orchestration memory indexes.
- `templates/role-trace-artifact.md` - template for role-level trace artifacts.

## Generated Orchestration Memory

Use `.memory/orchestrations/<orchestration-id>/` for generated orchestration memory. Each orchestration directory should contain:

- `INDEX.md` - scope, inputs, routing metadata status, role artifact links, validation evidence links, and final decisions.
- `delegation-packets/` - delegated prompts or packet summaries when retained.
- `roles/<role>/<artifact-id>.md` - trace artifacts for role work.
- `validation/` - independent validator command evidence.
- `decisions/` - parent synthesis outputs and accepted final decisions.

Generated orchestration memory is created during use and is not included in this fresh seed.
