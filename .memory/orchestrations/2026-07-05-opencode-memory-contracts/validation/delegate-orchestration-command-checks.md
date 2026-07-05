# Delegate Orchestration Command Checks

## Metadata

- orchestrationId: `2026-07-05-opencode-memory-contracts`
- artifactId: `delegate-orchestration-command-checks`
- status: passed

## Commands

- `node .opencode/scripts/validate-harness.mjs` - passed with `OpenCode harness validation passed`.
- `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.json --command delegate-orchestration` - returned `agent: null`, `variant: recursive-orchestration`, and `source: orchestratorCommand`.
- JSON parse for `.opencode/routing/harness-model-routing.json` and `.opencode/harness.manifest.json` - passed.

## Result

`/delegate-orchestration` is an orchestrator-owned command, not a subagent command. Role-specific delegation remains available through the individual `/delegate-*` commands, and recursive orchestration uses repeatable scoped role instances under one DAG.
