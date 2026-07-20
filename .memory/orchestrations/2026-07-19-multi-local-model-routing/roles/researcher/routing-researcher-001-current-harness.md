# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-multi-local-model-routing`
- role: `researcher`
- artifactId: `routing-researcher-001-current-harness`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Inspect current routing, enforcement, validation, documentation, sample, manifest, schema, and contract surfaces for multiple named local models and force-local delegation.
- Required context present: Yes. Scope, relevant paths, freshness, downstream needs, IDs, and write boundary were supplied.
- Routing metadata status: absent. No caller routing values were invented. Resolved researcher metadata was treated as harness context only.

## Work Performed

- Summary: Read repository routing and orchestration surfaces, searched routing terms and tests, and ran offline parse, syntax, resolver, config-hook, and full harness checks.
- Files read: `AGENTS.md`; `opencode.json`; `opencode-harness.design.md`; `.opencode/routing/*`; `.opencode/plugin-modules/*`; `.opencode/plugins/index.js`; `.opencode/scripts/validate-harness.mjs`; `.opencode/commands/*`; `.opencode/workflows/*`; `.opencode/skills/delegation-orchestrator/SKILL.md` and references; `.opencode/harness.manifest.json`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; memory protocol and trace template.
- Files changed: Only this required trace artifact. No implementation files changed.
- Commands/checks:
  - `git status --short` showed a pre-existing dirty worktree.
  - `node .opencode/scripts/validate-harness.mjs` failed at its default-path expectation.
  - Resolver checks for `/delegate-research` and explicit cloud model completed offline.
  - `node --check` passed for resolver, helper, enforcement, and plugin adapter.
  - Target JSON parse check passed.
  - Direct config-hook check left all eight committed role models unset and emitted a non-fatal Node module-type warning.

## Output Contract

- Outputs: citedFindings, sourceList, implementationImplications, risks, recommendedNextRole, unresolvedQuestions, and traceArtifactPath.
- Evidence: Direct findings are separated from inferred candidate semantics below and cite repository paths with line ranges.
- Artifact links: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/routing-researcher-001-current-harness.md`

## Cited Findings

1. **Singular advisory local config.** [Direct] The only local shape is one `localModel` object with one URL, two booleans, and one fallback; committed values enable metadata but do not prefer it. `.opencode/routing/harness-model-routing.json:84-89`.
2. **Local metadata does not select the top-level model.** [Direct] Model candidates use explicit caller, orchestrator, command, role, complexity, single, then default entries. Local fields are resolved separately, and `effectiveFallbackModel` never becomes top-level `model`. `.opencode/routing/resolve-model-routing.mjs:64-100,102-134`.
3. **Current precedence.** [Direct] Model and variant resolve independently. Explicit `explicitModel`, `providerModel`, or `model` wins; then command, role, complexity, enabled single model, and default model. Request agent wins command agent. `.opencode/routing/resolve-model-routing.mjs:65-100`. The design states the same model order without the inert orchestrator entry. `opencode-harness.design.md:117-137`.
4. **Enforcement is role-only and currently no-op.** [Direct] The config hook only applies non-null `roleOverrides[role].model`, ignores `singleModel` and `defaultModel`, requires one of eight fixed roles and a provider-prefixed model, then mutates `cfg.agent[role].model`. `.opencode/plugin-modules/role-model-routing-enforcement.js:5-18,73-123`. All committed role models are null. `.opencode/routing/harness-model-routing.json:9-39`.
5. **Resolver and runtime can diverge.** [Direct plus inference] Resolver output can select caller, single, or default models, while runtime hook ignores those values; the helper only invokes the resolver and returns JSON. No repository code binds a per-delegation decision to native dispatch. `.opencode/routing/model-routing-helper.mjs:12-25`; `.opencode/plugin-modules/role-model-routing-enforcement.js:99-123`; `.opencode/skills/delegation-orchestrator/SKILL.md:25-34`. Therefore current documentation that resolved model metadata drives dispatch is not proven by implementation.
6. **Plugin boundary.** [Direct] The sole auto-loaded adapter composes lifecycle and enforcement hooks. Lifecycle logs observation but performs no model injection. `.opencode/plugins/index.js:1-9`; `.opencode/plugin-modules/harness-lifecycle.js:1-27`.
7. **Native transport remains separate.** [Direct] Harness policy must stay out of `opencode.json`; actual endpoints require native provider configuration and provider/model IDs outside committed defaults. `AGENTS.md:12-17`; `opencode-harness.design.md:34,139-143`; `opencode.json:1-9`. The llama guide already documents two models as two server ports and two native provider/model entries, but does not bind roles. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md:172-181`.
8. **No routing schema or dedicated test suite exists.** [Direct] Validation hard-codes routing keys and representative cases inside one script. `.opencode/scripts/validate-harness.mjs:72-86,233-325,395-532`. Repository search found no test or spec files and no root package manifest; `.opencode/package.json` only declares the plugin dependency at lines 1-5.
9. **Validation encodes legacy behavior.** [Direct] It requires exact role and command sets, tests current precedence and singular local fallback, and explicitly asserts that single/default remain resolver-only. `.opencode/scripts/validate-harness.mjs:233-325,413-517`. It also rejects model frontmatter on every agent and command. `.opencode/scripts/validate-harness.mjs:688-715`.
10. **Documentation surfaces claim routing flow and require updates.** [Direct] Orchestrator command and skill require running the resolver and passing resolved model metadata. `.opencode/commands/delegate-orchestration.md:31-51`; `.opencode/skills/delegation-orchestrator/SKILL.md:25-34`. Workflow and checklist require routing consistency and representative checks. `.opencode/workflows/delegation-workflow.md:24-36`; `.opencode/workflows/validation-workflow.md:5-18`; `.opencode/skills/delegation-orchestrator/references/validation-checklist.md:5-35`.
11. **Manifest impact is conditional.** [Direct] Existing routing, plugin, docs, and validator paths are already listed. `.opencode/harness.manifest.json:29-46`. [Inference] The manifest changes only if a new routing schema, dedicated tests, or new docs are added; existing-file-only edits require no artifact-list change.
12. **Contracts are likely not directly changed.** [Direct] Research role I/O requires routing metadata status but defines no named local model or endpoint handoff. `.opencode/contracts/role-io-contracts.json:8-22`. The trace schema only records routing metadata status as present or absent. `.opencode/schemas/memory-trace-artifact.schema.json:18-27`. [Inference] Change these only if resolved local name, model, or URL becomes required role handoff data.
13. **Current baseline is red.** [Direct] Full validator failed because its default-path test expects current config to assign implementer `llamacpp/qwen-local`, while current worktree assigns null. `.opencode/scripts/validate-harness.mjs:451-464`; `.opencode/routing/harness-model-routing.json:18-20`. This predates this research artifact.
14. **Prior projections are excluded.** [Direct] `.agents/` and `.codex/` are reference-only and cannot become runtime dependencies. `AGENTS.md:3-5,26-28`; `opencode-harness.design.md:44-48`.

## Surface Impact Matrix

- Must change: routing JSON, resolver, helper, role-model enforcement plugin, validator tests, design routing section, delegation skill, orchestrator command, delegation and validation workflows, role routing matrix, llama multi-port guide, and validation checklist.
- Review or wording-only: lifecycle telemetry, plugin adapter, all six role command prompts, AGENTS instructions, trust and restart guide.
- Conditional new surfaces: dedicated routing JSON schema and dedicated routing test file. If created, add them to harness manifest and validator static path lists.
- Likely unchanged unless handoff fields change: role I/O contracts, role-contract schema, memory trace schema, eight agent prompts, and native `opencode.json`.

## Candidate Config Semantics

[Inference, not a final plan]

- Prefer a named map such as `localModels.<name> = { model: provider/model, routingServiceUrl: URL }` plus separate policy such as `localRouting = { enabled, forceAllDelegatedSubagents, defaultLocalModel }`.
- Use `roleOverrides.<role>.localModel` as a catalog name rather than overloading existing `model`, which already means native provider/model.
- Under force mode, bind each fixed role by role local name, then default local name, then fail closed. Return model, local model name, URL, and source from one core resolver.
- True force semantics cannot retain arbitrary caller cloud model as highest precedence. The planner must explicitly define whether force rejects or overrides caller cloud choices.
- Keep URL advisory and native provider transport external. A named entry must pair one provider/model ID and one URL, but harness URL alone cannot activate transport.

## Implementation Implications

- Use one shared resolution function for CLI output and config-hook mutation to avoid split-brain decisions.
- Validate the complete catalog, default reference, role references, and all eight target agents before mutating any agent to avoid partial application.
- Preserve current role/command mappings, variants, no-model frontmatter, offline `networkCalls: false`, and native-only `opencode.json` boundary.
- Define a migration for singular `localModel`, `localModelFallback`, `preferLocal`, and `singleModel/defaultModel`; silent reinterpretation would change precedence.
- Add tests for valid multiple entries, duplicate or ambiguous model IDs, malformed or blank URLs/models, missing default, unknown role model name, force on/off, all eight roles, explicit caller cloud/local interaction, role/default selection, no partial mutation, offline behavior, and legacy migration.
- Remove the current validator dependence on a specific committed implementer model.

## Risks

- Semantic split-brain among resolver, prompt guidance, and config hook.
- Force bypass if caller explicit model remains first.
- Endpoint/model mismatch because harness URL is advisory but native provider baseURL controls traffic.
- Partial config mutation on later validation error.
- Ambiguous scope of every delegated subagent beyond the eight fixed roles.
- Breaking migration from singular local fields and current precedence.
- Remote endpoints labeled local may expose prompts or require secrets; no credentials belong in routing config or memory.
- Current red baseline can obscure regressions.

## Unresolved Questions

1. Does force local reject every caller model or only non-catalog cloud models?
2. Does every delegated subagent mean only the eight harness roles or native and custom subagents too?
3. Is legacy singular config migrated automatically or rejected under a schema version?
4. May two names share one provider/model ID with different URLs, and which URL is canonical?
5. Should committed endpoint metadata remain, despite docs placing machine-specific transport in user/global config?
6. What native provider configuration and live test environment will prove endpoint activation and tool calling?

## Source List

- `.opencode/routing/harness-model-routing.json:3-89`
- `.opencode/routing/resolve-model-routing.mjs:59-134`
- `.opencode/routing/model-routing-helper.mjs:12-25`
- `.opencode/plugin-modules/role-model-routing-enforcement.js:5-129`
- `.opencode/plugins/index.js:1-9`
- `.opencode/plugin-modules/harness-lifecycle.js:1-27`
- `.opencode/scripts/validate-harness.mjs:72-86,233-325,395-532,585-626,655-723`
- `opencode-harness.design.md:20-46,84-143,145-179`
- `AGENTS.md:3-28`; `opencode.json:1-9`
- `.opencode/commands/delegate-orchestration.md:10-51`; `.opencode/commands/delegate-research.md:8-14`
- `.opencode/workflows/delegation-workflow.md:7-36`; `.opencode/workflows/validation-workflow.md:5-18`
- `.opencode/skills/delegation-orchestrator/SKILL.md:10-34`
- `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md:38-50`
- `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md:87-121,172-181,217-233`
- `.opencode/skills/delegation-orchestrator/references/validation-checklist.md:5-41`
- `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md:1-21`
- `.opencode/harness.manifest.json:5-46`
- `.opencode/contracts/role-io-contracts.json:1-22`; `.opencode/schemas/memory-trace-artifact.schema.json:1-60`

## Handoff

- Next role: `planner`
- Limitations: Repository-only and offline checks cannot prove endpoint reachability, native dispatch selection, provider compatibility, or tool calling. Worktree was already dirty and full validation currently fails.
- Risks: Force precedence, migration, endpoint/provider coherence, and exact subagent scope need explicit planning decisions.
