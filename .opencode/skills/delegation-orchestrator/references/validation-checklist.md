# OpenCode Harness Validation Checklist

Use this checklist before accepting delegated OpenCode harness work.

## File and Schema Checks

- [ ] `.opencode/portable.manifest.json` exists, parses, and lists the complete portable inventory with safe unique managed paths and memory seed mappings.
- [ ] Every expected role file exists under `.opencode/agents/`.
- [ ] Role frontmatter includes non-empty `description`, `mode: subagent`, and `permission`.
- [ ] Role-specific command files under `.opencode/commands/` have `description` and `agent` frontmatter.
- [ ] `.opencode/commands/delegate-orchestration.md` has `description`, omits `agent`, and sets `subtask: false`.
- [ ] Command files do not set `model`.
- [ ] `.opencode/routing/harness-model-routing.example.json` is a neutral disabled acceptance input, and the explicit enabled-local example is valid but never selected implicitly.
- [ ] The shared loader selects custom before example without merging, never falls back from a present bad custom file, reads explicit paths exactly, and reports both paths plus the copy command when both implicit files are absent.
- [ ] `.opencode/schemas/harness-model-routing.schema.json` parses as draft 2020-12, and dependency-free runtime normalization rejects structural and semantic defects.
- [ ] `.opencode/routing/routing-policy.mjs` and its tests are in the portable inventory and pass deterministic, non-mutating policy checks.
- [ ] Minimal memory exists: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`; generated orchestration history is not required.
- [ ] `.opencode/contracts/role-io-contracts.json` parses and includes all eight roles.
- [ ] `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- [ ] Each role references the memory protocol, role contract catalog, trace schema, and `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` path.
- [ ] `.opencode/plugins/index.js` exists as the only auto-loaded local plugin file and default-export adapter.
- [ ] Segmented plugin logic lives outside the auto-loaded plugin directory, for example `.opencode/plugin-modules/harness-lifecycle.js`, and is imported by the adapter.
- [ ] `node .opencode/scripts/validate-portable-harness.mjs --root .` passes from the installed repository.

## Delegation Checks

- [ ] Parent-thread role-work is prohibited.
- [ ] Research, planning, implementation, integration, validation, review, synthesis, and artifact verification have explicit routing.
- [ ] `/delegate-orchestration` is documented as orchestrator-owned and recursive, not a fixed subagent command.
- [ ] Research is required before planning and validation is required before acceptance.
- [ ] Recursive work uses a DAG, parallelizes independent role instances, and permits repeatable role instances with scoped artifact IDs.
- [ ] Remediation is limited to 3 loops per scoped work unit before synthesizing blockers and asking the user.
- [ ] Every delegated role receives an `orchestration-id`, memory root, role contract catalog, trace schema, and trace artifact requirement.
- [ ] Every new role task has a nonempty `delegationTaskId`, stable `scopeKey`, `dispatchKind: fresh`, and a Task call with no own `task_id` property.
- [ ] The only `task_id` reuse is one matching parent response to a recorded child-originated clarification for the unchanged unresolved task; replay and post-restart reuse fail closed.
- [ ] Retry, remediation, correction, follow-up, changed scope/role/deliverable, and completed/failed/cancelled work start fresh child threads; direct unverified child-dispatch surfaces are not used.
- [ ] Acceptance requires validator or artifact-verifier evidence.
- [ ] Routing labels are preserved when supplied by the caller.
- [ ] Missing routing labels are not invented.

## Local Routing and Restart Checks

- [ ] Committed local routing and force-local activation are false; local selections outside force mode are advisory and do not write native agent configuration.
- [ ] Neutral-example plugin startup is clean and does not mutate agents; optional customization starts from the explicit enabled-local example, explicit validation targets an exact path, and changes require a full OpenCode quit/restart.
- [ ] Synthetic force tests cover exactly all eight fixed roles, complete native provider/model/baseURL coherence, and no partial agent/provider mutation on asynchronous startup failure.
- [ ] Native provider transport and credentials stay in operator-owned OpenCode configuration; harness routing does not create them.
- [ ] Provider ids, aliases, model names, ports, URLs, GPU settings, and capacities are clearly illustrative rather than installed claims.
- [ ] `OPENCODE_CONFIG` is documented as merging before project config, not as a final override; later `OPENCODE_CONFIG_CONTENT` is not recommended for secrets.
- [ ] Config and plugin activation requires quitting and restarting OpenCode.
- [ ] Endpoint `maxInFlight` budgets are cooperative and grouped by canonical URL rather than claimed as runtime semaphores.
- [ ] Health is not accepted as model/tool-use proof; live endpoint, delegated tool-use, and capacity/VRAM benchmarks remain operator-dependent gates.

## Safety Checks

- [ ] No provider tokens, auth secrets, user home auth paths, or machine-local private paths are stored in repo-managed harness files.
- [ ] Lifecycle plugins are described as telemetry and guardrails only.
- [ ] `node --test .opencode/plugin-modules/task-thread-policy.test.mjs` passes and lifecycle hooks read Task/Bash arguments from the second hook parameter `output.args`.
- [ ] Reference-only prior projection directories are not listed as OpenCode runtime dependencies.
- [ ] Portable files depend only on the managed `.opencode/` inventory and minimal `.memory/` surface.

## Acceptance Decision

Accept only when required checks pass or every skipped check has a concrete task-specific rationale.
