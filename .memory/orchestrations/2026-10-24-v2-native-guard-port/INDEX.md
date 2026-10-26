# 2026-10-24-v2-native-guard-port

## Scope and status

- Goal: use pinned V2 `2.1.4` native evidence to port the launcher/plugin/Task guard where the exact contracts permit; preserve current V1 and WebFetch work.
- [Validated normalized specification](normalized-spec.json). Routing metadata status: absent; no live provider, global config, new Git mutation or publication.
- Existing commit `91b15dc` contains the operator QA runner and was pushed to `origin/main`. Remaining V2/WebFetch source edits are uncommitted and must be preserved. Prior [external verification record](../2026-10-24-qa-execution-boundary/validation/operator-external-qa-20261024.md) covers a registry-integrity-matched `2.1.4` archive, credential-free isolated CLI/doctor probes, and passing full source QA on the prior tree; it is not managed-gate proof on this tree.

## Workflow DAG and next safe action

- Work unit `v2-port`: serial researcher → planner → conditional implementer → independent validator. Assigned managed read-only gates: `git diff --check`, `node --check bin/opencode-harness.mjs`, `node --check .opencode/plugins/index.js`. Required full source/runtime/package QA remains external after final edits.
- Current status: [researcher](roles/researcher/v2-port-researcher-001-native-contract.md) identified pinned V2 `subagent` tool and incompatible V1 Task/session/result contracts. [Planner](roles/planner/v2-port-planner-001-gated-plan.md) found no safe implementation target without selected-binary behavioral proof of plugin loading, pre-spawn rejection and child/result/termination correlation. Implementer and validator were not dispatched, and V2 managed acceptance was not claimed.
- Next safe action: obtain isolated, credential-free native V2 guard fixtures with independently observed plugin registration, before-subagent denial without child effects, parent/child and result binding, permissions and cleanup. Review a new scoped specification after those results; this work unit cannot authorize speculative edits. Retain `dispatch-started.json`; never replay this ID.
- Acceptance of native V2 managed dispatch requires independently proven pre-spawn refusal, native Task child/result binding and plugin guard behavior; version/CLI help alone does not prove it.
