---
description: Fail-closed compatibility entry point for planner packets
agent: planner
---

Target role: `planner`.

This direct command is fail-closed and must not perform work or dispatch another agent. Refuse and direct the operator to `/delegate-orchestration`.

The replacement orchestration specification must validate against `.opencode/schemas/orchestration-input.schema.json`. Its scoped planner packet must exactly match `.opencode/contracts/role-io-contracts.json`, including nonempty `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, explicit `taskMode: plan | synthesis`, `routingMetadataStatus`, and every planner-specific required field, without any `task_id` property. Do not infer omitted fields or routing metadata.
