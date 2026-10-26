# 2026-10-24-opencode2-post-restart

## Scope

- Request: following user-confirmed OpenCode restart, verify researcher WebFetch, determine current OpenCode 2 compatibility changes, implement and validate evidence-backed upgrade.
- [Normalized specification](normalized-spec.json) validated before dispatch. Preserve four pre-existing WebFetch code/test changes.
- Routing metadata status: absent. No live provider, global config, Git mutation, or publication.

## Status and DAG

- Current status: [researcher](roles/researcher/upgrade-researcher-001-live-upstream.md) observed successful WebFetch and tagged v2.1.4. [Planner](roles/planner/upgrade-planner-001-v2-evidence-gated-plan.md) found exact guard/runtime contracts insufficient for implementation in this workflow.
- Next safe action: [fresh pinned-contract workflow](../2026-10-24-opencode2-pinned-contract/INDEX.md) investigates exact V2 source. Old task IDs are terminal; do not replay this workflow.
- Work unit `upgrade`: serial research → plan → implementation → validation. Assigned read-only gates `git diff --check`, `node --check .opencode/plugins/index.js`. Full runtime/source/package checks must be separately executed outside managed verifier.
- Retain `dispatch-started.json` after dispatch; no old ID replay.

## Evidence and decisions

- Prior repair and limitations: [managed WebFetch repair](../2026-10-24-managed-webfetch-repair/INDEX.md).
- No upgrade acceptance: neither native V2 guard behavior nor full source/runtime QA has been independently proven.
