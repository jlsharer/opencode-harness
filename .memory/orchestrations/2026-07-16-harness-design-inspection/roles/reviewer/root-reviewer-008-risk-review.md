# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-16-harness-design-inspection`
- role: `reviewer`
- artifactId: `root-reviewer-008-risk-review`
- createdAt: `2026-07-17T02:26:32Z`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Defect/risk review request for current researcher, planner, and implementer artifacts plus OpenCode harness design, config, agents, commands, routing, plugins/modules, workflows, contracts, schemas, and validation script. Scope was review-only; only this reviewer trace artifact could be created or updated.
- Required context present: orchestration ID, memory root, role contract catalog, trace schema, delegation skill/workflow paths, routing metadata status, source paths, local-model and context-management focus areas, and output requirements were supplied.
- Routing metadata status: absent. Caller-supplied routing metadata labels were absent; no routing values were invented.

## Work Performed

- Summary: Read the supplied orchestration index, role artifacts through planner/implementer refresh, design/config/runtime harness surfaces, workflow/skill guidance, contracts/schemas, routing resolver/config, plugin adapter/module, and validation script. Ran command-backed checks for git status/diff, harness validation, resolver behavior, tracked skill coverage, ignored local package files, and focused secret/reference searches. Reviewed from a defect-first stance; no runtime/config/workflow/design files were modified.
- Files read:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/implementer/root-implementer-001-memory-index.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/implementer/root-implementer-006-memory-index-refresh.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/root-researcher-002-design-current-state.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/local-researcher-003-local-model-integration.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/context-researcher-004-agent-context-management.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/planner/root-planner-005-inspection-plan.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/integrator/root-integrator-007-consistency.md`
  - `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/templates/*.md`
  - `opencode-harness.design.md`, `opencode.json`, `AGENTS.md`, `.gitignore`
  - `.opencode/agents/*.md`, `.opencode/commands/*.md`, `.opencode/routing/*`, `.opencode/plugins/index.js`, `.opencode/plugin-modules/harness-lifecycle.js`, `.opencode/workflows/*.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/*.json`, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, `.opencode/skills/delegation-orchestrator/**`, `.opencode/skills/opencode-skill-authoring/SKILL.md`, `.opencode/skills/opencode-workflow-guidance/SKILL.md`, `.opencode/.gitignore`, `.opencode/package.json`
- Files changed:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/reviewer/root-reviewer-008-risk-review.md`
- Commands/checks:
  - Loaded `delegation-orchestrator` skill.
  - `git status --short`
  - `git diff --stat -- .memory .opencode opencode.json AGENTS.md opencode-harness.design.md`
  - `git diff -- .memory/orchestrations/2026-07-16-harness-design-inspection .memory/INDEX.md`
  - `node .opencode/scripts/validate-harness.mjs` -> passed before this reviewer artifact existed; emitted a Node MODULE_TYPELESS_PACKAGE_JSON warning for `.opencode/plugins/index.js` / `.opencode/package.json`.
  - `git ls-files ".opencode/skills"`
  - `git status --short --ignored -- ".opencode/package.json" ".opencode/package-lock.json" ".opencode/node_modules" ".opencode/.gitignore"`
  - `git ls-files ".agents" ".codex"`
  - `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.json --command delegate-research --role researcher --metadata-json '{...local metadata...}'` -> returned `agent: researcher`, `variant: research`, no top-level `model`, `effectiveFallbackModel: ollama/qwen3-coder`, `networkCalls: false`.
  - `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.json --command delegate-orchestration` -> returned orchestrator variant, no agent/model, `networkCalls: false`.
  - Fetched `https://opencode.ai/config.json` to spot-check native config fields for provider/model, `subagent_depth`, `tool_output`, `compaction`, agent `steps`, and permission `task`.
  - Focused grep/read checks for routing metadata keys, prior-projection references, context-control keys, and secret-token terms in scoped harness files and current orchestration memory.
  - Created the reviewer role directory/wrote this artifact with a scoped `mkdir -p` and `python3` write because no separate write/edit tool was available; then read the artifact back.
  - Post-artifact `node .opencode/scripts/validate-harness.mjs` -> failed: `.memory/INDEX.md must index orchestration memory path: orchestrations/2026-07-16-harness-design-inspection/roles/integrator/root-integrator-007-consistency.md`. This integrator artifact appeared during the review window and, like this reviewer artifact, is outside the current indexes.

## Output Contract

- Outputs: Defect-first prioritized findings, open questions, residual risk, change summary, local-model risk assessment, context-management risk assessment, missing validation/tests, and handoff notes.
- Evidence:

### Prioritized review findings

1. **High - `validate-harness.mjs` can miss invalid local-model routing keys in `opencode.json`.** The design requires `opencode.json` to contain only native OpenCode keys and keeps harness routing in `.opencode/routing/harness-model-routing.json` (`opencode-harness.design.md:34`, `opencode-harness.design.md:130-137`), and current `opencode.json` is minimal (`opencode.json:1-9`). However the validation guard only rejects `harnessModelRouting|roleOverrides|commandOverrides|complexityTiers` in serialized config (`.opencode/scripts/validate-harness.mjs:129-134`) and does not reject `routingServiceUrl`, `localModelEnabled`, `preferLocal`, or `localModelFallback`. Without official schema validation, a future local-model implementation could add those non-native keys to `opencode.json` and still pass the project script.

2. **High - Required resolver behavior is not covered by the harness validation script.** The design says validation includes the resolver resolving explicit, command, role, complexity, single/default, and local-fallback cases without network calls (`opencode-harness.design.md:171-173`), and the validation workflow requires representative resolver runs (`.opencode/workflows/validation-workflow.md:14-16`). The script only checks routing config structure in `assertRouting` (`.opencode/scripts/validate-harness.mjs:219-243`) and main only calls that static assertion (`.opencode/scripts/validate-harness.mjs:426-427`); there is no `resolveModelRouting` import or child-process execution. A broken resolver could pass `node .opencode/scripts/validate-harness.mjs`.

3. **Medium - Tracked runtime skills are outside the design/manifest baseline, and validation is blind to extra tracked `.opencode` files.** The design-owned skill surface lists only `delegation-orchestrator` and references (`opencode-harness.design.md:27`, `opencode-harness.design.md:115`), and the manifest lists only those skill files (`.opencode/harness.manifest.json:29-32`). `git ls-files ".opencode/skills"` shows two additional tracked project skills: `.opencode/skills/opencode-skill-authoring/SKILL.md` and `.opencode/skills/opencode-workflow-guidance/SKILL.md`. The manifest check is built from hard-coded expected paths (`.opencode/scripts/validate-harness.mjs:36-60`, `.opencode/scripts/validate-harness.mjs:182-194`), so it can pass while unmanifested tracked OpenCode runtime assets exist. This is either manifest/design drift or an unintended auto-discovered prompt surface.

4. **Medium - Trace artifact schema, contract catalog, and Markdown template remain incompatible for machine validation.** The role contract catalog requires trace fields named `inputSummary`, `outputSummary`, and `evidence` (`.opencode/contracts/role-io-contracts.json:17-19`, `.opencode/contracts/role-io-contracts.json:92-94`), while the JSON schema requires `inputContract` and `outputContract` objects (`.opencode/schemas/memory-trace-artifact.schema.json:6`, `.opencode/schemas/memory-trace-artifact.schema.json:18-27`, `.opencode/schemas/memory-trace-artifact.schema.json:39-48`). The template is Markdown headings rather than JSON (`.memory/templates/role-trace-artifact.md:12-35`). Roles can follow the spirit of the template, but validators lack an unambiguous artifact-to-schema mapping.

5. **Medium - Validation walks ignored local `.opencode` dependency trees during prior-projection reference checks.** Ignored local package/dependency files exist under `.opencode` (`.opencode/.gitignore:1-5`, `.opencode/package.json:1-5`; `git status --ignored` reports package files and `node_modules/`). `assertPriorProjectionReferences` scans every file returned by `walk('.opencode')` (`.opencode/scripts/validate-harness.mjs:171-179`), and `walk` recurses without ignoring `node_modules` or ignored files (`.opencode/scripts/validate-harness.mjs:399-410`). This can make validation slow or flaky and can fail because of local ignored dependency content outside the harness deliverable surface.

6. **Medium - Newly generated role artifacts are not indexable by this role's allowed edit scope, so post-review validation fails until an index-maintenance step runs.** The memory protocol requires orchestration indexes to link retained role traces (`.memory/protocols/memory-management.md:41-45`) and `validate-harness.mjs` requires every `.md` under `.memory/orchestrations` to appear in `.memory/INDEX.md` (`.opencode/scripts/validate-harness.mjs:270-288`). The current top-level memory index lists artifacts through `root-implementer-006-memory-index-refresh` only (`.memory/INDEX.md:50-55`), while the orchestration index still lists no integrator or reviewer artifact (`.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md:105-110`). A post-artifact validation run failed first on the unindexed integrator artifact; this reviewer artifact will need the same index refresh. Because this task forbids index edits, downstream memory-maintenance work is required before final validation.

### Local-model risk assessment

- The researchers and planner correctly avoid adding local-model metadata to `opencode.json`; this aligns with the strict native schema and current minimal config (`opencode.json:1-9`).
- Current local-model support is metadata-only. Routing config defaults are disabled/null (`.opencode/routing/harness-model-routing.json:84-89`), and resolver output keeps `networkCalls: false` (`.opencode/routing/resolve-model-routing.mjs:126-133`). A resolver run with local metadata produced `effectiveFallbackModel` but no top-level `model`, so downstream code must not assume local fallback actually configures OpenCode transport.
- Minimal local integration should remain documentation/global-config/invocation guidance unless a separate implementation adds native `provider.<id>.options.baseURL` and `provider/model` selection. Committing machine-specific provider/model defaults in project `opencode.json` risks breaking users without the endpoint and conflicts with non-goals for secrets/private paths (`opencode-harness.design.md:177-180`).
- The highest local-model review risk is validation overconfidence: the script neither schema-validates `opencode.json` nor exercises resolver cases, so local-model changes need explicit validator cases beyond the current script.

### Context-management risk assessment

- The context-management recommendations are directionally valid but should remain future design work, not implicit acceptance criteria. Current repo evidence shows broad/full-context wording (`opencode-harness.design.md:77-80`, `.opencode/skills/delegation-orchestrator/SKILL.md:27-33`) and no configured context controls in `opencode.json` (`opencode.json:1-9`).
- Native config/schema support for `compaction`, `tool_output`, `subagent_depth`, agent `steps`, and permission `task` was spot-checked in the fetched OpenCode config schema, so those are not inherently invalid OpenCode assumptions. The exact values and role effects remain unvalidated.
- Plugin compaction/session recommendations are the riskiest overreach: current plugin code is only a load warning, destructive-command guardrail, and no-op message hook (`.opencode/plugin-modules/harness-lifecycle.js:1-21`), while the research notes plugin hook payloads were not live-validated. Any future plugin telemetry must stay non-authoritative per design (`opencode-harness.design.md:139-147`).
- Adding aggressive budgets, source hashes, or truncation rules can hide evidence or store machine-local data if not designed carefully; validators should first require source lists/retrieval dates and privacy-safe stale-source criteria.

### Missing validation/tests

- Add or require explicit validation that `opencode.json` contains no local-model metadata keys (`routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`) and ideally validate against the official OpenCode schema.
- Add resolver execution tests for explicit model, command override, role override, complexity tier, single/default model, orchestrator command, and local metadata fallback; confirm no network calls and confirm whether fallback should or should not populate top-level `model`.
- Add a manifest/tracked-surface check that flags tracked `.opencode` runtime assets not present in `.opencode/harness.manifest.json`, or deliberately document and exclude them.
- Add a machine-checkable trace artifact validation strategy: either JSON sidecar/schema validation, a Markdown-to-schema mapping, or schema/contract/template reconciliation.
- Exclude ignored local dependency trees from validation scans or move `.opencode` package/dependency material outside the project harness surface.
- Final validator still needs command-backed evidence after this reviewer artifact is indexed, including `node .opencode/scripts/validate-harness.mjs`, git status/diff review, secret scan, prior-projection runtime-reference scan, and confirmation no runtime/config/design files changed.

### Open questions

- Are `opencode-skill-authoring` and `opencode-workflow-guidance` intended baseline runtime skills, or should they be de-scoped from this harness projection?
- Should local-model fallback metadata ever populate the resolver's top-level `model`, or is `effectiveFallbackModel` intentionally advisory only?
- Should reviewer/synthesizer remain orchestrator-only roles without direct slash commands, or should command parity be added in a separate design task?
- Should trace artifacts remain Markdown-only, or should generated JSON artifacts/sidecars be introduced for schema validation?

### Residual risk

- Current validation passed before later role artifacts existed, but post-review validation is now blocked by unindexed integrator/reviewer artifacts until indexes are refreshed.
- Several findings are validation and design-policy gaps rather than current runtime failures; final synthesis should avoid claiming implementation support for local model dispatch or context controls.
- Web/OpenCode schema evidence was spot-checked during review, but plugin hook runtime payloads and live local endpoints were not validated.

### Change summary

- Current implementation changes under review are memory-only: `.memory/INDEX.md` has been updated to index the new orchestration through planner/implementer refresh, and this review adds only the reviewer trace artifact. No `.opencode`, `opencode.json`, `AGENTS.md`, or design files were modified in this review.

- Artifact links:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/reviewer/root-reviewer-008-risk-review.md`

## Handoff

- Next role: integrator/synthesizer after indexing remediation as assigned; validator must run final checks before acceptance.
- Limitations: Review-only. I did not rewrite implementation, update indexes, validate final acceptance, or contact a live local model endpoint. Line references reflect files read in this working tree. The integrator artifact that appeared during review and this reviewer artifact both need downstream indexing because the review scope allowed only this file.
- Risks: Validation gaps around local-model keys, resolver behavior, extra tracked skills, trace schema alignment, and ignored dependency scans should be remediated or explicitly accepted before final orchestration acceptance.
