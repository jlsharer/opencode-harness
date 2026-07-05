# Role Trace Artifact: delegate orchestration command

## Metadata

- orchestrationId: `2026-07-05-opencode-memory-contracts`
- role: `implementer`
- artifactId: `delegate-orchestration-command`
- status: completed

## Input Contract

- User decisions: `/delegate-orchestration` belongs to the orchestrator, not a subagent role; ask only when required context is missing; use one orchestration ID with scoped artifacts by default; cap remediation at 3 loops; always use a DAG and parallelize independent role instances; require research, planning, and validation; update memory templates for repeated role instances.

## Work Performed

- Added `.opencode/commands/delegate-orchestration.md` with no `agent` frontmatter and `subtask: false`.
- Added harness-owned routing metadata for `/delegate-orchestration` as an orchestrator command with no subagent assignment.
- Updated routing resolver, manifest, validator script, delegation workflow, memory protocol, orchestration index template, delegation skill, validation checklist, `AGENTS.md`, and design doc.

## Routing Metadata

- Original request routing metadata status: absent.
- No values were invented for `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback`.

## Handoff

- Validation evidence: `validation/delegate-orchestration-command-checks.md`.
- Hooks/plugins remain guardrails only and are not acceptance proof.
