# <orchestration-id>

## Scope

- Request:
- Allowed edit scope:
- Non-goals:

## Compaction Handoff

- Reviewed owner-only handoff: [COMPACTION_HANDOFF.md](COMPACTION_HANDOFF.md) (create from the active trace root's `templates/compaction-handoff.md` only after completing every section; record "absent" until then).
- Status and exact next safe action:
- This pointer does not resume a Task thread or prove acceptance.

## Routing Metadata

- routingMetadataStatus: present | absent
- Preserved labels, if present:

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Orchestration input schema: `.opencode/schemas/orchestration-input.schema.json`

## Workflow DAG

- Planning rule: research must precede planning, and validation must precede acceptance.

- `<node-id>`:
  - scope:
  - dependsOn:
  - parallelizableWith:
  - requiredRoles:
  - status:

## Sub-Workflows

- `<scope-id>`:
  - parent:
  - goal:
  - acceptanceCriteria:
  - remediationLoopsUsed:
  - status:

## Delegation Packets

- `<packet-id>`:

## Delegated Tasks

- `<delegationTaskId>`:
  - scopeKey:
  - role:
  - taskMode:
  - artifactId:
  - dispatchKind: fresh | clarification-response
  - childTaskOrSessionId:
  - parentSessionId:
  - predecessorTaskOrArtifact:
  - clarificationRequestNonceStatus:
  - remediationLoop:
  - terminalStatus:

## Role Trace Artifacts

- `researcher`:
  - `<scope>-researcher-<sequence>-<slug>`:
- `planner`:
  - `<scope>-planner-<sequence>-<slug>`:
- `implementer`:
  - `<scope>-implementer-<sequence>-<slug>`:
- `validator`:
  - `<scope>-validator-<sequence>-<slug>`:

## Validation Evidence

- Commands:
- Results:
- Skipped checks:

## Decisions

- Accepted decisions:
- Remaining risks:
