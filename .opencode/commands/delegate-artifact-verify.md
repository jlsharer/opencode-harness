---
description: Delegate generated artifact proof to the artifact-verifier role
agent: artifact-verifier
---

Target role: `artifact-verifier`.

This direct role command is fail-closed and MUST NOT perform managed work or dispatch a subagent. The lifecycle guard rejects it because command-frontmatter dispatch is not proven to traverse the Task guard. Tell the operator to use `/delegate-orchestration`, which creates the nonempty `delegationTaskId`, stable `scopeKey`, `dispatchKind: fresh` Task packet without any `task_id` property.

Use `.opencode/skills/delegation-orchestrator/SKILL.md` with `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.

Input contract: provide `orchestration-id`, artifact paths, expected generated tree, parse or render checks, temp-directory requirements, cleanup decision criteria, memory path `.memory/orchestrations/<orchestration-id>/`, role contract `.opencode/contracts/role-io-contracts.json`, trace schema `.opencode/schemas/memory-trace-artifact.schema.json`, and any caller-supplied routing metadata. Preserve these labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

Required output evidence: temp-directory proof, artifact tree or listing, parse/render/check outputs, cleanup decision, remaining limitations, and a trace artifact at `.memory/orchestrations/<orchestration-id>/roles/artifact-verifier/<artifact-id>.md`. Do not invent routing metadata values when they are absent.

Verification expectations: verify generated artifacts outside canonical task state where practical and make proof reproducible from command output.
