---
description: Delegate source-backed research to the researcher role
agent: researcher
---

Target role: `researcher`.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, research question, source constraints, allowed paths, freshness requirements, downstream needs, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: cited findings, source list, compatibility implications, risks, implementation constraints, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/researcher/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: cite authoritative sources, distinguish direct evidence from inference, and flag unresolved compatibility uncertainty for validator follow-up.
