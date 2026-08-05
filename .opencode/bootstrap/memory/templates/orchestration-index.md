# <orchestration-id>

## Scope

- Request:
- Allowed edit scope:
- Non-goals:

## Routing Metadata

- routingMetadataStatus: present | absent
- Preserved labels, if present:

## Static Context

- Memory protocol: `.memory/protocols/memory-management.md`
- Role contracts: `.opencode/contracts/role-io-contracts.json`
- Trace schema: `.opencode/schemas/memory-trace-artifact.schema.json`

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
- `integrator`:
  - `<scope>-integrator-<sequence>-<slug>`:
- `validator`:
  - `<scope>-validator-<sequence>-<slug>`:
- `reviewer`:
  - `<scope>-reviewer-<sequence>-<slug>`:
- `synthesizer`:
  - `<scope>-synthesizer-<sequence>-<slug>`:
- `artifact-verifier`:
  - `<scope>-artifact-verifier-<sequence>-<slug>`:

## Validation Evidence

- Commands:
- Results:
- Skipped checks:

## Decisions

- Accepted decisions:
- Remaining risks:
