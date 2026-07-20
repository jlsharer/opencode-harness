# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-16-harness-design-inspection`
- role: `researcher`
- artifactId: `local-researcher-003-local-model-integration`
- createdAt: `2026-07-17T02:07:25Z`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Scoped research question to inspect current local-model/routing-related harness state and identify minimal work needed for local OpenAI-compatible or other local provider support.
- Required context present: `orchestration-id`, memory root, role contract catalog, trace schema, delegation skill/workflow references, source constraints, and downstream needs were supplied. Relevant paths included `opencode.json`, `.opencode/routing/`, `.opencode/agents/`, `.opencode/commands/`, `.opencode/plugins/`, `.opencode/plugin-modules/`, and local/routing documentation surfaces.
- Routing metadata status: `absent`; no caller-supplied `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback` values were invented.

## Work Performed

- Summary: Inspected native OpenCode configuration, harness-owned routing policy/resolver, agents, commands, plugins, validation scripts/workflows, design documentation, and authoritative OpenCode schema/docs for local provider/model constraints.
- Files read:
  - `opencode.json`
  - `AGENTS.md`
  - `opencode-harness.design.md`
  - `.opencode/routing/harness-model-routing.json`
  - `.opencode/routing/resolve-model-routing.mjs`
  - `.opencode/agents/{researcher,planner,implementer,integrator,validator,reviewer,synthesizer,artifact-verifier}.md`
  - `.opencode/commands/{delegate-research,delegate-plan,delegate-implement,delegate-integrate,delegate-validate,delegate-artifact-verify,delegate-orchestration}.md`
  - `.opencode/plugins/index.js`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/scripts/validate-harness.mjs`
  - `.opencode/harness.manifest.json`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/skills/delegation-orchestrator/references/{role-routing-matrix,validation-checklist,trust-and-restart-guide}.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md`
- Files changed:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/local-researcher-003-local-model-integration.md`
- Commands/checks/webfetches:
  - Loaded skills: `customize-opencode`; `delegation-orchestrator`.
  - `grep` searches for `localModelEnabled|preferLocal|routingServiceUrl|localModelFallback|harnessModelRouting|Provider Model|Routing Config|model routing|provider/model|baseURL|enabled_providers|disabled_providers` under `.opencode`.
  - `grep` search for `resolve-model-routing|resolveModelRouting|harness-model-routing` across Markdown/JSON/JS/MJS files.
  - `node -e "for (const p of ['opencode.json','.opencode/routing/harness-model-routing.json','.opencode/harness.manifest.json']) { JSON.parse(require('node:fs').readFileSync(p,'utf8')); console.log('parsed '+p); }"` -> parsed all three JSON files.
  - `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.json --command delegate-research --role researcher --metadata-json '{"routingServiceUrl":"http://127.0.0.1:11434/v1","localModelEnabled":true,"preferLocal":true,"localModelFallback":"ollama/qwen3-coder"}'` -> resolved `agent: researcher`, `variant: research`, local fallback model, and `networkCalls: false`.
  - `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.json --command delegate-orchestration` -> resolved orchestrator variant with no agent/model and local metadata disabled.
  - `webfetch https://opencode.ai/config.json`.
  - `webfetch https://opencode.ai/docs/providers` and `https://opencode.ai/docs/providers/#custom-provider`.
  - `webfetch https://opencode.ai/docs/models`.
  - `webfetch https://opencode.ai/docs/config`.

## Output Contract

- Outputs:

### Current local-model/routing state

**Direct evidence**

1. `opencode.json` is minimal native OpenCode config: it declares `$schema`, includes `AGENTS.md` and `.memory/protocols/memory-management.md` instructions, and sets `edit`, `bash`, and `webfetch` permissions; it does not set native `provider`, `model`, `small_model`, `enabled_providers`, or `disabled_providers` (`opencode.json:1-8`).
2. Harness policy explicitly keeps role command frontmatter model-free and keeps harness-owned model routing out of `opencode.json` (`AGENTS.md:13-14`). The same file says absent caller routing metadata must not be invented (`AGENTS.md:24`).
3. `.opencode/routing/harness-model-routing.json` is present and harness-owned. It has `defaultMode: single-model`, `defaultModel: null`, `singleModel.enabled: false`, all role override `model` values set to `null`, command overrides mapping delegate commands to agents, an orchestrator command entry with `agent: null`, complexity tier model values set to `null`, and `localModel` defaults of `routingServiceUrl: null`, `localModelEnabled: false`, `preferLocal: false`, and `localModelFallback: null` (`.opencode/routing/harness-model-routing.json:2-89`).
4. The resolver accepts either wrapped `harnessModelRouting` or bare config (`resolve-model-routing.mjs:16-18`), loads the routing config from `.opencode/routing/harness-model-routing.json` by default (`resolve-model-routing.mjs:7-9,55-56`), and returns a deterministic decision rather than invoking a provider.
5. Resolver model precedence is implemented as explicit caller model/provider model/request model first, then command override, role override, complexity tier, single-model default, and default model (`resolve-model-routing.mjs:82-90`, `resolve-model-routing.mjs:87`). Local metadata is resolved from request first and config defaults second, and the output always includes `networkCalls: false` (`resolve-model-routing.mjs:102-133`).
6. The design states this projection includes a harness-owned routing resolver but does not define provider credentials, durable task state, external routing services, or canonical orchestration ledgers (`opencode-harness.design.md:18`). It also states `opencode.json` must contain only native OpenCode keys and that harness routing lives in `.opencode/routing/harness-model-routing.json` (`opencode-harness.design.md:34`).
7. The design distinguishes native model selection from harness routing: native OpenCode selects models through native config/invocation controls, while harness routing separately chooses a model, variant, and role target before native dispatch (`opencode-harness.design.md:117-137`). The design keeps concrete provider/model IDs and local preference policy as open questions (`opencode-harness.design.md:186-189`).
8. Role agents are subagents with permissions and no `model` frontmatter in the inspected role files; for example, `researcher.md` has only `description`, `mode`, and `permission` in frontmatter (`.opencode/agents/researcher.md:1-8`). Command files route by `agent` and omit `model`; for example, `/delegate-research` has `description` and `agent` only (`.opencode/commands/delegate-research.md:1-4`), while `/delegate-orchestration` has `description` and `subtask: false` and omits `agent`/`model` (`.opencode/commands/delegate-orchestration.md:1-4`).
9. Plugin files do not implement model routing: `.opencode/plugins/index.js` only imports and delegates to `HarnessLifecyclePlugin` (`.opencode/plugins/index.js:1-5`), and the lifecycle module only emits a session warning and a destructive-command guardrail (`.opencode/plugin-modules/harness-lifecycle.js:1-21`).
10. Validation code rejects harness routing policy embedded in `opencode.json` (`.opencode/scripts/validate-harness.mjs:129-134`), verifies command files omit `model` (`.opencode/scripts/validate-harness.mjs:453-469`), and validates routing structure for role and orchestrator commands (`.opencode/scripts/validate-harness.mjs:219-243`).

**Inference from direct evidence**

- The harness already has a metadata/resolution layer for local-model preference, but no concrete local provider configuration and no committed model ID are active. A local endpoint will not be used by OpenCode solely because `.opencode/routing/harness-model-routing.json.localModel.routingServiceUrl` is set; native OpenCode still needs a native `provider`/`model` configuration or an invocation-time model selection.
- Repository search found no runtime call site beyond docs/validation for `resolve-model-routing.mjs`; if automatic dispatch to a selected model is required, a planner should decide whether to implement a dispatch bridge or keep the resolver as an explicit pre-dispatch helper.

### Native OpenCode config constraints

**Direct evidence from authoritative OpenCode sources**

1. `https://opencode.ai/config.json` defines the top-level `Config` object with `additionalProperties: false`; native fields include `$schema`, `provider`, `model`, `small_model`, `agent`, `command`, `enabled_providers`, `disabled_providers`, `plugin`, `permission`, and others. Therefore non-native top-level keys such as `harnessModelRouting`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback` must not be added to `opencode.json`.
2. The same schema defines `model` and `small_model` as strings in `provider/model` format and defines `AgentConfig.model` and command `model` as model strings. Harness conventions intentionally avoid command `model` even though native OpenCode allows it.
3. The schema defines native `provider` as an object keyed by provider ID, with `ProviderConfig` allowing `api`, `name`, `env`, `id`, `npm`, `whitelist`, `blacklist`, `options`, and `models`. `ProviderConfig.options` includes native `apiKey`, `baseURL`, and timeout fields, and `ProviderConfig.models` is a map of model IDs to model metadata such as `name`, `id`, `limit`, `options`, headers, variants, and status.
4. `https://opencode.ai/docs/config` states config files are merged by precedence and that project `opencode.json` is safe to check into Git. It also documents native `provider`, `model`, and `small_model` options, provider timeout options, plugin placement, and `{env:VAR}` / `{file:path}` substitutions for secrets.
5. `https://opencode.ai/docs/models` states default model strings are full IDs in `provider_id/model_id` format; for custom providers, `provider_id` is the key under `provider`, and `model_id` is the key under `provider.models`. It also documents loading priority: CLI `--model`/`-m`, config `model`, last used model, then internal priority.
6. `https://opencode.ai/docs/providers` states OpenCode uses AI SDK and Models.dev, supports 75+ providers and local models, and local OpenAI-compatible providers are configured through native `provider` entries. The local examples for Atomic Chat, llama.cpp, LM Studio, and Ollama use `npm: "@ai-sdk/openai-compatible"`, a display `name`, `options.baseURL`, and a `models` map; Ollama uses `http://localhost:11434/v1`, LM Studio uses `http://127.0.0.1:1234/v1`, and llama.cpp uses `http://127.0.0.1:8080/v1`.

### Missing pieces and recommended minimal path

**Missing pieces**

1. No native local provider is configured in `opencode.json` or documented as an installation-specific override in the current harness files (`opencode.json:1-8`).
2. No concrete `provider/model` string is selected for harness defaults; all `model` fields and local fallback fields in `.opencode/routing/harness-model-routing.json` are `null` or disabled (`.opencode/routing/harness-model-routing.json:4-8,10-39,70-89`).
3. No local provider setup guide or example currently explains how to map `localModel.routingServiceUrl` metadata to native OpenCode `provider.<id>.options.baseURL`, or how to keep secrets out of repo-managed config.
4. No automatic runtime bridge was found that invokes `resolve-model-routing.mjs` and passes the resulting `model` to native OpenCode execution; current evidence shows the resolver exists and is validated, but not wired as a provider call path.

**Recommended minimal path**

1. Keep harness-only metadata in `.opencode/routing/harness-model-routing.json`. Do not add `harnessModelRouting`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback` to `opencode.json` because the OpenCode schema is strict and the harness already documents/validates that boundary.
2. Add local provider support through native OpenCode config only. Minimal native shape for an OpenAI-compatible local endpoint is:
   - `provider.<provider-id>.npm: "@ai-sdk/openai-compatible"`
   - `provider.<provider-id>.name: "<display name>"`
   - `provider.<provider-id>.options.baseURL: "http://127.0.0.1:<port>/v1"`
   - `provider.<provider-id>.models.<model-id>.name` and optional `limit`
   - `model: "<provider-id>/<model-id>"` or invocation-time `--model <provider-id>/<model-id>`
3. Prefer documenting this as user/global configuration unless the project intentionally wants to force a local provider for every checkout. `https://opencode.ai/docs/config` documents global config at `~/.config/opencode/opencode.json`, project config precedence, custom config via `OPENCODE_CONFIG`, and env/file substitution; this avoids committing machine-specific endpoints or credentials.
4. If the harness should prefer local without forcing native defaults, set only harness-owned routing values after a planner decision, e.g. `localModel.localModelEnabled: true`, `preferLocal: true`, `localModelFallback: "ollama/qwen3-coder"`, plus `singleModel.model` or `defaultModel` when appropriate. Ensure the selected string exactly matches a native configured `provider/model` ID.
5. Add documentation or a reference snippet explaining that `routingServiceUrl` is routing metadata, while `provider.<id>.options.baseURL` is the native OpenCode endpoint actually used for model calls.
6. If automatic pre-dispatch model selection is required, plan a small integration that runs the resolver and applies the resulting `model` through a native OpenCode-supported mechanism (for example explicit command/invocation model selection), without putting non-native fields in `opencode.json` and without adding `model` frontmatter to harness role commands.
7. Extend validation only after implementation: parse native config, run resolver representative cases, and avoid network-dependent acceptance unless a task explicitly supplies a local endpoint health check.

### Risks

- A local model may not support reliable tool calling; the OpenCode providers docs caution to choose local models with strong tool-calling support for Atomic Chat and Ollama-like setups.
- Committing a project-level `model` can override users' global defaults and may break users without the same local endpoint. A documented global/`OPENCODE_CONFIG` path is safer for installation-specific local models.
- Storing API keys, OAuth secrets, or private auth file paths in repo-managed files violates existing harness guidance (`opencode-harness.design.md:177-180`; `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md:7-10`). Use `/connect`, environment variables, or file substitution outside the repo instead.
- The resolver's `routingServiceUrl` metadata does not itself configure native provider transport; confusing this with `provider.options.baseURL` would produce a routing decision that cannot reach the local model.
- Current search found no automatic resolver invocation path; assuming automatic model switching may be incorrect until planner/implementer evidence adds or documents the bridge.

- Evidence: See cited file paths/line ranges and authoritative URLs above.
- Artifact links:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/local-researcher-003-local-model-integration.md`

## Handoff

- Next role: `planner`
- Limitations: Research was read-only except this trace artifact. Web sources were fetched on 2026-07-17 UTC; provider/model IDs and endpoint choices remain installation-specific and were not supplied by the caller. No local endpoint was contacted, no final validation/acceptance was performed, and the orchestration `INDEX.md` was not updated because the allowed write scope was this researcher trace artifact only.
- Risks: Planner should keep native OpenCode config fields separate from harness-owned routing metadata, decide whether support belongs in documentation, project config, global-config guidance, or a dispatch bridge, and require validator evidence before acceptance.
