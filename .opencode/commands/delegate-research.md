---
description: Fail-closed compatibility entry point for researcher packets
agent: researcher
---

Target role: `researcher`.

This direct command is fail-closed and must not perform work or dispatch another agent. Refuse and direct the operator to `/delegate-orchestration`.

The operator may give `/delegate-orchestration` an ordinary-language request; its parent assembles the internal specification. The resulting scoped researcher packet must exactly match `.opencode/contracts/role-io-contracts.json`, including nonempty `orchestrationId`, `delegationTaskId`, `scopeKey`, `dispatchKind: fresh`, `taskMode: research`, `routingMetadataStatus`, and every researcher-specific required field, without any `task_id` property. Do not invent routing metadata.
