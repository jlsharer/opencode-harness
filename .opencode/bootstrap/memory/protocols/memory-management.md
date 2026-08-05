# Harness Memory Management Protocol

## Purpose

`.memory` is the project-owned memory surface for OpenCode harness orchestration. It records reusable references, orchestration indexes, delegation packets, role trace artifacts, validation evidence, synthesis outputs, and final decisions. It is not an official OpenCode native protocol and must not be treated as an external service or runtime dependency beyond project instructions.

## Memory Levels

Use these levels consistently:

- Project memory: stable protocols, references, schemas, and templates under `.memory/INDEX.md`, `.memory/protocols/`, `.memory/references/`, and `.memory/templates/`.
- Orchestration memory: one directory per orchestration under `.memory/orchestrations/<orchestration-id>/`.
- Delegation memory: delegated packet summaries under `.memory/orchestrations/<orchestration-id>/delegation-packets/`.
- Role memory: trace artifacts under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Validation memory: command evidence, parse results, and acceptance matrices under `.memory/orchestrations/<orchestration-id>/validation/`.
- Decision memory: synthesis conclusions and final accepted decisions under `.memory/orchestrations/<orchestration-id>/decisions/`.

## Orchestration ID

Every delegated task should receive an `orchestration-id`. Prefer a stable, date-prefixed slug such as `2026-07-05-opencode-memory-contracts`. Do not invent caller routing metadata when it was absent; record `routingMetadataStatus: absent` instead.

## Recursive Role Instances

Use one orchestration ID for the overall workflow unless a sub-workflow is explicitly independent. Within that orchestration, create as many scoped role instances as required by the dependency graph.

Use a DAG for sub-workflow dependencies and run independent role instances in parallel whenever possible. Every workflow and sub-workflow must use `researcher` before `planner`, and research must precede planning. Every workflow and sub-workflow must use `validator` before acceptance.

Role names are fixed, but role instances are repeatable. Use scoped artifact IDs:

`<scope>-<role>-<sequence>-<slug>`

Examples:

- `root-researcher-001-docs`
- `api-planner-002-contracts`
- `ui-implementer-003-form-state`
- `root-validator-004-final`

Use at most 3 remediation loops per scoped work unit. After the third failed loop, write or request a `synthesizer` blocker artifact and ask the user for direction.

## Required Indexing

Every orchestration directory must include `INDEX.md` using `.memory/templates/orchestration-index.md`. The index should link to each retained role trace artifact, delegation packet, validation artifact, decision artifact, DAG node, and sub-workflow.

Every role output must include or reference a trace artifact matching `.memory/templates/role-trace-artifact.md` and the contract catalog in `.opencode/contracts/role-io-contracts.json`.

## Role Trace Path

Use this path convention:

`.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`

`<role>` must be one of: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, or `artifact-verifier`.

## Content Rules

- Keep artifacts concise and evidence-oriented.
- Preserve caller-supplied routing labels exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, and `localModelFallback`.
- When routing labels are absent, state that they were absent and do not add placeholder values.
- Do not store provider tokens, secrets, user auth paths, or machine-local private paths.
- Treat hooks and plugins as guardrails and telemetry only. Acceptance evidence must come from validator or artifact-verifier work.
- References to prior projections are allowed only as reference-material notes, never as runtime dependencies.

## Handoff Expectations

Each role must report:

- `orchestration-id`
- role name
- input summary
- output summary
- artifact path
- commands/checks run, if any
- limitations and handoff notes

Validator or artifact-verifier evidence is required before orchestration acceptance.
