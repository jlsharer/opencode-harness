---
description: Delegate implementation planning to the planner role
agent: planner
---

Target role: `planner`.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, approved request, research evidence, target file paths, allowed edit scope, dependencies, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: sequenced task plan, file contracts, dependency ordering, acceptance gates, verification commands, handoff notes, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/planner/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: make gates concrete enough for implementer and validator roles to execute without changing scope.
