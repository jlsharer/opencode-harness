---
description: Fail-closed compatibility entry point for validator packets
agent: validator
---

Target role: `validator`.

This direct command is fail-closed and must not perform work or dispatch another agent. Refuse and direct the operator to `/delegate-orchestration`.

The replacement orchestration specification must validate against `.opencode/schemas/orchestration-input.schema.json`. Its scoped validator packet must exactly match `.opencode/contracts/role-io-contracts.json`, including nonempty `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, explicit `taskMode: validation | review | artifact-proof | integration-check`, `routingMetadataStatus`, and every validator-specific required field, without any `task_id` property. Do not infer omitted fields or routing metadata.
