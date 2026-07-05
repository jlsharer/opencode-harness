---
description: Delegate cross-artifact consistency checks to the integrator role
agent: integrator
---

Target role: `integrator`.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, changed artifacts, expected path relationships, manifest expectations if in scope, command and hook contracts, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: path consistency notes, manifest consistency notes, cross-file issues, integration fixes requested or applied, residual risks, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/integrator/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: confirm commands, hooks, workflows, skills, and routing assets agree on role names and preserved labels.
