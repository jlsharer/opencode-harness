---
description: Delegate acceptance validation to the validator role
agent: validator
---

Target role: `validator`.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, changed paths, expected schemas, acceptance gates, command policy checks, trust and restart caveats, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: file existence checks, schema parse results, command outputs, diff and status review, secret scan result, explicit pass/fail status, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/validator/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: treat hooks as guardrails only; acceptance requires concrete validation evidence for each in-scope artifact.
