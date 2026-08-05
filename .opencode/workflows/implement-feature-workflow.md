# Implement Feature Delegation Workflow

This document defines the project-local `implement-feature` workflow for delegated feature implementation in this harness.

## Boundary

- `.opencode/workflows/*.md` files are project-local guidance only. They are not an official native OpenCode workflow schema and must not be treated as runtime configuration.
- Native OpenCode invocation surfaces remain commands, skills, agents, plugins, MCP servers, permissions, and configuration files documented by OpenCode.
- This workflow uses only the fixed roles: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier`.
- Parent orchestration delegates scoped role work, preserves or records routing metadata status, and consolidates evidence; it does not perform role work directly.
- Every new scoped role task gets a nonempty `delegationTaskId`, stable `scopeKey`, `dispatchKind: fresh`, and a fresh child thread; its Task call omits `task_id`.

## Intake Packet

Capture a concise feature packet before delegation:

- Feature goal, user-visible behavior, target paths, allowed edit scope, explicit non-goals, and scoped acceptance criteria.
- Connector source identifiers, documentation URLs or repository paths, compatibility constraints, version constraints, and requirement evidence.
- Auth and secrets exclusions: never include provider tokens, user auth paths, private credentials, or secret values in packets or memory artifacts.
- Required source excerpts rather than whole files when possible; include file contracts for every allowed path.
- Expected handoff artifacts under `.memory/orchestrations/<orchestration-id>/`.

## DAG Phases

1. **Memory and routing setup**
   - Choose or preserve `orchestration-id`.
   - Create/update `.memory/orchestrations/<orchestration-id>/INDEX.md`.
   - Preserve caller-supplied routing labels exactly when present; when absent, record `routingMetadataStatus: absent` and do not invent values.

2. **Research** (`researcher`)
   - Run before planning for every workflow or sub-workflow.
   - Gather cited evidence from supplied source identifiers, documentation URLs/paths, existing code, connector compatibility constraints, and requirement statements.
   - Separate direct evidence from inference and identify unresolved questions.

3. **Planning** (`planner`)
   - Convert research into ordered work units, dependencies, file contracts, allowed paths, non-goals, verification commands, and acceptance gates.
   - Define a DAG that identifies independent implementation branches and integration join points.

4. **Parallel implementation** (`implementer`)
   - Spawn repeatable scoped `implementer` instances for independent files, components, migrations, tests, docs, or generated assets.
   - Each instance edits only assigned paths, follows its file contracts, records self-checks, and writes a role trace artifact.
   - Avoid overlapping writes unless the planner made the dependency explicit.

5. **Integration gate** (`integrator`)
   - Join implementation branches and check cross-file consistency, manifests, schemas, role names, connector assumptions, and acceptance coverage.
    - Create remediation as a new task, artifact, and fresh child thread linked to its predecessor instead of broadening scope silently.

6. **Validation gate** (`validator`)
   - Run command-backed checks before acceptance.
   - Confirm acceptance criteria, parse/schema checks, tests, routing or config checks when relevant, secret exclusions, and no unintended runtime dependencies.
   - Lifecycle hooks and plugins are guardrails/telemetry only; they are not acceptance evidence.

7. **Optional review, synthesis, and artifact proof**
   - Use `reviewer` for defect-focused review of risky diffs.
   - Use `synthesizer` to resolve conflicts, blocker tradeoffs, or repeated remediation failures.
   - Use `artifact-verifier` for generated artifacts that need reproducible temp-directory proof.

## Context-Window Discipline for Local Models

- Delegate small task packets rather than broad repository context.
- Include source excerpts, documentation snippets, exact file contracts, narrow allowed paths, explicit non-goals, scoped acceptance criteria, and expected handoff artifacts.
- Prefer many narrowly scoped role instances over one large prompt when dependencies allow parallelism.
- Keep each role artifact concise and evidence-oriented.
- Pass only the downstream evidence needed by the next role; link to larger artifacts instead of copying them wholesale.

## Memory and Trace Requirements

- Each role output must follow `.opencode/contracts/role-io-contracts.json` and shape trace artifacts according to `.opencode/schemas/memory-trace-artifact.schema.json`.
- Role traces live at `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Use scoped artifact IDs such as `<scope>-researcher-001-docs`, `<scope>-planner-002-contracts`, `<scope>-implementer-003-api`, and `<scope>-validator-004-final`.
- Update the orchestration `INDEX.md` with DAG nodes, retained role traces, validation evidence, decisions, and remediation status.
- Use at most 3 remediation loops per scoped work unit; after the third failed loop, request a `synthesizer` blocker artifact and user direction.
- Reuse `task_id` only for one response to a recorded child-originated clarification while the exact task remains unresolved. Retry, remediation, correction, follow-up, changed scope/role/deliverable, terminal work, replay, and post-restart responses start fresh. Do not use unverified direct child-dispatch surfaces for managed orchestration.

## Acceptance Standard

The feature is accepted only after `validator` evidence confirms that scoped criteria pass. Integrated changes must have complete role trace links, documented connector-source evidence, validated auth/secrets exclusions, and no unresolved cross-file consistency defects.
