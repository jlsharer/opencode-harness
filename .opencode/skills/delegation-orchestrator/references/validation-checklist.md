# OpenCode Harness Validation Checklist

Use this checklist before accepting delegated OpenCode harness work.

## File and Schema Checks

- [ ] `opencode.json`, `AGENTS.md`, and `.opencode/harness.manifest.json` exist.
- [ ] Every expected role file exists under `.opencode/agents/`.
- [ ] Role frontmatter includes non-empty `description`, `mode: subagent`, and `permission`.
- [ ] Role-specific command files under `.opencode/commands/` have `description` and `agent` frontmatter.
- [ ] `.opencode/commands/delegate-orchestration.md` has `description`, omits `agent`, and sets `subtask: false`.
- [ ] Command files do not set `model`.
- [ ] `opencode.json` parses as JSON and does not contain harness-owned routing keys.
- [ ] `.opencode/routing/harness-model-routing.example.json` parses as JSON and is the deterministic routing acceptance input; the optional ignored custom file is excluded.
- [ ] The shared loader selects custom before example without merging, never falls back from a present bad custom file, reads explicit paths exactly, and reports both paths plus the copy command when both implicit files are absent.
- [ ] `.opencode/schemas/harness-model-routing.schema.json` parses as draft 2020-12, and dependency-free runtime normalization rejects structural and semantic defects.
- [ ] `.opencode/routing/routing-policy.mjs` and its test file are listed in the manifest and pass deterministic/non-mutating policy checks.
- [ ] `.opencode/harness.manifest.json` lists only OpenCode-owned artifacts and included root OpenCode project files.
- [ ] Static memory files exist: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`.
- [ ] `.opencode/contracts/role-io-contracts.json` parses and includes all eight roles.
- [ ] `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- [ ] Each role references the memory protocol, role contract catalog, trace schema, and `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` path.
- [ ] `.opencode/plugins/index.js` exists as the only auto-loaded local plugin file and default-export adapter.
- [ ] Segmented plugin logic lives outside the auto-loaded plugin directory, for example `.opencode/plugin-modules/harness-lifecycle.js`, and is imported by the adapter.
- [ ] `opencode.json` does not list local plugin paths.

## Delegation Checks

- [ ] Parent-thread role-work is prohibited.
- [ ] Research, planning, implementation, integration, validation, review, synthesis, and artifact verification have explicit routing.
- [ ] `/delegate-orchestration` is documented as orchestrator-owned and recursive, not a fixed subagent command.
- [ ] Research is required before planning and validation is required before acceptance.
- [ ] Recursive work uses a DAG, parallelizes independent role instances, and permits repeatable role instances with scoped artifact IDs.
- [ ] Remediation is limited to 3 loops per scoped work unit before synthesizing blockers and asking the user.
- [ ] Every delegated role receives an `orchestration-id`, memory root, role contract catalog, trace schema, and trace artifact requirement.
- [ ] Acceptance requires validator or artifact-verifier evidence.
- [ ] Routing labels are preserved when supplied by the caller.
- [ ] Missing routing labels are not invented.

## Local Routing and Deployment Checks

- [ ] Committed force-local activation is false; local selections outside force mode are described as advisory and do not write native agent configuration.
- [ ] Example-only plugin startup is clean and does not mutate agents; optional customization uses `cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json`, explicit validation can target either exact path, and changes require a full OpenCode quit/restart.
- [ ] Synthetic force tests cover exactly all eight fixed roles, complete native provider/model/baseURL coherence, and no partial agent/provider mutation on asynchronous startup failure.
- [ ] Native provider transport stays in external merged OpenCode config; no provider, credential, or harness routing policy was added to `opencode.json`.
- [ ] Provider ids, aliases, model names, ports, URLs, GPU settings, and capacities are clearly illustrative rather than installed claims.
- [ ] `OPENCODE_CONFIG` is documented as merging before project config, not as a final override; later `OPENCODE_CONFIG_CONTENT` is not recommended for secrets.
- [ ] Config and plugin activation requires quitting and restarting OpenCode.
- [ ] Endpoint `maxInFlight` budgets are cooperative and grouped by canonical URL rather than claimed as runtime semaphores.
- [ ] Private `instances/*.env` files are ignored while `.env.example` templates remain trackable.
- [ ] Both named Compose projects render from temporary env files with unique loopback ports, a required digest-pinned image, required model identity, and an existing absolute model directory mounted read-only without automatic creation.
- [ ] Rendered Compose has one reusable service and no `container_name`, overriding `command`, secret, private host path, or generated output in the repository.
- [ ] NVIDIA reservations are not described as proof of GPU isolation; static single-model restart behavior is distinguished from separately validated router mode.
- [ ] Health is not accepted as model/tool-use proof; live endpoint, delegated tool-use, and capacity/VRAM benchmarks remain operator-dependent gates.

## Safety Checks

- [ ] No provider tokens, auth secrets, user home auth paths, or machine-local private paths are stored in repo-managed harness files.
- [ ] Lifecycle plugins are described as telemetry and guardrails only.
- [ ] Reference-only prior projection directories are not listed as OpenCode runtime dependencies.

## Acceptance Decision

Accept only when required checks pass or every skipped check has a concrete task-specific rationale.
