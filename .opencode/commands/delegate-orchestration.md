---
description: Invoke the authoritative four-role delegation protocol from a natural-language request or prefilled specification
subtask: false
---

Load and follow `.opencode/skills/delegation-orchestrator/SKILL.md` as the sole parent-only delegation protocol. Explicit invocation of this command or the skill is required; an ordinary mention in conversation does not prove skill loading. Never pass this parent skill to a leaf.

Read the immutable `.memory/protocols/memory-management.md` and `.opencode/contracts/role-io-contracts.json` before dispatch. In external mode resolve those assets beneath `OPENCODE_HARNESS_RUNTIME_ROOT` (the protocol at `bootstrap/memory/protocols/memory-management.md`), do workspace work beneath `OPENCODE_HARNESS_WORKSPACE_ROOT`, and put generated orchestration traces beneath `OPENCODE_HARNESS_TRACE_ROOT`. Typed leaf packets and the immutable normalized specification, not a prompt suffix or a compaction reminder, carry task authorization.

Treat the content between the marker lines below as the user's orchestration request. Follow the skill's Intake and Normalization protocol: extract supplied intent and constraints, generate coordinator-owned fields, derive safe execution structure, and ask concise follow-up questions only for unresolved user decisions. Validate the resulting internal specification against `.opencode/schemas/orchestration-input.schema.json` before delegation. Never require the user to write JSON or know schema field names.

<<<ORCHESTRATION_REQUEST>>>
$ARGUMENTS
<<<END_ORCHESTRATION_REQUEST>>>
