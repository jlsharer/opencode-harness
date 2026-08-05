---
description: Delegate scoped file edits to the implementer role
agent: implementer
---

Target role: `implementer`.

This direct role command is fail-closed and MUST NOT perform managed work or dispatch a subagent. The lifecycle guard rejects it because command-frontmatter dispatch is not proven to traverse the Task guard. Tell the operator to use `/delegate-orchestration`, which creates the nonempty `delegationTaskId`, stable `scopeKey`, `dispatchKind: fresh` Task packet without any `task_id` property.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, approved task plan, exact write paths, schema requirements, preservation requirements, verification commands, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: changed paths, rationale, schema or role-boundary choices, commands run with results, skipped checks, known limitations, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/implementer/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: keep edits minimal and deterministic, avoid manifests unless explicitly assigned, and run local self-checks before handoff.
