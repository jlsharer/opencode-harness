# OpenCode Harness Design

## Purpose and Scope

This document defines a standalone OpenCode projection of the Universal Agentic Harness. The deliverable is a set of OpenCode-owned project files under `.opencode/` plus root project guidance files. Reference projections from other hosts may inform the implementation, but they are not runtime dependencies and are not part of the OpenCode solution surface.

The harness preserves these eight role names exactly:

- `researcher`
- `planner`
- `implementer`
- `integrator`
- `validator`
- `reviewer`
- `synthesizer`
- `artifact-verifier`

The baseline projection covers role agents, command prompts, delegation and validation workflows, a harness-owned model routing resolver, lifecycle guardrails, and validation tooling. It does not define provider credentials, durable task state, external routing services, or canonical orchestration ledgers.

## Standalone OpenCode Surface

The OpenCode harness owns these files:

- Root OpenCode project files: `opencode.json`, `AGENTS.md`, and this design document.
- Role agents: `.opencode/agents/*.md`.
- Commands: `.opencode/commands/delegate-*.md`, including the central orchestrator-owned `.opencode/commands/delegate-orchestration.md`.
- Skills and references: `.opencode/skills/delegation-orchestrator/SKILL.md` and `.opencode/skills/delegation-orchestrator/references/*.md`.
- Workflows: `.opencode/workflows/delegation-workflow.md` and `.opencode/workflows/validation-workflow.md`.
- Role contracts and schemas: `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, and `.opencode/schemas/harness-model-routing.schema.json`.
- Harness routing: committed `.opencode/routing/harness-model-routing.example.json`, optional ignored operator override `.opencode/routing/harness-model-routing.json`, shared loader `.opencode/routing/routing-config-loader.mjs`, the pure `.opencode/routing/routing-policy.mjs`, its dependency-free tests, and thin CLI/helper entry points.
- Local deployment examples: `.opencode/deployments/llama-server/`, containing a reusable Compose service, tracked sanitized env templates, and operator guidance. Private `instances/*.env` copies are not harness artifacts.
- Lifecycle plugin adapter and guardrails: `.opencode/plugins/index.js` as the only auto-loaded plugin entry point, with segmented guardrail modules under `.opencode/plugin-modules/`.
- Validation and manifest files: `.opencode/scripts/validate-harness.mjs` and `.opencode/harness.manifest.json`.

`opencode.json` must contain only native OpenCode configuration keys. Harness-owned routing settings must not be embedded in `opencode.json`; committed defaults live in `.opencode/routing/harness-model-routing.example.json` and are consumed by the harness resolver.

Project-owned memory lives under `.memory/`:

- Static memory: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, and `.memory/templates/*.md`.
- Generated orchestration memory: `.memory/orchestrations/<orchestration-id>/`.
- Role trace artifacts: `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.

OpenCode does not provide an official native `.memory` protocol in the cited research evidence. This harness treats `.memory` as project-owned memory and exposes the protocol through native `instructions` in `opencode.json`.

## Reference Material and Prior Projection Examples

The directories `.agents/` and `.codex/` are reference material only. They may be used to understand prior role wording, workflow boundaries, and validation expectations, but they must not be treated as OpenCode deliverable paths, command dependencies, manifest artifacts, or runtime requirements.

Do not delete `.agents/` or `.codex/` as part of this projection. They remain available for comparison unless a separate cleanup task explicitly authorizes their removal.

## OpenCode Role Agents

Each role is implemented as a Markdown agent file under `.opencode/agents/` with YAML frontmatter containing:

- `description`: concise trigger guidance.
- `mode: subagent`: the role is a delegated worker, not the primary orchestration surface.
- `permission`: conservative tool permission posture.

Role prompt bodies must preserve boundaries:

- `researcher`: source-backed evidence and citations; no implementation or acceptance decisions.
- `planner`: task sequencing, file contracts, and acceptance gates; no file edits.
- `implementer`: exact scoped file creation or modification; no broad planning, integration, or final validation.
- `integrator`: cross-artifact consistency and path coherence; no hidden scope expansion.
- `validator`: parse, file, schema, command, and acceptance evidence; no implementation fixes.
- `reviewer`: code-review findings ordered by severity; no rewrites unless separately assigned.
- `synthesizer`: conflict resolution and recommendation consolidation; no source-free invention.
- `artifact-verifier`: generated artifact proof, temp-directory checks, and render/parse evidence where applicable.

Each role must also follow `.opencode/contracts/role-io-contracts.json`. The catalog defines required inputs, required outputs, trace artifact path templates, and verification expectations for all eight roles. Trace artifacts are shaped by `.opencode/schemas/memory-trace-artifact.schema.json` and indexed from `.memory/orchestrations/<orchestration-id>/INDEX.md`.

## Delegation Protocol

The harness uses delegation-only orchestration. Parent orchestration coordinates, delegates, reviews returned evidence, asks for remediation, and consolidates final results. It does not perform role work directly.

The workflow is:

1. Classify the request into research, planning, implementation, integration, validation, review, synthesis, or artifact verification work.
2. Dispatch each work category to the matching role.
3. Pass complete task context, allowed paths, file contracts, verification gates, `orchestration-id`, memory root, role contract catalog, trace schema, trace artifact requirement, and any caller-supplied routing metadata.
4. Inspect role outputs for required evidence and trace artifact references.
5. Request remediation from the responsible role when evidence is incomplete.
6. Accept only after validator evidence, and artifact-verifier evidence when generated artifacts are involved, is present.

Delegated prompts that originate from enriched orchestration input must preserve caller-supplied labels exactly:

- `### Delegation Parameters`
- `**Provider Model**`
- `**Routing Config**`
- `routingServiceUrl`
- `localModelEnabled`
- `preferLocal`
- `localModelFallback`

If those labels are absent from the original request, the OpenCode harness does not invent values for them. Command prompts document preservation behavior but do not add synthetic routing metadata.

## Commands, Skills, and Workflows

`/delegate-orchestration` is the parent orchestration command for arbitrary workflows. It is orchestrator-owned, so it intentionally omits `agent` frontmatter and sets `subtask: false`. It decomposes the requested workflow into a DAG of scoped work units and sub-workflows, runs independent role instances in parallel whenever dependencies allow, requires research before planning, and requires validation before acceptance.

Role names are fixed, but role instances are repeatable. A workflow can use many `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, or `artifact-verifier` instances as long as each instance has a scoped artifact ID and trace artifact under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.

Remediation is capped at 3 loops per scoped work unit. After the third failed loop, the orchestrator delegates blocker synthesis and asks the user for direction.

OpenCode command files are thin wrappers around role-specific prompts:

- `/delegate-research` routes to `researcher`.
- `/delegate-plan` routes to `planner`.
- `/delegate-implement` routes to `implementer`.
- `/delegate-integrate` routes to `integrator`.
- `/delegate-validate` routes to `validator`.
- `/delegate-artifact-verify` routes to `artifact-verifier`.

Role-specific command frontmatter uses `description` and `agent` only. The central `/delegate-orchestration` command omits `agent` so it belongs to the current parent orchestrator rather than a subagent role. Model selection is omitted from command frontmatter so the harness-owned resolver can decide model routing before dispatch without mixing non-native routing policy into command definitions.

The reusable delegation rules live in `.opencode/skills/delegation-orchestrator/SKILL.md`. Longer routing, validation, and trust/restart guidance lives under its `references/` directory. Workflow files under `.opencode/workflows/` define the design-to-implementation and acceptance-validation gates.

## Model Routing

Native OpenCode can select models through its own configuration and invocation controls. Harness model routing is a separate policy layer that chooses a model, variant, and role target before native dispatch.

The routing document is a strict v2 contract. It contains named local catalog entries, a catalog default, per-role native or local selectors, fixed command targets, complexity tiers, and explicit `enabled` and `forceLocalForHarnessSubagents` switches. Legacy singular local keys are rejected with migration guidance rather than inferred. A dependency-free pure policy module performs executable normalization and semantic validation; the draft 2020-12 schema is the structural interoperability document.

The committed example is the deterministic validation input. Operators may optionally copy it to `.opencode/routing/harness-model-routing.json` and customize that ignored file. Implicit loads select the custom file when present and otherwise the example; the documents are never merged. A selected custom file that is unreadable, malformed, or semantically invalid fails closed without example fallback. Explicit paths read exactly that path. If neither implicit candidate exists, the loader reports both paths and the `cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json` setup command. Plugin project discovery walks ancestors to the first routing pair, then falls back to the module pair.

The committed catalog is enabled for discovery and advisory resolution while force-local activation remains false. Outside force mode, model precedence is explicit request, orchestrator command, command, role local selector, role native override, complexity, enabled single model, then default model. Catalog metadata can describe an advisory local choice, but only a non-null native role override is eligible for startup agent configuration. The resolver makes no network calls and does not prove native enforcement.

Force mode applies only to the exact eight fixed harness roles. A role local selector precedes the catalog default, and an explicit request model becomes an exact-match constraint rather than an escape route. At startup, the async config hook computes all eight assignments and preflights every existing subagent, native provider prefix, provider model declaration when present, and catalog-backed canonical `baseURL`. Only after the complete plan passes does it set agent models. Any mismatch deliberately rejects startup with no partial agent or provider mutation and no cloud/default fallback.

Actual provider transport remains native OpenCode configuration outside committed project defaults. Approved user/global config or a non-conflicting `OPENCODE_CONFIG` can define native provider options, credentials or environment references, model maps, and `provider/model` identities. `OPENCODE_CONFIG` merges before project config and is not a final override; `OPENCODE_CONFIG_CONTENT` is merged later but must not be used to commit or expose secrets. Harness routing never creates or mutates providers, baseURLs, credentials, or model maps.

Catalog provider ids, model aliases, endpoint URLs, ports, GPU settings, and capacities are illustrative examples, not installed-resource claims. Endpoint `maxInFlight` values are cooperative orchestration budgets grouped by canonical URL, not runtime semaphores or capacity proof. Shared-URL catalog entries require equal budgets.

Config and plugin changes require fully quitting and restarting OpenCode. The force-false example does not configure provider transport or mutate native agents. Local integration validation is offline and explicitly example-based: parse policy/schema/native config, exercise policy/CLI/helper parity, prove force-false advisory behavior and atomic synthetic force behavior, and reject secrets or non-native routing keys in `opencode.json`. Live health, exact model identity, delegated tool use, quality, concurrency, and VRAM benchmarks are separate operator-dependent gates; health alone is insufficient.

## Local llama-server Deployment

`.opencode/deployments/llama-server/compose.yaml` is one static service template run as separately named `llama-research` and `llama-coder` projects with private ignored env files. It requires an approved digest-pinned image, a unique loopback host port, an existing absolute model directory, a model file, and an alias. The model directory is mounted read-only without automatic host-path creation. The service intentionally has no fixed `container_name`, overriding `command`, or secret.

The checked-in env templates align with the illustrative routing identities but require operator replacement of image digest, private paths, aliases where needed, topology, and unmeasured capacities. NVIDIA capability reservation does not prove GPU isolation. Static instance settings change on recreation, and a request model must match the resident alias. Request-time selection requires a separately designed router with cold-load, eviction, timeout, provider-propagation, shared-failure-domain, and endpoint-budget validation.

## Lifecycle Guardrails

`.opencode/plugins/index.js` is the local project plugin entry point. It is the only JavaScript module in the auto-loaded `.opencode/plugins/` directory. It is a pure adapter that imports segmented logic from `.opencode/plugin-modules/` and exports the default plugin function expected by OpenCode local plugin loading.

`.opencode/plugin-modules/harness-lifecycle.js` provides guardrail and telemetry hooks for OpenCode sessions. It can warn about dangerous commands, remind users that delegation evidence is required, and surface validation guidance. Keeping it outside `.opencode/plugins/` prevents OpenCode from auto-loading segmented modules separately from the adapter.

`.opencode/plugin-modules/role-model-routing-enforcement.js` is the startup configuration boundary for the assignment plan described above. It is separate from lifecycle telemetry and is not acceptance evidence. Although its config callback is asynchronous, all selected native relationships are checked before any agent mutation.

Do not list `.opencode/plugins/index.js` or `.opencode/plugin-modules/harness-lifecycle.js` as local paths in `opencode.json`; the documented `plugin` array is for npm packages, while local project plugins live under `.opencode/plugins/`.

Lifecycle hooks are not acceptance proof. Acceptance requires concrete validator or artifact-verifier evidence from `.opencode/workflows/validation-workflow.md` and `node .opencode/scripts/validate-harness.mjs`.

## Agentic Protocol Hooks

The accepted agentic protocol hook design is a future harness extension for low-noise, deterministic reminders around high-value agent actions. It does not add runtime hook files in this document change. The design keeps hooks as guardrails and telemetry only; validator or artifact-verifier evidence remains the acceptance boundary.

### Architecture and Boundaries

The design uses a host-neutral core for event normalization, file/action classification, registry selection, noise policy, reminder rendering, ledger-entry shaping, and summaries. Future OpenCode delivery belongs in segmented modules under `.opencode/plugin-modules/`, with `.opencode/plugins/index.js` remaining the only auto-loaded local plugin and a thin import/merge adapter.

The core and OpenCode adapter must not store provider tokens, secrets, full prompts, raw file contents, full shell commands, user auth paths, or private absolute paths. Reminder text is static registry text plus sanitized identifiers only, so protocol hooks do not become a prompt-injection or data-exfiltration channel.

### Event Timing and Classification

Pre-tool edit/write hooks are the v1 primary delivery point for actionable reminders before mutation. Optional post-tool behavior is non-blocking and limited to verification notes or summaries; it is never acceptance proof. Read-only tools do not inject reminders by default. Bash or command tools may classify tests, code generation, destructive operations, delegation commands, and validation commands for notices or metrics, but they must not interfere with validation commands.

Chat or system transforms are not a v1 dependency and require later API confirmation before use. Event classification should normalize host, phase, tool/action kind, safe relative path or path bucket, language, file kind, risk tags, session/call ids, and raw shape version without logging full prompts or raw command payloads.

### Hierarchical Protocol Registry

The future registry is closed, deterministic, and secret-free. If implemented as a file, an example location is `.opencode/protocols/agentic-micro-protocols.json`, but that runtime file is not created by this design update. The conceptual hierarchy is:

```text
packs[] -> layers[] -> groups[] -> protocols[]
```

Registry records use explicit configured packs rather than unsorted filesystem discovery:

- `schemaVersion`: registry contract version.
- `packs[]`: ordered protocol packs such as `harness-core` or `playwright`; each pack has `id`, numeric `order`, `enabledByDefault`, and `layers[]`.
- `layers[]`: broad applicability bands such as `global`, `role-or-workflow`, `domain`, `file-kind`, or `phase-or-action`; each layer has `id`, numeric `order`, `scope`, and `groups[]`.
- `groups[]`: related protocol families such as `naming`, `playwright-page-objects`, `playwright-specs`, `playwright-fixtures`, or `validation-commands`; each group has `id`, numeric `order`, `match`, and `protocols[]`.
- `protocols[]`: the smallest rendered reminder candidates; each protocol has `id`, numeric `order`, `title`, `severity`, `timing`, `match`, `message`, `dedupeKeyTemplate`, `maxPerSession`, and `enabledByDefault`.

### Deterministic Selection and Injection Order

Registry loading validates schema before use, fails closed for malformed committed registries, and ignores explicitly disabled packs. Load and evaluation order is deterministic: sort packs by numeric `pack.order` then stable `pack.id`; within each pack sort layers by `layer.order` then `layer.id`; within each layer sort groups by `group.order` then `group.id`; within each group sort protocols by `protocol.order` then stable `protocol.id`.

Each hook normalizes the event, classifies action/file/risk attributes, evaluates `packs[] -> layers[] -> groups[] -> protocols[]` in the loaded stable hierarchy order, filters disabled or nonmatching candidates, applies dedupe and caps in the same order, then renders visible reminders and ledgers evaluated/injected/suppressed decisions in stable order. Candidate precedence is pack order, layer order, group order, protocol order, then stable protocol id tie-breaker. Specificity may be used only as a documented suppression or preference rule inside the same applicable set; it must not create unstable reordering.

Default noise caps are intentionally conservative: `maxVisiblePerToolCall: 1`, `maxVisiblePerSession: 8`, and `maxPerProtocolPerSession: 3`. A future implementation may raise `maxVisiblePerToolCall` to `2` only after fixture-backed precision is proven. Suppressed candidates are ledgered with deterministic reasons such as `tool-limit`, `session-limit`, `protocol-disabled`, `dedupe-window`, `dry-run`, `path-ignore`, `host-unsupported`, or `collapsed-by-more-specific`. Collapse summaries may say, for example, `[harness protocol] 2 additional applicable reminders collapsed; see ledger summary`.

### Playwright Protocol Examples

More than one protocol can apply to the same hook event. General protocols are evaluated first, followed by increasingly specific protocols according to the stable hierarchy: global or file-naming standards before domain or file-kind protocols, and then phase/action-specific protocols.

For a Playwright page object creation event, a general file naming protocol can apply together with page-object locator and method protocols. The naming reminder is evaluated and rendered first because it belongs to a broader earlier layer/group; the page-object locator/method reminder follows if visible caps allow. If only one visible reminder is allowed for that tool call, the deterministic collapse policy may render the more specific page-object reminder while ledgering the generic naming reminder as collapsed with the reason `collapsed-by-more-specific` and a summary notice.

Page object classification includes `**/pages/**/*.ts`, `**/*.page.ts`, `**/*.po.ts`, class names ending in `Page`, or locator/action helper exports. Page-object reminders should prefer stable intent-level methods, private selectors, role/test-id locators, minimal assertions except invariant waits, and updates to affected specs when method contracts change.

Spec classification includes `**/*.spec.ts`, `**/*.test.ts`, `tests/e2e/**`, or imports from `@playwright/test`. Spec reminders should assert user-visible behavior, avoid duplicating page-object selectors, keep setup in fixtures, prefer resilient locators, and run focused Playwright checks for changed flows. Fixture classification includes `**/fixtures/**/*.ts`, `**/*.fixture.ts`, or Playwright `test` extension, with reminders for deterministic isolation, no hidden cross-test state, explicit worker/test scope, and teardown preservation.

### Telemetry, Privacy, and Noise Controls

If implemented, telemetry uses redacted append-only JSONL under project-owned `.memory/` only after a separate validation decision selects the exact path and retention policy. Ledger and metric fields are limited to sanitized identifiers: timestamp, host, session/call ids, phase, tool/action kind, relative path or path hash, file kind, protocol id, severity, decision, suppression reason, dry-run flag, and message id.

Operator controls may include future `OPENCODE_HARNESS_PROTOCOL_DRY_RUN=1` and `OPENCODE_HARNESS_PROTOCOL_HOOKS=0` switches. Dry-run, summary-only, and opt-out modes are guardrails and telemetry controls, not validation evidence.

### OpenCode and Claude Boundary

OpenCode is the implementation target for this harness surface. Claude compatibility, if pursued later, is adapter/spec/export documentation only and must not add committed `.claude` settings or a runtime dependency on `.claude`, `.agents`, or `.codex`. Prior projection directories remain reference material only, never runtime dependencies.

### Future Implementation and Validation Gates

Future runtime implementation must confirm OpenCode hook names and safe mutation/notice semantics; test the pure core before hook wiring; schema-validate any registry; test Playwright classification, deterministic hierarchy ordering, noise caps, collapse behavior, and ledger redaction; confirm `.opencode/plugins/index.js` remains the sole auto-loaded local plugin; and run `node .opencode/scripts/validate-harness.mjs`.

### Residual Risks

OpenCode hook API shape and model-visible reminder delivery semantics remain unconfirmed. Classifier false positives or false negatives may create reminder fatigue. Ledger privacy, ignored/committed status, and retention policy remain future decisions. Claude/OpenCode semantic drift remains possible if compatibility exports are later pursued.

## Manifest

`.opencode/harness.manifest.json` lists only OpenCode-owned artifacts and root OpenCode project files included by the harness. It must not list prior projection files from reference directories.

The manifest is descriptive baseline evidence. It does not replace file existence checks, schema parsing, or command validation.

## Validation Gates

Required validation includes:

- `opencode.json`, `AGENTS.md`, and `.opencode/harness.manifest.json` exist.
- Static `.memory` protocol, reference, and template files exist.
- Every `.opencode/agents/*.md` role file has YAML frontmatter with `description`, `mode: subagent`, and `permission`.
- Every role references `.memory/protocols/memory-management.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, and the `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` path convention.
- The eight required role files exist exactly.
- Every role-specific `.opencode/commands/*.md` command has frontmatter with `description` and `agent`, and omits `model`.
- `.opencode/commands/delegate-orchestration.md` has frontmatter with `description`, omits `agent`, sets `subtask: false`, and documents recursive DAG orchestration.
- `opencode.json` parses and does not contain harness-owned routing keys.
- `opencode.json` instructions include `AGENTS.md` and `.memory/protocols/memory-management.md`, and it does not list local plugin paths.
- `.opencode/routing/harness-model-routing.example.json` and `.opencode/schemas/harness-model-routing.schema.json` parse; the pure dependency-free normalizer provides executable semantic validation. Validation does not consume the optional ignored custom override.
- `.opencode/contracts/role-io-contracts.json` parses and contains all eight roles.
- `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- Routing policy tests cover strict v2 structure and semantics, deterministic non-mutating decisions, fixed-command conflict rejection, force-false advisory behavior, all-eight force assignment, native provider/model/baseURL coherence, and failure without partial or provider mutation.
- CLI and helper outputs match the pure policy without network calls.
- Native local transport remains outside committed project defaults and uses native OpenCode provider/model settings instead of harness metadata in `opencode.json`.
- `.opencode/plugins/index.js` imports segmented modules and exports a default plugin function; segmented plugin logic remains separate and is not auto-loaded independently. Lifecycle behavior is telemetry only.
- Both illustrative Compose instances render from temporary env files with a digest-pinned image, unique loopback ports, exact aliases, read-only non-auto-created binds, and no fixed container name, command, secret, or private committed path.
- Documentation consistently describes restart activation, `OPENCODE_CONFIG` precedence, cooperative endpoint budgets, illustrative identities, static-versus-router behavior, and operator-dependent live/model/tool-use/benchmark proof.
- `.opencode/scripts/validate-harness.mjs` passes.
- References to `.agents` or `.codex` appear only in this design document or `AGENTS.md` as reference-material notes, never as `.opencode` runtime dependencies.
- Routing label preservation text is present in the command, skill, or workflow surfaces.

## Non-Goals

- Do not store provider tokens, OAuth secrets, user auth paths, or machine-local private paths in repo-managed files.
- Do not create or mutate prior host projection files as part of the OpenCode deliverable.
- Do not depend on plugins as the acceptance boundary.
- Do not invent non-native fields in `opencode.json`.
- Do not create first-class OpenCode task-complexity schema; complexity routing is harness-owned policy.
- Do not treat generated `.memory/orchestrations/` trace artifacts as static manifest baseline unless a task explicitly requires that.

## Open Questions

- Which concrete provider/model IDs should be configured for a given installation.
- Whether local model preference is selected by explicit user metadata, orchestrator policy, or future runtime UI.
- Whether release packaging should compute and store content hashes in the manifest as a separate validation step.
