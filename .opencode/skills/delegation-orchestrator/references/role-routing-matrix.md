# Four-Role Routing Matrix

The authoritative protocol is `../SKILL.md`. This reference only maps bounded work categories to active role modes.

| Work category | Role | Required task mode | Boundary |
| --- | --- | --- | --- |
| Source-backed facts | `researcher` | `research` | Read-only; no plan or acceptance. |
| Implementation sequencing | `planner` | `plan` | No implementation edits. |
| Evidence conflict/tradeoff resolution | `planner` | `synthesis` | Use supplied evidence only. |
| Scoped file changes | `implementer` | `implementation` | Assigned paths only. |
| Assigned cross-file stitching | `implementer` | `integration` | Editing integration; not independent acceptance. |
| Final acceptance | `validator` | `validation` | Independent command-backed gates. |
| Adversarial defect analysis | `validator` | `review` | Findings, no fixes. |
| Generated-output proof | `validator` | `artifact-proof` | Reproducible temp/list/parse/render evidence. |
| Independent coherence check | `validator` | `integration-check` | Check paths/manifests/schemas, no fixes. |

Each packet names one role, one listed task mode, one work unit, one bounded task, a fresh `delegationTaskId`, stable `scopeKey`, `dispatchKind: fresh`, and `routingMetadataStatus`. Retired role names in historical traces are not valid dispatch targets.

Local-model work is serial by default. Parallelism requires explicit authorization or recorded distinct-capacity evidence. Default remediation is one cycle per work unit. A finding blocks only with command-backed evidence tied to the goal, an acceptance gate, or changed behavior.
