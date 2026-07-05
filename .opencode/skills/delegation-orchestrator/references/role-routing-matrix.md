# OpenCode Delegation Role Routing Matrix

Parent orchestration coordinates work; specialized subagents perform work. If a task requires evidence gathering, planning, file edits, integration, review, synthesis, validation, or artifact proof, delegate it before relying on the result.

`/delegate-orchestration` is orchestrator-owned and coordinates recursive delegation. It is not assigned to a fixed subagent role. It should create a DAG of scoped work units, run independent role instances in parallel where possible, and use as many instances of each role as the workflow requires.

Research is mandatory before planning. Validation is mandatory before acceptance.

| Work category | Delegate to | Required input context | Required output evidence | Parent boundary |
| --- | --- | --- | --- | --- |
| Research | `researcher` | Scoped question, source constraints, relevant paths, freshness requirements | Cited findings, source list, implementation implications | Do not independently research facts beyond returned evidence. |
| Planning | `planner` | Goal, constraints, research findings, target paths, acceptance gates | Sequenced plan, file contracts, dependencies, verification gates | Do not create the substantive plan directly. |
| Implementation | `implementer` | Approved plan, exact target paths, schemas, preservation requirements | Changed files, rationale, self-checks, limitations | Do not edit files in parent orchestration. |
| Integration | `integrator` | Changed artifacts, expected path relationships, manifest and workflow contracts | Path consistency notes, manifest notes, requested or applied fixes | Do not manually stitch multi-file changes in parent orchestration. |
| Validation | `validator` | Final changed paths, schemas, commands, acceptance criteria | File checks, parse checks, command output, pass/fail status | Do not accept self-validation as sufficient. |
| Review | `reviewer` | Diff, intended behavior, risk areas, test expectations | Findings by severity, questions, residual risks | Do not rewrite implementation as part of review. |
| Synthesis | `synthesizer` | Role outputs, conflicts, decisions needed | Resolved conclusions, tradeoffs, final recommendation inputs | Do not merge conflicting outputs without synthesis evidence. |
| Artifact proof | `artifact-verifier` | Artifact paths, expected tree, parse/render checks, temp-directory plan | Temp path, listing, parse/render evidence, cleanup decision | Do not treat generated files alone as proof. |

## Memory and Trace Requirements

Every delegated packet must include:

- `orchestration-id`
- memory root `.memory/orchestrations/<orchestration-id>/`
- role contract catalog `.opencode/contracts/role-io-contracts.json`
- trace schema `.opencode/schemas/memory-trace-artifact.schema.json`
- required trace artifact path `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`

Use scoped artifact IDs for repeatable role instances:

`<scope>-<role>-<sequence>-<slug>`

Use at most 3 remediation loops per scoped work unit. After the third failed loop, route blocker synthesis to `synthesizer` and ask the user for direction.

The orchestration index should link all role trace artifacts, validation evidence, and final decisions.

## Routing Metadata Preservation

When present in caller input, delegated prompts must preserve:

- `### Delegation Parameters`
- `**Provider Model**`
- `**Routing Config**`
- `routingServiceUrl`
- `localModelEnabled`
- `preferLocal`
- `localModelFallback`

Do not rename the labels, change casing, or supply placeholder values when the caller did not provide them.
