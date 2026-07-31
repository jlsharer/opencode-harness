---
description: Coordinate delegated feature implementation from intake through validated acceptance
subtask: false
---

Use this command as the parent orchestrator for implementing a feature through scoped, delegated OpenCode harness role instances.

This command belongs to the orchestrator. It must not be routed to a fixed subagent role. OpenCode defaults commands without `agent` frontmatter to the current agent, so this command intentionally omits `agent` and coordinates subagent instances through the delegation protocol.

## Required Intake

Collect or confirm before delegation:

- `orchestration-id`, or create a stable date-prefixed slug.
- Feature goal and user-visible outcome.
- Scope boundaries, allowed paths, write permissions, and ownership boundaries.
- Non-goals and explicitly excluded paths, behaviors, or refactors.
- Acceptance criteria, including required tests, validation commands, artifact proof, and documentation expectations.
- Connector sources and documentation sources to research, such as task-supplied references, MCP sources, repository paths, external docs, schemas, APIs, or examples. Do not invent sources that were not supplied or discoverable.
- Memory root `.memory/orchestrations/<orchestration-id>/` and expected role trace paths `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.
- Role contract catalog `.opencode/contracts/role-io-contracts.json`.
- Trace schema `.opencode/schemas/memory-trace-artifact.schema.json`.
- Delegation protocol and workflow references, including `.memory/protocols/memory-management.md`, `.opencode/skills/delegation-orchestrator/SKILL.md`, `.opencode/workflows/delegation-workflow.md`, and `.opencode/workflows/validation-workflow.md`.
- Relevant skill references or workflow guidance required by the feature domain.
- Caller-supplied routing metadata, if any.

Preserve these routing labels exactly when supplied by the caller: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`.

If the caller did not provide enriched routing metadata, record `routingMetadataStatus: absent` and do not invent values.

Ask clarifying questions only when required intake is missing or ambiguous. At minimum, clarify missing goal, scope boundaries, non-goals, acceptance criteria, connector or documentation sources, allowed paths, write permissions, or routing metadata status before dispatching role work.

## Phased Delegation Workflow

1. **Intake and memory setup**
   - Create or update `.memory/orchestrations/<orchestration-id>/INDEX.md`.
   - Record the goal, boundaries, non-goals, acceptance criteria, routing metadata status, and initial DAG.
   - Keep the parent context concise; link to artifacts instead of embedding long source excerpts.

2. **Source research**
   - Delegate one or more scoped `researcher` instances before planning.
   - Give each researcher only the relevant connector sources, documentation sources, paths, freshness requirements, downstream needs, and routing metadata status.
   - Require cited findings, source lists, implementation implications, risks, and trace artifacts.

3. **Requirements synthesis**
   - Consolidate research into feature requirements, constraints, assumptions, unresolved questions, and acceptance criteria.
   - Use `synthesizer` when evidence conflicts, requirements are ambiguous, or tradeoffs need an explicit decision.
   - Do not proceed to implementation planning while required evidence is missing.

4. **Scoped planning**
   - Delegate `planner` instances after research is complete.
   - Require exact target paths, allowed edit scope, file contracts, schema requirements, preservation requirements, dependencies, verification gates, and handoff notes.
   - Break work into small DAG nodes that can be implemented independently when paths and dependencies do not conflict.

5. **Parallel implementation subagents**
   - Delegate repeatable `implementer` instances for file creation or modification only after the relevant plan is approved.
   - Use small scoped work packets with: approved plan excerpt, target paths, allowed edit scope, acceptance criteria, schema/style constraints, preservation requirements, verification commands, routing metadata status, and required artifact path.
   - Run independent implementers in parallel only when their paths and contracts do not conflict.
   - Require minimal, deterministic, diffable changes. Do not broaden scope or perform unrelated cleanup.

6. **Integration**
   - Delegate `integrator` after implementation branches join.
   - Check cross-file consistency, manifests, routing, schemas, workflows, command names, generated artifacts, and path relationships.
   - Request targeted remediation instead of silently expanding scope.

7. **Validation and artifact proof**
   - Delegate `validator` before acceptance. Use `artifact-verifier` when generated artifacts, rendered output, package contents, temp-directory proof, or externally inspectable deliverables require reproducible proof.
   - Require command-backed evidence, pass/fail matrices, schema results, security or activation findings, remediation lists, skipped-check rationale, and trace artifacts.
   - Treat lifecycle hooks and plugins as guardrails and telemetry only; they cannot replace validator or artifact-verifier evidence.

8. **Review, synthesis, and final acceptance**
   - Use `reviewer` for defect-focused review when regression, security, maintainability, or behavior risk remains.
   - Use `synthesizer` for final consolidation, conflict resolution, blocker summaries, or accepted decision records.
   - Accept the feature only after validation evidence satisfies the acceptance criteria or after explicit user approval of documented residual risk.

## Local Model and Context Economy Rules

- Keep every delegated packet narrow enough for local or smaller models: one scope, exact paths, explicit constraints, short source excerpts, and links to artifacts.
- Prefer artifact paths over repeated context. Store retained evidence under `.memory/orchestrations/<orchestration-id>/`.
- State clear acceptance criteria and verification commands in each role packet.
- Preserve fixed role names exactly: `researcher`, `planner`, `implementer`, `integrator`, `validator`, `reviewer`, `synthesizer`, and `artifact-verifier`.
- Give each role instance a unique scoped artifact ID, such as `api-researcher-001-docs`, `ui-implementer-002-form-state`, or `root-validator-003-final`.
- Use at most 3 remediation loops for each scoped work unit. After the third failed loop, delegate a `synthesizer` blocker artifact and ask the user for direction.
- Require validation before acceptance for every workflow and sub-workflow.

## Completion Evidence

The parent orchestrator must produce or reference:

- Intake summary with routing metadata status and preserved routing labels when present.
- DAG summary with dependencies, parallel branches, remediation loop counts, and role instance status.
- Role trace artifacts matching `.opencode/schemas/memory-trace-artifact.schema.json` and `.opencode/contracts/role-io-contracts.json`.
- Integration notes for cross-file or cross-artifact consistency.
- Validator or artifact-verifier evidence, including skipped-check rationale if any required check is skipped.
- Final acceptance summary with changed files, validation results, residual risks, and next steps.
