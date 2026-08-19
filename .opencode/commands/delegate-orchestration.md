---
description: Invoke the authoritative four-role delegation protocol from a natural-language request or prefilled specification
subtask: false
---

Load and follow `.opencode/skills/delegation-orchestrator/SKILL.md` as the sole authoritative protocol.

Treat the content between the marker lines below as the user's orchestration request. Follow the skill's Intake and Normalization protocol: extract supplied intent and constraints, generate coordinator-owned fields, derive safe execution structure, and ask concise follow-up questions only for unresolved user decisions. Validate the resulting internal specification against `.opencode/schemas/orchestration-input.schema.json` before delegation. Never require the user to write JSON or know schema field names.

<<<ORCHESTRATION_REQUEST>>>
$ARGUMENTS
<<<END_ORCHESTRATION_REQUEST>>>
