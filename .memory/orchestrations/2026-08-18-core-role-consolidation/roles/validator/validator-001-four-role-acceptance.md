# Four-Role Consolidation Final Validation

## Findings

1. **MEDIUM — BLOCKING:** Active role prompts and the design retain workflow-surface claims after all workflow files were removed. Each packaged agent says immutable assets include `workflows` (`.opencode/agents/researcher.md:28`, `.opencode/agents/planner.md:28`, `.opencode/agents/implementer.md:25`, `.opencode/agents/validator.md:28`), while no `.opencode/workflows/` files remain. The design also says the baseline covers “delegation and validation workflows” (`opencode-harness.design.md:16`) while saying redundant workflow documents are absent at lines 54 and 156. Repository search supplied command-backed evidence. This violates acceptance criterion 6 and affects changed packaged prompts.

No high- or critical-severity findings were observed.

```json
{
  "orchestrationId": "2026-08-18-core-role-consolidation",
  "role": "validator",
  "artifactId": "validator-001-four-role-acceptance",
  "createdAt": "2026-08-18T23:03:10Z",
  "contract": ".opencode/contracts/role-io-contracts.json#roles.validator",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Final validation/review/integration-check/artifact-proof request, workspace, IDs, absent routing status, verification criteria, traces, and acceptance standard.",
    "requiredContextPresent": "Objective and verification context were complete enough to validate. delegationTaskId, scopeKey, and dispatchKind required by the current validator packet contract were absent and not invented; this non-acceptance metadata did not prevent parsing.",
    "routingMetadataStatus": "absent",
    "workspaceRoot": "/home/joshl/projects/opencode-harness",
    "traceRoot": "/home/joshl/projects/opencode-harness/.memory"
  },
  "workPerformed": {
    "summary": "Independently inspected the worktree/diff and harness surfaces. Ran the planned suite, schema checks, counts, references, isolated OpenCode 1.18.18 inspection, and temporary archive proof with cleanup. No provider, global-state, Git mutation, or remediation ran.",
    "filesRead": [
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/researcher/researcher-001-role-overlap.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/planner/planner-001-four-role-plan.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/implementer/implementer-001-four-role-protocol.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".opencode/schemas/orchestration-input.schema.json",
      ".opencode/agents/*.md",
      ".opencode/commands/*.md",
      ".opencode/skills/**",
      ".opencode/{harness,portable,runtime}.manifest.json",
      ".opencode/routing/**",
      ".opencode/plugin-modules/**",
      ".opencode/scripts/**",
      "AGENTS.md",
      "README.md",
      "opencode-harness.design.md",
      "package.json",
      "bin/opencode-harness.mjs"
    ],
    "filesChanged": [".memory/orchestrations/2026-08-18-core-role-consolidation/roles/validator/validator-001-four-role-acceptance.md"],
    "commands": [
      "git status/diff/log inspection; git diff --check",
      "node --check bin/opencode-harness.mjs",
      "node --test .opencode/plugin-modules/task-thread-policy.test.mjs",
      "node --test .opencode/plugin-modules/trace-root-permissions.test.mjs",
      "node .opencode/routing/routing-policy.test.mjs",
      "node .opencode/scripts/portable-harness.test.mjs",
      "node --test .opencode/scripts/runtime-harness.test.mjs",
      "node --test .opencode/scripts/runtime-foreign-repo.test.mjs",
      "node .opencode/scripts/validate-portable-harness.mjs --root .",
      "node .opencode/scripts/validate-harness.mjs",
      "npm pack --dry-run --json",
      "Draft202012Validator schema/negative fixtures",
      "isolated owner-only HOME/XDG opencode 1.18.18 agent inspection",
      "temporary npm pack/extract/security/mode proof and cleanup",
      "focused reference/count/version/mode checks"
    ]
  },
  "outputContract": {
    "outputs": "REJECT. One medium finding blocks the explicit no-broken-workflow-reference gate; all other checks passed.",
    "evidence": "Matrix: four roles PASS; modes/independence PASS; protocol authority/thin wrapper/fail-closed direct commands PASS; schema PASS; parent/leaf permissions PASS; removed-workflow references FAIL; 4/70/43/36/27/40 and 0.1.9 PASS; suite/archive/security/modes/cleanup PASS; scope review PASS apart from finding 1.",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/researcher/researcher-001-role-overlap.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/planner/planner-001-four-role-plan.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/implementer/implementer-001-four-role-protocol.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/validator/validator-001-four-role-acceptance.md"
    ],
    "passFailMatrixOrFindings": "FAIL workflow-reference integrity; PASS all other stated dimensions.",
    "commandOutputs": "task-thread 10/10; trace permissions 4/4; routing 39/39; portable 18 pass/4 Darwin skips; runtime 28/28; foreign runtime 8 pass/1 optional skip; both validators pass; syntax/diff pass; npm 40; archive 40, runtime 36, version 0.1.9, launcher 0755, other payload 0644, zero private-path/secret-pattern findings; cleanup pass.",
    "schemaResults": "Draft 2020-12 schema/valid fixture passed. Negative fixtures rejected missing goal, unknown field, retired role, role/mode mismatch, unauthorized parallelism, metadata with absent status, and wrong remediation default.",
    "securityAndActivationFindings": "Credential-free OpenCode 1.18.18 inspection used disposable mode-0700 HOME/XDG with pure/default/external plugin and external-skill disablement. Four roles resolved as subagents; effective permissions had task '*' deny and skill '*' allow followed by delegation-orchestrator deny. No provider ran; temp trees were removed.",
    "remediationList": "Correct stale workflow-asset claims in all four active agents and the contradictory design baseline sentence. No remediation was requested or started.",
    "skippedChecks": "Four Darwin-only tests, Darwin native validation, and one optional external fixture. Live/provider/network/publication/global-install/Git mutation checks were prohibited.",
    "residualRisk": "Ignored owner routing override retains retired roles and fails closed until owner action; it was pre-existing and untouched. OpenCode built-ins are not harness roles. Existing module warnings remain. The bootstrap 0644-to-0755 residual is preserved. A first archive proof hit zsh's read-only status variable after proof; its temp tree was removed and proof reran successfully."
  },
  "handoff": {
    "nextRole": "parent decision owner",
    "limitations": "Only validator pass; no fixes, remediation, providers, global mutation, or Git mutation. Skill denial was confirmed in effective permissions without a provider-backed leaf turn.",
    "risks": "Acceptance is blocked solely by finding 1. Packet omissions and trace/index progress are non-acceptance metadata. Routing was absent and no values were invented."
  }
}
```

## Acceptance Decision

**REJECT** — one command-backed medium finding is tied to criterion 6 and changed packaged role behavior. All other gates passed or were honestly skipped.
