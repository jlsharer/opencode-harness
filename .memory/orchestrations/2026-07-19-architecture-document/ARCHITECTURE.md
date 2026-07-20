# OpenCode Harness Architecture

## Overview

This project is a **standalone OpenCode harness projection** that provides a structured, delegation-based agentic workflow system. It is designed to manage multi-step AI agent tasks through a well-defined pipeline of eight specialized roles, with contract-guaranteed I/O, traceable orchestration memory, and automated validation.

The deliverable surface is rooted in `.opencode/` plus root-level project guidance files (`opencode.json`, `AGENTS.md`, `opencode-harness.design.md`). Reference directories (`.agents/`, `.codex/`) are prior projection examples used only for comparison, never as runtime dependencies.

---

## Root Configuration

### `opencode.json`
Minimal native OpenCode configuration:
- Loads two instruction surfaces: `AGENTS.md` (harness conventions) and `.memory/protocols/memory-management.md` (memory protocol).
- Sets conservative tool permissions (`ask` for edit, bash, webfetch).
- Contains **no** harness-owned routing keys; all routing policy lives elsewhere.

### `AGENTS.md`
Canonical harness conventions document:
- Enumerates the eight role names.
- Defines delegation boundaries (parent orchestrator delegates; does not do role work).
- Specifies routing metadata preservation rules.
- Sets the validation entry point: `node .opencode/scripts/validate-harness.mjs`.

### `opencode-harness.design.md`
Detailed design specification covering:
- Standalone OpenCode surface definition.
- Role agent contract, delegation protocol, commands/skills/workflows.
- Model routing precedence, lifecycle guardrails, manifest structure, validation gates, and non-goals.

---

## Role Agents (`.opencode/agents/`)

Eight Markdown files, one per role. Each uses YAML frontmatter with `description`, `mode: subagent`, and `permission`. The roles form a pipeline:

| Role | Responsibility | Boundary |
|---|---|---|
| `researcher` | Source-backed evidence & citations | No implementation or acceptance decisions |
| `planner` | Task sequencing, file contracts, acceptance gates | No file edits |
| `implementer` | Scoped file creation/modification | No broad planning, integration, or final validation |
| `integrator` | Cross-artifact consistency & path coherence | No hidden scope expansion |
| `validator` | Parse, file, schema, command, acceptance evidence | No implementation fixes |
| `reviewer` | Code-review findings by severity | No rewrites |
| `synthesizer` | Conflict resolution & recommendation consolidation | No source-free invention |
| `artifact-verifier` | Artifact proof, parse/render evidence | No modification of deliverables |

Every role references the shared contracts and memory protocol.

---

## Delegation Commands (`.opencode/commands/`)

Seven command prompt files that route work to specific roles:

| Command | Target Role | Frontmatter |
|---|---|---|
| `/delegate-research` | `researcher` | `description` + `agent` only |
| `/delegate-plan` | `planner` | `description` + `agent` only |
| `/delegate-implement` | `implementer` | `description` + `agent` only |
| `/delegate-integrate` | `integrator` | `description` + `agent` only |
| `/delegate-validate` | `validator` | `description` + `agent` only |
| `/delegate-artifact-verify` | `artifact-verifier` | `description` + `agent` only |
| `/delegate-orchestration` | *(parent orchestrator)* | `description` only; omits `agent`; sets `subtask: false` |

Key design: command files omit `model` so the harness-owned resolver decides routing before dispatch.

---

## Model Routing (`.opencode/routing/`)

Three files implement a precedence-based model selection layer:

1. **`harness-model-routing.json`** — Configuration for model/variant/complexity/default mappings.
2. **`resolve-model-routing.mjs`** — Resolver that reads config + CLI metadata and outputs a deterministic JSON decision. Precedence: explicit caller > command override > role override > complexity tier > single-model default > default model > local fallback metadata.
3. **`model-routing-helper.mjs`** — Utility helpers for common routing patterns.

Local model metadata (`routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`) is opt-in and never causes network calls. Actual local model transport is configured outside committed project defaults.

---

## Contracts & Schemas (`.opencode/contracts/`, `.opencode/schemas/`)

- **`role-io-contracts.json`** — Catalog of all eight roles with required inputs, required outputs, trace artifact path templates, and verification expectations.
- **`role-io-contracts.schema.json`** — JSON Schema validating `role-io-contracts.json`.
- **`memory-trace-artifact.schema.json`** — JSON Schema for role trace artifacts with fields: `orchestrationId`, `role`, `artifactId`, `createdAt`, `inputContract`, `workPerformed`, `outputContract`, `handoff`.

---

## Lifecycle Plugin (`.opencode/plugins/`, `.opencode/plugin-modules/`)

- **`plugins/index.js`** — Single auto-loaded adapter that imports from plugin-modules and exports the default plugin function expected by OpenCode.
- **`plugin-modules/harness-lifecycle.js`** — Guardrail and telemetry hooks (dangerous command warnings, delegation reminders, validation guidance).
- **`plugin-modules/role-model-routing-enforcement.js`** — Enforcement module for role-model routing guarantees.

Segmented modules stay outside `.opencode/plugins/` to prevent independent auto-loading. Hooks are guardrails/telemetry only; acceptance requires validator or artifact-verifier evidence.

---

## Validation (`.opencode/scripts/`)

- **`validate-harness.mjs`** — Master validation script covering 20+ checks: file existence, frontmatter validation, schema parsing, routing resolution, plugin structure, manifest coverage, and reference-only status of prior projection directories.

---

## Skills (`.opencode/skills/`)

| Skill | Purpose |
|---|---|
| `delegation-orchestrator` | Reusable delegation rules, DAG decomposition, routing, validation, and trust/restart guidance |
| `linear-playwright-ir` | Linear + Playwright integration skill |
| `opencode-skill-authoring` | Skill creation/update guidance |
| `opencode-workflow-guidance` | Workflow design guidance |

The `delegation-orchestrator` skill is the core reusable workflow pattern, with references for routing matrices, validation checklists, and integration guides.

---

## Workflows (`.opencode/workflows/`)

| Workflow | Purpose |
|---|---|
| `delegation-workflow.md` | Design-to-implementation workflow: research → planning → implementation → integration → review → validation |
| `validation-workflow.md` | Acceptance-validation gates: what to verify, how to validate, acceptance criteria |

---

## Memory System (`.memory/`)

```
.memory/
  INDEX.md                          # Project memory index
  protocols/
    memory-management.md            # Memory levels, indexing, retention
  references/
    opencode-refs.md                # OpenCode documentation inventory
  templates/
    orchestration-index.md          # Per-orchestration index template
    role-trace-artifact.md          # Role trace artifact template
  orchestrations/
    <orchestration-id>/
      INDEX.md                      # Scope, routing status, artifact links
      delegation-packets/           # Delegated prompt summaries
      roles/<role>/<artifact-id>.md # Role trace artifacts
      validation/                   # Validator evidence
      decisions/                    # Synthesis outputs and final decisions
```

Memory is exposed to agents through `opencode.json` instructions, not as a native OpenCode feature. Orchestration IDs follow a date-prefixed convention (e.g., `2026-07-19-architecture-document`).

---

## Manifest (`.opencode/harness.manifest.json`)

Lists all harness-owned artifacts with path, kind, and owner metadata. Used as descriptive baseline evidence only; does not replace actual validation checks.

---

## High-Level Data Flow

```
User Request
    │
    ▼
delegate-orchestration (DAG decomposition)
    │
    ├── researcher ──► evidence ──┐
    │                            │
    ├── planner ──► plan ────────┤   (sequential: research → planning)
    │                            │
    ├── implementer ──► changed files ──┐
    │                                  │
    ├── integrator ──► consistency notes ──┐
    │                                    │
    ├── reviewer ──► findings ────────────┤
    │                                    │
    ├── validator ──► pass/fail matrix ───┤   (required before acceptance)
    │                                    │
    └── artifact-verifier ──► proof ──────┘
                                         │
                                         ▼
                                 synthesizer (conflict resolution)
                                         │
                                         ▼
                                  Final acceptance / handoff
```

---

## Key Design Decisions

1. **Delegation-only orchestration** — Parent orchestrator never performs role work; it only coordinates, reviews evidence, and accepts.
2. **Contract-guaranteed I/O** — Every role has required inputs and outputs defined in `role-io-contracts.json`.
3. **Traceable memory** — Every role output produces a trace artifact at a deterministic path, shaped by a JSON Schema.
4. **No harness keys in `opencode.json`** — Routing policy lives in `.opencode/routing/`, not in the native config.
5. **Reference-only prior projections** — `.agents/` and `.codex/` inform but never drive runtime behavior.
6. **Guardrails ≠ acceptance** — Lifecycle hooks provide telemetry/warnings; validator evidence is the acceptance boundary.
7. **Deterministic routing** — Model resolution is a pure function of config + metadata with no network calls.
