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
- Role contracts and schemas: `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, and `.opencode/schemas/memory-trace-artifact.schema.json`.
- Harness routing: `.opencode/routing/harness-model-routing.json` and `.opencode/routing/resolve-model-routing.mjs`.
- Lifecycle plugin adapter and guardrails: `.opencode/plugins/index.js` as the only auto-loaded plugin entry point, with segmented guardrail modules under `.opencode/plugin-modules/`.
- Validation and manifest files: `.opencode/scripts/validate-harness.mjs` and `.opencode/harness.manifest.json`.

`opencode.json` must contain only native OpenCode configuration keys. Harness-owned routing settings must not be embedded in `opencode.json`; they live in `.opencode/routing/harness-model-routing.json` and are consumed by the harness resolver.

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

The harness-owned routing resolver supports this precedence:

1. Explicit caller model or provider model.
2. Command override.
3. Role override.
4. Complexity tier.
5. Single-model default.
6. Default model.

Local model metadata is opt-in and never causes network calls in the resolver. Effective local routing metadata is resolved from caller metadata first and config defaults second:

- `routingServiceUrl`
- `localModelEnabled`
- `preferLocal`
- `localModelFallback`

The routing config is stored in `.opencode/routing/harness-model-routing.json`. The resolver at `.opencode/routing/resolve-model-routing.mjs` reads that config, accepts CLI metadata, and prints a deterministic JSON decision.

## Lifecycle Guardrails

`.opencode/plugins/index.js` is the local project plugin entry point. It is the only JavaScript module in the auto-loaded `.opencode/plugins/` directory. It is a pure adapter that imports segmented logic from `.opencode/plugin-modules/harness-lifecycle.js` and exports the default plugin function expected by OpenCode local plugin loading.

`.opencode/plugin-modules/harness-lifecycle.js` provides guardrail and telemetry hooks for OpenCode sessions. It can warn about dangerous commands, remind users that delegation evidence is required, and surface validation guidance. Keeping it outside `.opencode/plugins/` prevents OpenCode from auto-loading segmented modules separately from the adapter.

Do not list `.opencode/plugins/index.js` or `.opencode/plugin-modules/harness-lifecycle.js` as local paths in `opencode.json`; the documented `plugin` array is for npm packages, while local project plugins live under `.opencode/plugins/`.

Lifecycle hooks are not acceptance proof. Acceptance requires concrete validator or artifact-verifier evidence from `.opencode/workflows/validation-workflow.md` and `node .opencode/scripts/validate-harness.mjs`.

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
- `.opencode/routing/harness-model-routing.json` parses.
- `.opencode/contracts/role-io-contracts.json` parses and contains all eight roles.
- `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- `.opencode/routing/resolve-model-routing.mjs` resolves explicit, command, role, complexity, single/default, and local fallback metadata without network calls.
- `.opencode/plugins/index.js` imports `.opencode/plugin-modules/harness-lifecycle.js` and exports a default plugin function; segmented plugin logic remains separate and is not auto-loaded independently.
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
