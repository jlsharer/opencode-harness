# 2026-10-24-opencode2-pinned-contract

- Goal: obtain exact pinned V2 plugin/CLI/SDK contracts before implementation; preserve four pre-existing WebFetch edits.
- [Validated specification](normalized-spec.json); routing metadata status: absent.
- Scope: `bin/`, `.opencode/`, package metadata and pertinent project docs; no global/Git mutation or live provider activation.
- Evidence seed: [post-restart upstream research](../2026-10-24-opencode2-post-restart/roles/researcher/upgrade-researcher-001-live-upstream.md) found tagged v2.1.4 and breaking plugin migration; [planner](../2026-10-24-opencode2-post-restart/roles/planner/upgrade-planner-001-v2-evidence-gated-plan.md) requested exact pinned API contracts.
- Status: [pinned research](roles/researcher/pinned-contract-researcher-001-upstream.md) established V2 registration/CLI differences; [plan](roles/planner/pinned-contract-planner-001-staged-plan.md) approved non-activation staging only; [implementer](roles/implementer/pinned-contract-implementer-001-non-activation.md) updated README.md, opencode-harness.design.md and an offline runtime test fixture. [Validator](roles/validator/pinned-contract-validator-001-validation.md) observed both managed gates pass but blocked overall acceptance because complete changed-file inventory and baseline preservation were not independently proven.
- Next safe action: obtain trusted v2.1.4 binary and exact Task-lifecycle/config contracts for a fresh implementation workflow; arrange separate full source/runtime/package verification against exact tree. Retain `dispatch-started.json`; no replay of this ID.
- Managed gates `git diff --check` and `node --check .opencode/plugins/index.js` exited zero. Full source/runtime/package QA remains external; no V2 native compatibility claim.
